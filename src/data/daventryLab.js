// The Daventry One local model lab: the drawing above the bookcase (src/workspace3d/room.js) and its inspection view.
// Daventry One is Christopher's Mac Studio. Every model below is installed there (checked with `ollama list` on 2026-10-29).
// This is a reference drawing of what is installed and what each model is for. It is not a live status display.
export const LAB = {
  title: 'DAVENTRY ONE',
  subtitle: 'LOCAL MODEL LAB',
  caption: 'Local compute. Specialized models. Human-controlled workflows.',
  nodes: [
    { id: 'captain', name: 'CAPTAIN', model: 'qwen3.8:27b', role: 'Reasoning and orchestration', desc: 'Takes the harder reasoning and planning steps, and coordinates which specialist handles each part of a task.' },
    { id: 'volt', name: 'VOLT', model: 'qwen3-coder-next', role: 'Code development', desc: 'The default model in his local agent setup, used for writing and changing code.' },
    { id: 'vision', name: 'VISION', model: 'qwen3-vl:32b', role: 'Visual understanding', desc: 'Reads screenshots and images when a workflow needs to see what is on screen.' },
    { id: 'review', name: 'REVIEW', model: 'nemotron-lightning:30b', role: 'Fast first pass', desc: 'A quick first pass: it answers or checks ordinary requests directly and hands harder ones to Captain.' },
    { id: 'muse', name: 'MUSE', model: 'muse-glimmer:30b', role: 'Creative exploration', desc: 'Kept for open-ended drafting and brainstorming, where variety matters more than precision.' },
  ],
};
