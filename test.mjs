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
console.log('engine ok');
