// The full-page experiences the CRT opens. Each one is an existing, unchanged section component;
// the hash is the existing anchor id (so every old `/#work`, `/#about`, `/#navigator` link still lands).
// `file`/`ext` are the names shown on the CRT directory. Descriptions reuse the sections' own wording.
export const EXPERIENCES = [
  { id: 'work', file: 'WORLD', ext: 'MAP', label: 'Project World', blurb: 'The illustrated journey through the systems I build.' },
  { id: 'navigator', file: 'ASK', ext: 'EXE', label: 'Ask about my work', blurb: 'Describe a problem or ask about a project.' },
  { id: 'about', file: 'ABOUT', ext: 'TXT', label: 'About', blurb: 'Who I am and how I work.' },
  { id: 'skills', file: 'SKILLS', ext: 'TXT', label: 'Skills', blurb: 'Stacks I reach for when I build something real.' },
  { id: 'ai-consultation', file: 'CONSULT', ext: 'EXE', label: 'AI consultation', blurb: 'Where AI could actually help in your workflow.' },
  { id: 'contact', file: 'CONTACT', ext: 'TXT', label: 'Contact', blurb: 'How to reach me.' },
];

export const experienceFromHash = (hash) => EXPERIENCES.find((e) => `#${e.id}` === hash) || null;
export const hrefFor = (e) => `/#${e.id}`;
