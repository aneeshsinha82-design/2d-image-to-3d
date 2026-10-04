import { W, H, clamp01, easeOutCubic, rnd } from './util.js';

/* ---------- crumpled beige paper (painted once, then cached) ---------- */
let paperCv = null;
function paintPaper() {
  const w = 540, h = 960;
  paperCv = document.createElement('canvas'); paperCv.width = w; paperCv.height = h;
  const g = paperCv.getContext('2d');
  const base = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, h * 0.7);
  base.addColorStop(0, '#e2d2b2'); base.addColorStop(1, '#c6b088');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd(i * 0.37) - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.lineWidth = 1;
  for (let i = 0; i < 700; i++) { // paper fibres
    const x = rnd(i * 3.1) * w, y = rnd(i * 5.3) * h, a = rnd(i * 7.7) * 6.28, l = 6 + rnd(i * 2.9) * 22;
    g.strokeStyle = `rgba(90,65,30,${0.03 + rnd(i * 1.3) * 0.05})`;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let c = 0; c < 14; c++) { // creases: a dark line with a light line beside it
    g.beginPath();
    let x = rnd(c * 11.1) * w, y = rnd(c * 17.3) * h;
    const pts = [[x, y]];
    for (let k = 0; k < 4; k++) { x += (rnd(c * 3.3 + k) - 0.5) * 260; y += (rnd(c * 6.1 + k) - 0.5) * 260; pts.push([x, y]); }
    g.strokeStyle = 'rgba(70,50,25,.14)'; g.lineWidth = 1.6; pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    g.beginPath(); g.strokeStyle = 'rgba(255,248,230,.18)'; g.lineWidth = 1.2; pts.forEach((p, i) => (i ? g.lineTo(p[0] + 1.8, p[1] + 1.8) : g.moveTo(p[0] + 1.8, p[1] + 1.8))); g.stroke();
  }
  g.strokeStyle = 'rgba(90,70,40,.08)'; g.lineWidth = 1; // faint graph grid
  for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
  v.addColorStop(0, 'rgba(60,40,15,0)'); v.addColorStop(1, 'rgba(60,40,15,.38)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}
export function drawPaper(ctx) {
  if (!paperCv) paintPaper();
  ctx.drawImage(paperCv, 0, 0, W, H);
}

/* ---------- Instagram-style logo (gradient that turns white) ---------- */
export function drawLogo(ctx, cx, cy, size, mix) {
  ctx.save();
  ctx.lineWidth = size * 0.14; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(cx - size, cy + size, cx + size, cy - size);
  g.addColorStop(0, '#feda75'); g.addColorStop(0.45, '#d62976'); g.addColorStop(1, '#962fbf');
  const draw = () => {
    ctx.beginPath(); ctx.roundRect(cx - size, cy - size, size * 2, size * 2, size * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.45, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + size * 0.58, cy - size * 0.58, size * 0.1, 0, 7); ctx.fill();
  };
  ctx.globalAlpha = 1 - mix; ctx.strokeStyle = g; ctx.fillStyle = '#d62976'; draw();
  ctx.globalAlpha = mix; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; draw();
  ctx.restore();
}

/* ---------- end card: last scene dimmed + logo + handle ---------- */
export function drawEndCardOverlay(ctx, a, handle) {
  const p = easeOutCubic(clamp01(a / 0.5));
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.78 * p})`; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = p; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  drawLogo(ctx, W / 2, H / 2 - 40 + (1 - p) * 24, 74, clamp01((a - 1.0) / 0.9));
  ctx.fillStyle = '#fff'; ctx.font = '600 40px "Space Mono", "Courier New", monospace';
  ctx.fillText((handle || '').toUpperCase(), W / 2, H / 2 + 110 + (1 - p) * 24);
  ctx.restore();
}

/* ---------- showcase wrapper: teal stage + card + tilted editing timeline ---------- */
let off = null;
export function renderShowcase(ctx, t, S, tl, renderDesign) {
  const k = 0.66, cw = Math.round(W * k * S), ch = Math.round(H * k * S);
  if (!off || off.width !== cw || off.height !== ch) { off = document.createElement('canvas'); off.width = cw; off.height = ch; }
  const og = off.getContext('2d');
  renderDesign(og, S * k);

  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2d8fae'); bg.addColorStop(1, '#0f5d78');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; // diagonal light streaks
  for (let i = 0; i < 6; i++) {
    const x = -300 + i * 300 + Math.sin(t * 0.25 + i) * 20;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 150, 0); ctx.lineTo(x + 150 + 560, H); ctx.lineTo(x + 560, H); ctx.closePath(); ctx.fill();
  }
  const cardW = W * k, cardH = H * k, cx = (W - cardW) / 2, cy = 120;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(cx, cy, cardW, cardH, 18); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  ctx.drawImage(off, 0, 0, cw, ch, cx, cy, cardW, cardH);
  ctx.restore();

  // tilted timeline panel
  const y0 = 1500, y1 = 1840;
  const pt = (v, u) => { const l = 150 + (10 - 150) * v, r = 930 + (1070 - 930) * v; return [l + (r - l) * u, y0 + (y1 - y0) * v]; };
  ctx.save();
  ctx.fillStyle = '#14171b'; ctx.beginPath(); ctx.moveTo(...pt(0, 0)); ctx.lineTo(...pt(0, 1)); ctx.lineTo(...pt(1, 1)); ctx.lineTo(...pt(1, 0)); ctx.closePath(); ctx.fill();
  const cols = ['#ff6b4a', '#bfc5d6', '#e9dfc8', '#4fa3ff', '#ff6b4a', '#bfc5d6'], span = 8;
  if (tl && tl.scenes) tl.scenes.forEach((sc, i) => {
    const lane = i % 6, v0 = 0.08 + lane * 0.14, v1 = v0 + 0.1;
    const u0 = clamp01((sc.start - (t - span / 2)) / span), u1 = clamp01((sc.end - (t - span / 2)) / span);
    if (u1 <= u0) return;
    ctx.fillStyle = cols[lane];
    ctx.beginPath(); ctx.moveTo(...pt(v0, u0)); ctx.lineTo(...pt(v0, u1)); ctx.lineTo(...pt(v1, u1)); ctx.lineTo(...pt(v1, u0)); ctx.closePath(); ctx.fill();
  });
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...pt(0, 0.5)); ctx.lineTo(...pt(1, 0.5)); ctx.stroke();
  ctx.fillStyle = '#19c37d'; ctx.beginPath(); ctx.arc(1000, 1812, 34, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(986, 1812); ctx.lineTo(1014, 1812); ctx.moveTo(1000, 1798); ctx.lineTo(1000, 1826); ctx.stroke();
  ctx.restore();
}
