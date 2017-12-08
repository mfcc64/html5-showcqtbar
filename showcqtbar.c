/*
 * Copyright (c) 2017 Muhammad Faiz <mfcc64@gmail.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with FFmpeg; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */

/* Audio visualization based on showcqtbar mpv/ffmpeg audio visualization */
/* See https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avf_showcqt.c */

#include <math.h>
#include <stdint.h>

#define MAX_FFT_SIZE 32768
#define MAX_WIDTH 1920
#define MAX_HEIGHT 1080
#define MAX_KERNEL_SIZE 200000

typedef struct Complex {
    float re, im;
} Complex;

typedef struct Color {
    uint8_t r, g, b, a;
} Color;

typedef struct ColorF {
    float r, g, b, h;
} ColorF;

typedef union Kernel {
    float f;
    int   i;
} Kernel;

typedef struct ShowCQT {
    /* args */
    float       input[2][MAX_FFT_SIZE];
    Color       output[MAX_WIDTH];

    /* tables */
    Complex     exp_tbl[MAX_FFT_SIZE];
    int         perm_tbl[MAX_FFT_SIZE/2];
    float       attack_tbl[MAX_FFT_SIZE/2];

    /* buffers */
    Complex     fft_buf[MAX_FFT_SIZE];
    ColorF      color_buf[MAX_WIDTH*2];
    float       rcp_h_buf[MAX_WIDTH];

    /* props */
    int         width;
    int         height;
    int         fft_size;
    int         t_size;
    int         attack_size;
    float       sono_v;
    float       bar_v;

    /* kernel */
    Kernel      kernel[MAX_KERNEL_SIZE];
} ShowCQT;

static ShowCQT cqt;

float *get_input_array(int index)
{
    return cqt.input[!!index];
}

Color *get_output_array(void)
{
    return cqt.output;
}

static unsigned revbin(unsigned x, int bits)
{
    unsigned m = 0x55555555;
    x = ((x & m) << 1) | ((x & ~m) >> 1);
    m = 0x33333333;
    x = ((x & m) << 2) | ((x & ~m) >> 2);
    m = 0x0F0F0F0F;
    x = ((x & m) << 4) | ((x & ~m) >> 4);
    m = 0x00FF00FF;
    x = ((x & m) << 8) | ((x & ~m) >> 8);
    m = 0x0000FFFF;
    x = ((x & m) << 16) | ((x & ~m) >> 16);
    return (x >> (32 - bits)) & ((1 << bits) - 1);
}

static void gen_perm_tbl(int bits)
{
    int n = 1 << bits;
    for (int x = 0; x < n; x++)
        cqt.perm_tbl[x] = revbin(x, bits);
}

static void gen_exp_tbl(int n)
{
    for (int k = 1; k < n; k *= 2) {
        double mul = M_PI / k;
        for (int x = 0; x < k; x++)
            cqt.exp_tbl[k+x] = (Complex){ cos(mul*x), -sin(mul*x) };
    }
}

#define C_ADD(a, b) (Complex){ (a).re + (b).re, (a).im + (b).im }
#define C_SUB(a, b) (Complex){ (a).re - (b).re, (a).im - (b).im }
#define C_MUL(a, b) (Complex){ (a).re * (b).re - (a).im * (b).im, (a).re * (b).im + (a).im * (b).re }

static void fft_calc(Complex *v, int n)
{
    if (n > 2) {
        int x, h = n>>1;
        const Complex *t = cqt.exp_tbl + h;
        Complex a, b;
        fft_calc(v, h);
        fft_calc(v + h, h);
        a = v[0];
        b = v[h];
        v[0] = C_ADD(a, b);
        v[h] = C_SUB(a, b);
        for (x = 1; x < h; x++) {
            a = v[x];
            b = C_MUL(t[x], v[h+x]);
            v[x] = C_ADD(a, b);
            v[h+x] = C_SUB(a, b);
        }
    } else {
        Complex a = v[0], b = v[1];
        v[0] = C_ADD(a, b);
        v[1] = C_SUB(a, b);
    }
}

int init(int rate, int width, int height, float bar_v, float sono_v, int super)
{
    if (height <= 0 || height > MAX_HEIGHT || width <= 0 || width > MAX_WIDTH)
        return 0;

    cqt.width = width;
    cqt.height = height;

    if (bar_v > 0.1f && bar_v < 100.0f && sono_v > 0.1f && sono_v < 100.0f) {
        cqt.sono_v = sono_v;
        cqt.bar_v = bar_v;
    } else {
        return 0;
    }

    if (rate < 8000 || rate > 100000)
        return 0;

    int bits = ceil(log(rate * 0.33)/ M_LN2);
    if (bits > 20 || bits < 10)
        return 0;
    cqt.fft_size = 1 << bits;
    if (cqt.fft_size > MAX_FFT_SIZE)
        return 0;

    gen_perm_tbl(bits - 1);
    gen_exp_tbl(cqt.fft_size);

    cqt.attack_size = ceil(rate * 0.033);
    for (int x = 0; x < cqt.attack_size; x++) {
        double y = M_PI * x / (rate * 0.033);
        cqt.attack_tbl[x] = 0.355768 + 0.487396 * cos(y) + 0.144232 * cos(2*y) + 0.012604 * cos(3*y);
    }

    cqt.t_size = cqt.width * (1 + !!super);
    double log_base = log(20.01523126408007475);
    double log_end = log(20495.59681441799654);
    for (int f = 0, idx = 0; f < cqt.t_size; f++) {
        double freq = exp(log_base + (f + 0.5) * (log_end - log_base) * (1.0/cqt.t_size));

        if (freq >= 0.5 * rate) {
            cqt.kernel[idx].i = 0;
            break;
        }

        double tlen = 384*0.33 / (384/0.17 + 0.33*freq/(1-0.17)) + 384*0.33 / (0.33*freq/0.17 + 384/(1-0.17));
        double flen = 8.0 * cqt.fft_size / (tlen * rate);
        double center = freq * cqt.fft_size / rate;
        int start = ceil(center - 0.5*flen);
        int end = floor(center + 0.5*flen);
        int len = end - start + 1;

        if (idx + len + 1000 > MAX_KERNEL_SIZE)
            return 0;
        cqt.kernel[idx].i = len;
        cqt.kernel[idx+1].i = start;

        for (int x = start; x <= end; x++) {
            int sign = (x & 1) ? (-1) : 1;
            double y = 2.0 * M_PI * (x - center) * (1.0 / flen);
            double w = 0.355768 + 0.487396 * cos(y) + 0.144232 * cos(2*y) + 0.012604 * cos(3*y);
            w *= sign * (1.0/cqt.fft_size);
            cqt.kernel[idx+2+x-start].f = w;
        }
        idx += len+2;
    }
    return cqt.fft_size;
}

void calc(void)
{
    int fft_size_h = cqt.fft_size >> 1;
    int shift = fft_size_h - cqt.attack_size;

    for (int x = 0; x < cqt.attack_size; x++) {
        cqt.fft_buf[2*cqt.perm_tbl[x]] = (Complex){ cqt.input[0][shift+x], cqt.input[1][shift+x] };
        cqt.fft_buf[2*cqt.perm_tbl[x]+1].re = cqt.attack_tbl[x] * cqt.input[0][fft_size_h+shift+x];
        cqt.fft_buf[2*cqt.perm_tbl[x]+1].im = cqt.attack_tbl[x] * cqt.input[1][fft_size_h+shift+x];
    }

    for (int x = cqt.attack_size; x < fft_size_h; x++) {
        cqt.fft_buf[2*cqt.perm_tbl[x]] = (Complex){ cqt.input[0][shift+x], cqt.input[1][shift+x] };
        cqt.fft_buf[2*cqt.perm_tbl[x]+1] = (Complex){0,0};
    }

    fft_calc(cqt.fft_buf, cqt.fft_size);

    for (int x = 0, m = 0; x < cqt.t_size; x++) {
        int len = cqt.kernel[m].i;
        int start = cqt.kernel[m+1].i;
        if (!len) {
            cqt.color_buf[x] = (ColorF){0,0,0,0};
            continue;
        }
        Complex a = {0,0}, b = {0,0};
        for (int y = 0; y < len; y++) {
            int i = start + y;
            int j = cqt.fft_size - i;
            float u = cqt.kernel[m+2+y].f;
            a.re += u * cqt.fft_buf[i].re;
            a.im += u * cqt.fft_buf[i].im;
            b.re += u * cqt.fft_buf[j].re;
            b.im += u * cqt.fft_buf[j].im;
        }
        Complex v0 = { a.re + b.re, a.im - b.im };
        Complex v1 = { b.im + a.im, b.re - a.re };
        float r0 = v0.re*v0.re + v0.im*v0.im;
        float r1 = v1.re*v1.re + v1.im*v1.im;

        float c = 255.0f * sqrtf(cqt.sono_v * sqrtf(r0));
        cqt.color_buf[x].r = (c < 255.0f) ? c : 255.0f;
        c = 255.0f * sqrtf(cqt.sono_v * sqrtf(0.5f * (r0+r1)));
        cqt.color_buf[x].g = (c < 255.0f) ? c : 255.0f;
        c = 255.0f * sqrtf(cqt.sono_v * sqrtf(r1));
        cqt.color_buf[x].b = (c < 255.0f) ? c : 255.0f;
        cqt.color_buf[x].h = cqt.bar_v * sqrtf(0.5f * (r0+r1));

        m += len+2;
    }

    if (cqt.t_size != cqt.width) {
        for (int x = 0; x < cqt.width; x++) {
            cqt.color_buf[x].r = 0.5f * (cqt.color_buf[2*x].r + cqt.color_buf[2*x+1].r);
            cqt.color_buf[x].g = 0.5f * (cqt.color_buf[2*x].g + cqt.color_buf[2*x+1].g);
            cqt.color_buf[x].b = 0.5f * (cqt.color_buf[2*x].b + cqt.color_buf[2*x+1].b);
            cqt.color_buf[x].h = 0.5f * (cqt.color_buf[2*x].h + cqt.color_buf[2*x+1].h);
        }
    }

    for (int x = 0; x < cqt.width; x++)
        cqt.rcp_h_buf[x] = 1.0f / (cqt.color_buf[x].h + 0.0001f);
}

void render_line(int y)
{
    if (y >= 0 && y < cqt.height) {
        float ht = (cqt.height - y) / (float) cqt.height;
        for (int x = 0; x < cqt.width; x++) {
            if (cqt.color_buf[x].h <= ht) {
                cqt.output[x] = (Color) {0,0,0,255};
            } else {
                float mul = (cqt.color_buf[x].h - ht) * cqt.rcp_h_buf[x];
                cqt.output[x] = (Color){mul*cqt.color_buf[x].r+0.5f, mul*cqt.color_buf[x].g+0.5f, mul*cqt.color_buf[x].b+0.5f, 255};
            }
        }
    } else {
        for (int x = 0; x < cqt.width; x++)
            cqt.output[x] = (Color){cqt.color_buf[x].r+0.5f, cqt.color_buf[x].g+0.5f, cqt.color_buf[x].b+0.5f, 255};
    }
}
