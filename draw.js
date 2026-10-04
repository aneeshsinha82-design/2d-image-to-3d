import { THEMES, FONT_SETS } from './themes.js';

export const W = 1080, H = 1920;
const clamp01 = x => Math.max(0, Math.min(1, x));
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const bounce = x => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) { x -= 1.5 / d; return n * x * x + 0.75; }
  if (x < 2.5 / d) { x -= 2.25 / d; return n * x * x + 0.9375; }
  x -= 2.625 / d; return n * x * x + 0.984375;
};
const rnd = seed => { const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export const TEXT_ANIMS = ['rise', 'type', 'letters', 'blur', 'zoom', 'slide', 'bounce', 'spin'];
export const ENTRANCES = ['pop', 'slide', 'spin', 'left', 'right', 'drop', 'zoom', 'flip', 'swing'];
export const TRANSITIONS = ['wipe', 'iris', 'stripes', 'glitch', 'curtain', 'diagonal', 'zoom', 'flash'];

/* ---------- decorations ---------- */
function barcode(ctx, x, y, w, h, color) {
  let seed = 7, cx = x;
  ctx.fillStyle = color;
  while (cx < x + w) {
    seed = (seed * 9301 + 49297) % 233280;
    const bw = 2 + Math.floor(seed / 233280 * 7);
    ctx.fillRect(cx, y, bw, h);
    cx += bw + 2 + (seed % 5);
  }
}
function drawDeco(ctx, th, si, total) {
  ctx.save();
  ctx.globalAlpha = 0.75; ctx.fillStyle = th.muted;
  ctx.font = '500 24px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const n = v => String(v).padStart(2, '0');
  ctx.fillText(`SCENE ${n(Math.max(si, 0) + 1)} / ${n(total)}`, 50, 100);
  ctx.fillText('SCRIPT > VIDEO', 50, 136);
  barcode(ctx, W - 330, H - 150, 270, 60, th.muted);
  ctx.restore();
}

/* ---------- pictures ---------- */
function entranceParams(kind, p, age) {
  const a = { pop: 1, alpha: Math.min(age / 0.22, 1), rot: 0, kb: 1 + 0.035 * Math.min(age / 6, 1), dx: 0, dy: 0, sm: 1, sx: 1 };
  const e = easeOutCubic(p);
  switch (kind) {
    case 'slide': a.pop = e; a.dy = (1 - e) * 520; break;
    case 'spin':  a.pop = easeOutBack(p); a.rot = (1 - e) * -0.5; break;
    case 'left':  a.dx = -(1 - e) * 900; break;
    case 'right': a.dx = (1 - e) * 900; break;
    case 'drop':  a.dy = -(1 - bounce(clamp01(age / 0.8))) * 900; a.alpha = clamp01(age / 0.1); break;
    case 'zoom':  a.sm = 2.2 - 1.2 * e; break;
    case 'flip':  a.sx = Math.max(0.02, Math.sin(e * Math.PI / 2)); break;
    case 'swing': a.pop = e; a.rot = (1 - p) * 0.35 * Math.cos(p * 11); break;
    default:      a.pop = easeOutBack(p); a.rot = (1 - p) * -0.07;
  }
  return a;
}
function drawPicture(ctx, im, cy, a, style) {
  const nw = im.el.naturalWidth, nh = im.el.naturalHeight;
  const s = Math.min(820 / nw, 940 / nh) * (0.8 + 0.2 * a.pop) * a.kb * a.sm;
  const w = nw * s, h = nh * s;
  ctx.save();
  ctx.globalAlpha = clamp01(a.alpha);
  ctx.translate(W / 2 + a.dx, cy + a.dy);
  ctx.rotate(a.rot);
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
  } else {
    ctx.drawImage(im.el, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

/* ---------- text ---------- */
function drawWord(ctx, it, px, py, age, kind, k, th) {
  ctx.save();
  ctx.font = it.st.font(it.size); ctx.textBaseline = 'middle'; ctx.fillStyle = th[it.st.col];
  const txt = it.txt;
  if (kind === 'type') {
    const total = ctx.measureText(txt).width;
    const n = Math.min(txt.length, Math.ceil(txt.length * Math.min(age / Math.max(0.25, txt.length * 0.045), 1)));
    ctx.textAlign = 'left';
    const x0 = px - total / 2;
    ctx.fillText(txt.slice(0, n), x0, py);
    if (n < txt.length) ctx.fillRect(x0 + ctx.measureText(txt.slice(0, n)).width + 4, py - it.size * 0.38, 5, it.size * 0.76);
  } else if (kind === 'letters') {
    ctx.textAlign = 'left';
    let cx = px - ctx.measureText(txt).width / 2;
    for (let i = 0; i < txt.length; i++) {
      const p = easeOutCubic(clamp01((age - i * 0.035) / 0.3));
      ctx.globalAlpha = p;
      ctx.fillText(txt[i], cx, py + (1 - p) * 60);
      cx += ctx.measureText(txt[i]).width;
    }
  } else {
    const p = easeOutCubic(clamp01(age / 0.3));
    let dx = 0, dy = 0, sc = 1, rot = 0, al = p;
    if (kind === 'blur') { ctx.filter = `blur(${((1 - p) * 22).toFixed(1)}px)`; sc = 1.12 - 0.12 * p; }
    else if (kind === 'zoom') { sc = 2.4 - 1.4 * p; }
    else if (kind === 'slide') { dx = (k % 2 ? 1 : -1) * (1 - p) * 520; }
    else if (kind === 'bounce') { dy = -(1 - bounce(clamp01(age / 0.55))) * 320; al = clamp01(age / 0.12); }
    else if (kind === 'spin') { const q = clamp01(age / 0.45); rot = (1 - q) * -0.9; sc = 0.4 + 0.6 * easeOutBack(q); al = clamp01(age / 0.15); }
    else { dy = (1 - p) * 46; sc = 0.92 + 0.08 * p; }
    ctx.globalAlpha = al;
    ctx.translate(px + dx, py + dy); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.textAlign = 'center';
    ctx.fillText(txt, 0, 0);
  }
  ctx.restore();
}
function drawText(ctx, sc, t, th, cy, o) {
  const ph = sc.phrases.find(p => t >= p.start && t < p.end) || (t >= sc.end ? sc.phrases[sc.phrases.length - 1] : sc.phrases[0]);
  if (!ph || t < ph.start) return;
  const set = FONT_SETS[o.fontSet] || FONT_SETS.editorial;
  const info = ph.idx.map(i => {
    const w = sc.words[i];
    const st = w.emph ? set.emph : set.styles[w.gi % set.styles.length];
    const txt = st.upper ? w.text.toUpperCase() : w.text;
    let size = st.size;
    ctx.font = st.font(size);
    const m = ctx.measureText(txt).width;
    if (m > 940) size *= 940 / m;
    const extra = o.reflect && w.emph ? size * 0.85 : 0;
    return { w, st, txt, size, lh: size * 1.1 + extra, extra };
  });
  const totalH = info.reduce((a, x) => a + x.lh, 0);
  let y = cy - totalH / 2;
  info.forEach((x, k) => {
    if (t >= x.w.t) {
      const age = t - x.w.t;
      const kind = o.textAnim === 'mix' || !o.textAnim ? TEXT_ANIMS[x.w.gi % TEXT_ANIMS.length] : o.textAnim;
      const px = W / 2 + (k % 2 ? 1 : -1) * 28, py = y + (x.lh - x.extra) * 0.5;
      drawWord(ctx, x, px, py, age, kind, k, th);
      if (o.reflect && x.w.emph) {
        const delay = kind === 'type' || kind === 'letters' ? 0.4 : 0;
        const p = easeOutCubic(clamp01((age - delay) / 0.3));
        ctx.save();
        ctx.globalAlpha = p * 0.2;
        ctx.translate(px, py + x.size * 0.95); ctx.scale(1, -1);
        ctx.font = x.st.font(x.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = th[x.st.col];
        ctx.fillText(x.txt, 0, 0);
        ctx.restore();
      }
    }
    y += x.lh;
  });
}

/* ---------- watermark / outro ---------- */
function drawWatermark(ctx, th, handle) {
  if (!handle) return;
  ctx.save();
  ctx.globalAlpha = 0.9; ctx.fillStyle = th.wm; ctx.strokeStyle = th.wm; ctx.lineWidth = 3;
  ctx.font = '500 26px Inter, Arial, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(handle.toUpperCase(), W - 50, 150);
  const x = W - 74, y = 100;
  ctx.beginPath(); ctx.roundRect(x - 18, y - 18, 36, 36, 10); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 11, y - 11, 2, 0, 7); ctx.fill();
  ctx.restore();
}
function drawOutro(ctx, th, a, handle) {
  ctx.fillStyle = th.outro; ctx.fillRect(0, 0, W, H);
  const p = easeOutCubic(Math.min(a / 0.5, 1));
  ctx.save();
  ctx.globalAlpha = p; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 64px Inter, Arial, sans-serif'; ctx.fillText(handle || '', W / 2, H / 2 - 20 + (1 - p) * 30);
  ctx.font = '800 50px Inter, Arial, sans-serif'; ctx.fillText('All rights reserved', W / 2, H / 2 + 50 + (1 - p) * 30);
  ctx.restore();
}

/* ---------- scene transitions (drawn on top of the finished frame) ---------- */
function drawTransition(ctx, th, sc, t, kind, si) {
  const D = 0.5, q = (t - sc.start) / D;
  if (q < 0 || q >= 1) return;
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
  } else if (kind === 'stripes') {
    const N = 8, bh = H / N;
    for (let i = 0; i < N; i++) {
      const local = clamp01((q - i * 0.04) / 0.6);
      ctx.fillRect(-W + local * 2 * W, i * bh, W, bh + 1);
    }
  } else if (kind === 'curtain') {
    const w = (W / 2) * Math.sin(Math.PI * q);
    ctx.fillRect(0, 0, w, H); ctx.fillRect(W - w, 0, w, H);
  } else if (kind === 'diagonal') {
    const o = -W * 1.6 + q * (W * 3.6), skew = 600;
    ctx.beginPath(); ctx.moveTo(o, 0); ctx.lineTo(o + W * 1.1, 0); ctx.lineTo(o + W * 1.1 - skew, H); ctx.lineTo(o - skew, H); ctx.closePath(); ctx.fill();
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

// o = { theme, handle, picStyle, entrance, trans, textAnim, fontSet, deco, reflect }
export function renderFrame(ctx, t, S, tl, o) {
  const th = THEMES[o.theme] || THEMES.editorial;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.filter = 'none';
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  if (!tl || !tl.scenes.length) return;
  if (tl.hasOutro && t >= tl.outroStart) { drawOutro(ctx, th, t - tl.outroStart, o.handle); return; }

  let si = tl.scenes.findIndex(s => t >= s.start && t < s.end);
  if (si < 0) si = t < tl.scenes[0].start ? -1 : tl.scenes.length - 1;
  const sc = si >= 0 ? tl.scenes[si] : null;

  if (o.deco) drawDeco(ctx, th, si, tl.scenes.length);

  let ai = -1;
  tl.events.forEach((e, i) => { if (e.t <= t) ai = i; });
  const hasImg = ai >= 0, cy = 720;
  if (hasImg) {
    const ev = tl.events[ai], age = t - ev.t, p = Math.min(age / 0.55, 1);
    if (th.circle) {
      const cp = easeOutBack(Math.min(age / 0.6, 1));
      ctx.fillStyle = th.accent;
      ctx.beginPath(); ctx.arc(330, cy - 120, 300 * Math.max(cp, 0), 0, 7); ctx.fill();
      ctx.save();
      ctx.strokeStyle = th.accent; ctx.lineWidth = 3; ctx.setLineDash([2, 12]);
      ctx.beginPath(); ctx.arc(330, cy - 120, 350 * Math.max(cp, 0), 0, 7); ctx.stroke();
      ctx.restore();
    }
    if (ai > 0 && age < 0.25) {
      drawPicture(ctx, tl.events[ai - 1].img, cy, { pop: 1, alpha: 1 - age / 0.25, rot: 0, kb: 1, dx: 0, dy: 0, sm: 1, sx: 1 }, o.picStyle);
    }
    const kind = !o.entrance || o.entrance === 'mix' ? ENTRANCES[ai % ENTRANCES.length] : o.entrance;
    drawPicture(ctx, ev.img, cy, entranceParams(kind, p, age), o.picStyle);
  }
  if (sc) drawText(ctx, sc, t, th, hasImg ? 1500 : 960, o);
  drawWatermark(ctx, th, o.handle);
  if (sc && si > 0 && o.trans && o.trans !== 'none') {
    const kind = o.trans === 'mix' ? TRANSITIONS[(si - 1) % TRANSITIONS.length] : o.trans;
    drawTransition(ctx, th, sc, t, kind, si);
  }
}
