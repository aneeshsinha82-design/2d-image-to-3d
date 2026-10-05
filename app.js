import { parseScript, buildTimeline } from './engine.js';
import { analyzeVoice, applyVoiceSync } from './sync.js';
import { renderFrame, W } from './draw.js';

const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const state = { images: [], audioBuf: null, voice: null, marks: {}, marksFor: '', tl: null, nextId: 1 };
let curT = 0, playing = false, exporting = false;

$('script').value = `Tired of poor *Marketing*? {?}

People don't want *services* {icons:gear,headset,24/7,user}

They want *status* and *success*.

Let's make it *happen*. ((Book Now))`;

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const getOpts = () => ({
  theme: $('theme').value, handle: $('handle').value.trim(), picStyle: $('picstyle').value, picPos: $('picpos').value,
  entrance: $('entrance').value, trans: $('trans').value, textAnim: $('textanim').value, textExit: $('textexit').value,
  layout: $('layout').value, fontSet: $('fontset').value, deco: $('deco').value, backdrop: $('backdrop').value,
  splash: $('splash').checked, reflect: $('reflect').checked, endStyle: $('endstyle').value, wrapper: $('wrapper').checked
});
const draw = (t, S) => renderFrame(ctx, t, S, state.tl, getOpts());
// when paused at the very start, show a "poster" frame (first picture + first words) instead of a blank screen
const shownT = () => {
  const tl = state.tl;
  if (curT > 0 || !tl || !tl.total) return curT;
  const first = tl.events.length ? tl.events[0].t : (tl.scenes[0] ? tl.scenes[0].start : 0);
  return Math.min(first + 1.0, tl.total);
};

/* ---------- pictures ---------- */
$('imgs').onchange = async e => {
  const skipped = [];
  for (const f of e.target.files) {
    const url = URL.createObjectURL(f), el = new Image();
    el.src = url;
    try { await el.decode(); } catch { skipped.push(f.name); URL.revokeObjectURL(url); continue; }
    state.images.push({ id: state.nextId++, name: f.name.replace(/\.[^.]+$/, ''), el, url });
  }
  e.target.value = ''; renderList(); refresh();
  $('imgmsg').textContent = skipped.length ? `Could not read ${skipped.length} file(s): ${skipped.join(', ')}. Use JPG, PNG or WebP (iPhone HEIC photos are not supported — convert them first).` : '';
};
function renderList() {
  const box = $('imglist'); box.innerHTML = '';
  state.images.forEach((im, i) => {
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `<img src="${im.url}"><div><div class="num">#${i + 1}</div><input value="${esc(im.name)}" placeholder="name / trigger words"><div class="row"></div></div><div></div>`;
    d.querySelector('input').oninput = e => { im.name = e.target.value; refresh(); };
    const row = d.querySelector('.row');
    const mk = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn; row.appendChild(b); };
    const swap = (a, b) => { [state.images[a], state.images[b]] = [state.images[b], state.images[a]]; renderList(); refresh(); };
    mk('Insert [tag]', () => insertTag(im, i));
    mk('↑', () => { if (i > 0) swap(i - 1, i); });
    mk('↓', () => { if (i < state.images.length - 1) swap(i, i + 1); });
    mk('✕', () => { state.images.splice(i, 1); renderList(); refresh(); });
    box.appendChild(d);
  });
}
function insertTag(im, i) {
  const ta = $('script'), tag = `[${(im.name.split(',')[0] || String(i + 1)).trim()}] `;
  const p = ta.selectionStart;
  ta.value = ta.value.slice(0, p) + tag + ta.value.slice(ta.selectionEnd);
  ta.focus(); ta.selectionStart = ta.selectionEnd = p + tag.length; refresh();
}

/* ---------- voice-over ---------- */
$('aud').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const ac = new AudioContext();
  try {
    state.audioBuf = await ac.decodeAudioData(await f.arrayBuffer());
    state.voice = analyzeVoice(state.audioBuf.getChannelData(0), state.audioBuf.sampleRate);
    state.marks = {};
    const v = state.voice;
    $('audname').textContent = `${f.name} · ${state.audioBuf.duration.toFixed(1)}s · ` + (v.blocks.length ? `${v.blocks.length} speech parts, ${v.pauses.length} pauses found` : 'no clear speech found (using even stretch)');
  }
  catch { $('audname').textContent = 'Could not read that audio file.'; state.audioBuf = null; state.voice = null; }
  ac.close(); refresh();
};

/* ---------- timeline ---------- */
function refresh() {
  $('wpmv').textContent = $('wpm').value + ' wpm';
  const aDur = state.audioBuf ? state.audioBuf.duration : 0, smart = $('syncmode').value === 'smart' && state.voice;
  const bo = { wpm: +$('wpm').value, autoFill: $('autofill').checked, outro: $('outro').checked };
  $('syncoffv').textContent = (+$('syncoff').value / 1000).toFixed(2) + ' s';
  if (state.marksFor !== $('script').value) state.marks = {};   // taps belong to one exact script
  state.tl = buildTimeline(parseScript($('script').value), state.images, { ...bo, audioDur: smart ? 0 : aDur });
  if (smart) {
    const ok = applyVoiceSync(state.tl, state.voice, { offset: +$('syncoff').value / 1000, marks: state.marks, audioDur: aDur });
    if (!ok) state.tl = buildTimeline(parseScript($('script').value), state.images, { ...bo, audioDur: aDur });
  }
  curT = Math.min(curT, state.tl.total);
  const tl = $('tl'); tl.innerHTML = '';
  state.tl.scenes.forEach((sc, i) => {
    const evs = state.tl.events.filter(e => e.scene === i);
    const d = document.createElement('div'); d.className = 'sc';
    d.innerHTML = `<b>Scene ${i + 1}</b>${state.marks[i] !== undefined ? ' 📍' : ''} · ${fmt(sc.start)}–${fmt(sc.end)}<br>${esc(sc.words.map(w => w.text).join(' '))}` +
      (evs.length ? '<br>' + evs.map(e => `<span class="ev">🖼 ${esc(e.img.name || '#')} @ “${esc(sc.words[e.wi].text)}”</span>`).join(' · ') : '<br><span>no picture</span>');
    tl.appendChild(d);
  });
  draw(shownT(), cv.width / W); updateTime();
}
['script', 'wpm', 'autofill', 'outro', 'theme', 'handle', 'picstyle', 'picpos', 'entrance', 'trans', 'textanim', 'textexit', 'layout', 'fontset', 'deco', 'backdrop', 'splash', 'reflect', 'endstyle', 'wrapper', 'sfx', 'syncmode', 'syncoff'].forEach(id => {
  $(id).addEventListener('input', refresh); $(id).addEventListener('change', refresh);
});

/* ---------- audio: voice-over + whoosh sound effects ---------- */
let pactx = null, srcNode = null, sfxNodes = [];
function stopAudio() {
  try { srcNode && srcNode.stop(); } catch { }
  sfxNodes.forEach(n => { try { n.stop(); } catch { } });
  srcNode = null; sfxNodes = [];
}
function startVoice(actx, dest, offset, when) {
  if (!state.audioBuf || offset >= state.audioBuf.duration) return null;
  const s = actx.createBufferSource(); s.buffer = state.audioBuf; s.connect(dest); s.start(when, offset); return s;
}
function whoosh(actx, dest, when, vol) {
  const len = Math.floor(actx.sampleRate * 0.45), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) { const x = i / len; d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * Math.min(1, x * 1.2)) * (1 - x); }
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(500, when); f.frequency.exponentialRampToValueAtTime(3500, when + 0.4);
  const g = actx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(dest); src.start(when); return src;
}
function startSfx(actx, dest, fromT, baseTime) {
  if (!$('sfx').checked || !state.tl) return [];
  const times = [...state.tl.events.map(e => e.t), ...state.tl.scenes.slice(1).map(s => s.start)];
  return times.filter(t => t >= fromT).map(t => whoosh(actx, dest, Math.max(baseTime, baseTime + (t - fromT) - 0.05), 0.35));
}

/* ---------- tap-to-sync: press at the start of every scene while the voice plays ---------- */
let tap = null;
function showTapInfo() {
  const n = state.tl.scenes.length, sc = state.tl.scenes[tap.idx];
  $('tapinfo').textContent = `Scene ${tap.idx + 1} of ${n}: press when the voice says “${sc.words.slice(0, 4).map(w => w.text).join(' ')}…”`;
}
function doTap() {
  if (!tap) return;
  tap.marks[tap.idx] = Math.max(0, tap.actx.currentTime - tap.startAt - 0.15);   // 0.15 s = human reaction time
  tap.idx++;
  if (tap.idx >= state.tl.scenes.length) finishTap(); else showTapInfo();
}
function finishTap() {
  if (!tap) return;
  state.marks = { ...tap.marks }; state.marksFor = $('script').value;
  try { tap.src && tap.src.stop(); } catch { }
  tap.actx.close(); tap = null; $('tapbox').hidden = true; $('tapstart').disabled = false;
  $('syncmode').value = 'smart'; refresh();
}
$('tapstart').onclick = () => {
  if (!state.audioBuf) { $('audname').textContent = 'Add a voice-over first.'; return; }
  if (tap || exporting) return;
  pause();
  const actx = new AudioContext(); actx.resume();
  const startAt = actx.currentTime + 0.1;
  tap = { actx, startAt, idx: 0, marks: {}, src: startVoice(actx, actx.destination, 0, startAt) };
  $('tapbox').hidden = false; $('tapstart').disabled = true; showTapInfo();
};
$('tapnext').onclick = doTap;
$('tapdone').onclick = finishTap;
$('tapclear').onclick = () => { state.marks = {}; refresh(); };
document.addEventListener('keydown', e => {
  if (tap && e.code === 'Space') { e.preventDefault(); doTap(); }
});

/* ---------- playback ---------- */
let raf = 0;
function updateTime() {
  const tot = state.tl ? state.tl.total : 0;
  $('time').textContent = `${fmt(curT)} / ${fmt(tot)}`;
  $('seek').value = tot ? curT / tot * 1000 : 0;
}
function play() {
  if (exporting || tap || !state.tl.total) return;
  if (curT >= state.tl.total - 0.05) curT = 0;
  playing = true; $('play').textContent = '❚❚ Pause';
  pactx = pactx || new AudioContext(); pactx.resume();
  const now = pactx.currentTime + 0.05;
  srcNode = startVoice(pactx, pactx.destination, curT, now);
  sfxNodes = startSfx(pactx, pactx.destination, curT, now);
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
$('seek').oninput = e => {
  const was = playing; if (was) pause();
  curT = e.target.value / 1000 * state.tl.total; draw(shownT(), cv.width / W); updateTime();
  if (was) play();
};

/* ---------- HD export ---------- */
$('export').onclick = async () => {
  if (exporting || !state.tl.total) return;
  pause(); exporting = true; $('export').disabled = true;
  await Promise.all(['800 40px Inter', '300 40px Inter', '500 40px Inter', 'italic 500 40px "Playfair Display"', '500 40px "Playfair Display"', '400 40px Anton', '700 40px "Dancing Script"', '700 40px Caveat', '400 40px "Space Mono"', '700 40px "Space Mono"'].map(f => document.fonts.load(f).catch(() => { })));
  const outW = +$('res').value, outH = Math.round(outW * 16 / 9 / 2) * 2, fps = +$('fps').value, S = outW / W;
  cv.width = outW; cv.height = outH;
  const stream = cv.captureStream(fps);
  let actx = null;
  if (state.audioBuf || $('sfx').checked) {
    actx = new AudioContext(); await actx.resume();
    const dest = actx.createMediaStreamDestination(), at = actx.currentTime + 0.1;
    srcNode = startVoice(actx, dest, 0, at);
    sfxNodes = startSfx(actx, dest, 0, at);
    dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
  }
  const mime = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  const bps = outW >= 1440 ? 32e6 : outW >= 1080 ? 20e6 : 10e6;
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps, audioBitsPerSecond: 192000 });
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(500);
  const start = performance.now() + 100, total = state.tl.total;
  await new Promise(res => {
    const loop = () => {
      const t = Math.max(0, Math.min((performance.now() - start) / 1000, total));
      draw(t, S);
      $('expstat').textContent = `Rendering ${Math.round(t / total * 100)}% — keep this tab open and visible…`;
      if (t >= total) { setTimeout(res, 250); return; }
      requestAnimationFrame(loop);
    };
    loop();
  });
  rec.stop(); await done; stopAudio(); actx && actx.close();
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(chunks, { type: mime.split(';')[0] }));
  a.download = `script-video-${outW}p.${ext}`; a.click();
  $('expstat').textContent = `Done — saved as ${a.download}` + (ext === 'webm' ? ' (this browser records WebM; use Chrome or Edge for MP4)' : '');
  cv.width = 540; cv.height = 960; exporting = false; $('export').disabled = false; refresh();
};

document.fonts.ready.then(refresh); refresh();
