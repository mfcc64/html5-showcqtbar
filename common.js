
function start_showcqtbar(width, height, bar_h) {
    var audio_ctx = new(window.AudioContext || window.webkitAudioContext)();
    var analyser_l = audio_ctx.createAnalyser();
    var analyser_r = audio_ctx.createAnalyser();
    var splitter = audio_ctx.createChannelSplitter(2);
    var merger = audio_ctx.createChannelMerger(2);
    var source = audio_ctx.createMediaElementSource(document.getElementById("my-audio"));
    var canvas = document.getElementById("my-canvas").getContext("2d", {alpha:false});
    var showcqtbar = new ShowCQTBar(audio_ctx.sampleRate, width, bar_h, 9, 17, 1);
    analyser_l.fftSize = showcqtbar.fft_size;
    analyser_r.fftSize = showcqtbar.fft_size;
    source.connect(splitter);
    splitter.connect(analyser_l, 0);
    splitter.connect(analyser_r, 1);
    analyser_l.connect(merger, 0, 0);
    analyser_r.connect(merger, 0, 1);
    merger.connect(audio_ctx.destination);
    var audio_data_l = showcqtbar.get_input_array(0);
    var audio_data_r = showcqtbar.get_input_array(1);
    var line_buffer_tmp = null, line_buffer = null;
    try {
        line_buffer = new ImageData(showcqtbar.get_output_array(), width, 1);
    } catch (e) {
        line_buffer_tmp = showcqtbar.get_output_array();
        line_buffer = canvas.createImageData(width, 1);
    }
    var render_time = 0.0;
    var calc_time = 0.0;
    var time_count = 0;
    var last_time = performance.now();

    function draw() {
        requestAnimationFrame(draw);
        var start = performance.now();
        analyser_l.getFloatTimeDomainData(audio_data_l);
        analyser_r.getFloatTimeDomainData(audio_data_r);
        showcqtbar.calc();
        var middle = performance.now();
        for (var y = 0; y < height/2; y++) {
            showcqtbar.render_line(y);
            if (line_buffer_tmp)
                line_buffer.data.set(line_buffer_tmp);
            canvas.putImageData(line_buffer, 0, y);
            canvas.putImageData(line_buffer, 0, height-1-y);
        }
        var end = performance.now();
        calc_time += middle - start;
        render_time += end - middle;
        time_count++;
        if (time_count >= 100) {
            document.getElementById("my-perf").textContent = "Render Time: " +
                (calc_time/time_count).toFixed(2) + " ms (FFT+CQT calculation) + " +
                (render_time/time_count).toFixed(2) + " ms (render) = " +
                ((calc_time + render_time)/time_count).toFixed(2) + " ms (total). Frame Rate: " +
                (1000*time_count/(start - last_time)).toFixed(2) + " fps.";
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
