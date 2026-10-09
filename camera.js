// Camera movement + scene-exit motion. Pure maths (no DOM) so it can be tested in Node.
// All curves were measured from the reference video (subject tracked frame by frame):
//   riseup   : whole scene starts 0.38 H below its rest position and rises with a long cubic ease-out (1.65 s), no zoom
//   settle   : scene starts at 75 % size and grows to 100 % (0.8 s ease-out), then a very slow push-in (+4.5 %)
//   slidein  : scene starts 0.36 W to the right and slides to rest (0.9 s cubic ease-out)
//   drift    : fast slide in from the right, then a constant slow drift to the left (0.167 W / s) with a tiny zoom and tilt
// // Exits (last fraction of a second of a scene, ease-in = accelerating):
//   whipup   : whole scene whips upward and out (0.28 s)
//   slideout : whole scene slides out to the right (0.33 s)
//   zoompush : scene zooms hugely into the cut, up to 2.6x (0.2 s)
import { W, H, clamp01 } from './util.js';

export const CAMERAS = ['riseup', 'settle', 'slidein', 'drift'];
export const EXITS = ['whipup', 'slideout', 'zoompush'];
const EXIT_MIX = ['whipup', 'none', 'zoompush', 'slideout', 'none'];
const EXIT_LEN = { whipup: 0.28, slideout: 0.33, zoompush: 0.2 };

export const cameraFor = (kind, si) => (!kind || kind === 'off' ? 'off' : kind === 'mix' ? CAMERAS[Math.max(si, 0) % CAMERAS.length] : kind);
export const exitFor = (kind, si) => (!kind || kind === 'none' ? 'none' : kind === 'mix' ? EXIT_MIX[Math.max(si, 0) % EXIT_MIX.length] : kind);

// u = seconds since the scene started, r = seconds left until it ends.
// returns { dx, dy, s, rot, blur }  (dx, dy in design pixels, applied around the frame centre)
export function cameraState(camKind, exitKind, u, r) {
  const st = { dx: 0, dy: 0, s: 1, rot: 0, blur: 0 };
  if (camKind === 'riseup') {
    st.dy = 0.38 * H * Math.pow(1 - clamp01(u / 1.65), 3);
  } else if (camKind === 'settle') {
    st.s = (1 - 0.25 * Math.pow(1 - clamp01(u / 0.8), 1.5)) * (1 + 0.045 * clamp01(u / 2.2));
  } else if (camKind === 'slidein') {
    st.dx = 0.36 * W * Math.pow(1 - clamp01(u / 0.9), 3);
  const D = EXIT_LEN[exitKind];
  if (D && r < D) {
    const q = clamp01(1 - r / D);
    if (exitKind === 'whipup') { st.dy += -0.6 * H * Math.pow(q, 2.2); st.blur = q * 7; }
    else if (exitKind === 'slideout') { st.dx += 0.5 * W * Math.pow(q, 2.4); }
    else if (exitKind === 'zoompush') { st.s *= 1 + 1.6 * Math.pow(q, 2.2); st.blur = q * 5; }
  }
  return st;
}

export function applyCamera(ctx, st) {
  if (st.dx === 0 && st.dy === 0 && st.s === 1 && st.rot === 0 && !st.blur) return;
  ctx.translate(W / 2 + st.dx, H / 2 + st.dy);
  if (st.rot) ctx.rotate(st.rot);
  ctx.scale(st.s, st.s);
  ctx.translate(-W / 2, -H / 2);
  if (st.blur > 0.5) ctx.filter = `blur(${st.blur.toFixed(1)}px)`;
}
