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
    setBPM,
    clearSequence,
    getIsChallengeMode,
    setIsChallengeMode,
    getActiveChallenge,
    loadChallenge,
    loadRandomChallenge,
    checkSequence
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
let padElements = [[], [], []];

/**
 * Initializes the grid UI
 */
function initGrid() {
    gridContainer.innerHTML = '';
    padElements = [[], [], []];

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
            padElements[laneIndex][step] = pad;
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
    if (laneIndex === 0) {
        img.classList.add('tomato-fruit-img');
    }
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
    if (getIsChallengeMode()) {
        playBtn.textContent = isPlaying ? 'Playing...' : 'Test Beat';
        playBtn.style.backgroundColor = isPlaying ? '#00e676' : '#00ff88';
        playBtn.style.color = '#121212';
        playBtn.style.borderColor = '#00b35f';
    } else {
        playBtn.textContent = isPlaying ? 'Stop' : 'Start';
        playBtn.style.backgroundColor = isPlaying ? '#f44336' : '#ff9800';
        playBtn.style.color = 'white';
        playBtn.style.borderColor = isPlaying ? '#b71c1c' : '#e65100';
    }
}

// Play/Stop Event
playBtn.addEventListener('click', () => {
    initAudio(); // Resume AudioContext

    if (getIsPlaying()) {
        stopSequencer();
        // Clear evaluation highlights when stopped manually
        if (getIsChallengeMode()) {
            for (let lane = 0; lane < 3; lane++) {
                const pads = padElements[lane];
                for (let step = 0; step < pads.length; step++) {
                    pads[step].classList.remove('eval-correct', 'eval-incorrect');
                }
            }
        }
    } else {
        // If starting in Challenge Mode, show evaluation highlights immediately
        if (getIsChallengeMode()) {
            highlightEvaluationGrid();
        }
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

    // Clear previous focus using the cached padElements
    for (let lane = 0; lane < 3; lane++) {
        const pads = padElements[lane];
        for (let step = 0; step < pads.length; step++) {
            pads[step].classList.remove('playing');
        }
    }

    // Highlight specific pads for each lane that triggered
    laneSteps.forEach((stepIndex, laneIndex) => {
        if (stepIndex !== null) {
            const pad = padElements[laneIndex][stepIndex];
            if (pad) pad.classList.add('playing');
        }
    });
});

// --- CHALLENGE MODE LOGIC ---

const modeToggle = document.getElementById('mode-toggle');
const modeFreeText = document.getElementById('mode-free');
const modeChallengeText = document.getElementById('mode-challenge');
const challengeCard = document.getElementById('challenge-card');
const nextChallengeBtn = document.getElementById('next-challenge-btn');

const gameModal = document.getElementById('game-modal');
const modalRetryBtn = document.getElementById('modal-retry-btn');
const modalContinueBtn = document.getElementById('modal-continue-btn');

function clearGarden() {
    for (let lane = 0; lane < 3; lane++) {
        const pads = padElements[lane];
        for (let step = 0; step < pads.length; step++) {
            const pad = pads[step];
            const plant = pad.querySelector('.plant');
            if (plant) {
                pad.removeChild(plant);
            }
            pad.classList.remove('cue', 'eval-correct', 'eval-incorrect');
        }
    }
    clearSequence();
}

function updateInventoryForActiveChallenge() {
    const activeChal = getActiveChallenge();
    if (activeChal && getIsChallengeMode()) {
        const counts = [0, 0, 0];
        for (let lane = 0; lane < 3; lane++) {
            counts[lane] = activeChal.sequence[lane].filter(v => v === 1).length;
        }
        inventory = counts;
    } else {
        inventory = [4, 8, 16]; // Free Play defaults
    }
    updateInventoryUI();
}

function applyChallengeCues() {
    const activeChal = getActiveChallenge();
    if (!activeChal || !getIsChallengeMode()) return;
    
    for (let lane = 0; lane < 3; lane++) {
        const pads = padElements[lane];
        for (let step = 0; step < pads.length; step++) {
            pads[step].classList.remove('cue');
        }
    }
    
    for (let laneIndex = 0; laneIndex < 3; laneIndex++) {
        const steps = activeChal.sequence[laneIndex];
        steps.forEach((val, stepIndex) => {
            if (val === 1) {
                const pad = padElements[laneIndex][stepIndex];
                if (pad) {
                    pad.classList.add('cue');
                }
            }
        });
    }
}

// Mode Selector Toggle
modeToggle.addEventListener('change', (e) => {
    const isChallenge = e.target.checked;
    setIsChallengeMode(isChallenge);
    document.body.classList.toggle('challenge-mode-active', isChallenge);
    
    if (isChallenge) {
        modeFreeText.classList.remove('active');
        modeChallengeText.classList.add('active');
        challengeCard.classList.remove('hidden');
        
        if (getIsPlaying()) {
            stopSequencer();
        }
        
        loadRandomChallenge();
    } else {
        modeChallengeText.classList.remove('active');
        modeFreeText.classList.add('active');
        challengeCard.classList.add('hidden');
        
        if (getIsPlaying()) {
            stopSequencer();
        }
        
        clearGarden();
        updateInventoryForActiveChallenge();
    }
    
    updatePlayButton();
});

// Skip Button
nextChallengeBtn.addEventListener('click', () => {
    loadRandomChallenge();
});

function highlightEvaluationGrid() {
    const activeChal = getActiveChallenge();
    if (!activeChal) return;
    
    for (let lane = 0; lane < 3; lane++) {
        const pads = padElements[lane];
        const steps = activeChal.sequence[lane];
        
        for (let step = 0; step < pads.length; step++) {
            const pad = pads[step];
            const hasPlant = pad.querySelector('.plant') !== null ? 1 : 0;
            const target = steps[step];
            
            // Clear previous evaluation classes
            pad.classList.remove('eval-correct', 'eval-incorrect');
            
            if (hasPlant === target) {
                // If it matches and there is a plant, glow green
                if (hasPlant === 1) {
                    pad.classList.add('eval-correct');
                }
            } else {
                // If it doesn't match, glow red
                pad.classList.add('eval-incorrect');
            }
        }
    }
}

// Challenge Playback Finished Event
window.addEventListener('challenge-playback-finished', () => {
    // Clear playhead highlight from cached padElements
    for (let lane = 0; lane < 3; lane++) {
        const pads = padElements[lane];
        for (let step = 0; step < pads.length; step++) {
            pads[step].classList.remove('playing');
        }
    }
    
    const result = checkSequence();
    highlightEvaluationGrid();
    showResultsModal(result);
});

// Challenge Loaded Event
window.addEventListener('challenge-loaded', (e) => {
    const { challenge } = e.detail;
    
    const titleEl = document.getElementById('challenge-title');
    const descEl = document.getElementById('challenge-desc');
    if (titleEl) titleEl.textContent = challenge.name;
    if (descEl) descEl.textContent = challenge.description;
    
    bpmInput.value = challenge.bpm;
    bpmSlider.value = challenge.bpm;
    
    clearGarden();
    updateInventoryForActiveChallenge();
    applyChallengeCues();
});

function showResultsModal(result) {
    const modalTitle = document.getElementById('modal-title');
    const modalStars = document.getElementById('modal-stars');
    const modalMessage = document.getElementById('modal-message');
    
    // Grading scale
    let stars = 0;
    if (result.accuracy === 1.0) {
        stars = 3;
    } else if (result.accuracy >= 0.85) {
        stars = 2;
    } else if (result.accuracy >= 0.70) {
        stars = 1;
    }
    
    if (stars === 3) {
        modalTitle.textContent = "Perfect Garden! 🌟";
        modalMessage.textContent = "Amazing groove! You planted every single seed in the perfect spot.";
        modalContinueBtn.textContent = "Next Challenge";
    } else if (stars === 2) {
        modalTitle.textContent = "Very Good! 🌻";
        modalMessage.textContent = `So close! You got ${result.correctCount} out of ${result.totalCount} steps correct. Just a couple of tweaks needed for perfection.`;
        modalContinueBtn.textContent = "Continue Anyway";
    } else if (stars === 1) {
        modalTitle.textContent = "Nice Effort! 🌿";
        modalMessage.textContent = `Getting there! You got ${result.correctCount} out of ${result.totalCount} steps correct. Try adjusting your plants to match the glowing cues!`;
        modalContinueBtn.textContent = "Continue Anyway";
    } else {
        modalTitle.textContent = "Try Again! 🍂";
        modalMessage.textContent = `The beat is a bit out of sync. You got ${result.correctCount} out of ${result.totalCount} correct. Retrying will help you match the cues!`;
        modalContinueBtn.textContent = "Skip Challenge";
    }
    
    modalStars.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        const starSpan = document.createElement('span');
        starSpan.className = 'star';
        starSpan.innerHTML = '&#9733;';
        if (i <= stars) {
            starSpan.classList.add('filled');
        }
        starSpan.style.animationDelay = `${(i - 1) * 150}ms`;
        starSpan.classList.add('animate');
        modalStars.appendChild(starSpan);
    }
    
    gameModal.showModal();
    updatePlayButton();
}

// Modal Buttons Actions
modalRetryBtn.addEventListener('click', () => {
    gameModal.close();
    clearGarden();
    updateInventoryForActiveChallenge();
    applyChallengeCues();
});

modalContinueBtn.addEventListener('click', () => {
    gameModal.close();
    loadRandomChallenge();
});

// Start initialization
initGrid();
updateInventoryUI();
updatePlayButton();
console.log('Gardening UI Initialized');
