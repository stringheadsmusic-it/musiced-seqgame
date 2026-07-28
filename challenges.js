/**
 * challenges.js - Game Challenges Definition
 */

export const challenges = [
    {
        id: "rock-groove",
        name: "Rock & Roll Garden",
        description: "Grow a classic rock groove! Tomatoes (Kick) on beats 1 and 3, Corn (Snare) on beats 2 and 4, and Carrots (Hats) on all eighth-notes.",
        bpm: 120,
        sequence: [
            [1, 0, 1, 0], // Kick (4 steps)
            [0, 0, 1, 0, 0, 0, 1, 0], // Snare (8 steps)
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] // Hat (16 steps)
        ]
    },
    {
        id: "dance-groove",
        name: "Techno Dance Floor",
        description: "Grow a driving dance beat! Tomatoes (Kick) on every single beat, Corn (Snare) on beats 2 and 4, and Carrots (Hats) playing off-beats.",
        bpm: 128,
        sequence: [
            [1, 1, 1, 1], // Kick
            [0, 0, 1, 0, 0, 0, 1, 0], // Snare
            [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] // Hat (offbeats)
        ]
    },
    {
        id: "hiphop-groove",
        name: "Boom-Bap Backyard",
        description: "Grow a hip-hop boom-bap rhythm! Tomatoes on beats 1 and 3, Corn on beats 2 and 4, and Carrots playing fast sixteenth-notes.",
        bpm: 95,
        sequence: [
            [1, 0, 1, 0], // Kick
            [0, 0, 1, 0, 0, 0, 1, 0], // Snare
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] // Hat (16th notes)
        ]
    },
    {
        id: "funk-groove",
        name: "Funky Greenhouse",
        description: "Grow a syncopated funk beat! Tomatoes on beats 1, 3, and 4. Corn on beats 2 and 4. Carrots playing a groovy syncopated pattern.",
        bpm: 110,
        sequence: [
            [1, 0, 1, 1], // Kick
            [0, 0, 1, 0, 0, 0, 1, 0], // Snare
            [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1] // Hat
        ]
    },
    {
        id: "caribbean-breeze",
        name: "Caribbean Salsa Garden",
        description: "Grow a sunny Latin beat! Tomatoes on beats 1 and 3. Corn playing syncopated cross-beats, and Carrots filling the rhythm.",
        bpm: 115,
        sequence: [
            [1, 0, 1, 0], // Kick
            [0, 1, 0, 1, 0, 1, 0, 1], // Snare (syncopated)
            [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1] // Hat
        ]
    }
];
