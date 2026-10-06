import { W, clamp01, easeOutCubic, easeOutBack, bounce, rnd } from './util.js';
import { FONT_SETS, FONT_KEYS } from './themes.js';

export const TEXT_ANIMS = ['rise', 'type', 'letters', 'blur', 'zoom', 'slide', 'bounce', 'spin', 'glitch', 'wave', 'flip', 'scramble', 'stretch', 'maskrise', 'focus'];
export const LAYOUTS = ['stack', 'keyword', 'keywordtop', 'ladder'];
const LAD_LEAD = ['focus', 'maskrise'], LAD_BIG = ['maskrise', 'focus', 'blur'];
const KEY_ANIMS = ['blur', 'zoom', 'flip', 'glitch', 'scramble', 'bounce'];
const HELP_ANIMS = ['rise', 'slide', 'letters', 'type', 'wave'];
const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$';

/* ---------- one word, one animation ---------- */
function drawWord(ctx, it, px, py, age, kind, k, th, ex) {
  const txt = it.txt;
  ctx.save();
  ctx.font = it.st.font(it.size); ctx.textBaseline = 'middle'; ctx.fillStyle = th[it.st.col];
  const fade = ex.alpha;
  const blurTo = b => { const v = b + ex.blur; if (v > 0.4) ctx.filter = `blur(${v.toFixed(1)}px)`; };
  py += ex.dy;
  if (kind === 'type') {
    blurTo(0); ctx.globalAlpha = fade;
    const total = ctx.measureText(txt).width;
    const n = Math.min(txt.length, Math.ceil(txt.length * Math.min(age / Math.max(0.25, txt.length * 0.045), 1)));
    ctx.textAlign = 'left';
    const x0 = px - total / 2;
    ctx.fillText(txt.slice(0, n), x0, py);
    if (n < txt.length) ctx.fillRect(x0 + ctx.measureText(txt.slice(0, n)).width + 4, py - it.size * 0.38, 5, it.size * 0.76);
  } else if (kind === 'letters' || kind === 'wave') {
    blurTo(0);
    ctx.textAlign = 'left';
    let cx = px - ctx.measureText(txt).width / 2;
    for (let i = 0; i < txt.length; i++) {
      const p = easeOutCubic(clamp01((age - i * 0.035) / 0.3));
      ctx.globalAlpha = p * fade;
      const wob = kind === 'wave' ? Math.sin(age * 7 + i * 0.7) * 7 * p : 0;
      ctx.fillText(txt[i], cx, py + (1 - p) * 60 + wob);
      cx += ctx.measureText(txt[i]).width;
    }
  } else if (kind === 'maskrise') {   // reference video: the word rises out from behind a mask line, grey -> full colour
    blurTo(0); ctx.textAlign = 'center';
    const p = easeOutCubic(clamp01(age / 0.38)), w = ctx.measureText(txt).width, h = it.size;
    ctx.beginPath(); ctx.rect(px - w / 2 - 12, py - h * 0.62, w + 24, h * 1.25); ctx.clip();
    ctx.globalAlpha = (0.35 + 0.65 * p) * fade;
    ctx.fillText(txt, px, py + (1 - p) * h * 0.95);
  } else if (kind === 'scramble') {
    blurTo(0); ctx.globalAlpha = clamp01(age / 0.1) * fade; ctx.textAlign = 'center';
    let s = '';
    for (let i = 0; i < txt.length; i++) {
      s += txt[i] === ' ' || age > 0.2 + i * 0.05 ? txt[i] : SCRAMBLE[Math.floor(rnd(Math.floor(age * 28) * 13 + i + k) * SCRAMBLE.length)];
    }
    ctx.fillText(s, px, py);
  } else if (kind === 'glitch') {
    blurTo(0); ctx.textAlign = 'center';
    const q = clamp01(age / 0.45), j = (1 - q) * 30;
    if (q < 1) {
      const f = Math.floor(age * 30) + k;
      ctx.globalAlpha = 0.7 * fade; ctx.fillStyle = th.accent; ctx.fillText(txt, px + (rnd(f) - 0.5) * j * 2, py + (rnd(f + 5) - 0.5) * j);
      ctx.fillStyle = '#18c8ff'; ctx.fillText(txt, px + (rnd(f + 9) - 0.5) * j * 2, py + (rnd(f + 3) - 0.5) * j);
      ctx.fillStyle = th[it.st.col];
    }
    ctx.globalAlpha = clamp01(age / 0.08) * fade; ctx.fillText(txt, px, py);
  } else {
    const p = easeOutCubic(clamp01(age / 0.3));
    let dx = 0, dy = 0, sx = 1, sy = 1, rot = 0, al = p, bl = 0;
    if (kind === 'blur') { bl = (1 - p) * 22; sx = sy = 1.12 - 0.12 * p; }
    else if (kind === 'zoom') { sx = sy = 2.4 - 1.4 * p; }
    else if (kind === 'slide') { dx = (k % 2 ? 1 : -1) * (1 - p) * 520; }
    else if (kind === 'bounce') { dy = -(1 - bounce(clamp01(age / 0.55))) * 320; al = clamp01(age / 0.12); }
    else if (kind === 'spin') { const q = clamp01(age / 0.45); rot = (1 - q) * -0.9; sx = sy = 0.4 + 0.6 * easeOutBack(q); al = clamp01(age / 0.15); }
    else if (kind === 'focus') { const q = easeOutCubic(clamp01(age / 0.45)); bl = (1 - q) * 9; al = q; sx = sy = 1.05 - 0.05 * q; }
    else if (kind === 'flip') { sy = Math.max(0.001, easeOutBack(clamp01(age / 0.4))); al = clamp01(age / 0.1); }
    else if (kind === 'stretch') { const q = easeOutCubic(clamp01(age / 0.4)); sx = 2.4 - 1.4 * q; sy = 0.6 + 0.4 * q; al = q; }
    else { dy = (1 - p) * 46; sx = sy = 0.92 + 0.08 * p; }
    blurTo(bl);
    ctx.globalAlpha = al * fade;
    ctx.translate(px + dx, py + dy); ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.textAlign = 'center';
    ctx.fillText(txt, 0, 0);
  }
  ctx.restore();
}

/* ---------- layout ---------- */
function pickKeyword(ph, sc) {
  let k = ph.idx.findIndex(i => sc.words[i].emph);
  if (k < 0) {
    let len = 4;
    ph.idx.forEach((i, p) => { const L = sc.words[i].text.replace(/[^\p{L}\p{N}]/gu, '').length; if (L > len) { len = L; k = p; } });
  }
  return k;
}

function buildLines(ctx, ph, sc, set, layout, o) {
  const mk = (wi, st) => {
    const w = sc.words[wi];
    const txt = st.upper ? w.text.toUpperCase() : w.text;
    let size = st.size;
    ctx.font = st.font(size);
    const width = ctx.measureText(txt).width;
    return { w, st, txt, size, width };
  };
  let kPos = layout === 'stack' || layout === 'ladder' ? -1 : pickKeyword(ph, sc);
  let lines;
  if (layout === 'ladder' && ph.idx.length > 1) {          // small lead-in words, then bigger words (reference video)
    const n = ph.idx.length, bigN = n <= 2 ? 1 : Math.ceil(n / 2);
    const smallS = { ...set.small, col: 'text' };
    const bigS = { ...set.styles[0], size: Math.round(set.styles[0].size * 1.25), col: 'text', isBig: true };
    lines = [ph.idx.slice(0, n - bigN).map(wi => mk(wi, smallS)), ph.idx.slice(n - bigN).map(wi => mk(wi, bigS))];
    kPos = 0;
  } else if (kPos < 0) {
    lines = ph.idx.map(wi => {
      const w = sc.words[wi];
      return [mk(wi, w.emph ? set.emph : set.styles[w.gi % set.styles.length])];
    });
  } else {
    const lead = ph.idx.slice(0, kPos).map(wi => mk(wi, set.small));
    const key = [mk(ph.idx[kPos], set.emph)];
    const tail = ph.idx.slice(kPos + 1).map(wi => mk(wi, set.small));
    lines = layout === 'keyword' ? [lead, key, tail] : [key, lead.concat(tail)];
    lines = lines.filter(l => l.length);
  }
  // fit every line inside the frame
  lines.forEach(line => {
    const gap = line[0].size * 0.28, total = line.reduce((a, x) => a + x.width, 0) + gap * (line.length - 1);
    if (total > 940) { const f = 940 / total; line.forEach(x => { x.size *= f; x.width *= f; }); }
    line.forEach(x => { x.isKey = (kPos >= 0 && x.st === set.emph) || !!x.st.isBig; });
  });
  return { lines, stack: kPos < 0 && layout !== 'ladder', ladder: layout === 'ladder' };
}

export function drawText(ctx, sc, t, th, cy, o, si) {
  const ph = sc.phrases.find(p => t >= p.start && t < p.end) || (t >= sc.end ? sc.phrases[sc.phrases.length - 1] : sc.phrases[0]);
  if (!ph || t < ph.start) return;
  const idx = Math.max(si, 0);
  const setKey = o.fontSet === 'mix' ? FONT_KEYS[idx % FONT_KEYS.length] : o.fontSet;
  const set = FONT_SETS[setKey] || FONT_SETS.editorial;
  const layout = o.layout === 'mix' ? LAYOUTS[idx % LAYOUTS.length] : (o.layout || 'stack');
  const { lines, stack, ladder } = buildLines(ctx, ph, sc, set, layout, o);

  // exit animation near the end of the phrase
  const qE = o.textExit && o.textExit !== 'none' ? clamp01((t - (ph.end - 0.28)) / 0.28) : 0;
  const ex = { alpha: 1, blur: 0, dy: 0 };
  if (qE > 0) {
    if (o.textExit === 'fade') ex.alpha = 1 - qE;
    else if (o.textExit === 'blur') { ex.alpha = 1 - qE * 0.9; ex.blur = qE * 16; }
    else if (o.textExit === 'rise') { ex.alpha = 1 - qE; ex.dy = -qE * 60; }
  }

  const lh = lines.map(l => {
    const m = Math.max(...l.map(x => x.size)) * 1.12;
    return m + (stack && o.reflect && l[0].w.emph ? l[0].size * 0.85 : 0);
  });
  const extra = lines.map((l, i) => (stack && o.reflect && l[0].w.emph ? l[0].size * 0.85 : 0));
  const totalH = lh.reduce((a, b) => a + b, 0);
  let y = cy - totalH / 2;
  lines.forEach((line, li) => {
    const gap = line[0].size * 0.28;
    const total = line.reduce((a, x) => a + x.width, 0) + gap * (line.length - 1);
    let x = W / 2 - total / 2 + (stack ? (li % 2 ? 1 : -1) * 28 : 0);
    const py = y + (lh[li] - extra[li]) / 2;
    line.forEach((it, k) => {
      const px = x + it.width / 2;
      x += it.width + gap;
      if (t < it.w.t) return;
      const age = t - it.w.t;
      let kind = o.textAnim;
      if (!kind || kind === 'mix') kind = ladder ? (it.isKey ? LAD_BIG : LAD_LEAD)[it.w.gi % (it.isKey ? LAD_BIG.length : LAD_LEAD.length)] : stack ? TEXT_ANIMS[it.w.gi % TEXT_ANIMS.length] : (it.isKey ? KEY_ANIMS[it.w.gi % KEY_ANIMS.length] : HELP_ANIMS[it.w.gi % HELP_ANIMS.length]);
      drawWord(ctx, it, px, py, age, kind, k + li, th, ex);
      if (stack && o.reflect && it.w.emph) {
        const p = easeOutCubic(clamp01((age - (kind === 'type' || kind === 'letters' ? 0.4 : 0)) / 0.3));
        ctx.save();
        ctx.globalAlpha = p * 0.2 * ex.alpha;
        ctx.translate(px, py + it.size * 0.95 + ex.dy); ctx.scale(1, -1);
        ctx.font = it.st.font(it.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = th[it.st.col];
        ctx.fillText(it.txt, 0, 0);
        ctx.restore();
      }
    });
    y += lh[li];
  });
}
