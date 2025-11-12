import * as vscode from 'vscode';
import * as path from 'path';

export class AudioPlayerProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'GoDE.audioPlayer';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly onAudioData: (data: AudioAnalysisData) => void
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'audioAnalysis':
                    this.onAudioData(data.payload);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(data.message);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audio Player</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 16px;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            height: 100vh;
        }

        .controls {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
            transition: background 0.2s;
        }

        button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        input[type="file"] {
            flex: 1;
            min-width: 150px;
        }

        .visualizer-container {
            flex: 1;
            position: relative;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            overflow: hidden;
            min-height: 300px;
        }

        canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            opacity: 0.8;
            gap: 16px;
            flex-wrap: wrap;
        }

        .info-item {
            display: flex;
            gap: 4px;
        }

        .info-label {
            opacity: 0.7;
        }

        .reactive-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .toggle-switch {
            position: relative;
            width: 40px;
            height: 20px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--vscode-input-background);
            transition: .3s;
            border-radius: 20px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--vscode-button-background);
        }

        input:checked + .slider:before {
            transform: translateX(20px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <input type="file" id="fileInput" accept="audio/*">
            <button id="playBtn" disabled>Play</button>
            <button id="pauseBtn" disabled>Pause</button>
            <button id="stopBtn" disabled>Stop</button>
        </div>

        <div class="reactive-toggle">
            <label class="toggle-switch">
                <input type="checkbox" id="reactiveTheme">
                <span class="slider"></span>
            </label>
            <span>Audio-Reactive Theme</span>
        </div>

        <div class="visualizer-container">
            <canvas id="spectrogram"></canvas>
        </div>

        <div class="info">
            <div class="info-item">
                <span class="info-label">Time:</span>
                <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
            </div>
            <div class="info-item">
                <span class="info-label">BPM:</span>
                <span id="bpm">--</span>
            </div>
            <div class="info-item">
                <span class="info-label">Energy:</span>
                <span id="energy">--</span>
            </div>
            <div class="info-item">
                <span class="info-label">Brightness:</span>
                <span id="brightness">--</span>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        let audioContext;
        let analyser;
        let audioSource;
        let audioElement;
        let animationId;
        let spectrogramData = [];

        // Mel filterbank configuration
        const FFT_SIZE = 2048;
        const MEL_BINS = 128;
        const SAMPLE_RATE = 44100;
        const UPDATE_INTERVAL = 20; // 20ms per line as requested!

        // UI elements
        const fileInput = document.getElementById('fileInput');
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const canvas = document.getElementById('spectrogram');
        const ctx = canvas.getContext('2d');
        const reactiveToggle = document.getElementById('reactiveTheme');

        // Audio analysis state
        let beatDetector = {
            history: [],
            threshold: 1.3,
            lastBeat: 0
        };

        // Initialize canvas size
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // File selection
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Initialize audio context on user interaction
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = FFT_SIZE;
                    analyser.smoothingTimeConstant = 0.8;
                }

                // Create audio element
                if (audioElement) {
                    audioElement.pause();
                    audioElement.src = '';
                }

                audioElement = new Audio();
                audioElement.src = URL.createObjectURL(file);

                // Create or recreate source
                if (audioSource) {
                    audioSource.disconnect();
                }
                audioSource = audioContext.createMediaElementSource(audioElement);
                audioSource.connect(analyser);
                analyser.connect(audioContext.destination);

                // Enable controls
                playBtn.disabled = false;
                stopBtn.disabled = false;

                audioElement.addEventListener('timeupdate', updateTimeDisplay);
                audioElement.addEventListener('loadedmetadata', () => {
                    updateTimeDisplay();
                });

            } catch (error) {
                vscode.postMessage({
                    type: 'error',
                    message: 'Failed to load audio file: ' + error.message
                });
            }
        });

        // Playback controls
        playBtn.addEventListener('click', () => {
            if (audioElement && audioContext) {
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                audioElement.play();
                pauseBtn.disabled = false;
                startVisualization();
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (audioElement) {
                audioElement.pause();
            }
        });

        stopBtn.addEventListener('click', () => {
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
                spectrogramData = [];
                pauseBtn.disabled = true;
            }
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        // Create mel filterbank
        function createMelFilterbank(numFilters, fftSize, sampleRate) {
            const filters = [];
            const minMel = hzToMel(0);
            const maxMel = hzToMel(sampleRate / 2);
            const melStep = (maxMel - minMel) / (numFilters + 1);

            for (let i = 0; i < numFilters; i++) {
                const leftMel = minMel + i * melStep;
                const centerMel = minMel + (i + 1) * melStep;
                const rightMel = minMel + (i + 2) * melStep;

                const leftHz = melToHz(leftMel);
                const centerHz = melToHz(centerMel);
                const rightHz = melToHz(rightMel);

                const leftBin = Math.floor(leftHz / (sampleRate / fftSize));
                const centerBin = Math.floor(centerHz / (sampleRate / fftSize));
                const rightBin = Math.floor(rightHz / (sampleRate / fftSize));

                filters.push({ leftBin, centerBin, rightBin });
            }

            return filters;
        }

        function hzToMel(hz) {
            return 2595 * Math.log10(1 + hz / 700);
        }

        function melToHz(mel) {
            return 700 * (Math.pow(10, mel / 2595) - 1);
        }

        // Apply mel filterbank to FFT data
        function applyMelFilterbank(fftData, filterbank) {
            const melSpectrum = new Float32Array(filterbank.length);

            filterbank.forEach((filter, i) => {
                let sum = 0;
                let count = 0;

                // Triangular filter
                for (let bin = filter.leftBin; bin <= filter.rightBin; bin++) {
                    if (bin < fftData.length) {
                        let weight;
                        if (bin < filter.centerBin) {
                            weight = (bin - filter.leftBin) / (filter.centerBin - filter.leftBin);
                        } else {
                            weight = (filter.rightBin - bin) / (filter.rightBin - filter.centerBin);
                        }
                        sum += fftData[bin] * weight;
                        count++;
                    }
                }

                melSpectrum[i] = count > 0 ? sum / count : 0;
            });

            return melSpectrum;
        }

        const melFilterbank = createMelFilterbank(MEL_BINS, FFT_SIZE, SAMPLE_RATE);
        let lastUpdateTime = 0;

        function startVisualization() {
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);

            function draw(timestamp) {
                if (!audioElement || audioElement.paused) {
                    return;
                }

                // Update at 20ms intervals
                if (timestamp - lastUpdateTime >= UPDATE_INTERVAL) {
                    analyser.getByteFrequencyData(frequencyData);

                    // Apply mel filterbank
                    const melSpectrum = applyMelFilterbank(frequencyData, melFilterbank);

                    // Add new line to spectrogram (rolling visualization)
                    spectrogramData.push(Array.from(melSpectrum));

                    // Keep only enough lines to fill the canvas
                    const maxLines = canvas.width;
                    if (spectrogramData.length > maxLines) {
                        spectrogramData.shift();
                    }

                    // Analyze audio features
                    const audioFeatures = analyzeAudioFeatures(frequencyData, melSpectrum);
                    updateInfoDisplay(audioFeatures);

                    // Send to extension for reactive theming
                    if (reactiveToggle.checked) {
                        vscode.postMessage({
                            type: 'audioAnalysis',
                            payload: audioFeatures
                        });
                    }

                    lastUpdateTime = timestamp;
                }

                // Draw spectrogram
                drawSpectrogram();

                animationId = requestAnimationFrame(draw);
            }

            animationId = requestAnimationFrame(draw);
        }

        function drawSpectrogram() {
            const width = canvas.width;
            const height = canvas.height;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);

            const lineWidth = width / spectrogramData.length;

            spectrogramData.forEach((spectrum, x) => {
                const barHeight = height / spectrum.length;

                spectrum.forEach((value, y) => {
                    const intensity = value / 255;

                    // Beautiful color gradient based on intensity and frequency
                    const hue = (y / spectrum.length) * 280; // Blue to purple range
                    const saturation = 70 + intensity * 30;
                    const lightness = 20 + intensity * 60;

                    ctx.fillStyle = \`hsl(\${hue}, \${saturation}%, \${lightness}%)\`;
                    ctx.fillRect(
                        x * lineWidth,
                        height - (y + 1) * barHeight,
                        lineWidth + 1,
                        barHeight + 1
                    );
                });
            });
        }

        function analyzeAudioFeatures(frequencyData, melSpectrum) {
            // Calculate energy (RMS)
            let energy = 0;
            for (let i = 0; i < frequencyData.length; i++) {
                energy += frequencyData[i] * frequencyData[i];
            }
            energy = Math.sqrt(energy / frequencyData.length) / 255;

            // Beat detection
            beatDetector.history.push(energy);
            if (beatDetector.history.length > 43) { // ~1 second at 20ms intervals
                beatDetector.history.shift();
            }

            const avgEnergy = beatDetector.history.reduce((a, b) => a + b, 0) / beatDetector.history.length;
            const isBeat = energy > avgEnergy * beatDetector.threshold;

            // Calculate brightness (high frequency content)
            const highFreqStart = Math.floor(frequencyData.length * 0.6);
            let brightness = 0;
            for (let i = highFreqStart; i < frequencyData.length; i++) {
                brightness += frequencyData[i];
            }
            brightness = brightness / (frequencyData.length - highFreqStart) / 255;

            // Spectral centroid (timbral brightness)
            let weightedSum = 0;
            let sum = 0;
            for (let i = 0; i < melSpectrum.length; i++) {
                weightedSum += i * melSpectrum[i];
                sum += melSpectrum[i];
            }
            const spectralCentroid = sum > 0 ? weightedSum / sum / melSpectrum.length : 0;

            // Dominant frequency bin
            let maxBin = 0;
            let maxValue = 0;
            for (let i = 0; i < melSpectrum.length; i++) {
                if (melSpectrum[i] > maxValue) {
                    maxValue = melSpectrum[i];
                    maxBin = i;
                }
            }
            const dominantFreq = maxBin / melSpectrum.length;

            return {
                energy,
                isBeat,
                brightness,
                spectralCentroid,
                dominantFreq,
                timestamp: Date.now()
            };
        }

        function updateInfoDisplay(features) {
            document.getElementById('energy').textContent = (features.energy * 100).toFixed(1) + '%';
            document.getElementById('brightness').textContent = (features.brightness * 100).toFixed(1) + '%';

            // Simple BPM estimation based on beat intervals
            if (features.isBeat) {
                const now = Date.now();
                if (beatDetector.lastBeat > 0) {
                    const interval = (now - beatDetector.lastBeat) / 1000;
                    const bpm = Math.round(60 / interval);
                    if (bpm >= 60 && bpm <= 200) {
                        document.getElementById('bpm').textContent = bpm;
                    }
                }
                beatDetector.lastBeat = now;
            }
        }

        function updateTimeDisplay() {
            if (!audioElement) return;

            const current = audioElement.currentTime;
            const duration = audioElement.duration;

            document.getElementById('currentTime').textContent = formatTime(current);
            document.getElementById('duration').textContent = formatTime(duration);
        }

        function formatTime(seconds) {
            if (!isFinite(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }
    </script>
</body>
</html>`;
    }
}

export interface AudioAnalysisData {
    energy: number;
    isBeat: boolean;
    brightness: number;
    spectralCentroid: number;
    dominantFreq: number;
    timestamp: number;
}
