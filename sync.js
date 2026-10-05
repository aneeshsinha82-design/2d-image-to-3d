// Voice-over sync. Pure logic (no DOM) so it can be tested in Node.
//
//  analyzeVoice(samples, sampleRate)  -> { dur, blocks, pauses }
//     blocks  = stretches of speech  [{s, e}]  (short gaps inside a sentence are merged)
//     pauses  = real silences between blocks [{s, e}]  (>= PAUSE seconds)
//
//  applyVoiceSync(tl, voice, opts)    -> re-times an existing timeline so words follow the voice
//     opts = { offset, marks, audioDur }
//       offset  : seconds, positive = text appears later
//       marks   : { sceneIndex: seconds }  scene starts tapped by the user (exact anchors)
//
// Method: words are placed on the SPEECH-ONLY time axis (silences removed), in proportion to
// their spoken length. Scene starts / sentence ends are then snapped to the nearest real pause
// in the audio, which removes drift. Taps override everything.

const PAUSE = 0.25;

export function analyzeVoice(samples, sr) {
  const dur = samples.length / sr;
  const hop = Math.max(1, Math.round(sr * 0.01)), win = Math.max(1, Math.round(sr * 0.025));
  const n = Math.max(0, Math.floor((samples.length - win) / hop));
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0; const o = i * hop;
    for (let j = 0; j < win; j++) { const v = samples[o + j]; s += v * v; }
    db[i] = 20 * Math.log10(Math.sqrt(s / win) + 1e-9);
  }
  if (!n) return { dur, blocks: [], pauses: [] };
  const sorted = Array.from(db).sort((a, b) => a - b);
  const p10 = sorted[Math.floor(n * 0.1)], p95 = sorted[Math.floor(n * 0.95)];
  if (p95 < -70) return { dur, blocks: [], pauses: [] };           // silent file
  const thr = Math.max(p95 - 28, p10 + 6);
  const act = new Uint8Array(n);
  for (let i = 0; i < n; i++) act[i] = db[i] > thr ? 1 : 0;

  // frames -> segments, closing dips < 0.12 s, dropping blips < 0.06 s
  const fr = 0.01;
  let segs = [];
  for (let i = 0; i < n; i++) {
    if (!act[i]) continue;
    let j = i; while (j + 1 < n && act[j + 1]) j++;
    segs.push([i * fr, (j + 1) * fr]); i = j;
  }
  const closed = [];
  segs.forEach(s => {
    const last = closed[closed.length - 1];
    if (last && s[0] - last[1] < 0.12) last[1] = s[1]; else closed.push(s.slice());
  });
  segs = closed.filter(s => s[1] - s[0] >= 0.06);

  // speech blocks: merge gaps shorter than PAUSE; pauses = the gaps that stay
  const blocks = [], pauses = [];
  segs.forEach(s => {
    const last = blocks[blocks.length - 1];
    if (last && s[0] - last.e < PAUSE) last.e = s[1];
    else { if (last) pauses.push({ s: last.e, e: s[0] }); blocks.push({ s: s[0], e: s[1] }); }
  });
  return { dur, blocks, pauses };
}

function speechAxis(blocks) {
  const cs = []; let acc = 0;
  blocks.forEach(b => { cs.push(acc); acc += b.e - b.s; });
  const total = acc;
  const S = t => { // time -> speech-time
    for (let k = blocks.length - 1; k >= 0; k--) {
      if (t >= blocks[k].s) return cs[k] + Math.min(t, blocks[k].e) - blocks[k].s;
    }
    return 0;
  };
  const Sinv = u => { // speech-time -> time (ties resolve to the START of the next block)
    if (u >= total) return blocks[blocks.length - 1].e;
    for (let k = 0; k < blocks.length; k++) {
      if (u < cs[k] + (blocks[k].e - blocks[k].s)) return blocks[k].s + Math.max(0, u - cs[k]);
    }
    return blocks[blocks.length - 1].e;
  };
  return { cs, total, S, Sinv };
}

export function applyVoiceSync(tl, voice, o = {}) {
  const blocks = voice && voice.blocks;
  if (!blocks || !blocks.length || !tl.scenes.length) return null;
  const outroLen = tl.hasOutro ? tl.total - tl.outroStart : 0;

  // flatten words
  const F = [];
  tl.scenes.forEach((sc, si) => sc.words.forEach((w, wi) => F.push({ si, wi, w, wt: Math.max(0.12, w.dur) })));
  const N = F.length;
  const cum = [0]; F.forEach(f => cum.push(cum[cum.length - 1] + f.wt));
  const { cs, total: Ts, S, Sinv } = speechAxis(blocks);
  if (Ts <= 0) return null;

  // boundaries = first word of a scene, or first word after . ! ?
  const sceneFirst = {}; let idx = 0;
  tl.scenes.forEach((sc, si) => { sceneFirst[idx] = si; idx += sc.words.length; });
  const bounds = [];
  for (let i = 1; i < N; i++) {
    if (sceneFirst[i] !== undefined || /[.!?]["')\]]*$/.test(F[i - 1].w.text)) bounds.push(i);
  }

  // hard anchors: the very start, taps from the user, the very end
  const marks = o.marks || {};
  const hard = [{ i: 0, time: blocks[0].s, u: 0 }];
  bounds.forEach(bi => {
    const mt = sceneFirst[bi] !== undefined ? marks[sceneFirst[bi]] : undefined;
    if (mt !== undefined && mt !== null) {
      const t = Math.max(mt, hard[hard.length - 1].time + 0.05);
      hard.push({ i: bi, time: t, u: S(t) });
    }
  });
  hard.push({ i: N, time: blocks[blocks.length - 1].e, u: Ts });
  const anchors = new Map(hard.map(h => [h.i, h]));

  // unmarked boundaries: predict where each should fall, then match them to the real pauses
  // with a global monotonic matching (prefers long pauses, penalises distance)
  const open = bounds.filter(bi => !anchors.has(bi));
  const pred = open.map(bi => {
    let h0 = hard[0], h1 = hard[hard.length - 1];
    for (let q = 0; q < hard.length - 1; q++) if (hard[q].i < bi && bi < hard[q + 1].i) { h0 = hard[q]; h1 = hard[q + 1]; break; }
    const U = h0.u + (cum[bi] - cum[h0.i]) / (cum[h1.i] - cum[h0.i] || 1) * (h1.u - h0.u);
    return { bi, T: Sinv(U), lo: h0.time, hi: h1.time, span: Sinv(U) - h0.time };
  });
  const P = voice.pauses, m = pred.length, p = P.length, SKIP = 3.5, INF = 1e9;
  const cost = (i, k) => {
    const pr = pred[i], c = (P[k].s + P[k].e) / 2, sg = Math.min(1.6, Math.max(0.7, 0.3 * pr.span));
    const d = Math.abs(c - pr.T);
    if (c < pr.lo + 0.1 || c > pr.hi - 0.1 || d > 1.5 * sg) return INF;
    return (d / sg) * (d / sg) - 2.0 * Math.min(P[k].e - P[k].s, 1.2);
  };
  const dp = Array.from({ length: m + 1 }, () => new Float64Array(p + 1));
  const from = Array.from({ length: m + 1 }, () => new Int8Array(p + 1));
  for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] + SKIP;
  for (let i = 1; i <= m; i++) for (let k = 1; k <= p; k++) {
    let best = dp[i][k - 1], fr = 0;                                   // skip pause k-1
    if (dp[i - 1][k] + SKIP < best) { best = dp[i - 1][k] + SKIP; fr = 1; } // boundary i-1 unmatched
    const c = cost(i - 1, k - 1);
    if (c < INF && dp[i - 1][k - 1] + c < best) { best = dp[i - 1][k - 1] + c; fr = 2; } // match
    dp[i][k] = best; from[i][k] = fr;
  }
  for (let i = m, k = p; i > 0 && k >= 0;) {
    if (k === 0) { i--; continue; }
    const fr = from[i][k];
    if (fr === 2) {
      const nb = k; // pause k-1 sits before block k
      if (blocks[nb]) anchors.set(pred[i - 1].bi, { i: pred[i - 1].bi, time: blocks[nb].s, u: cs[nb] });
      i--; k--;
    } else if (fr === 1) i--; else k--;
  }

  // interpolate every word between consecutive anchors on the speech axis
  const keys = Array.from(anchors.keys()).sort((x, y) => x - y);
  const times = new Array(N);
  for (let q = 0; q < keys.length - 1; q++) {
    const i0 = keys[q], i1 = keys[q + 1], A0 = anchors.get(i0), A1 = anchors.get(i1);
    const span = cum[i1] - cum[i0] || 1;
    for (let i = i0; i < i1; i++) {
      times[i] = i === i0 ? A0.time : Sinv(A0.u + (cum[i] - cum[i0]) / span * Math.max(0, A1.u - A0.u));
    }
  }
  const off = o.offset || 0;
  let prev = 0;
  for (let i = 0; i < N; i++) { times[i] = Math.max(prev, Math.max(0, times[i] + off)); prev = times[i]; }

  // write the new times back into the timeline
  F.forEach((f, i) => { f.w.t = times[i]; f.w.dur = i + 1 < N ? Math.min(0.7, Math.max(0.12, times[i + 1] - times[i])) : 0.4; });
  const audioEnd = Math.max(o.audioDur || 0, voice.dur || 0, times[N - 1] + 0.6);
  tl.scenes.forEach((sc, si) => {
    const first = sc.words[0].t;
    sc.start = si === 0 ? Math.max(0, first - 0.35) : first;
    sc.end = si + 1 < tl.scenes.length ? tl.scenes[si + 1].words[0].t : audioEnd;
    sc.phrases.forEach((p, k) => {
      p.start = sc.words[p.idx[0]].t;
      p.end = k + 1 < sc.phrases.length ? sc.words[sc.phrases[k + 1].idx[0]].t : sc.end;
    });
  });
  tl.events.forEach(e => { e.t = tl.scenes[e.scene].words[e.wi].t; });
  tl.outroStart = audioEnd;
  tl.total = audioEnd + outroLen;
  tl.synced = true;
  return tl;
}
