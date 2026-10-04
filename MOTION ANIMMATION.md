# PROMPT FOR CHATGPT (copy everything below this line and paste it into ChatGPT; the repo is already filled in)

You are a careful software engineer. Your job is to CREATE a small web project in a GitHub repository by copying the files below EXACTLY, then verify it and commit it. Do not be creative. Do not "improve", "refactor", "modernize", rename, reformat, shorten or summarize any code. The code below is already written, tested and working. Your only job is to place it in the repository byte-for-byte.

## WHAT THE PROJECT IS
"Script -> Video": a browser-only tool (no server, no API keys, no build step). The user writes a text script, uploads many pictures and names each picture. The tool matches pictures to words in the script, plays a vertical 9:16 kinetic-typography video preview on a canvas (words pop in one by one, pictures pop in with a red circle behind, handle watermark, end card), and exports it as an HD video (720p / 1080p / 2K) using MediaRecorder.

## TARGET REPOSITORY
Repository: https://github.com/aneeshsinha82-design/2d-image-to-3d
Owner: aneeshsinha82-design
Repo name: 2d-image-to-3d
Branch: main

## STEP-BY-STEP INSTRUCTIONS (follow in this exact order)

STEP 1. Open the repository. It currently contains an OLD tool: `index.html`, an `api/` folder (with `generate.js` and `status.js`), and `vercel.json`. DELETE all of these, because this new project replaces them. Do not delete `.git` or `.gitignore`.

STEP 2. Create EXACTLY these 6 files in the repository ROOT (no subfolders): 
`engine.js`, `test.mjs`, `index.html`, `style.css`, `app.js`, `README.md`.
The full content of each file is given in the "FILES" section below. Copy the content between the `~~~~` lines EXACTLY. Do NOT include the `~~~~` lines themselves or the `FILE:` heading line in the file. Keep every character, space, quote, backtick, and line break as it is. Do not convert tabs/spaces. Do not add comments. Do not change any import path.

STEP 3. Create a file `package.json` in the root with exactly this content:
~~~~json
{
  "name": "script-to-video",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node test.mjs",
    "start": "python3 -m http.server 8765"
  }
}
~~~~

STEP 4. Run the test: `node test.mjs`
The expected output is exactly:
```
[ 'Galaxy Planet', 'soldier', 'walter, heisenberg', 'soldier' ] 9.39
engine ok
```
If the output is different, you made a copy error in `engine.js` or `test.mjs`. Re-copy those two files from this prompt and run again. Do NOT edit the logic to make the test pass.

STEP 5. Syntax check: `node --check app.js` must print nothing (no errors).

STEP 6. Commit all changes to `main` with the message:
`Add Script-to-Video tool: script + named pictures -> HD vertical video`
and push.

STEP 7 (hosting, optional but do it if you can). Enable GitHub Pages: Settings -> Pages -> Source = "Deploy from a branch" -> Branch `main`, folder `/ (root)`. Tell me the final URL (https://<username>.github.io/<repo>/).

## IF YOU CANNOT WRITE DIRECTLY TO GITHUB
If you have no GitHub write access, do NOT stop and do NOT paraphrase. Instead output each of the 7 files (the 6 below + package.json) one after another, each in its own code block, each with its file name as the heading, so I can copy them myself. Also give a ready-to-run bash script that creates every file using `cat > file <<'EOF' ... EOF` heredocs (quoted 'EOF' so nothing is expanded), so I can paste once in my terminal.

## HOW THE SCRIPT SYNTAX WORKS (for your understanding only, do not change the code)
- A blank line or a line with `---` starts a new scene.
- `[soldier]` in the script = show the picture whose name is "soldier" starting from the NEXT word. `[3]` = show the 3rd picture in the list.
- `*word*` = emphasised word (bigger, accent colour).
- Auto-match: a picture named `soldier` automatically appears when the word "soldier" is spoken. A picture name with commas, e.g. `walter, heisenberg, breaking bad`, has several trigger words.
- If a scene has no matching picture and "auto-fill" is on, it uses the next unused picture in list order.
- With a voice-over audio file, all word timings are stretched to fit the audio length.

## STRICT RULES
1. Copy files exactly. No edits, no "fixes", no style changes.
2. Never replace the code with "..." or "rest of file unchanged". Every file must be complete.
3. Do not add libraries, frameworks, bundlers, or a build step. It is plain HTML + ES modules.
4. Do not rename files. `app.js` imports `./engine.js` and `index.html` loads `style.css` and `app.js` — names must match.
5. Use ONLY the 6 files + package.json. No other files.
6. After finishing, reply with: (a) the list of files created, (b) the output of `node test.mjs`, (c) the commit link, (d) the GitHub Pages URL if enabled. Nothing else.

## KNOWN NOTES (do not "fix" these)
- Export records in real time via MediaRecorder; Chrome/Edge give MP4, other browsers may give WebM. This is intended.
- Google Fonts are loaded from the internet in index.html. This is intended.

# FILES


### FILE: engine.js
~~~~
// Pure logic: script parsing, image matching, timeline. No DOM -> testable in Node.

export const norm = s => (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

// "walter, heisenberg, breaking bad"  -> [['walter'],['heisenberg'],['breaking','bad']]
// "soldier_1"                          -> [['soldier','1'], ['soldier']]
export function imageKeys(name) {
  const parts = (name || '').split(/[,;]+/).map(p => p.trim()).filter(Boolean);
  const keys = parts.map(p => p.split(/[\s_-]+/).map(norm).filter(Boolean)).filter(a => a.length);
  if (parts.length === 1) {
    for (const tok of parts[0].split(/[\s_-]+/).map(norm)) {
      if (tok.length >= 4 && !/^\d+$/.test(tok) && !keys.some(k => k.length === 1 && k[0] === tok)) keys.push([tok]);
    }
  }
  return keys;
}

// Syntax:
//   blank line or a line of --- = new scene
//   [soldier]  = show image named "soldier" starting at the NEXT word ([3] = 3rd image in list)
//   *word*     = emphasised word (accent colour)
export function parseScript(src) {
  const prepared = (src || '').replace(/\[([^\]]+)\]/g, (m, a) => '[' + a.trim().replace(/\s+/g, '_') + ']');
  const scenes = prepared.split(/\n\s*\n|^\s*---+\s*$/m).map(s => s.trim()).filter(Boolean);
  return scenes.map(txt => {
    const words = [];
    let pending = null;
    for (let tok of txt.split(/\s+/)) {
      let m;
      while ((m = tok.match(/^\[([^\]]+)\]/))) { pending = m[1]; tok = tok.slice(m[0].length); }
      if (!tok) continue;
      const emph = /^\*+[^*]+\*+[^\w]*$/.test(tok);
      tok = tok.replace(/\*/g, '');
      if (!tok) continue;
      words.push({ text: tok, emph, tag: pending });
      pending = null;
    }
    return { words };
  }).filter(s => s.words.length);
}

export function findByTag(tag, images) {
  if (/^\d+$/.test(tag)) return images[+tag - 1] || null;
  const tk = tag.split(/[\s_-]+/).map(norm).filter(Boolean).join(' ');
  for (const im of images) {
    if (norm(im.name) === norm(tag)) return im;
    if (imageKeys(im.name).some(k => k.join(' ') === tk)) return im;
  }
  return null;
}

export function autoMatch(words, i, images) {
  for (const im of images) {
    for (const key of imageKeys(im.name)) {
      if (key.length === 1) {
        const w = norm(words[i].text);
        if (w === key[0] || (key[0].length >= 4 && w.startsWith(key[0]))) return im;
      } else if (key.every((k, j) => words[i + j] && norm(words[i + j].text) === k)) return im;
    }
  }
  return null;
}

export function buildTimeline(parsed, images, o = {}) {
  const wpm = o.wpm || 150, base = 60 / wpm;
  const lead = o.lead ?? 0.3, hold = o.hold ?? 0.5, outroLen = o.outro ? (o.outroLen ?? 1.8) : 0;
  let t = lead, gi = 0;
  const scenes = [];
  const rawEvents = []; // per scene [{wi,img}]
  const used = new Set();

  parsed.forEach(sc => {
    const start = t, evs = [];
    const words = sc.words.map((w, i) => {
      const len = Math.min(w.text.replace(/[^\p{L}\p{N}]/gu, '').length, 12);
      let dur = base * (0.7 + len / 12 * 0.6);
      const word = { ...w, t, dur, gi: gi++ };
      t += dur + (/[.!?]$/.test(w.text) ? 0.35 : /[,;:]$/.test(w.text) ? 0.15 : 0);
      const im = w.tag ? findByTag(w.tag, images) : autoMatch(sc.words, i, images);
      if (im) { evs.push({ wi: i, img: im }); used.add(im); }
      return word;
    });
    const end = t + hold;
    t = end;
    // phrases
    const phrases = []; let cur = [], chars = 0;
    words.forEach((w, i) => {
      cur.push(i); chars += w.text.length;
      if (/[.,;:!?]$/.test(w.text) || cur.length >= 4 || chars > 24 || i === words.length - 1) {
        phrases.push({ idx: cur }); cur = []; chars = 0;
      }
    });
    phrases.forEach((p, k) => {
      p.start = words[p.idx[0]].t;
      p.end = k + 1 < phrases.length ? words[phrases[k + 1].idx[0]].t : end;
    });
    scenes.push({ start, end, words, phrases });
    rawEvents.push(evs);
  });

  // Auto-fill scenes with no image using unused images in upload order
  if (o.autoFill) {
    const pool = images.filter(im => !used.has(im));
    rawEvents.forEach((evs, si) => { if (!evs.length && pool.length) evs.push({ wi: 0, img: pool.shift() }); });
  }

  let events = [];
  rawEvents.forEach((evs, si) => evs.forEach(e => events.push({ t: scenes[si].words[e.wi].t, img: e.img, scene: si, wi: e.wi })));
  events.sort((a, b) => a.t - b.t);
  events = events.filter((e, i) => i === 0 || events[i - 1].img !== e.img); // no re-animation of same image

  let total = scenes.length ? scenes[scenes.length - 1].end : 0;
  if (o.audioDur && total > 0) { // stretch/squeeze to fit voice-over
    const f = o.audioDur / total;
    scenes.forEach(s => {
      s.start *= f; s.end *= f;
      s.words.forEach(w => { w.t *= f; w.dur *= f; });
      s.phrases.forEach(p => { p.start *= f; p.end *= f; });
    });
    events.forEach(e => e.t *= f);
    total = o.audioDur;
  }
  const outroStart = total;
  return { scenes, events, total: total + outroLen, outroStart, hasOutro: outroLen > 0 };
}
~~~~


### FILE: test.mjs
~~~~
import {parseScript,buildTimeline} from './engine.js';
import assert from 'node:assert';
const imgs=[{name:'soldier'},{name:'walter, heisenberg'},{name:'Galaxy Planet'},{name:'unused'}];
const p=parseScript("Getting good at *editing* [3] isn't easy.\n\nThe strongest soldier fights.\n\nHeisenberg [1] knocks.");
assert.equal(p.length,3);
assert.equal(p[0].words[4].tag,'3'); assert.equal(p[0].words[3].emph,true);
const tl=buildTimeline(p,imgs,{wpm:150,outro:true});
const names=tl.events.map(e=>e.img.name);
console.log(names, tl.total.toFixed(2));
assert.equal(names[0],'Galaxy Planet'); assert.equal(names[1],'soldier'); assert.equal(names[2],'walter, heisenberg'); assert.equal(names[3],'soldier');
const tl2=buildTimeline(p,imgs,{audioDur:20}); assert(Math.abs(tl2.total-20)<1e-6);
console.log('engine ok');
~~~~


### FILE: index.html
~~~~
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Script → Video</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;500;800&family=Playfair+Display:ital,wght@1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head><body>
<header><h1>Script <span>→</span> Video</h1><p>Write a script, add named pictures, export a 9:16 kinetic-text video in HD.</p></header>
<main>
  <section class="col editor">
    <h2>1 · Script</h2>
    <textarea id="script" spellcheck="false"></textarea>
    <p class="hint">Blank line = new scene · <code>[soldier]</code> shows that picture from the next word · <code>*word*</code> = accent colour. A picture also appears automatically when its name is spoken.</p>

    <h2>2 · Pictures <small>(in chronological order)</small></h2>
    <label class="btn" for="imgs">+ Add pictures</label><input id="imgs" type="file" accept="image/*" multiple hidden>
    <div id="imglist"></div>
    <p class="hint">Rename each picture. Use commas for several trigger words: <code>walter, heisenberg, breaking bad</code>. Click a name chip to insert <code>[tag]</code> in the script.</p>

    <h2>3 · Voice-over <small>(optional)</small></h2>
    <label class="btn" for="aud">+ Add audio</label><input id="aud" type="file" accept="audio/*" hidden>
    <span id="audname" class="hint"></span>
    <p class="hint">With audio, the words are stretched to fit its length. Without it, timing follows the speed slider.</p>

    <h2>4 · Style</h2>
    <div class="grid">
      <label>Theme <select id="theme"><option value="editorial">Editorial light (red)</option><option value="night">Night</option><option value="warm">Warm cream (orange)</option></select></label>
      <label>Handle <input id="handle" value="@yourhandle"></label>
      <label>Speed <input id="wpm" type="range" min="80" max="260" value="150"><b id="wpmv">150 wpm</b></label>
      <label>Export <select id="res"><option value="720">HD 720×1280</option><option value="1080" selected>Full HD 1080×1920</option><option value="1440">2K 1440×2560</option></select></label>
      <label>FPS <select id="fps"><option>30</option><option>60</option></select></label>
      <label class="chk"><input type="checkbox" id="autofill" checked> Unmatched scenes use next unused picture</label>
      <label class="chk"><input type="checkbox" id="outro" checked> End card</label>
    </div>
  </section>

  <section class="col preview">
    <div class="phone"><canvas id="cv" width="540" height="960"></canvas></div>
    <div class="ctrl">
      <button id="play">▶ Play</button>
      <input id="seek" type="range" min="0" max="1000" value="0"><span id="time">0:00 / 0:00</span>
    </div>
    <button id="export" class="primary">⬇ Export HD video</button>
    <div id="expstat" class="hint"></div>
    <h2>Timeline</h2>
    <div id="tl"></div>
  </section>
</main>
<script type="module" src="app.js"></script>
</body></html>
~~~~


### FILE: style.css
~~~~
*{box-sizing:border-box}body{margin:0;background:#0b0d12;color:#eceff4;font-family:Inter,Arial,sans-serif}
header{padding:22px 28px;border-bottom:1px solid #222a36}header h1{margin:0;font-size:26px}header h1 span{color:#ff3b2f}header p{margin:4px 0 0;color:#8d97a7;font-size:14px}
main{display:grid;grid-template-columns:minmax(340px,1fr) minmax(320px,460px);gap:28px;padding:24px 28px;max-width:1200px;margin:auto}
@media(max-width:860px){main{grid-template-columns:1fr}}
h2{font-size:15px;margin:22px 0 8px;letter-spacing:.3px}h2:first-child{margin-top:0}h2 small{color:#7d8797;font-weight:400}
textarea{width:100%;height:230px;background:#11151d;color:#eceff4;border:1px solid #2a3240;border-radius:12px;padding:14px;font:15px/1.5 Inter,monospace;resize:vertical}
.hint{font-size:12.5px;color:#7d8797;margin:6px 0}code{background:#1b212c;padding:1px 5px;border-radius:5px;color:#ffb3ad}
.btn,button{background:#1b212c;color:#eceff4;border:1px solid #2f3846;border-radius:10px;padding:10px 16px;font-weight:700;font-size:14px;cursor:pointer;display:inline-block}
.btn:hover,button:hover{background:#242c3a}button:disabled{opacity:.5;cursor:wait}
button.primary{width:100%;margin-top:12px;background:#ff3b2f;border-color:#ff3b2f;color:#fff;font-size:16px;padding:14px}
#imglist{display:grid;gap:8px;margin-top:10px}
.card{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;background:#11151d;border:1px solid #232b38;border-radius:12px;padding:8px}
.card img{width:56px;height:56px;object-fit:cover;border-radius:8px;background:#222}
.card input{width:100%;background:#0b0e14;color:#eceff4;border:1px solid #2a3240;border-radius:8px;padding:8px}
.card .row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.card .row button{padding:4px 9px;font-size:12px}
.card .num{font-size:11px;color:#7d8797}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.grid label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:#9aa4b3}
.grid input:not([type=range]):not([type=checkbox]),.grid select{background:#11151d;color:#eceff4;border:1px solid #2a3240;border-radius:8px;padding:9px}
.grid .chk{flex-direction:row;align-items:center;grid-column:span 2;gap:8px}
.phone{background:#000;border-radius:22px;padding:8px;border:1px solid #2a3240;width:min(100%,340px);margin:0 auto}
canvas{width:100%;display:block;border-radius:16px;aspect-ratio:9/16;background:#111}
.ctrl{display:flex;gap:10px;align-items:center;margin:14px auto 0;max-width:340px}.ctrl input{flex:1}.ctrl span{font-size:12px;color:#8d97a7;white-space:nowrap}
#tl{display:grid;gap:6px;font-size:12.5px}.sc{background:#11151d;border:1px solid #232b38;border-radius:10px;padding:8px 10px;color:#aeb7c5}
.sc b{color:#fff}.sc .ev{color:#ffb3ad}
~~~~


### FILE: app.js
~~~~
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
~~~~


### FILE: README.md
~~~~
# Script → Video

Browser tool that turns a **text script + named pictures** into a vertical (9:16) kinetic-typography video, exportable in HD (720p / 1080p / 2K). No server, no API keys — everything runs in the browser.

## How to use
1. Write the script. A blank line (or `---`) starts a new scene.
2. Add pictures (any number, PNG with transparent background looks best). Rename each one — the name is what the tool matches against the script.
3. Optional: add a voice-over; the script timing stretches to fit it.
4. Pick a theme, set your handle, press **Export HD video**.

## Script syntax
| Syntax | Meaning |
|---|---|
| blank line / `---` | new scene |
| `[soldier]` | show the picture named "soldier" starting at the next word |
| `[3]` | show the 3rd picture in the list |
| `*broken*` | emphasised word (accent colour, bigger) |

**Auto-match:** if a picture is named `soldier`, it appears whenever the word "soldier" is spoken — no tag needed. Name several triggers with commas: `walter, heisenberg, breaking bad`.
**Auto-fill:** scenes with no matching picture use the next unused picture in list order (toggle in Style).

## Run / deploy
Static files only. Open via any web server (`python3 -m http.server`) or deploy to GitHub Pages / Vercel as-is.
Use **Chrome or Edge** for MP4 export (other browsers may give WebM). Export renders in real time — keep the tab open and visible.

## Files
- `engine.js` – script parser, picture matching, timeline (pure logic, `node test.mjs`)
- `app.js` – UI, canvas renderer, playback, export
- `index.html`, `style.css`
~~~~

# END OF FILES

Now perform STEP 1 to STEP 7. Start immediately. Do not ask me any questions. The repository URL is already given above. If you cannot access it, use the fallback in the section IF YOU CANNOT WRITE DIRECTLY TO GITHUB.
