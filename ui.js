/**
 * ui.js - DOM Interaction & Visualization
 */

import { initAudio } from './audio.js';
import { 
    sequence, 
    startSequencer, 
    stopSequencer, 
    toggleStep, 
    getIsPlaying, 
    setBPM 
} from './sequencer.js';

const gridContainer = document.getElementById('sequencer-grid');
const playBtn = document.getElementById('play-btn');
const bpmInput = document.getElementById('bpm');

const lanes = ['Kick', 'Snare', 'Hi-Hat'];

/**
 * Initializes the grid UI
 */
function initGrid() {
    gridContainer.innerHTML = '';
    
    lanes.forEach((laneName, laneIndex) => {
        // Create Row Container
        const row = document.createElement('div');
        row.className = `lane-row lane-row-${laneIndex}`;
        
        // Lane steps count from sequence data
        const stepCount = sequence[laneIndex].length;
        
        // PADS for this lane
        for (let step = 0; step < stepCount; step++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.lane = laneIndex;
            pad.dataset.step = step;
            
            pad.addEventListener('click', () => {
                toggleStep(laneIndex, step);
                pad.classList.toggle('active');
            });
            
            row.appendChild(pad);
        }
        
        gridContainer.appendChild(row);
    });
}

/**
 * Updates playbutton state
 */
function updatePlayButton() {
    const isPlaying = getIsPlaying();
    playBtn.textContent = isPlaying ? 'Stop' : 'Play';
    playBtn.style.backgroundColor = isPlaying ? '#ff4444' : '#00ff88';
}

// Play/Stop Event
playBtn.addEventListener('click', () => {
    initAudio(); // Resume AudioContext
    
    if (getIsPlaying()) {
        stopSequencer();
    } else {
        startSequencer();
    }
    updatePlayButton();
});

// BPM Event
bpmInput.addEventListener('change', (e) => {
    setBPM(parseInt(e.target.value));
});

// Visual Playhead Sync
window.addEventListener('step-triggered', (e) => {
    const { laneSteps } = e.detail;
    
    // Clear previous focus
    const allPads = document.querySelectorAll('.pad');
    allPads.forEach(p => p.classList.remove('playing'));
    
    // Highlight specific pads for each lane that triggered
    laneSteps.forEach((stepIndex, laneIndex) => {
        if (stepIndex !== null) {
            const pad = document.querySelector(`.pad[data-lane="${laneIndex}"][data-step="${stepIndex}"]`);
            if (pad) pad.classList.add('playing');
        }
    });
});

// Start initialization
initGrid();
updatePlayButton();
console.log('UI Initialized');
