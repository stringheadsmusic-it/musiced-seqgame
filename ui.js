/**
 * ui.js - Gardening Gameplay & Visualization
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
const bpmSlider = document.getElementById('bpm-slider');
const shovelTool = document.getElementById('shovel-tool');

const lanes = ['Kick', 'Snare', 'Hi-Hat'];
const fruitAssets = [
    'assets/image/tomato.png',
    'assets/image/corn.png',
    'assets/image/carrot.png'
];

let inventory = [4, 8, 16];
let isDeleteMode = false;
let draggedLane = null;

/**
 * Initializes the grid UI
 */
function initGrid() {
    gridContainer.innerHTML = '';

    lanes.forEach((laneName, laneIndex) => {
        const row = document.createElement('div');
        row.className = `lane-row lane-row-${laneIndex}`;
        const stepCount = sequence[laneIndex].length;

        for (let step = 0; step < stepCount; step++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.lane = laneIndex;
            pad.dataset.step = step;

            // Drag and Drop Listeners
            pad.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedLane == laneIndex && !pad.querySelector('.plant')) {
                    pad.classList.add('drag-over');
                }
            });

            pad.addEventListener('dragleave', () => {
                pad.classList.remove('drag-over');
            });

            pad.addEventListener('drop', (e) => {
                e.preventDefault();
                pad.classList.remove('drag-over');
                if (draggedLane == laneIndex && !pad.querySelector('.plant') && inventory[laneIndex] > 0) {
                    plantSeed(pad, laneIndex, step);
                }
            });

            // Click listener for Shovel (Delete Mode)
            pad.addEventListener('click', () => {
                if (isDeleteMode && pad.querySelector('.plant')) {
                    harvestPlant(pad, laneIndex, step);
                }
            });

            row.appendChild(pad);
        }
        gridContainer.appendChild(row);
    });
}

/**
 * Planting Logic
 */
function plantSeed(pad, laneIndex, step) {
    // Update Sequencer State
    if (sequence[laneIndex][step] === 0) {
        toggleStep(laneIndex, step);
    }

    // Create Plant Element
    const plant = document.createElement('div');
    plant.className = 'plant';
    const img = document.createElement('img');
    img.src = fruitAssets[laneIndex];
    img.className = 'fruit-img';
    plant.appendChild(img);
    pad.appendChild(plant);

    // Update Inventory
    inventory[laneIndex]--;
    updateInventoryUI();
}

/**
 * Harvesting Logic
 */
function harvestPlant(pad, laneIndex, step) {
    // Update Sequencer State
    if (sequence[laneIndex][step] === 1) {
        toggleStep(laneIndex, step);
    }

    // Remove Plant Element
    const plant = pad.querySelector('.plant');
    if (plant) pad.removeChild(plant);

    // Update Inventory
    inventory[laneIndex]++;
    updateInventoryUI();
}

/**
 * Inventory UI Sync
 */
function updateInventoryUI() {
    inventory.forEach((count, i) => {
        const countEl = document.getElementById(`count-${i}`);
        if (countEl) countEl.textContent = count;

        // Visual feedback if empty
        const container = document.querySelector(`.basket-container[data-lane="${i}"]`);
        const seedEl = container ? container.querySelector('.seed') : null;

        if (seedEl) {
            if (count === 0) {
                seedEl.style.opacity = '0.3';
                seedEl.style.pointerEvents = 'none';
            } else {
                seedEl.style.opacity = '1';
                seedEl.style.pointerEvents = 'all';
            }
        }
    });
}

/**
 * Shovel Mode Toggle
 */
shovelTool.addEventListener('click', () => {
    isDeleteMode = !isDeleteMode;
    shovelTool.classList.toggle('active');
    document.body.classList.toggle('delete-mode');
});

/**
 * Global Drag Events for Seeds
 */
document.querySelectorAll('.seed').forEach(seed => {
    seed.addEventListener('dragstart', (e) => {
        draggedLane = e.target.closest('.seed').dataset.lane;
        e.dataTransfer.setData('text/plain', draggedLane);
        // Subtle delay to hide original while dragging
        setTimeout(() => e.target.style.visibility = 'hidden', 0);
    });

    seed.addEventListener('dragend', (e) => {
        e.target.style.visibility = 'visible';
        draggedLane = null;
    });
});

/**
 * Updates playbutton state
 */
function updatePlayButton() {
    const isPlaying = getIsPlaying();
    playBtn.textContent = isPlaying ? 'Stop' : 'Start';
    playBtn.style.backgroundColor = isPlaying ? '#f44336' : '#ff9800';
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
bpmInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    console.log(`UI: numeric input changed to ${val}`);
    if (isNaN(val)) return;
    setBPM(val);
    bpmSlider.value = val;
});

bpmSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    console.log(`UI: slider changed to ${val}`);
    setBPM(val);
    bpmInput.value = val;
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
updateInventoryUI();
updatePlayButton();
console.log('Gardening UI Initialized');
