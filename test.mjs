import { cameraState } from './camera.js';
import { analyzeVoice, applyVoiceSync } from './sync.js';
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
// auto-fill: one scene, three unmatched pictures -> all three must appear, in upload order
const one=parseScript("This is one long scene with no blank lines so every picture should still show up one after another here.");
const tl3=buildTimeline(one,[{name:'a1'},{name:'b2'},{name:'c3'}],{autoFill:true});
assert.deepEqual(tl3.events.map(e=>e.img.name),['a1','b2','c3']);
// auto-fill: more scenes than pictures -> one picture per scene, in order
const three=parseScript("One.\n\nTwo.\n\nThree.");
const tl4=buildTimeline(three,[{name:'a1'},{name:'b2'}],{autoFill:true});
assert.deepEqual(tl4.events.map(e=>e.img.name),['a1','b2']);
// new tokens: ghost symbol, orbit icons, button
const tk=parseScript("Tired of poor *Marketing* {?}\n\nPeople want *status* {icons:gear,Head set,24/7}\n\nLet's talk. (( Book Now ))");
assert.equal(tk.length,3);
assert.equal(tk[0].ghost,'?'); assert.equal(tk[0].words.length,4);
assert.deepEqual(tk[1].icons,['gear','headset','247']);
assert.equal(tk[2].button,'Book Now'); assert.equal(tk[2].words.length,2);
const tl5=buildTimeline(tk,[],{});
assert.equal(tl5.scenes[0].ghost,'?'); assert.equal(tl5.scenes[2].button,'Book Now');
// voice sync: a synthetic voice with silence at both ends and pauses; words must land near the true times
{
  const SC = "One two three four. Five six seven eight.\n\nNine ten eleven twelve. Thirteen fourteen fifteen.\n\nSixteen seventeen eighteen nineteen twenty.";
  const sr = 8000, parsed = parseScript(SC);
  let tt = 1.5, r = 7; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  const truth = [], bursts = [];
  parsed.forEach(sc => sc.words.forEach((w, i) => {
    const d = 0.06 * w.text.length + 0.12; truth.push(tt); bursts.push([tt, tt + d]); tt += d;
    tt += i === sc.words.length - 1 ? 0.9 : /[.!?]$/.test(w.text) ? 0.55 : 0.07;
  }));
  const n = Math.floor((tt + 1.5) * sr), x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (rnd() - 0.5) * 0.002;
  bursts.forEach(([s, e]) => { for (let i = Math.floor(s * sr); i < Math.floor(e * sr); i++) x[i] += 0.3 * Math.sin(i * 0.12) + (rnd() - 0.5) * 0.2; });
  const voice = analyzeVoice(x, sr);
  assert(voice.blocks.length >= 5, 'speech parts found');
  const tl6 = buildTimeline(parsed, [], { wpm: 150 });
  applyVoiceSync(tl6, voice, { audioDur: n / sr });
  const got = tl6.scenes.flatMap(s => s.words.map(w => w.t));
  const err = got.reduce((a, g, i) => a + Math.abs(g - truth[i]), 0) / got.length;
  assert(err < 0.2, 'voice sync mean error ' + err);
  const shifted = buildTimeline(parseScript(SC), [], { wpm: 150 });
  applyVoiceSync(shifted, voice, { audioDur: n / sr, offset: 0.3 });
  assert(Math.abs(shifted.scenes[0].words[2].t - tl6.scenes[0].words[2].t - 0.3) < 1e-6, 'offset');
  assert.equal(applyVoiceSync(buildTimeline(parseScript(SC), [], {}), analyzeVoice(new Float32Array(sr * 2), sr), {}), null);
}
// camera curves measured from the reference video (px are in the 359x640 space of the measurement)
{
  const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, msg + ' got ' + a + ' want ' + b);
  near(cameraState('riseup', 'none', 0.4, 9).dy / 3, 106, 6, 'rise at 0.4s');
  near(cameraState('riseup', 'none', 0.8, 9).dy / 3, 34, 5, 'rise at 0.8s');
  near(cameraState('slidein', 'none', 0.3, 9).dx / 3.008, 36, 6, 'slide in at 0.3s');
  near(cameraState('settle', 'none', 0.2, 9).s, 0.85, 0.03, 'settle at 0.2s');
  assert.equal(cameraState('off', 'none', 0.3, 9).dy, 0);
  assert(cameraState('off', 'zoompush', 0, 0).s > 2.5, 'zoom push reaches 2.6x at the cut');
  assert(cameraState('off', 'whipup', 0, 0).dy < -1000, 'whip up leaves the frame');
  assert.equal(cameraState('off', 'whipup', 0, 1).dy, 0);
  assert.equal(parseScript("Big *SKILL* {giant:skill words}")[0].giant, 'skill words');
}
console.log('engine ok');
