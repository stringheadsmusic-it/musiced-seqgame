/**
 * sequencer.js - Rhythm Logic & Look-ahead Scheduling
 */

import { getAudioContext, playKick, playSnare, playHiHat, playSample } from './audio.js';

// Configuration
export const sequence = [
    [0, 0, 0, 0],             // Lane 0: Kick (4 steps)
    [0, 0, 0, 0, 0, 0, 0, 0], // Lane 1: Snare (8 steps)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Lane 2: Hi-Hat (16 steps)
];

let bpm = 120;
let isPlaying = false;
let currentStep = 0; // Global 16-step counter
let nextNoteTime = 0;
const lookahead = 0.05; // 50ms look-ahead
const scheduleInterval = 25; // Check every 25ms
let timerId = null;

// Samples (to be loaded if available)
let kickBuffer = null;
let snareBuffer = null;
let hatBuffer = null;

export const setBPM = (newBpm) => {
    console.log(`Sequencer: setting BPM to ${newBpm}`);
    bpm = newBpm;
};

export const getBPM = () => bpm;

export const toggleStep = (lane, step) => {
    sequence[lane][step] = sequence[lane][step] === 1 ? 0 : 1;
};

/**
 * Main scheduling loop
 */
function scheduler() {
    const audioCtx = getAudioContext();
    while (nextNoteTime < audioCtx.currentTime + lookahead) {
        scheduleNote(currentStep, nextNoteTime);
        advanceNote();
    }
}

function advanceNote() {
    // 1 bar = 4 beats. 16th note = 1/4 of a beat.
    const secondsPerBeat = 60.0 / bpm;
    const stepDuration = secondsPerBeat / 4; // 16th note duration
    
    nextNoteTime += stepDuration;
    
    currentStep++;
    if (currentStep === 16) {
        currentStep = 0;
    }
}

function scheduleNote(step, time) {
    // Determine which lane steps to trigger based on the global 16-step 'step'
    
    // Lane 0: Kick (4 steps) - triggers every 4th 16th-note
    if (step % 4 === 0) {
        const kickStep = step / 4;
        if (sequence[0][kickStep]) (kickBuffer ? playSample(kickBuffer, time) : playKick(time));
    }

    // Lane 1: Snare (8 steps) - triggers every 2nd 16th-note
    if (step % 2 === 0) {
        const snareStep = step / 2;
        if (sequence[1][snareStep]) (snareBuffer ? playSample(snareBuffer, time) : playSnare(time));
    }

    // Lane 2: Hi-Hat (16 steps) - triggers every 16th-note
    if (sequence[2][step]) (hatBuffer ? playSample(hatBuffer, time) : playHiHat(time));

    // Emit event for UI highlight
    // We pass both the global step (16-step) and the specific step indices for each lane
    const event = new CustomEvent('step-triggered', { 
        detail: { 
            globalStep: step,
            laneSteps: [
                step % 4 === 0 ? step / 4 : null,
                step % 2 === 0 ? step / 2 : null,
                step
            ],
            time 
        } 
    });
    window.dispatchEvent(event);
}

export const startSequencer = () => {
    isPlaying = true;
    currentStep = 0;
    const audioCtx = getAudioContext();
    nextNoteTime = audioCtx.currentTime;
    timerId = setInterval(scheduler, scheduleInterval);
};

export const stopSequencer = () => {
    isPlaying = false;
    clearInterval(timerId);
    timerId = null;
    currentStep = 0;
};

export const getIsPlaying = () => isPlaying;
export const getCurrentStep = () => currentStep;
