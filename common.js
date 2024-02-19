
async function start_showcqtbar(width, height, bar_h, stream) {
    var {ShowCQT} = await import("https://cdn.jsdelivr.net/npm/showcqt@1/showcqt.mjs");
    var audio_ctx = new(window.AudioContext || window.webkitAudioContext)();
    function resume_audio_ctx() {
        if (audio_ctx.state === "suspended") {
            audio_ctx.resume();
            window.setTimeout(resume_audio_ctx, 100);
        }
    }
    resume_audio_ctx();
    var analyser_l = audio_ctx.createAnalyser();
    var analyser_r = audio_ctx.createAnalyser();
    var splitter = audio_ctx.createChannelSplitter(2);
    var panner = audio_ctx.createStereoPanner();
    var iir = audio_ctx.createBiquadFilter();
    var source = stream ?
        audio_ctx.createMediaStreamSource(stream) :
        audio_ctx.createMediaElementSource(document.getElementById("my-audio"));

    var canvas = document.getElementById("my-canvas").getContext("2d", {alpha:true});
    var bar_knob = document.getElementById("my-bar-knob");
    var brightness_knob = document.getElementById("my-brightness-knob");
    var showcqtbar = await ShowCQT.instantiate();
    showcqtbar.init(audio_ctx.sampleRate, width, bar_h,
                    Math.pow(10, bar_knob.value/20),
                    Math.pow(10, brightness_knob.value/20), 1);
    var bass_knob = document.getElementById("my-bass-knob");
    analyser_l.fftSize = showcqtbar.fft_size;
    analyser_r.fftSize = showcqtbar.fft_size;
    source.connect(panner);
    iir.type = "peaking";
    iir.frequency.value = 10;
    iir.Q.value = 0.33;
    iir.gain.value = bass_knob.value;
    panner.connect(iir);
    iir.connect(splitter);
    splitter.connect(analyser_l, 0);
    splitter.connect(analyser_r, 1);
    if (!stream)
        panner.connect(audio_ctx.destination);
    var line_buffer_tmp = null;
    var img_buffer = canvas.createImageData(width, height);
    var render_time = 0.0;
    var calc_time = 0.0;
    var time_count = 0;
    var last_time = performance.now();
    var waterfall_off = document.getElementById("my-waterfall-off");
    var waterfall_slow = document.getElementById("my-waterfall-slow");
    var waterfall_medium = document.getElementById("my-waterfall-medium");
    var waterfall_fast = document.getElementById("my-waterfall-fast");

    bass_knob.onchange = function() {
        iir.gain.value = bass_knob.value;
    }

    function change_volume() {
        showcqtbar.set_volume(Math.pow(10, bar_knob.value/20),
                              Math.pow(10, brightness_knob.value/20));
    }
    bar_knob.onchange = change_volume;
    brightness_knob.onchange = change_volume;

    function draw() {
        requestAnimationFrame(draw);
        var new_width = Math.min(Math.max(Math.floor(window.innerWidth), 640), 1920);
        if (new_width != width && (window.location.search == "?s=auto" || window.location.search == "?s=autosmall")) {
            width = new_width;
            height = window.location.search == "?s=autosmall" ? Math.floor(width * 3 / 32) * 2 : Math.floor(width * 3 / 16) * 2;
            var expected_h = Math.floor((window.innerHeight - document.getElementById("my-audio-div").clientHeight
                                    - document.getElementById("my-input-div").clientHeight
                                    - document.getElementById("my-p").clientHeight)/2) * 2;
            height = Math.min(height, Math.max(expected_h, 120));
            var axis_h = Math.round(width / 80) * 2;
            bar_h = ((height - axis_h)/2)|0;
            resize_canvas(width, height, bar_h, axis_h);
            showcqtbar.init(audio_ctx.sampleRate, width, bar_h,
                            Math.pow(10, bar_knob.value/20),
                            Math.pow(10, brightness_knob.value/20), 1);
            img_buffer = canvas.createImageData(width, height);
        }
        var start = performance.now();
        analyser_l.getFloatTimeDomainData(showcqtbar.inputs[0]);
        analyser_r.getFloatTimeDomainData(showcqtbar.inputs[1]);
        showcqtbar.calc();
        var middle = performance.now();
        var waterfall = !waterfall_off.checked;
        for (var y = 0; y < height/2; y++) {
            if (y <= bar_h)
                showcqtbar.render_line_opaque(y);
            img_buffer.data.set(showcqtbar.output, 4*width*y);
            if (!waterfall || y >= bar_h)
                img_buffer.data.set(showcqtbar.output, 4*width*(height-1-y));
        }

        if (waterfall) {
            if (waterfall_slow.checked)
                waterfall = 1;
            else if (waterfall_medium.checked)
                waterfall = 2;
            else
                waterfall = 3;

            if (img_buffer.data.copyWithin) {
                img_buffer.data.copyWithin(4*width*(height-bar_h+waterfall), 4*width*(height-bar_h), 4*width*(height-waterfall));
            } else {
                for (var y = 0; y < bar_h - waterfall; y++) {
                    var dst = 4 * width * (height - y - 1);
                    var src = 4 * width * (height - y - 1 - waterfall);
                    for (var x = 0; x < 4*width; x++)
                        img_buffer.data[dst+x] = img_buffer.data[src+x];
                }
            }
            var src0 = 4 * width * (height - bar_h - 1);
            var src1 = 4 * width * (height - bar_h + waterfall);
            var dst = 4 * width * (height - bar_h);
            for (var x = 0; x < 4*width; x++)
                img_buffer.data[dst+x] = img_buffer.data[src0+x];
            for (var y = 1; y < waterfall; y++) {
                var dst = 4 * width * (height - bar_h + y);
                var a1 = y / waterfall;
                var a0 = 1.0 - a1;
                for (var x = 0; x < 4*width; x++) {
                    img_buffer.data[dst+x] = (a0 * img_buffer.data[src0+x] + a1 * img_buffer.data[src1+x] + 0.5)|0;
                }
            }
        }
        canvas.putImageData(img_buffer, 0, 0);
        var end = performance.now();
        calc_time += middle - start;
        render_time += end - middle;
        time_count++;
        if (time_count >= 100) {
            document.getElementById("my-perf").textContent =
                (calc_time/time_count).toFixed(2)                   + "  ms   (calc time)\n" +
                (render_time/time_count).toFixed(2)                 + "  ms (render time)\n" +
                ((calc_time + render_time)/time_count).toFixed(2)   + "  ms  (total time)\n" +
                (1000*time_count/(start - last_time)).toFixed(2)    + " fps  (frame rate)\n";
            calc_time = 0.0;
            render_time = 0.0;
            time_count = 0;
            last_time = start;
        }
    }
    requestAnimationFrame(draw);
}

function load_audio() {
    var url = window.URL || window.webkitURL;
    var audio = document.getElementById("my-audio");
    var file = document.getElementById("my-file").files[0];
    audio.src = url.createObjectURL(file);
}

function resize_canvas(w, h, bar_h, axis_h) {
    document.getElementById("my-canvas").width = w;
    document.getElementById("my-canvas").height = h;
    document.getElementById("my-div-canvas").style.height = h + "px";
    document.getElementById("my-div-img").style.top = bar_h + "px";
    document.getElementById("my-img").width = w;
    document.getElementById("my-img").height = axis_h;
    if (document.getElementById("my-audio"))
        document.getElementById("my-audio").style.width = w + "px";
    document.getElementById("my-knob-div").style.width = (w/2-8) + "px";
    document.getElementById("my-knob-div").style.height = (h/2-8) + "px";
    document.getElementById("my-perf-div").style.left = (w/2) + "px";
    document.getElementById("my-perf-div").style.width = (w/2-8) + "px";
    document.getElementById("my-perf-div").style.height = (h/2-8) + "px";
}

window.addEventListener("load", function(event) {
    var qstring = window.location.search;
    var w = 0, h = 0, axis_h = 0, bar_h = 0;
    var auto_size = 0;

    if (qstring == "?s=640x240")
        w = 640;
    else if (qstring == "?s=960x360")
        w = 960;
    else if (qstring == "?s=1280x480")
        w = 1280;
    else if (qstring == "?s=1600x600")
        w = 1600;
    else if (qstring == "?s=1920x720")
        w = 1920;
    else if (qstring == "?s=auto" || qstring == "?s=autosmall")
        w = Math.min(Math.max(Math.floor(window.innerWidth), 640), 1920);
    else if (document.getElementById("my-audio"))
        window.location.replace("index.html?s=auto");
    else
        window.location.replace("capture.html?s=auto");

    h = qstring == "?s=autosmall" ? Math.floor(w * 3 / 32) * 2 : Math.floor(w * 3 / 16) * 2;
    if (qstring == "?s=auto" || qstring == "?s=autosmall") {
        var expected_h = Math.floor((window.innerHeight - document.getElementById("my-audio-div").clientHeight
                                    - document.getElementById("my-input-div").clientHeight
                                    - document.getElementById("my-p").clientHeight)/2) * 2;
        h = Math.min(h, Math.max(expected_h, 120));
        document.body.style.overflow = "hidden";
    }
    axis_h = Math.round(w / 80) * 2;
    bar_h = ((h - axis_h)/2)|0;

    resize_canvas(w, h, bar_h, axis_h);

    document.getElementById("my-perf-div").onmouseover = function() {
        document.getElementById("my-perf").style.visibility = "visible";
    }

    document.getElementById("my-perf-div").onmouseout = function() {
        document.getElementById("my-perf").style.visibility = "hidden";
    }

    document.getElementById("my-knob-div").onmouseover = function() {
        document.getElementById("my-knob").style.visibility = "visible";
    }

    document.getElementById("my-knob-div").onmouseout = function() {
        document.getElementById("my-knob").style.visibility = "hidden";
    }


    if (document.getElementById("my-audio")) {
        start_showcqtbar(w, h, bar_h, null);
    } else if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(function(stream) {
            start_showcqtbar(w, h, bar_h, stream);
        })
        .catch(function(err) {
            alert("Error on navigator.mediaDevices.getUserMedia(): " + err.name + ".");
        });
    } else {
        alert("navigator.mediaDevices is not supported on your browser.");
    }
});
