export const THEMES = {
  editorial: { bg: '#e9e6e3', text: '#121212', muted: '#6d6d6d', accent: '#e1251b', circle: true,  wm: '#222', outro: '#050505', dark: false },
  night:     { bg: '#050505', text: '#f4f4f4', muted: '#8a8a8a', accent: '#ff3b2f', circle: false, wm: '#fff', outro: '#000', dark: true },
  warm:      { bg: '#fcefdc', text: '#2a1d12', muted: '#8a6f55', accent: '#f26a1b', circle: true,  wm: '#3a2a1c', outro: '#1a0f07', dark: false },
  mint:      { bg: '#eef2ee', text: '#10261e', muted: '#5f7a6e', accent: '#c8261c', circle: false, wm: '#10261e', outro: '#06140f', dark: false },
  cream:     { bg: '#fbf5ec', text: '#141414', muted: '#7a7a7a', accent: '#e8261a', circle: false, wm: '#222', outro: '#050505', dark: false },
  paper:     { bg: '#d9c7a6', text: '#1b1510', muted: '#6b5a45', accent: '#b3260f', circle: false, wm: '#2a2016', outro: '#0b0b0b', dark: false, paper: true }
};
// "alternate" is not a colour set: the renderer switches between these two for odd/even scenes
export const ALTERNATE = ['cream', 'night'];

const inter = w => s => `${w} ${s}px Inter, Arial, sans-serif`;
const playfair = (w, it) => s => `${it ? 'italic ' : ''}${w} ${s}px "Playfair Display", Georgia, serif`;
const anton = s => `400 ${s}px Anton, Impact, sans-serif`;
const script = s => `700 ${s}px "Dancing Script", "Brush Script MT", cursive`;
const hand = s => `700 ${s}px Caveat, "Comic Sans MS", cursive`;
const mono = w => s => `${w} ${s}px "Space Mono", "Courier New", monospace`;

// Each font set = 4 styles that rotate word by word, one style for *emphasised* words,
// and one "small" style used for the helper words in the keyword layouts.
export const FONT_SETS = {
  editorial: {
    styles: [
      { font: inter(800), size: 104, col: 'text' },
      { font: inter(300), size: 78, col: 'muted' },
      { font: playfair(500, true), size: 96, col: 'text' },
      { font: anton, size: 124, col: 'accent', upper: true }
    ],
    emph: { font: inter(800), size: 118, col: 'accent' },
    small: { font: inter(400), size: 64, col: 'muted' }
  },
  agency: {
    styles: [
      { font: inter(800), size: 104, col: 'text' },
      { font: inter(400), size: 78, col: 'muted' },
      { font: inter(800), size: 96, col: 'text' },
      { font: inter(500), size: 84, col: 'muted' }
    ],
    emph: { font: inter(800), size: 168, col: 'accent' },
    small: { font: inter(500), size: 66, col: 'text' }
  },
  poster: {
    styles: [
      { font: anton, size: 132, col: 'text', upper: true },
      { font: inter(800), size: 84, col: 'muted' },
      { font: anton, size: 112, col: 'text', upper: true },
      { font: inter(300), size: 76, col: 'text' }
    ],
    emph: { font: anton, size: 160, col: 'accent', upper: true },
    small: { font: inter(800), size: 60, col: 'muted' }
  },
  elegant: {
    styles: [
      { font: playfair(500, true), size: 104, col: 'text' },
      { font: playfair(500, false), size: 84, col: 'muted' },
      { font: inter(300), size: 74, col: 'text' },
      { font: playfair(500, true), size: 96, col: 'muted' }
    ],
    emph: { font: playfair(500, true), size: 140, col: 'accent' },
    small: { font: playfair(500, false), size: 66, col: 'muted' }
  },
  script: {
    styles: [
      { font: script, size: 128, col: 'text' },
      { font: inter(800), size: 80, col: 'muted' },
      { font: hand, size: 118, col: 'text' },
      { font: playfair(500, true), size: 92, col: 'muted' }
    ],
    emph: { font: script, size: 160, col: 'accent' },
    small: { font: inter(500), size: 62, col: 'muted' }
  },
  tech: {
    styles: [
      { font: mono(700), size: 84, col: 'text' },
      { font: mono(400), size: 72, col: 'muted' },
      { font: inter(800), size: 96, col: 'text' },
      { font: anton, size: 112, col: 'text', upper: true }
    ],
    emph: { font: mono(700), size: 110, col: 'accent', upper: true },
    small: { font: mono(400), size: 56, col: 'muted' }
  }
};
export const FONT_KEYS = Object.keys(FONT_SETS);
