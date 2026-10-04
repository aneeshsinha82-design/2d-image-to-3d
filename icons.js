import { W, clamp01, easeOutCubic, easeOutBack } from './util.js';

// Every icon is drawn in a unit box (-1..1) with the current stroke settings.
const ICONS = {
  gear(g) {
    for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); g.fillRect(-0.12, -0.62, 0.24, 0.26); g.restore(); }
    g.beginPath(); g.arc(0, 0, 0.42, 0, 7); g.stroke();
    g.beginPath(); g.arc(0, 0, 0.16, 0, 7); g.stroke();
  },
  user(g) {
    g.beginPath(); g.arc(0, -0.28, 0.24, 0, 7); g.stroke();
    g.beginPath(); g.arc(0, 0.62, 0.46, Math.PI, 0); g.stroke();
  },
  headset(g) {
    g.beginPath(); g.arc(0, -0.05, 0.46, Math.PI, 0); g.stroke();
    g.fillRect(-0.58, -0.08, 0.2, 0.42); g.fillRect(0.38, -0.08, 0.2, 0.42);
    g.beginPath(); g.moveTo(0.48, 0.34); g.quadraticCurveTo(0.46, 0.6, 0.1, 0.6); g.stroke();
  },
  chat(g) {
    g.beginPath(); g.roundRect(-0.6, -0.45, 1.2, 0.8, 0.18); g.stroke();
    g.beginPath(); g.moveTo(-0.25, 0.35); g.lineTo(-0.4, 0.68); g.lineTo(0.05, 0.35); g.stroke();
  },
  star(g) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.25 : 0.62, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.stroke();
  },
  check(g) { g.beginPath(); g.moveTo(-0.5, 0.05); g.lineTo(-0.15, 0.4); g.lineTo(0.55, -0.35); g.stroke(); },
  bolt(g) { g.beginPath(); g.moveTo(0.15, -0.65); g.lineTo(-0.35, 0.1); g.lineTo(0, 0.1); g.lineTo(-0.15, 0.65); g.lineTo(0.4, -0.15); g.lineTo(0.05, -0.15); g.closePath(); g.stroke(); },
  heart(g) {
    g.beginPath(); g.moveTo(0, 0.55);
    g.bezierCurveTo(-0.9, -0.05, -0.4, -0.7, 0, -0.2);
    g.bezierCurveTo(0.4, -0.7, 0.9, -0.05, 0, 0.55); g.stroke();
  },
  clock(g) {
    g.beginPath(); g.arc(0, 0, 0.55, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(0, -0.3); g.lineTo(0, 0); g.lineTo(0.25, 0.12); g.stroke();
  },
  247(g) { g.font = '800 0.5px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('24/7', 0, 0.02); },
  hand(g) { // thumbs up
    g.beginPath(); g.roundRect(-0.62, -0.05, 0.26, 0.6, 0.05); g.stroke();
    g.beginPath(); g.moveTo(-0.3, -0.02); g.lineTo(-0.02, -0.5); g.quadraticCurveTo(0.12, -0.7, 0.22, -0.5); g.lineTo(0.14, -0.14);
    g.lineTo(0.5, -0.14); g.quadraticCurveTo(0.66, -0.12, 0.6, 0.06); g.lineTo(0.46, 0.5); g.quadraticCurveTo(0.4, 0.6, 0.3, 0.6); g.lineTo(-0.3, 0.6); g.stroke();
  },
  mail(g) { g.beginPath(); g.roundRect(-0.6, -0.4, 1.2, 0.8, 0.1); g.stroke(); g.beginPath(); g.moveTo(-0.6, -0.35); g.lineTo(0, 0.1); g.lineTo(0.6, -0.35); g.stroke(); }
};
export const ICON_NAMES = Object.keys(ICONS);

export function drawBadge(ctx, name, x, y, r, th, pop, alpha) {
  if (pop <= 0) return;
  const draw = ICONS[name] || ICONS.star;
  ctx.save();
  ctx.globalAlpha = clamp01(alpha);
  ctx.translate(x, y); ctx.scale(pop, pop);
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 0.11; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.scale(r * 0.62, r * 0.62);
  draw(ctx);
  ctx.restore();
}

// thin ring with round icon badges that orbit slowly and pop in one after another
export function drawOrbit(ctx, th, names, cx, cy, R, t, age) {
  if (!names || !names.length) return;
  const ringP = easeOutCubic(clamp01(age / 0.5));
  ctx.save();
  ctx.globalAlpha = 0.9 * ringP; ctx.strokeStyle = th.text; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R * ringP, 0, 7); ctx.stroke();
  ctx.restore();
  names.forEach((n, i) => {
    const local = age - 0.2 - i * 0.14;
    const a = -Math.PI / 2 + i * 2 * Math.PI / names.length + t * 0.45;
    drawBadge(ctx, n, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 62, th, local <= 0 ? 0 : easeOutBack(clamp01(local / 0.4)), clamp01(local / 0.15));
  });
}

function cursor(ctx, x, y, s, press) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s * (press ? 0.92 : 1), s * (press ? 0.92 : 1));
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#111'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 42); ctx.lineTo(11, 32); ctx.lineTo(19, 50); ctx.lineTo(28, 46); ctx.lineTo(20, 29); ctx.lineTo(34, 29); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// black pill button; a hand cursor flies in, presses it, a pale halo pulses
export function drawButton(ctx, th, text, cy, age) {
  if (age <= 0) return;
  const pop = easeOutBack(clamp01(age / 0.45));
  ctx.save();
  ctx.font = '800 56px Inter, Arial, sans-serif';
  const w = ctx.measureText(text).width + 130, h = 112;
  const clickT = 1.15, pressed = age > clickT && age < clickT + 0.18;
  ctx.translate(W / 2, cy); ctx.scale(pop * (pressed ? 0.95 : 1), pop * (pressed ? 0.95 : 1));
  if (age > clickT) { // halo ring
    const q = clamp01((age - clickT) / 0.7);
    ctx.globalAlpha = (1 - q) * 0.45; ctx.fillStyle = th.dark ? '#ffffff' : '#9a9a9a';
    ctx.beginPath(); ctx.roundRect(-w / 2 - 22 * q - 14, -h / 2 - 22 * q - 14, w + 44 * q + 28, h + 44 * q + 28, h); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = th.dark ? '#f4f4f4' : '#141414';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = th.dark ? '#111' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 4);
  ctx.restore();
  // cursor path: from lower-right to the pill centre
  const q = easeOutCubic(clamp01((age - 0.5) / 0.65));
  if (age > 0.5) cursor(ctx, W / 2 + (300 - 300 * q) + 30, cy + (260 - 260 * q) + 6, 1.15, pressed);
}
