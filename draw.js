import { THEMES, STYLES } from './themes.js';

export const W = 1080, H = 1920;
const clamp01 = x => Math.max(0, Math.min(1, x));
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const EMPH = { font: STYLES[0].font, size: 118, col: 'accent' };

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
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = th.muted;
  ctx.font = '500 24px "Courier New", monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const n = v => String(v).padStart(2, '0');
  ctx.fillText(`SCENE ${n(Math.max(si, 0) + 1)} / ${n(total)}`, 50, 100);
  ctx.fillText('SCRIPT > VIDEO', 50, 136);
  barcode(ctx, W - 330, H - 150, 270, 60, th.muted);
  ctx.restore();
}

function drawPicture(ctx, im, cy, a, style) {
  const nw = im.el.naturalWidth, nh = im.el.naturalHeight;
  const s = Math.min(820 / nw, 940 / nh) * (0.8 + 0.2 * a.pop) * a.kb;
  const w = nw * s, h = nh * s;
  ctx.save();
  ctx.globalAlpha = clamp01(a.alpha);
  ctx.translate(W / 2, cy + a.dy);
  ctx.rotate(a.rot);
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

function drawText(ctx, sc, t, th, cy, o) {
  const ph = sc.phrases.find(p => t >= p.start && t < p.end) || (t >= sc.end ? sc.phrases[sc.phrases.length - 1] : sc.phrases[0]);
  if (!ph || t < ph.start) return;
  const info = ph.idx.map(i => {
    const w = sc.words[i];
    const st = w.emph ? EMPH : STYLES[w.gi % STYLES.length];
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
      const p = easeOutCubic(Math.min((t - x.w.t) / 0.3, 1));
      const px = W / 2 + (k % 2 ? 1 : -1) * 28, py = y + (x.lh - x.extra) * 0.5 + (1 - p) * 46, sc2 = 0.92 + 0.08 * p;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(px, py); ctx.scale(sc2, sc2);
      ctx.font = x.st.font(x.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = th[x.st.col];
      ctx.fillText(x.txt, 0, 0);
      ctx.restore();
      if (o.reflect && x.w.emph) {
        ctx.save();
        ctx.globalAlpha = p * 0.2;
        ctx.translate(px, py + x.size * 0.95); ctx.scale(sc2, -sc2);
        ctx.font = x.st.font(x.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = th[x.st.col];
        ctx.fillText(x.txt, 0, 0);
        ctx.restore();
      }
    }
    y += x.lh;
  });
}

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

function drawTransition(ctx, th, sc, t, kind) {
  const q = (t - sc.start) / 0.45;
  if (q < 0 || q >= 1) return;
  ctx.save();
  if (kind === 'wipe') {
    const bw = W * 0.8;
    ctx.fillStyle = th.accent;
    ctx.fillRect(-bw + q * (W + bw), 0, bw, H);
  } else if (kind === 'flash') {
    ctx.globalAlpha = (1 - q) * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// o = { theme, handle, picStyle, entrance, deco, reflect, trans }
export function renderFrame(ctx, t, S, tl, o) {
  const th = THEMES[o.theme] || THEMES.editorial;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
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
      drawPicture(ctx, tl.events[ai - 1].img, cy, { pop: 1, alpha: 1 - age / 0.25, rot: 0, kb: 1, dy: 0 }, o.picStyle);
    }
    const a = { pop: 1, alpha: Math.min(age / 0.22, 1), rot: 0, kb: 1 + 0.035 * Math.min(age / 6, 1), dy: 0 };
    if (o.entrance === 'slide') { a.pop = easeOutCubic(p); a.dy = (1 - easeOutCubic(p)) * 520; }
    else if (o.entrance === 'spin') { a.pop = easeOutBack(p); a.rot = (1 - easeOutCubic(p)) * -0.5; }
    else { a.pop = easeOutBack(p); a.rot = (1 - p) * -0.07; }
    drawPicture(ctx, ev.img, cy, a, o.picStyle);
  }
  if (sc) drawText(ctx, sc, t, th, hasImg ? 1500 : 960, o);
  drawWatermark(ctx, th, o.handle);
  if (sc && si > 0 && o.trans && o.trans !== 'none') drawTransition(ctx, th, sc, t, o.trans);
}
