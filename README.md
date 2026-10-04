# Script → Video

Browser tool that turns a **text script + named pictures** into a vertical (9:16) kinetic-typography video, exportable in HD (720p / 1080p / 2K). No server, no API keys — everything runs in the browser.

## How to use
1. Write the script. A blank line (or `---`) starts a new scene.
2. Add pictures (any number; PNG with transparent background looks best). Rename each one — the name is what the tool matches against the script.
3. Optional: add a voice-over; the script timing stretches to fit it.
4. Pick a theme and styles, set your handle, press **Export HD video**.

## Script syntax
| Syntax | Meaning |
|---|---|
| blank line / `---` | new scene |
| `[soldier]` | show the picture named "soldier" starting at the next word |
| `[3]` | show the 3rd picture in the list |
| `*broken*` | emphasised word (accent colour, bigger, optional reflection) |

**Auto-match:** a picture named `soldier` appears whenever the word "soldier" is spoken. Several triggers: `walter, heisenberg, breaking bad`.
**Auto-fill:** scenes with no matching picture use the next unused picture in list order.

## Style options
- **Themes:** Editorial (red), Night, Warm cream (orange), Mint (green + red)
- **Scene transitions** (Mix = a different one for each scene): Colour wipe, Circle iris, Stripes, Glitch, Curtain, Diagonal slash, Zoom punch, Flash, None
- **Picture entrances** (Mix = a different one for each picture): Pop, Slide up, Spin in, Fly in from left / right, Drop + bounce, Zoom in, Flip, Swing
- **Text animations** (Mix = a different one for each word): Rise + fade, Typewriter, Letter by letter, Blur in, Zoom in, Slide from sides, Drop + bounce, Spin in
- **Text font style:** Editorial mix, Bold poster, Elegant serif, Handwritten script, Tech mono
- **Picture style:** Cut-out, White card, Polaroid, Gold frame
- Decorations (scene counter + barcode), reflection under accent words, whoosh sound effects (included in the export)

## Run / deploy
Static files only. Open via any web server (`python3 -m http.server`) or GitHub Pages.
Use **Chrome or Edge** for MP4 export (other browsers may give WebM). Export renders in real time — keep the tab open and visible.

## Files
- `engine.js` – script parser, picture matching, timeline (pure logic; `node test.mjs`)
- `themes.js` – colour themes and font sets
- `draw.js` – canvas renderer (pictures, text, decorations, transitions)
- `app.js` – UI, playback, audio, export
- `index.html`, `style.css`, `package.json`
