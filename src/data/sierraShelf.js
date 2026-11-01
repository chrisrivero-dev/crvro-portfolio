// The Sierra shelf Easter egg: an original fan tribute. No Sierra artwork, music, dialogue, or other game assets are used.
export const FOLDERS = [
  { id: 'hero', label: "Hero's Quest", spine: ["HERO'S QUEST", '1989'], title: "HERO'S QUEST · 1989" },
  { id: 'space', label: 'Space Quest', spine: ['SPACE QUEST'], title: 'SPACE QUEST' },
  { id: 'kings', label: "King's Quest", spine: ["KING'S QUEST"], title: "KING'S QUEST" },
  { id: 'sierra', label: 'SIERRA.EXE', spine: ['SIERRA.EXE'], title: 'SIERRA.EXE' },
];

export const NOTES = {
  space: 'A folder of old adventures among the stars. Inside, one slip of paper reads: remember to save your game before touching anything.',
  kings: 'A folder of storybook roads and castle gates. Inside, one slip of paper reads: look at everything, and type what you would try.',
};

export const ARCHIVE = [
  { file: 'KINGQUEST', name: "King's Quest" },
  { file: 'SPACEQST', name: 'Space Quest' },
  { file: 'HEROQUEST', name: "Hero's Quest (1989), later Quest for Glory" },
];

export const CLASSES = [
  { id: 'fighter', name: 'Fighter', trait: 'Strength, persistence, and overcoming challenges.', story: 'The gate is locked. You knock, then push, then come back tomorrow and push again. Some problems do not need a clever answer. They need someone who refuses to leave.' },
  { id: 'magic', name: 'Magic User', trait: 'Creativity, curiosity, and finding unconventional solutions.', story: 'The gate is locked. You study it, ask why it was built, and try something nobody thought to try. Some problems only look solid until you change how you see them.' },
  { id: 'thief', name: 'Thief', trait: 'Observation, resourcefulness, and discovering hidden opportunities.', story: 'The gate is locked. You walk the wall, notice the loose stone, and spot the path others missed. Some problems were never in the way. You just have to look closer.' },
];

export const SHEET = {
  name: 'Christopher Rivero',
  charClass: 'Explorer / Problem Solver',
  stats: [['Curiosity', 95], ['Problem Solving', 88], ['Creativity', 82], ['Persistence', 90]],
  note: 'Before I was building interactive worlds, I was exploring them. Quest for Glory was one of the games that made me curious about what computers could do. I loved choosing a character, developing skills, exploring new places, and discovering how different decisions could change the experience. That sense of exploration still influences how I approach building software today.',
};
