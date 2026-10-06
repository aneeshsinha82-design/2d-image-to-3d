import { W, clamp01, easeOutCubic, easeOutBack, bounce } from './util.js';

export const ENTRANCES = ['pop', 'slide', 'spin', 'left', 'right', 'drop', 'zoom', 'flip', 'swing', 'pendulum', 'snap', 'rise', 'corner', 'focus', 'settle', 'longrise', 'drift'];

export function entranceParams(kind, p, age) {
  const a = { pop: 1, alpha: Math.min(age / 0.22, 1), rot: 0, kb: 1 + 0.035 * Math.min(age / 6, 1), dx: 0, dy: 0, sm: 1, sx: 1, blur: 0, pivot: false };
  const e = easeOutCubic(p);
  switch (kind) {
    case 'slide':    a.pop = e; a.dy = (1 - e) * 520; break;
    case 'spin':     a.pop = easeOutBack(p); a.rot = (1 - e) * -0.5; break;
    case 'left':     a.dx = -(1 - e) * 900; break;
    case 'right':    a.dx = (1 - e) * 900; break;
    case 'drop':     a.dy = -(1 - bounce(clamp01(age / 0.8))) * 900; a.alpha = clamp01(age / 0.1); break;
    case 'zoom':     a.sm = 2.2 - 1.2 * e; break;
    case 'flip':     a.sx = Math.max(0.02, Math.sin(e * Math.PI / 2)); break;
    case 'swing':    a.pop = e; a.rot = (1 - p) * 0.35 * Math.cos(p * 11); break;
    // hangs from its top edge and swings like a lamp
    case 'pendulum': { const q = clamp01(age / 1.4); a.pivot = true; a.dy = -(1 - easeOutCubic(clamp01(age / 0.5))) * 700; a.rot = (1 - q) * 0.7 * Math.cos(q * 13); a.alpha = clamp01(age / 0.1); break; }
    // flies in spinning from a corner and snaps into place
    case 'snap':     { const q = clamp01(age / 0.7), s = easeOutCubic(q); a.dx = (1 - s) * 520; a.dy = -(1 - s) * 560; a.rot = (1 - s) * 2.4; a.pop = easeOutBack(clamp01(age / 0.9)); break; }
    case 'rise':     a.dy = (1 - e) * 760; break;
    case 'corner':   a.dx = (1 - e) * 720; a.dy = (1 - e) * 840; a.rot = (1 - e) * 0.25; break;
    case 'focus':    a.blur = (1 - e) * 28; a.sm = 1.15 - 0.15 * e; break;
    // reference-video moves (measured): grow from 75 %, long cubic rise from below, slide in then keep drifting left
    case 'settle':   a.sm = 1 - 0.25 * Math.pow(1 - clamp01(age / 0.8), 1.5); break;
    case 'longrise': a.dy = 730 * Math.pow(1 - clamp01(age / 1.65), 3); a.alpha = clamp01(age / 0.1); break;
    case 'drift':    { const d = Math.min(age, 3); a.dx = 270 + 165 * Math.exp(-age / 0.25) - 180 * d; a.sm = 1 + 0.016 * d; break; }
    default:         a.pop = easeOutBack(p); a.rot = (1 - p) * -0.07;
  }
  return a;
}

export function drawPicture(ctx, im, cy, a, style, cx = 0) {
  const nw = im.el.naturalWidth, nh = im.el.naturalHeight;
  const s = Math.min(820 / nw, 940 / nh) * (0.8 + 0.2 * a.pop) * a.kb * a.sm;
  const w = nw * s, h = nh * s;
  ctx.save();
  ctx.globalAlpha = clamp01(a.alpha);
  if (a.blur > 0.5) ctx.filter = `blur(${a.blur.toFixed(1)}px)`;
  ctx.translate(W / 2 + cx + a.dx, cy + a.dy);
  if (a.pivot) { ctx.translate(0, -h / 2); ctx.rotate(a.rot); ctx.translate(0, h / 2); } else ctx.rotate(a.rot);
  ctx.scale(a.sx, 1);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  if (style === 'card' || style === 'polaroid') {
    const pad = style === 'card' ? 26 : 32, bottom = style === 'card' ? 26 : 120;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + pad + bottom, 16); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
  } else if (style === 'frame') {
    const pad = 46, mat = 14;
    const g = ctx.createLinearGradient(-w / 2 - pad, -h / 2 - pad, w / 2 + pad, h / 2 + pad);
    g.addColorStop(0, '#f6dd8f'); g.addColorStop(0.35, '#b88a2c'); g.addColorStop(0.7, '#f2d27a'); g.addColorStop(1, '#8a6420');
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + 2 * pad);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#2a1c0c';
    ctx.fillRect(-w / 2 - mat, -h / 2 - mat, w + 2 * mat, h + 2 * mat);
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
  } else if (style === 'glow') { // glowing yellow outline (like the "you stand out" figure)
    ctx.shadowColor = 'rgba(255,200,40,.95)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 0;
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
  } else {
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}
