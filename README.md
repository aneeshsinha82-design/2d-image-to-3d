# Script → Video

Browser tool that turns a **text script + named pictures** into a vertical (9:16) motion-graphics video, exportable in HD (720p / 1080p / 2K). No server, no API keys: everything runs in the browser.

## How to use
1. Write the script. A blank line (or `---`) starts a new scene.
2. Add pictures (any number; PNG with transparent background looks best). Rename each one: the name is what the tool matches against the script.
3. Optional: add a voice-over; the script timing stretches to fit it.
4. Pick styles (or leave everything on **Mix**), set your handle, press **Export HD video**.

## Script syntax
| Syntax | Meaning |
|---|---|
| blank line / `---` | new scene |
| `[soldier]` | show the picture named "soldier" starting at the next word (`[3]` = 3rd picture) |
| `*broken*` | emphasised keyword (accent colour, huge in the keyword layouts) |
| `{?}` | giant pale ghost symbol behind the scene text (`{0}`, `{$}`, any text) |
| `{icons:gear,headset,24/7,user}` | round icon badges orbiting a thin ring |
| `((Book Now))` | black pill button; a hand cursor flies in and clicks it at the end of the scene |

Icons: gear, user, headset, chat, star, check, bolt, heart, clock, 24/7, hand, mail.
**Auto-match:** a picture named `soldier` appears whenever the word "soldier" is spoken. Several triggers: `walter, heisenberg`.
**Auto-fill:** unmatched scenes use the next unused picture; leftovers are spread evenly over the words.

## Style options (every dropdown has a **Mix** choice that varies it automatically)
- **Themes:** Editorial, Night, Warm cream, Mint, Cream + black (ad style), Crumpled paper, **Alternate light / dark every scene**
- **Text layout:** Stacked words · Small lead-in + huge keyword · Huge keyword on top + helper line
- **Text font style:** Agency bold, Editorial mix, Bold poster, Elegant serif, Handwritten script, Tech mono
- **Text animation (13):** rise, typewriter, letter by letter, blur in, zoom, slide, bounce, spin, glitch, wavy letters, flip, scramble decode, stretch
- **Text exit:** blur out, fade out, float up
- **Scene transitions (15):** colour wipe, circle iris, stripes, glitch, curtain, diagonal slash, zoom punch, flash, vertical slits, horizontal bands, ink flood, ribbon sweep, corner circle, tilt-in camera, blur-in (or a hard cut)
- **Picture entrances (14):** pop, slide up, spin, fly from left / right, drop + bounce, zoom, flip, swing, hanging lamp swing, fly + snap, rise, from the corner, blur to focus
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
- `util.js` – shared constants and easing functions
- `themes.js` – colour themes and font sets
- `text.js` – text layouts, 13 animations, exit animations
- `pictures.js` – picture entrances and picture styles
- `fx.js` – scene transitions, decorations, ghost symbol, ink splash, backdrops
- `icons.js` – icon badges, orbit ring, button with cursor
- `wrapper.js` – paper texture, showcase wrapper, end card
- `draw.js` – renders each frame (puts everything together)
- `app.js` – UI, playback, audio, export
- `index.html`, `style.css`, `package.json`
