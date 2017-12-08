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
/* See common.js for usage example */

function ShowCQTBar(rate, width, height, bar_v, sono_v, supersampling) {
    this.rate = rate;
    this.width = width;
    this.height = height;
    this.buffer = new ArrayBuffer(2048*1024);
    this.asm = this.emscripten(window, null, this.buffer);
    this.fft_size = this.asm._init(rate, width, height, bar_v, sono_v, supersampling);
    if (!this.fft_size)
        throw ("Error initializing asm module");
    /* idx=0 : left, idx=1 : right */
    this.get_input_array = function(idx) {
        return new Float32Array(this.buffer, this.asm._get_input_array(idx), this.fft_size);
    }
    this.get_output_array = function() {
        return new Uint8ClampedArray(this.buffer, this.asm._get_output_array(), this.width*4);
    }
    /* calculate cqt from input_array */
    this.calc = function() { this.asm._calc(); }
    /* render showcqtbar at line y to output_array */
    this.render_line = function(y) { this.asm._render_line(y); }
}


ShowCQTBar.prototype.emscripten = function(global, env, buffer) {
'use asm';


  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntS = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var Math_fround=global.Math.fround;
  var tempFloat = Math_fround(0);
  const f0 = Math_fround(0);

// EMSCRIPTEN_START_FUNCS

function _calc() {
 var i1 = 0, i2 = 0, i3 = 0, f4 = f0, f5 = f0, i6 = 0, i7 = 0, f8 = f0, f9 = f0, i10 = 0, i11 = 0, i12 = 0, f13 = f0, f14 = f0;
 i6 = HEAP32[248673] >> 1;
 i1 = HEAP32[248675] | 0;
 i7 = i6 - i1 | 0;
 if ((i1 | 0) > 0) {
  i3 = i7 + i6 | 0;
  i2 = 0;
  do {
   i1 = 532348 + (i2 << 2) | 0;
   i11 = HEAP32[i1 >> 2] << 1;
   i12 = i2 + i7 | 0;
   i10 = HEAP32[131452 + (i12 << 2) >> 2] | 0;
   HEAP32[663420 + (i11 << 3) >> 2] = HEAP32[380 + (i12 << 2) >> 2];
   HEAP32[663420 + (i11 << 3) + 4 >> 2] = i10;
   i11 = 597884 + (i2 << 2) | 0;
   f9 = Math_fround(HEAPF32[i11 >> 2]);
   i10 = i3 + i2 | 0;
   f9 = Math_fround(f9 * Math_fround(HEAPF32[380 + (i10 << 2) >> 2]));
   HEAPF32[663420 + ((HEAP32[i1 >> 2] << 1 | 1) << 3) >> 2] = f9;
   f9 = Math_fround(HEAPF32[i11 >> 2]);
   f9 = Math_fround(f9 * Math_fround(HEAPF32[131452 + (i10 << 2) >> 2]));
   HEAPF32[663420 + ((HEAP32[i1 >> 2] << 1 | 1) << 3) + 4 >> 2] = f9;
   i2 = i2 + 1 | 0;
   i1 = HEAP32[248675] | 0;
  } while ((i2 | 0) < (i1 | 0));
 }
 if ((i1 | 0) < (i6 | 0)) do {
  i12 = 532348 + (i1 << 2) | 0;
  i11 = HEAP32[i12 >> 2] << 1;
  i3 = i1 + i7 | 0;
  i10 = HEAP32[131452 + (i3 << 2) >> 2] | 0;
  HEAP32[663420 + (i11 << 3) >> 2] = HEAP32[380 + (i3 << 2) >> 2];
  HEAP32[663420 + (i11 << 3) + 4 >> 2] = i10;
  i12 = HEAP32[i12 >> 2] << 1 | 1;
  HEAPF32[663420 + (i12 << 3) >> 2] = Math_fround(0.0);
  HEAPF32[663420 + (i12 << 3) + 4 >> 2] = Math_fround(0.0);
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != (i6 | 0));
 _fft_calc(663420, HEAP32[248673] | 0);
 i1 = HEAP32[248674] | 0;
 if ((i1 | 0) > 0) {
  i10 = 0;
  i2 = 0;
  do {
   i7 = HEAP32[994712 + (i2 << 2) >> 2] | 0;
   i3 = HEAP32[994712 + (i2 + 1 << 2) >> 2] | 0;
   if (!i7) {
    i12 = 925564 + (i10 << 4) | 0;
    HEAP32[i12 >> 2] = 0;
    HEAP32[i12 + 4 >> 2] = 0;
    HEAP32[i12 + 8 >> 2] = 0;
    HEAP32[i12 + 12 >> 2] = 0;
   } else {
    if ((i7 | 0) > 0) {
     i6 = HEAP32[248673] | 0;
     i1 = i2 + 2 | 0;
     i2 = 0;
     f9 = Math_fround(0.0);
     f8 = Math_fround(0.0);
     f5 = Math_fround(0.0);
     f4 = Math_fround(0.0);
     do {
      i11 = i2 + i3 | 0;
      i12 = i6 - i11 | 0;
      f13 = Math_fround(HEAPF32[994712 + (i1 + i2 << 2) >> 2]);
      f8 = Math_fround(f8 + Math_fround(f13 * Math_fround(HEAPF32[663420 + (i11 << 3) >> 2])));
      f4 = Math_fround(f4 + Math_fround(f13 * Math_fround(HEAPF32[663420 + (i11 << 3) + 4 >> 2])));
      f9 = Math_fround(f9 + Math_fround(f13 * Math_fround(HEAPF32[663420 + (i12 << 3) >> 2])));
      f5 = Math_fround(f5 + Math_fround(f13 * Math_fround(HEAPF32[663420 + (i12 << 3) + 4 >> 2])));
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i7 | 0));
    } else {
     i1 = i2 + 2 | 0;
     f9 = Math_fround(0.0);
     f8 = Math_fround(0.0);
     f5 = Math_fround(0.0);
     f4 = Math_fround(0.0);
    }
    f14 = Math_fround(f9 + f8);
    f13 = Math_fround(f4 - f5);
    f5 = Math_fround(f5 + f4);
    f9 = Math_fround(f9 - f8);
    f13 = Math_fround(Math_fround(f14 * f14) + Math_fround(f13 * f13));
    f9 = Math_fround(Math_fround(f9 * f9) + Math_fround(f5 * f5));
    f8 = Math_fround(HEAPF32[248676]);
    f5 = Math_fround(Math_fround(Math_sqrt(Math_fround(f8 * Math_fround(Math_sqrt(Math_fround(f13)))))) * Math_fround(255.0));
    i2 = f5 < Math_fround(255.0);
    HEAPF32[925564 + (i10 << 4) >> 2] = i2 ? f5 : Math_fround(255.0);
    f13 = Math_fround(Math_sqrt(Math_fround(Math_fround(f13 + f9) * Math_fround(.5))));
    f8 = Math_fround(Math_fround(Math_sqrt(Math_fround(f8 * f13))) * Math_fround(255.0));
    i2 = f8 < Math_fround(255.0);
    HEAPF32[925564 + (i10 << 4) + 4 >> 2] = i2 ? f8 : Math_fround(255.0);
    f9 = Math_fround(Math_fround(Math_sqrt(Math_fround(Math_fround(HEAPF32[248676]) * Math_fround(Math_sqrt(Math_fround(f9)))))) * Math_fround(255.0));
    i2 = f9 < Math_fround(255.0);
    HEAPF32[925564 + (i10 << 4) + 8 >> 2] = i2 ? f9 : Math_fround(255.0);
    HEAPF32[925564 + (i10 << 4) + 12 >> 2] = Math_fround(f13 * Math_fround(HEAPF32[248677]));
    i2 = i1 + i7 | 0;
   }
   i10 = i10 + 1 | 0;
   i1 = HEAP32[248674] | 0;
  } while ((i10 | 0) < (i1 | 0));
 }
 i2 = HEAP32[248671] | 0;
 if ((i1 | 0) != (i2 | 0) & (i2 | 0) > 0) {
  i2 = 0;
  do {
   i12 = i2 << 1;
   f14 = Math_fround(HEAPF32[925564 + (i12 << 4) >> 2]);
   i1 = i12 | 1;
   HEAPF32[925564 + (i2 << 4) >> 2] = Math_fround(Math_fround(f14 + Math_fround(HEAPF32[925564 + (i1 << 4) >> 2])) * Math_fround(.5));
   f14 = Math_fround(HEAPF32[925564 + (i12 << 4) + 4 >> 2]);
   HEAPF32[925564 + (i2 << 4) + 4 >> 2] = Math_fround(Math_fround(f14 + Math_fround(HEAPF32[925564 + (i1 << 4) + 4 >> 2])) * Math_fround(.5));
   f14 = Math_fround(HEAPF32[925564 + (i12 << 4) + 8 >> 2]);
   HEAPF32[925564 + (i2 << 4) + 8 >> 2] = Math_fround(Math_fround(f14 + Math_fround(HEAPF32[925564 + (i1 << 4) + 8 >> 2])) * Math_fround(.5));
   f14 = Math_fround(HEAPF32[925564 + (i12 << 4) + 12 >> 2]);
   HEAPF32[925564 + (i2 << 4) + 12 >> 2] = Math_fround(Math_fround(f14 + Math_fround(HEAPF32[925564 + (i1 << 4) + 12 >> 2])) * Math_fround(.5));
   i2 = i2 + 1 | 0;
   i1 = HEAP32[248671] | 0;
  } while ((i2 | 0) < (i1 | 0));
 } else i1 = i2;
 if ((i1 | 0) > 0) i1 = 0; else return;
 do {
  HEAPF32[987004 + (i1 << 2) >> 2] = Math_fround(Math_fround(1.0) / Math_fround(Math_fround(HEAPF32[925564 + (i1 << 4) + 12 >> 2]) + Math_fround(.0000999999974)));
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) < (HEAP32[248671] | 0));
 return;
}

function _init(i1, i3, i4, f5, f6, i10) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 f5 = Math_fround(f5);
 f6 = Math_fround(f6);
 i10 = i10 | 0;
 var d2 = 0.0, i7 = 0, d8 = 0.0, d9 = 0.0, i11 = 0, i12 = 0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0, i18 = 0, d19 = 0.0;
 if ((i3 + -1 | 0) >>> 0 > 1919 | (i4 + -1 | 0) >>> 0 > 1079) {
  i18 = 0;
  return i18 | 0;
 }
 HEAP32[248671] = i3;
 HEAP32[248672] = i4;
 if (!(f6 < Math_fround(100.0) & (f5 > Math_fround(.100000001) & f5 < Math_fround(100.0) & f6 > Math_fround(.100000001)))) {
  i18 = 0;
  return i18 | 0;
 }
 HEAPF32[248676] = f6;
 HEAPF32[248677] = f5;
 if ((i1 + -8e3 | 0) >>> 0 > 92e3) {
  i18 = 0;
  return i18 | 0;
 }
 d19 = +(i1 | 0);
 i1 = ~~+Math_ceil(+(+Math_log(+(d19 * .33)) / .6931471805599453));
 if ((i1 + -10 | 0) >>> 0 > 10) {
  i18 = 0;
  return i18 | 0;
 }
 i3 = 1 << i1;
 HEAP32[248673] = i3;
 if ((i3 | 0) > 32768) {
  i18 = 0;
  return i18 | 0;
 }
 i18 = i1 + -1 | 0;
 i7 = 1 << i18;
 if ((i18 | 0) != 31) {
  i3 = 33 - i1 | 0;
  i4 = i7 + -1 | 0;
  i1 = 0;
  do {
   i18 = i1 << 1 & -1431655766 | i1 >>> 1 & 1431655765;
   i18 = i18 << 2 & -858993460 | i18 >>> 2 & 858993459;
   i18 = i18 << 4 & -252645136 | i18 >>> 4 & 252645135;
   i18 = i18 << 8 & -16711936 | i18 >>> 8 & 16711935;
   HEAP32[532348 + (i1 << 2) >> 2] = (i18 << 16 | i18 >>> 16) >>> i3 & i4;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < (i7 | 0));
  i3 = HEAP32[248673] | 0;
 }
 if ((i3 | 0) > 1) {
  i4 = 1;
  do {
   d2 = 3.141592653589793 / +(i4 | 0);
   if ((i4 | 0) > 0) {
    i1 = 0;
    do {
     i18 = i1 + i4 | 0;
     d17 = d2 * +(i1 | 0);
     f6 = Math_fround(-Math_fround(+Math_sin(+d17)));
     HEAPF32[270204 + (i18 << 3) >> 2] = Math_fround(+Math_cos(+d17));
     HEAPF32[270204 + (i18 << 3) + 4 >> 2] = f6;
     i1 = i1 + 1 | 0;
    } while ((i1 | 0) != (i4 | 0));
   }
   i4 = i4 << 1;
  } while ((i4 | 0) < (i3 | 0));
 }
 d2 = d19 * .033;
 i18 = ~~+Math_ceil(+d2);
 HEAP32[248675] = i18;
 if ((i18 | 0) > 0) {
  i1 = 0;
  do {
   d17 = +(i1 | 0) * 3.141592653589793 / d2;
   HEAPF32[597884 + (i1 << 2) >> 2] = Math_fround(+Math_cos(+d17) * .487396 + .355768 + +Math_cos(+(d17 * 2.0)) * .144232 + +Math_cos(+(d17 * 3.0)) * .012604);
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < (HEAP32[248675] | 0));
 }
 i12 = Math_imul(HEAP32[248671] | 0, i10 | 0 ? 2 : 1) | 0;
 HEAP32[248674] = i12;
 if ((i12 | 0) <= 0) {
  i18 = HEAP32[248673] | 0;
  return i18 | 0;
 }
 d13 = d19 * .5;
 i1 = HEAP32[248673] | 0;
 d14 = +(i1 | 0);
 d15 = d14 * 8.0;
 d16 = 1.0 / d14;
 d17 = 1.0 / +(i12 | 0);
 i11 = 0;
 i18 = 0;
 while (1) {
  d2 = +Math_exp(+((+(i11 | 0) + .5) * 6.931471805599452 * d17 + 2.9964935469158838));
  if (d2 >= d13) {
   i3 = 20;
   break;
  }
  d8 = d2 * .33;
  d8 = d15 / (d19 * (126.72 / (d8 / .83 + 2258.8235294117644) + 126.72 / (d8 / .17 + 462.65060240963857)));
  d9 = d2 * d14 / d19;
  d2 = d8 * .5;
  i3 = ~~+Math_ceil(+(d9 - d2));
  i7 = ~~+Math_floor(+(d9 + d2));
  i10 = i7 - i3 | 0;
  i4 = i10 + 1 | 0;
  if ((i18 + 1e3 + i4 | 0) > 2e5) {
   i1 = 0;
   i3 = 26;
   break;
  }
  HEAP32[994712 + (i18 << 2) >> 2] = i4;
  HEAP32[994712 + (i18 + 1 << 2) >> 2] = i3;
  if ((i7 | 0) >= (i3 | 0)) {
   d2 = 1.0 / d8;
   i4 = i18 + 2 - i3 | 0;
   while (1) {
    d8 = d2 * ((+(i3 | 0) - d9) * 6.283185307179586);
    HEAPF32[994712 + (i4 + i3 << 2) >> 2] = Math_fround(d16 * +((i3 << 1 & 2 ^ 2) + -1 | 0) * (+Math_cos(+d8) * .487396 + .355768 + +Math_cos(+(d8 * 2.0)) * .144232 + +Math_cos(+(d8 * 3.0)) * .012604));
    if ((i3 | 0) < (i7 | 0)) i3 = i3 + 1 | 0; else break;
   }
  }
  i11 = i11 + 1 | 0;
  if ((i11 | 0) >= (i12 | 0)) {
   i3 = 26;
   break;
  } else i18 = i18 + 3 + i10 | 0;
 }
 if ((i3 | 0) == 20) {
  HEAP32[994712 + (i18 << 2) >> 2] = 0;
  i18 = i1;
  return i18 | 0;
 } else if ((i3 | 0) == 26) return i1 | 0;
 return 0;
}

function _fft_calc(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, f5 = f0, f6 = f0, f7 = f0, f8 = f0, f9 = f0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, f14 = f0, f15 = f0;
 if ((i1 | 0) <= 2) {
  f7 = Math_fround(HEAPF32[i2 >> 2]);
  i1 = i2 + 4 | 0;
  f8 = Math_fround(HEAPF32[i1 >> 2]);
  i3 = i2 + 8 | 0;
  f6 = Math_fround(HEAPF32[i3 >> 2]);
  i4 = i2 + 12 | 0;
  f5 = Math_fround(HEAPF32[i4 >> 2]);
  f9 = Math_fround(f8 + f5);
  HEAPF32[i2 >> 2] = Math_fround(f7 + f6);
  HEAPF32[i1 >> 2] = f9;
  f5 = Math_fround(f8 - f5);
  HEAPF32[i3 >> 2] = Math_fround(f7 - f6);
  HEAPF32[i4 >> 2] = f5;
  return;
 }
 i3 = i1 >>> 1;
 i4 = 270204 + (i3 << 3) | 0;
 _fft_calc(i2, i3);
 i11 = i2 + (i3 << 3) | 0;
 _fft_calc(i11, i3);
 f7 = Math_fround(HEAPF32[i2 >> 2]);
 i12 = i2 + 4 | 0;
 f6 = Math_fround(HEAPF32[i12 >> 2]);
 f8 = Math_fround(HEAPF32[i11 >> 2]);
 i10 = i2 + (i3 << 3) + 4 | 0;
 f9 = Math_fround(HEAPF32[i10 >> 2]);
 f5 = Math_fround(f6 + f9);
 HEAPF32[i2 >> 2] = Math_fround(f7 + f8);
 HEAPF32[i12 >> 2] = f5;
 f9 = Math_fround(f6 - f9);
 HEAPF32[i11 >> 2] = Math_fround(f7 - f8);
 HEAPF32[i10 >> 2] = f9;
 if ((i1 | 0) == 3) return; else i1 = 1;
 do {
  i13 = i2 + (i1 << 3) | 0;
  f7 = Math_fround(HEAPF32[i13 >> 2]);
  i10 = i2 + (i1 << 3) + 4 | 0;
  f6 = Math_fround(HEAPF32[i10 >> 2]);
  f5 = Math_fround(HEAPF32[i4 + (i1 << 3) >> 2]);
  i12 = i1 + i3 | 0;
  i11 = i2 + (i12 << 3) | 0;
  f15 = Math_fround(HEAPF32[i11 >> 2]);
  f8 = Math_fround(f5 * f15);
  f14 = Math_fround(HEAPF32[i4 + (i1 << 3) + 4 >> 2]);
  i12 = i2 + (i12 << 3) + 4 | 0;
  f9 = Math_fround(HEAPF32[i12 >> 2]);
  f8 = Math_fround(f8 - Math_fround(f14 * f9));
  f9 = Math_fround(Math_fround(f15 * f14) + Math_fround(f5 * f9));
  f5 = Math_fround(f6 + f9);
  HEAPF32[i13 >> 2] = Math_fround(f7 + f8);
  HEAPF32[i10 >> 2] = f5;
  f9 = Math_fround(f6 - f9);
  HEAPF32[i11 >> 2] = Math_fround(f7 - f8);
  HEAPF32[i12 >> 2] = f9;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) < (i3 | 0));
 return;
}

function _render_line(i1) {
 i1 = i1 | 0;
 var i2 = 0, f3 = f0, i4 = 0, i5 = 0, f6 = f0;
 if ((i1 | 0) > -1) {
  i2 = HEAP32[248672] | 0;
  if ((i2 | 0) > (i1 | 0)) {
   f6 = Math_fround(Math_fround(i2 - i1 | 0) / Math_fround(i2 | 0));
   if ((HEAP32[248671] | 0) > 0) i5 = 0; else return;
   do {
    f3 = Math_fround(HEAPF32[925564 + (i5 << 4) + 12 >> 2]);
    if (!(f3 <= f6)) {
     f3 = Math_fround(f3 - f6);
     f3 = Math_fround(f3 * Math_fround(HEAPF32[987004 + (i5 << 2) >> 2]));
     i4 = ~~Math_fround(Math_fround(f3 * Math_fround(HEAPF32[925564 + (i5 << 4) >> 2])) + Math_fround(.5)) & 255;
     i2 = ~~Math_fround(Math_fround(f3 * Math_fround(HEAPF32[925564 + (i5 << 4) + 4 >> 2])) + Math_fround(.5)) & 255;
     i1 = ~~Math_fround(Math_fround(f3 * Math_fround(HEAPF32[925564 + (i5 << 4) + 8 >> 2])) + Math_fround(.5)) & 255;
    } else {
     i1 = 0;
     i2 = 0;
     i4 = 0;
    }
    HEAP8[262524 + (i5 << 2) >> 0] = i4;
    HEAP8[262524 + (i5 << 2) + 1 >> 0] = i2;
    HEAP8[262524 + (i5 << 2) + 2 >> 0] = i1;
    HEAP8[262524 + (i5 << 2) + 3 >> 0] = -1;
    i5 = i5 + 1 | 0;
   } while ((i5 | 0) < (HEAP32[248671] | 0));
   return;
  }
 }
 if ((HEAP32[248671] | 0) > 0) i1 = 0; else return;
 do {
  i2 = ~~Math_fround(Math_fround(HEAPF32[925564 + (i1 << 4) >> 2]) + Math_fround(.5)) & 255;
  i4 = ~~Math_fround(Math_fround(HEAPF32[925564 + (i1 << 4) + 4 >> 2]) + Math_fround(.5)) & 255;
  i5 = ~~Math_fround(Math_fround(HEAPF32[925564 + (i1 << 4) + 8 >> 2]) + Math_fround(.5)) & 255;
  HEAP8[262524 + (i1 << 2) >> 0] = i2;
  HEAP8[262524 + (i1 << 2) + 1 >> 0] = i4;
  HEAP8[262524 + (i1 << 2) + 2 >> 0] = i5;
  HEAP8[262524 + (i1 << 2) + 3 >> 0] = -1;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) < (HEAP32[248671] | 0));
 return;
}

function _get_input_array(i1) {
 i1 = i1 | 0;
 return 380 + (((i1 | 0) != 0 & 1) << 17) | 0;
}

function _get_output_array() {
 return 262524;
}

// EMSCRIPTEN_END_FUNCS
  return { _render_line: _render_line, _init: _init, _get_input_array: _get_input_array, _calc: _calc, _get_output_array: _get_output_array };
}
