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
let dragGhost = null;
let activePointerId = null;
let cachedPads = [];
let currentHoveredPad = null;

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
 * Global Pointer Dragging handlers for Seeds
 */
function onPointerMove(e) {
    if (e.pointerId !== activePointerId) return;
    if (!dragGhost) return;
    
    // Update ghost position using GPU-composited 3D transforms for butter-smooth movement
    dragGhost.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;

    const x = e.clientX;
    const y = e.clientY;

    let foundPad = null;
    for (let i = 0; i < cachedPads.length; i++) {
        const pad = cachedPads[i];
        if (x >= pad.left && x <= pad.right && y >= pad.top && y <= pad.bottom) {
            foundPad = pad;
            break;
        }
    }

    if (foundPad) {
        if (currentHoveredPad !== foundPad.element) {
            if (currentHoveredPad) {
                currentHoveredPad.classList.remove('drag-over');
            }
            currentHoveredPad = foundPad.element;
            currentHoveredPad.classList.add('drag-over');
        }
    } else {
        if (currentHoveredPad) {
            currentHoveredPad.classList.remove('drag-over');
            currentHoveredPad = null;
        }
    }
}

function onPointerUp(e) {
    if (e.pointerId !== activePointerId) return;

    if (dragGhost) {
        document.body.removeChild(dragGhost);
        dragGhost = null;
    }

    const x = e.clientX;
    const y = e.clientY;

    let foundPad = null;
    for (let i = 0; i < cachedPads.length; i++) {
        const pad = cachedPads[i];
        if (x >= pad.left && x <= pad.right && y >= pad.top && y <= pad.bottom) {
            foundPad = pad;
            break;
        }
    }

    if (foundPad && inventory[draggedLane] > 0) {
        plantSeed(foundPad.element, draggedLane, foundPad.step);
    }

    // Restore UI states
    if (currentHoveredPad) {
        currentHoveredPad.classList.remove('drag-over');
    }
    document.querySelectorAll('.lane-row').forEach(row => row.classList.remove('inactive'));
    document.querySelectorAll('.seed').forEach(s => s.style.opacity = '1');

    draggedLane = null;
    activePointerId = null;
    cachedPads = [];
    currentHoveredPad = null;

    // Remove tracking listeners
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
}

function onPointerCancel(e) {
    if (e.pointerId !== activePointerId) return;

    if (dragGhost) {
        document.body.removeChild(dragGhost);
        dragGhost = null;
    }

    // Restore UI states
    if (currentHoveredPad) {
        currentHoveredPad.classList.remove('drag-over');
    }
    document.querySelectorAll('.lane-row').forEach(row => row.classList.remove('inactive'));
    document.querySelectorAll('.seed').forEach(s => s.style.opacity = '1');

    draggedLane = null;
    activePointerId = null;
    cachedPads = [];
    currentHoveredPad = null;

    // Remove tracking listeners
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
}

document.querySelectorAll('.seed').forEach(seed => {
    // Disable browser native image dragging
    seed.addEventListener('dragstart', (e) => e.preventDefault());

    seed.addEventListener('pointerdown', (e) => {
        // Only left-click for mouse, bypass for touch events
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        
        // Ignore additional touches if a drag is already active
        if (activePointerId !== null) return;
        
        const seedContainer = e.target.closest('.seed');
        if (!seedContainer) return;
        
        const laneVal = parseInt(seedContainer.dataset.lane);
        if (isNaN(laneVal) || inventory[laneVal] <= 0) {
            return;
        }

        activePointerId = e.pointerId;
        draggedLane = laneVal;

        // Prevent default touch scrolling/actions
        e.preventDefault();

        // Cache pads for the active lane to avoid layout thrashing during dragging
        cachedPads = [];
        currentHoveredPad = null;
        document.querySelectorAll(`.pad[data-lane="${draggedLane}"]`).forEach(pad => {
            const rect = pad.getBoundingClientRect();
            if (!pad.querySelector('.plant')) {
                cachedPads.push({
                    element: pad,
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                    step: parseInt(pad.dataset.step)
                });
            }
        });

        // Create visual ghost
        const seedImg = seedContainer.querySelector('.seed-img');
        dragGhost = document.createElement('img');
        dragGhost.src = seedImg.src;
        dragGhost.className = 'drag-ghost';
        // Position at pointer coordinates initially via hardware-accelerated transform
        dragGhost.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        document.body.appendChild(dragGhost);

        // Hide the original seed container during drag
        seedContainer.style.opacity = '0.3';

        // Dim inactive lanes
        document.querySelectorAll('.lane-row').forEach((row, index) => {
            if (index !== draggedLane) {
                row.classList.add('inactive');
            }
        });

        // Set up tracking listeners
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
    });
});

/**
 * Global Context Menu Prevention for Footer
 * Prevents interference during dragging and interaction
 */
document.querySelector('.game-footer').addEventListener('contextmenu', (e) => {
    e.preventDefault();
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
