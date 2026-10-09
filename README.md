# Script → Video

Browser tool that turns a **text script + named pictures** into a vertical (9:16) motion-graphics video, exportable in HD (720p / 1080p / 2K). No server, no API keys: everything runs in the browser.

## How to use
1. Write the script. A blank line (or `---`) starts a new scene.
2. Add pictures (any number; PNG with transparent background looks best). Rename each one: the name is what the tool matches against the script.
3. Optional: add a voice-over. **Voice sync** (Smart) listens to the audio, ignores silence at the start and end, follows the pauses between sentences and snaps scenes to them. Use **Fine-tune** to shift everything earlier/later, or **Tap to sync scenes** (press Space at the start of each scene while the voice plays) for exact scene starts.
4. Pick styles (or leave everything on **Mix**), set your handle, press **Export HD video**.

## Script syntax
| Syntax | Meaning |
|---|---|
| blank line / `---` | new scene |
| `[soldier]` | show the picture named "soldier" starting at the next word (`[3]` = 3rd picture) |
| `*broken*` | emphasised keyword (accent colour, huge in the keyword layouts) |
| `{?}` | giant pale ghost symbol behind the scene text (`{0}`, `{$}`, any text) |
| `{giant:SKILL}` | giant grey word in two rows behind the scene: flips in with a blur, then the rows drift in opposite directions |
| `{icons:gear,headset,24/7,user}` | round icon badges orbiting a thin ring |
| `((Book Now))` | black pill button; a hand cursor flies in and clicks it at the end of the scene |

Icons: gear, user, headset, chat, star, check, bolt, heart, clock, 24/7, hand, mail.
**Auto-match:** a picture named `soldier` appears whenever the word "soldier" is spoken. Several triggers: `walter, heisenberg`.
**Auto-fill:** unmatched scenes use the next unused picture; leftovers are spread evenly over the words.

## Reference-video style (camera moves, hard cuts, ladder text)
Pick **Quick style preset → Reference video** to switch everything on at once, or choose the parts separately. The curves were measured frame by frame from a reference video.
- **Camera movement** (moves the whole scene): rise & settle from below · zoom-up settle (75 % → 100 %) · slide in from the right · slide in + constant drift
- **Scene exit motion** (last fraction of a second): whip up and out · slide out to the right · zoom hugely into the cut
- **Transition: None (hard cut)** is the reference look: the motion above does the work
- **Text layout "Ladder":** small lead-in words, then bigger words · **Text animations:** rise from behind a mask line (grey → full colour), fade + focus pull
- **Picture entrances:** grow from 75 %, long rise from below, slide in and keep drifting

## Style options (every dropdown has a **Mix** choice that varies it automatically)
- **Themes:** Editorial, Night, Warm cream, Mint, Cream + black (ad style), Crumpled paper, **Alternate light / dark every scene**
- **Text layout:** Stacked words · Small lead-in + huge keyword · Huge keyword on top + helper line · Ladder (small lead-in, then bigger words)
- **Text font style:** Agency bold, Editorial mix, Bold poster, Elegant serif, Handwritten script, Tech mono
- **Text animation (15):** rise, typewriter, letter by letter, blur in, zoom, slide, bounce, spin, glitch, wavy letters, flip, scramble decode, stretch, mask-line rise, focus pull
- **Text exit:** blur out, fade out, float up
- **Scene transitions (15):** colour wipe, circle iris, stripes, glitch, curtain, diagonal slash, zoom punch, flash, vertical slits, horizontal bands, ink flood, ribbon sweep, corner circle, tilt-in camera, blur-in (or a hard cut)
- **Picture entrances (17):** pop, slide up, spin, fly from left / right, drop + bounce, zoom, flip, swing, hanging lamp swing, fly + snap, rise, from the corner, blur to focus, grow from 75 %, long rise, drift
- **Picture style:** cut-out, white card, polaroid, gold frame, yellow glow outline; position centre or alternating
- **Backdrop:** accent circle, green circle behind head, big corner circles
- **Decorations:** tech (graph-paper grid with crosshairs, side micro text, HD/4K badges, glitching barcode) or minimal
- **Ink splash** behind the keyword, reflection under accent words, whoosh sound effects (included in the export)
- **Showcase wrapper:** teal stage, card with shadow, perspective editing timeline that moves with the scenes
- **End card:** dimmed last scene + logo + handle, or black + handle

## Run / deploy
Static files only. Open via any web server (`python3 -m http.server`) or GitHub Pages.
Use **Chrome or Edge** for MP4 export (other browsers may give WebM). Export renders in real time: keep the tab open and visible. If the export looks choppy, choose 720p or 30 fps.

## Files
- `engine.js` – script parser, picture matching, timeline (pure logic; `node test.mjs`)
- `sync.js` – voice analysis and script-to-voice alignment (pure logic, tested)
- `util.js` – shared constants and easing functions
- `themes.js` – colour themes and font sets
- `text.js` – text layouts, 13 animations, exit animations
- `pictures.js` – picture entrances and picture styles
- `camera.js` – camera movements and scene-exit motion (pure maths, tested)
- `fx.js` – scene transitions, decorations, ghost symbol, giant words, ink splash, backdrops
- `icons.js` – icon badges, orbit ring, button with cursor
- `wrapper.js` – paper texture, showcase wrapper, end card
- `draw.js` – renders each frame (puts everything together)
- `app.js` – UI, playback, audio, export
- `index.html`, `style.css`, `package.json`
