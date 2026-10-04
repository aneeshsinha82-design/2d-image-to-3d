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
    const empty = rawEvents.map((e, i) => (e.length ? -1 : i)).filter(i => i >= 0);
    if (pool.length && pool.length <= empty.length) {
      pool.forEach((img, k) => rawEvents[empty[k]].push({ wi: 0, img }));
    } else if (pool.length) {
      // more pictures than empty scenes: spread them evenly over all the words, in upload order
      const flat = [];
      scenes.forEach((s, si) => s.words.forEach((w, wi) => flat.push([si, wi])));
      const N = flat.length;
      pool.forEach((img, k) => {
        let pos = Math.floor(k * N / pool.length);
        while (pos < N && rawEvents[flat[pos][0]].some(e => e.wi === flat[pos][1])) pos++;
        if (pos < N) rawEvents[flat[pos][0]].push({ wi: flat[pos][1], img });
      });
    }
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
