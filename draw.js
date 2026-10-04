import { W, H, clamp01, easeOutCubic } from './util.js';
import { THEMES, ALTERNATE } from './themes.js';
import { ENTRANCES, entranceParams, drawPicture } from './pictures.js';
import { TRANSITIONS, TRANS_LEN, cameraPre, drawTransition, drawDeco, drawGhost, drawInk, drawBackdrop } from './fx.js';
import { drawText, TEXT_ANIMS, LAYOUTS } from './text.js';
import { drawOrbit, drawButton } from './icons.js';
import { drawPaper, drawEndCardOverlay, renderShowcase } from './wrapper.js';

export { W, H, TEXT_ANIMS, ENTRANCES, TRANSITIONS, LAYOUTS };

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

function sceneIndex(tl, t) {
  let si = tl.scenes.findIndex(s => t >= s.start && t < s.end);
  if (si < 0) si = t < tl.scenes[0].start ? -1 : tl.scenes.length - 1;
  return si;
}
const themeFor = (o, si) => (o.theme === 'alternate' ? THEMES[ALTERNATE[Math.max(si, 0) % 2]] : (THEMES[o.theme] || THEMES.editorial));

function drawScene(ctx, t, S, tl, o) {
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.filter = 'none'; ctx.setLineDash([]);
  const si = sceneIndex(tl, t), sc = si >= 0 ? tl.scenes[si] : null, th = themeFor(o, si);
  const tkind = sc && si > 0 && o.trans && o.trans !== 'none' ? (o.trans === 'mix' ? TRANSITIONS[(si - 1) % TRANSITIONS.length] : o.trans) : 'none';
  const tq = sc ? (t - sc.start) / TRANS_LEN : 1;

  ctx.save();
  if (tq >= 0 && tq < 1) cameraPre(ctx, tkind, tq);
  ctx.fillStyle = th.bg; ctx.fillRect(-W, -H, 3 * W, 3 * H);
  if (th.paper) drawPaper(ctx);
  drawDeco(ctx, th, o.deco, si, tl.scenes.length, t);

  // current picture
  let ai = -1;
  tl.events.forEach((e, i) => { if (e.t <= t) ai = i; });
  const hasImg = ai >= 0, hasIcons = !!(sc && sc.icons && sc.icons.length);
  const textCy = hasImg || hasIcons ? 1500 : 960;
  const cxOff = o.picPos === 'alt' && hasImg ? (ai % 2 ? 1 : -1) * 130 : 0;

  if (sc && sc.ghost) drawGhost(ctx, th, sc.ghost, t - sc.start, textCy);
  if (hasImg) {
    const ev = tl.events[ai], age = t - ev.t, p = Math.min(age / 0.55, 1);
    drawBackdrop(ctx, th, o.backdrop, 330 + cxOff, 720, age);
    if (ai > 0 && age < 0.25) {
      const pcx = o.picPos === 'alt' ? ((ai - 1) % 2 ? 1 : -1) * 130 : 0;
      drawPicture(ctx, tl.events[ai - 1].img, 720, { pop: 1, alpha: 1 - age / 0.25, rot: 0, kb: 1, dx: 0, dy: 0, sm: 1, sx: 1, blur: 0, pivot: false }, o.picStyle, pcx);
    }
    const kind = !o.entrance || o.entrance === 'mix' ? ENTRANCES[ai % ENTRANCES.length] : o.entrance;
    drawPicture(ctx, ev.img, 720, entranceParams(kind, p, age), o.picStyle, cxOff);
  } else if (o.backdrop && o.backdrop !== 'auto' && o.backdrop !== 'none' && sc) {
    drawBackdrop(ctx, th, o.backdrop, 330, 720, t - sc.start);
  }
  if (sc && o.splash) {
    const key = sc.words.find(w => w.emph);
    if (key) drawInk(ctx, th, W / 2, textCy, t - key.t, si + 1);
  }
  if (hasIcons) drawOrbit(ctx, th, sc.icons, W / 2, 720, 380, t, t - sc.start);
  if (sc) drawText(ctx, sc, t, th, textCy, o, si);
  if (sc && sc.button) {
    const start = sc.end - Math.min(1.9, (sc.end - sc.start) * 0.65);
    drawButton(ctx, th, sc.button, hasImg || hasIcons ? 1700 : 1250, t - start);
  }
  drawWatermark(ctx, th, o.handle);
  ctx.restore();

  if (sc && tkind !== 'none') drawTransition(ctx, th, sc, t, tkind, si);
}

// o = { theme, handle, picStyle, picPos, entrance, trans, textAnim, textExit, layout, fontSet,
//       deco, backdrop, splash, reflect, endStyle, wrapper }
function renderDesign(ctx, t, S, tl, o) {
  if (!tl || !tl.scenes.length) {
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.filter = 'none';
    ctx.fillStyle = themeFor(o, 0).bg; ctx.fillRect(0, 0, W, H);
    return;
  }
  if (tl.hasOutro && t >= tl.outroStart) {
    if (o.endStyle === 'dim') {
      drawScene(ctx, tl.outroStart - 0.02, S, tl, o);
      drawEndCardOverlay(ctx, t - tl.outroStart, o.handle);
    } else {
      ctx.setTransform(S, 0, 0, S, 0, 0); ctx.filter = 'none';
      drawOutro(ctx, themeFor(o, tl.scenes.length - 1), t - tl.outroStart, o.handle);
    }
    return;
  }
  drawScene(ctx, t, S, tl, o);
}

export function renderFrame(ctx, t, S, tl, o) {
  if (o.wrapper) renderShowcase(ctx, t, S, tl, (g, s) => renderDesign(g, t, s, tl, o));
  else renderDesign(ctx, t, S, tl, o);
}
