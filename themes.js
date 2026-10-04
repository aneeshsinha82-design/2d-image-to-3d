export const THEMES = {
  editorial: { bg: '#e9e6e3', text: '#121212', muted: '#6d6d6d', accent: '#e1251b', circle: true,  wm: '#222', outro: '#050505' },
  night:     { bg: '#050505', text: '#f4f4f4', muted: '#8a8a8a', accent: '#ff3b2f', circle: false, wm: '#fff', outro: '#000' },
  warm:      { bg: '#fcefdc', text: '#2a1d12', muted: '#8a6f55', accent: '#f26a1b', circle: true,  wm: '#3a2a1c', outro: '#1a0f07' },
  mint:      { bg: '#eef2ee', text: '#10261e', muted: '#5f7a6e', accent: '#c8261c', circle: false, wm: '#10261e', outro: '#06140f' }
};

export const STYLES = [
  { font: s => `800 ${s}px Inter, Arial, sans-serif`, size: 104, col: 'text' },
  { font: s => `300 ${s}px Inter, Arial, sans-serif`, size: 78,  col: 'muted' },
  { font: s => `italic 500 ${s}px "Playfair Display", Georgia, serif`, size: 96, col: 'text' },
  { font: s => `400 ${s}px Anton, Impact, sans-serif`, size: 124, col: 'accent', upper: true }
];
