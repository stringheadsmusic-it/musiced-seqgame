/**
 * audio.js - Web Audio API Engine with Mastering Limiter
 */

let audioCtx = null;
let masterLimiter = null;

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master limiter (using DynamicsCompressorNode)
        masterLimiter = audioCtx.createDynamicsCompressor();
        
        // Configure DynamicsCompressorNode as a brickwall limiter
        masterLimiter.threshold.setValueAtTime(-0.1, audioCtx.currentTime); // Limit peaks at -0.1 dB
        masterLimiter.knee.setValueAtTime(0, audioCtx.currentTime);        // Hard knee for instant brickwall limiting
        masterLimiter.ratio.setValueAtTime(20, audioCtx.currentTime);      // Max compression ratio acts as a limiter
        masterLimiter.attack.setValueAtTime(0.003, audioCtx.currentTime);  // Fast attack (3ms) to suppress transients
        masterLimiter.release.setValueAtTime(0.05, audioCtx.currentTime);  // Fast release (50ms) to prevent pumping
        
        // Connect the limiter to the sound card destination
        masterLimiter.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const getAudioContext = () => audioCtx;

/**
 * Returns the master limiter node if initialized, falling back to audioCtx.destination
 */
function getAudioDestination() {
    return masterLimiter || audioCtx.destination;
}

/**
 * Loads a sample from a URL
 */
export async function loadSample(url) {
    if (!audioCtx) initAudio();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Plays a sample buffer at a specific time
 */
export function playSample(buffer, time) {
    if (!audioCtx) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(getAudioDestination());
    source.start(time);
}

/**
 * Fallback: Synthesized Kick Drum
 */
export function playKick(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(getAudioDestination());

    osc.start(time);
    osc.stop(time + 0.5);
}

/**
 * Fallback: Synthesized Snare Drum
 */
export function playSnare(time) {
    if (!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(1, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(getAudioDestination());

    noise.start(time);
    noise.stop(time + 0.2);
}

/**
 * Fallback: Synthesized Hi-Hat
 */
export function playHiHat(time) {
    if (!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 0.05;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 7000;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(getAudioDestination());

    noise.start(time);
    noise.stop(time + 0.05);
}
