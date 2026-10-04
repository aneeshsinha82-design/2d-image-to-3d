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
console.log('engine ok');
