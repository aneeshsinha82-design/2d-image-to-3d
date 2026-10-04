import { W, H, clamp01, easeOutCubic, easeInOut, easeOutBack, rnd } from './util.js';

export const TRANSITIONS = ['wipe', 'iris', 'stripes', 'glitch', 'curtain', 'diagonal', 'zoom', 'flash', 'slits', 'bands', 'ink', 'ribbon', 'dot', 'tilt', 'blurin'];
export const TRANS_LEN = 0.5;

/* ---------- camera-type transitions: change HOW the new scene is drawn ---------- */
export function cameraPre(ctx, kind, q) {
  if (kind === 'tilt') {
    const e = easeOutCubic(q);
    ctx.translate(W / 2, H / 2); ctx.rotate((1 - e) * 0.14);
    const s = 1 + (1 - e) * 0.22; ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
  } else if (kind === 'blurin') {
    ctx.filter = `blur(${((1 - easeOutCubic(q)) * 18).toFixed(1)}px)`;
  }
}

/* ---------- overlay-type transitions: drawn on top of the finished frame ---------- */
function blob(ctx, cx, cy, R, seed, jag) {
  const n = 34;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = R * (1 - jag + jag * 2 * rnd(seed + i * 3.1));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function drawTransition(ctx, th, sc, t, kind, si) {
  const q = (t - sc.start) / TRANS_LEN;
  if (q < 0 || q >= 1 || kind === 'tilt' || kind === 'blurin') return;
  const cv = ctx.canvas;
  ctx.save();
  ctx.fillStyle = th.accent;
  if (kind === 'wipe') {
    const bw = W * 0.8;
    ctx.fillRect(-bw + q * (W + bw), 0, bw, H);
  } else if (kind === 'flash') {
    ctx.globalAlpha = (1 - q) * 0.85; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  } else if (kind === 'iris') {
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 1150 * Math.sin(Math.PI * q), 0, 7); ctx.fill();
  } else if (kind === 'dot') {
    ctx.beginPath(); ctx.arc(0, H, 2300 * Math.sin(Math.PI * q), 0, 7); ctx.fill();
  } else if (kind === 'stripes') {
    const N = 8, bh = H / N;
    for (let i = 0; i < N; i++) ctx.fillRect(-W + clamp01((q - i * 0.04) / 0.6) * 2 * W, i * bh, W, bh + 1);
  } else if (kind === 'curtain') {
    const w = (W / 2) * Math.sin(Math.PI * q);
    ctx.fillRect(0, 0, w, H); ctx.fillRect(W - w, 0, w, H);
  } else if (kind === 'diagonal') {
    const o = -W * 1.6 + q * (W * 3.6), skew = 600;
    ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o + W * 1.1, 0); ctx.lineTo(o + W * 1.1 - skew, H); ctx.lineTo(o - skew, H); ctx.closePath(); ctx.fill();
  } else if (kind === 'slits') { // dark vertical columns slide apart and reveal the scene
    ctx.fillStyle = th.outro;
    const N = 7, cw = W / N;
    for (let i = 0; i < N; i++) {
      const w = (cw + 1) * (1 - easeOutCubic(clamp01((q - i * 0.035) / 0.7)));
      ctx.fillRect(i % 2 ? (i + 1) * cw - w : i * cw, 0, w, H);
    }
  } else if (kind === 'bands') { // horizontal bands open from the middle band outward
    ctx.fillStyle = th.outro;
    const N = 9, bh = H / N;
    for (let i = 0; i < N; i++) {
      const d = Math.abs(i - (N - 1) / 2) * 0.05;
      const h = (bh + 1) * (1 - easeOutCubic(clamp01((q - d) / 0.65)));
      ctx.fillRect(0, i % 2 ? (i + 1) * bh - h : i * bh, W, h);
    }
  } else if (kind === 'ink') { // torn-edge ink blot floods the frame, then fades
    const grow = easeOutCubic(clamp01(q / 0.6));
    ctx.globalAlpha = q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4;
    blob(ctx, W / 2, H / 2, 1250 * grow, si * 7 + 1, 0.16); ctx.fill();
  } else if (kind === 'ribbon') { // a thick curved ribbon draws across the frame
    const p = easeOutCubic(clamp01(q / 0.7)), L = 3000;
    ctx.globalAlpha = 1 - clamp01((q - 0.75) / 0.25);
    ctx.strokeStyle = th.accent; ctx.lineWidth = 280; ctx.lineCap = 'butt';
    ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - p);
    ctx.beginPath(); ctx.moveTo(-120, H * 0.88); ctx.quadraticCurveTo(W * 0.55, H * 0.1, W + 120, H * 0.62); ctx.stroke();
  } else if (kind === 'glitch') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cw = cv.width, ch = cv.height, step = Math.floor(q * 18) + si * 13;
    for (let i = 0; i < 9; i++) {
      const y = rnd(step * 9 + i) * ch, h = (0.02 + rnd(step * 5 + i + 3) * 0.09) * ch;
      const dx = (rnd(step * 7 + i + 1) - 0.5) * 0.25 * cw * (1 - q);
      ctx.drawImage(cv, 0, y, cw, h, dx, y, cw, h);
    }
    ctx.globalAlpha = 0.6 * (1 - q); ctx.fillStyle = th.accent;
    for (let i = 0; i < 3; i++) ctx.fillRect(0, rnd(step * 3 + i + 9) * ch, cw, ch * 0.006);
  } else if (kind === 'zoom') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const s = 1 + 0.28 * (1 - q) * (1 - q), cw = cv.width, ch = cv.height;
    ctx.drawImage(cv, -(s - 1) * cw / 2, -(s - 1) * ch / 2, cw * s, ch * s);
    ctx.globalAlpha = (1 - q) * 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
  }
  ctx.restore();
}

/* ---------- decorations ---------- */
function barcode(ctx, x, y, w, h, color, jitter, t) {
  let seed = 7, cx = x, i = 0;
  ctx.fillStyle = color;
  while (cx < x + w) {
    seed = (seed * 9301 + 49297) % 233280;
    const bw = 2 + Math.floor(seed / 233280 * 7);
    const dx = jitter && rnd(Math.floor(t * 12) + i * 1.7) > 0.93 ? (rnd(i + Math.floor(t * 12)) - 0.5) * 40 : 0;
    ctx.fillRect(cx + dx, y, bw, h);
    cx += bw + 2 + (seed % 5); i++;
  }
}
export function drawDeco(ctx, th, style, si, total, t) {
  if (!style || style === 'none') return;
  ctx.save();
  ctx.fillStyle = th.muted; ctx.strokeStyle = th.muted;
  if (style === 'tech') {
    // graph paper with crosshair marks, slowly drifting
    ctx.globalAlpha = 0.28; ctx.lineWidth = 1.5;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(t * 0.35) * 0.012); ctx.translate(-W / 2, -H / 2);
    for (let x = 90; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 1600); ctx.stroke(); }
    for (let y = 330; y <= 1600; y += 120) { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); }
    ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
    for (let x = 90; x < W; x += 120) for (let y = 330; y <= 1600; y += 120) {
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
    }
    ctx.restore();
    // vertical micro text on both edges
    ctx.globalAlpha = 0.8; ctx.font = '700 22px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(34, 960); ctx.rotate(-Math.PI / 2); ctx.fillText('UNFOLD 2010TX', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(W - 34, 960); ctx.rotate(Math.PI / 2); ctx.fillText('UNFOLD 2010TX', 0, 0); ctx.restore();
    [[60, 700], [60, 1240], [W - 60, 520], [W - 60, 1380]].forEach(([x, y]) => { ctx.font = '600 20px "Courier New", monospace'; ctx.fillText('▲ 21', x, y); });
    // HD / 4K badge row
    ctx.globalAlpha = 0.9; ctx.fillStyle = th.text; ctx.beginPath(); ctx.arc(W / 2 - 150, H - 120, 22, 0, 7); ctx.stroke();
    ctx.fillRect(W / 2 - 110, H - 142, 62, 44); ctx.fillStyle = th.bg; ctx.font = '800 26px Inter, Arial, sans-serif'; ctx.fillText('HD', W / 2 - 79, H - 119);
    ctx.fillStyle = th.muted; ctx.font = '500 16px "Courier New", monospace'; ctx.fillText('VIDEO INTERNATIONAL SIMBLE', W / 2 + 30, H - 128); ctx.fillText('PLEASE DO NOT THROW AWAY', W / 2 + 30, H - 108);
    ctx.strokeStyle = th.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W / 2 + 150, H - 140, 54, 40, 14); ctx.stroke();
    ctx.fillStyle = th.text; ctx.font = '800 22px Inter, Arial, sans-serif'; ctx.fillText('4K', W / 2 + 177, H - 119);
  }
  ctx.globalAlpha = 0.75; ctx.fillStyle = th.muted;
  ctx.font = '500 24px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const n = v => String(v).padStart(2, '0');
  ctx.fillText(`SCENE ${n(Math.max(si, 0) + 1)} / ${n(total)}`, 50, 100);
  ctx.fillText('SCRIPT > VIDEO', 50, 136);
  barcode(ctx, style === 'tech' ? W / 2 - 135 : W - 330, style === 'tech' ? 150 : H - 150, 270, 60, th.muted, th.dark, t);
  ctx.restore();
}

/* ---------- ghost glyph, ink splash, circles ---------- */
export function drawGhost(ctx, th, glyph, age, cy) {
  if (!glyph) return;
  const p = easeOutCubic(clamp01(age / 0.6));
  ctx.save();
  ctx.globalAlpha = 0.2 * p; ctx.fillStyle = th.accent;
  ctx.font = `800 ${Math.round(900 * (0.85 + 0.15 * p))}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(glyph, W / 2, cy);
  ctx.restore();
}
export function drawInk(ctx, th, cx, cy, age, seed) {
  if (age < 0) return;
  const p = easeOutBack(clamp01(age / 0.5));
  ctx.save();
  ctx.globalAlpha = 0.34; ctx.fillStyle = th.accent;
  blob(ctx, cx, cy, 285 * Math.max(p, 0), seed * 5 + 2, 0.22); ctx.fill();
  ctx.restore();
}
export function drawBackdrop(ctx, th, kind, cx, cy, age) {
  const mode = kind === 'auto' || !kind ? (th.circle ? 'circle' : 'none') : kind;
  if (mode === 'none') return;
  if (mode === 'blobs') {
    const p = easeOutCubic(clamp01(age / 0.7));
    ctx.save(); ctx.fillStyle = th.accent; ctx.globalAlpha = 0.9 * p;
    ctx.beginPath(); ctx.arc(W + 40 - 120 * p, H - 330, 320, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-40 + 80 * p, 330, 260, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  const cp = easeOutBack(clamp01(age / 0.6));
  ctx.save();
  if (mode === 'green') { ctx.fillStyle = '#16a116'; ctx.beginPath(); ctx.arc(W / 2, cy - 230, 190 * Math.max(cp, 0), 0, 7); ctx.fill(); }
  else {
    ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(cx, cy - 120, 300 * Math.max(cp, 0), 0, 7); ctx.fill();
    ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.setLineDash([2, 12]);
    ctx.beginPath(); ctx.arc(cx, cy - 120, 350 * Math.max(cp, 0), 0, 7); ctx.stroke();
  }
  ctx.restore();
}
