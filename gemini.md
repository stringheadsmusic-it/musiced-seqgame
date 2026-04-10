# Project Mission: 3-Lane Web Drum Sequencer

## Project Context
Building a high-performance, low-latency 1-bar drum sequencer using the Web Audio API. This is a "Vibe Coding" project focused on minimalist design and rhythmic precision.

## Tech Stack Requirements
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Audio:** Web Audio API (Strictly no <audio> tags for playback).
- **Architecture:** Look-ahead scheduling (50ms window) to avoid JavaScript thread jitter.

## Component Specifications
### 1. The Grid (Data Structure)
- Create a 2D array `sequence` (3 rows x 4 columns).
- Lanes: Row 0 = Kick, Row 1 = Snare, Row 2 = Hi-Hat.
- State: 0 (Off), 1 (On).

### 2. Audio Engine
- Context: Single `AudioContext` instance.
- Samples: Load 3 basic .wav samples (Kick, Snare, Hat).
- Trigger: `playSample(buffer, time)` function using `BufferSourceNodes`.

### 3. Sequencer Logic
- Default BPM: 120.
- Timing: Use a `setInterval` scheduler running every 25ms.
- Visuals: Highlight the current active beat column using a `.playing` CSS class.

## Style & UX Guidelines
- **Visuals:** Dark mode interface. Pads should be 60px x 60px squares with rounded corners (4px).
- **Colors:** - Off state: #333
  - On state: #00ff88 (Neon Green)
  - Playhead: Border highlight or glow effect.
- **Interactions:** Clicking a pad toggles its state in the `sequence` array and updates the UI instantly.

## Agent Constraints
- Do not use external libraries (like jQuery or Tone.js) unless specifically requested.
- Ensure the `AudioContext` is only resumed after a user gesture (Play button).
- Keep the code modular: `audio.js` for sound, `sequencer.js` for logic, `ui.js` for DOM.