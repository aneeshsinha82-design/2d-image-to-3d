import { parseScript, buildTimeline } from './engine.js';

const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const W = 1080, H = 1920;

const THEMES = {
  editorial: { bg: '#e9e6e3', text: '#121212', muted: '#6d6d6d', accent: '#e1251b', circle: true,  wm: '#222', outro: '#050505' },
  night:     { bg: '#050505', text: '#f4f4f4', muted: '#8a8a8a', accent: '#ff3b2f', circle: false, wm: '#fff', outro: '#000' },
  warm:      { bg: '#fcefdc', text: '#2a1d12', muted: '#8a6f55', accent: '#f26a1b', circle: true,  wm: '#3a2a1c', outro: '#1a0f07' }
};
const STYLES = [
  { font: s => `800 ${s}px Inter, Arial, sans-serif`, size: 104, col: 'text' },
  { font: s => `300 ${s}px Inter, Arial, sans-serif`, size: 78,  col: 'muted' },
  { font: s => `italic 500 ${s}px "Playfair Display", Georgia, serif`, size: 96, col: 'text' },
  { font: s => `400 ${s}px Anton, Impact, sans-serif`, size: 124, col: 'accent', upper: true }
];

const state = { images: [], audioBuf: null, tl: null, nextId: 1 };
let curT = 0, playing = false, exporting = false;

const sample = `Getting good at *editing*
isn't about software.

It's about how you *absorb*
the world around you.

No matter how messy life gets,
the strongest [soldier] soldier stays in the fight.

Silent. Tired. But never *broken*.`;
$('script').value = sample;

/* ---------- helpers ---------- */
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const theme = () => THEMES[$('theme').value];

/* ---------- images UI ---------- */
$('imgs').onchange = async e => {
  for (const f of e.target.files) {
    const url = URL.createObjectURL(f);
    const el = new Image(); el.src = url;
    try { await el.decode(); } catch { continue; }
    state.images.push({ id: state.nextId++, name: f.name.replace(/\.[^.]+$/, ''), el, url });
  }
  e.target.value = ''; renderList(); refresh();
};
function renderList() {
  const box = $('imglist'); box.innerHTML = '';
  state.images.forEach((im, i) => {
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<img src="${im.url}"><div><div class="num">#${i + 1}</div><input value="${im.name.replace(/"/g, '&quot;')}" placeholder="name / trigger words"><div class="row"></div></div><div></div>`;
    d.querySelector('input').oninput = e => { im.name = e.target.value; refresh(); };
    const row = d.querySelector('.row');
    const mk = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn; row.appendChild(b); };
    mk('Insert [tag]', () => insertTag(im, i));
    mk('↑', () => { if (i > 0) { [state.images[i - 1], state.images[i]] = [state.images[i], state.images[i - 1]]; renderList(); refresh(); } });
    mk('↓', () => { if (i < state.images.length - 1) { [state.images[i + 1], state.images[i]] = [state.images[i], state.images[i + 1]]; renderList(); refresh(); } });
    mk('✕', () => { state.images.splice(i, 1); renderList(); refresh(); });
    box.appendChild(d);
  });
}
function insertTag(im, i) {
  const ta = $('script'), tag = `[${(im.name.split(',')[0] || String(i + 1)).trim()}] `;
  const p = ta.selectionStart; ta.value = ta.value.slice(0, p) + tag + ta.value.slice(ta.selectionEnd);
  ta.focus(); ta.selectionStart = ta.selectionEnd = p + tag.length; refresh();
}

/* ---------- audio ---------- */
$('aud').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const ac = new AudioContext();
  try { state.audioBuf = await ac.decodeAudioData(await f.arrayBuffer()); $('audname').textContent = `${f.name} · ${state.audioBuf.duration.toFixed(1)}s`; }
  catch { $('audname').textContent = 'Could not read that audio file.'; state.audioBuf = null; }
  ac.close(); refresh();
};

/* ---------- timeline ---------- */
function refresh() {
  $('wpmv').textContent = $('wpm').value + ' wpm';
  state.tl = buildTimeline(parseScript($('script').value), state.images, {
    wpm: +$('wpm').value, autoFill: $('autofill').checked, outro: $('outro').checked,
    audioDur: state.audioBuf ? state.audioBuf.duration : 0
  });
  curT = Math.min(curT, state.tl.total);
  const tl = $('tl'); tl.innerHTML = '';
  state.tl.scenes.forEach((sc, i) => {
    const evs = state.tl.events.filter(e => e.scene === i);
    const d = document.createElement('div'); d.className = 'sc';
    const txt = sc.words.map(w => w.text).join(' ');
    d.innerHTML = `<b>Scene ${i + 1}</b> · ${fmt(sc.start)}–${fmt(sc.end)}<br>${txt.replace(/</g, '&lt;')}` +
      (evs.length ? '<br>' + evs.map(e => `<span class="ev">🖼 ${(e.img.name || '#').replace(/</g, '&lt;')} @ “${sc.words[e.wi].text.replace(/</g, '&lt;')}”</span>`).join(' · ') : '<br><span>no picture</span>');
    tl.appendChild(d);
  });
  draw(curT, cv.width / W); updateTime();
}
['script', 'wpm', 'autofill', 'outro', 'theme', 'handle'].forEach(id => $(id).addEventListener('input', refresh));
$('autofill').onchange = $('outro').onchange = refresh;

/* ---------- drawing ---------- */
function draw(t, S) {
  const th = theme(), tl = state.tl;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  if (!tl || !tl.scenes.length) return;

  if (tl.hasOutro && t >= tl.outroStart) { drawOutro(t - tl.outroStart, th); return; }

  const sc = tl.scenes.find(s => t >= s.start && t < s.end) || (t < tl.scenes[0].start ? null : tl.scenes[tl.scenes.length - 1]);
  // active image
  let ai = -1; tl.events.forEach((e, i) => { if (e.t <= t) ai = i; });
  const hasImg = ai >= 0;
  const cy = 720;
  if (hasImg) {
    const ev = tl.events[ai], age = t - ev.t, p = Math.min(age / 0.55, 1);
    if (th.circle) { // editorial accent circle
      const cp = easeOutBack(Math.min(age / 0.6, 1));
      ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(330, cy - 120, 300 * Math.max(cp, 0), 0, 7); ctx.fill();
    }
    if (ai > 0 && age < 0.25) drawImg(tl.events[ai - 1].img, cy, 1, 1 - age / 0.25, 0, 1);
    drawImg(ev.img, cy, easeOutBack(p), Math.min(age / 0.22, 1), (1 - p) * -0.07, 1 + 0.035 * Math.min(age / 6, 1));
  }
  if (sc) drawText(sc, t, th, hasImg ? 1500 : 960);
  drawWatermark(th);
}
function drawImg(im, cy, pop, alpha, rot, kb) {
  const maxW = 880, maxH = 1000;
  const s = Math.min(maxW / im.el.naturalWidth, maxH / im.el.naturalHeight) * (0.8 + 0.2 * pop) * kb;
  const w = im.el.naturalWidth * s, h = im.el.naturalHeight * s;
  ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(W / 2, cy); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  ctx.drawImage(im.el, -w / 2, -h / 2, w, h); ctx.restore();
}
function drawText(sc, t, th, centerY) {
  let ph = sc.phrases.find(p => t >= p.start && t < p.end) || (t >= sc.end ? sc.phrases[sc.phrases.length - 1] : sc.phrases[0]);
  if (!ph || t < ph.start) return;
  const items = ph.idx.map(i => sc.words[i]).filter(w => t >= w.t);
  const lay = items.map(w => {
    const st = w.emph ? { ...STYLES[0], size: 118, col: 'accent' } : STYLES[w.gi % STYLES.length];
    let size = st.size, txt = st.upper ? w.text.toUpperCase() : w.text;
    ctx.font = st.font(size);
    const m = ctx.measureText(txt).width; if (m > 940) size *= 940 / m;
    return { w, st, size, txt };
  });
  const totalH = ph.idx.reduce((a, i) => { const w = sc.words[i]; const st = w.emph ? { size: 118 } : STYLES[w.gi % STYLES.length]; return a + st.size * 1.1; }, 0);
  let y = centerY - totalH / 2;
  ph.idx.forEach((wi, k) => {
    const w = sc.words[wi], it = lay.find(l => l.w === w);
    const stSize = (w.emph ? 118 : STYLES[w.gi % STYLES.length].size) * 1.1;
    if (it) {
      const age = t - w.t, p = easeOutCubic(Math.min(age / 0.3, 1));
      ctx.save(); ctx.globalAlpha = p;
      const off = (k % 2 ? 1 : -1) * 28;
      ctx.translate(W / 2 + off, y + stSize * 0.5 + (1 - p) * 46);
      ctx.scale(0.92 + 0.08 * p, 0.92 + 0.08 * p);
      ctx.font = it.st.font(it.size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = th[it.st.col]; ctx.fillText(it.txt, 0, 0); ctx.restore();
    }
    y += stSize;
  });
}
function drawWatermark(th) {
  const h = $('handle').value.trim(); if (!h) return;
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = th.wm; ctx.strokeStyle = th.wm; ctx.lineWidth = 3;
  ctx.font = '500 26px Inter, Arial, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(h.toUpperCase(), W - 50, 150);
  const x = W - 74, y = 100; ctx.beginPath(); ctx.roundRect(x - 18, y - 18, 36, 36, 10); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 11, y - 11, 2, 0, 7); ctx.fill(); ctx.restore();
}
function drawOutro(a, th) {
  ctx.fillStyle = th.outro; ctx.fillRect(0, 0, W, H);
  const p = easeOutCubic(Math.min(a / 0.5, 1));
  ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 64px Inter, Arial, sans-serif'; ctx.fillText($('handle').value || '', W / 2, H / 2 - 20 + (1 - p) * 30);
  ctx.font = '800 50px Inter, Arial, sans-serif'; ctx.fillText('All rights reserved', W / 2, H / 2 + 50 + (1 - p) * 30);
  ctx.restore();
}

/* ---------- playback ---------- */
let pactx = null, srcNode = null, t0 = 0, raf = 0;
function stopAudio() { try { srcNode && srcNode.stop(); } catch { } srcNode = null; }
function startAudio(actx, dest, offset) {
  if (!state.audioBuf || offset >= state.audioBuf.duration) return null;
  const s = actx.createBufferSource(); s.buffer = state.audioBuf; s.connect(dest); s.start(0, offset); return s;
}
function updateTime() { $('time').textContent = `${fmt(curT)} / ${fmt(state.tl ? state.tl.total : 0)}`; $('seek').value = state.tl && state.tl.total ? curT / state.tl.total * 1000 : 0; }
function play() {
  if (exporting || !state.tl.total) return;
  if (curT >= state.tl.total - 0.05) curT = 0;
  playing = true; $('play').textContent = '❚❚ Pause';
  pactx = pactx || new AudioContext(); pactx.resume();
  srcNode = startAudio(pactx, pactx.destination, curT);
  const base = performance.now() - curT * 1000;
  const loop = () => {
    if (!playing) return;
    curT = (performance.now() - base) / 1000;
    if (curT >= state.tl.total) { curT = state.tl.total; pause(); }
    draw(curT, cv.width / W); updateTime();
    if (playing) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}
function pause() { playing = false; cancelAnimationFrame(raf); stopAudio(); $('play').textContent = '▶ Play'; }
$('play').onclick = () => playing ? pause() : play();
$('seek').oninput = e => { const was = playing; if (was) pause(); curT = e.target.value / 1000 * state.tl.total; draw(curT, cv.width / W); updateTime(); if (was) play(); };

/* ---------- export ---------- */
$('export').onclick = async () => {
  if (exporting || !state.tl.total) return;
  pause(); exporting = true; $('export').disabled = true;
  await Promise.all(['800 40px Inter', '300 40px Inter', 'italic 500 40px "Playfair Display"', '400 40px Anton'].map(f => document.fonts.load(f).catch(() => { })));
  const outW = +$('res').value, outH = Math.round(outW * 16 / 9 / 2) * 2, fps = +$('fps').value, S = outW / W;
  cv.width = outW; cv.height = outH; // CSS keeps preview size
  const stream = cv.captureStream(fps);
  let actx = null;
  if (state.audioBuf) { actx = new AudioContext(); const dest = actx.createMediaStreamDestination(); srcNode = startAudio(actx, dest, 0); dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr)); }
  const mime = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  const bps = outW >= 1440 ? 32e6 : outW >= 1080 ? 20e6 : 10e6;
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps, audioBitsPerSecond: 192000 });
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(500);
  const start = performance.now(), total = state.tl.total;
  await new Promise(res => {
    const loop = () => {
      const t = Math.min((performance.now() - start) / 1000, total);
      draw(t, S); $('expstat').textContent = `Rendering ${Math.round(t / total * 100)}% — keep this tab open and visible…`;
      if (t >= total) { setTimeout(res, 250); return; }
      requestAnimationFrame(loop);
    };
    loop();
  });
  rec.stop(); await done; stopAudio(); actx && actx.close();
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: mime.split(';')[0] }));
  a.download = `script-video-${outW}p.${ext}`; a.click();
  $('expstat').textContent = `Done — saved as ${a.download}` + (ext === 'webm' ? ' (your browser records WebM; use Chrome/Edge for MP4)' : '');
  cv.width = 540; cv.height = 960; exporting = false; $('export').disabled = false; refresh();
};

document.fonts.ready.then(refresh); refresh();
