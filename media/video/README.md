# After Midnight — demo video

90-second cinematic vertical (1080×1920) HyperFrames composition.

## Files in this folder

| File | What it is | Provided by |
|---|---|---|
| `DESIGN.md` | Visual identity (palette, type, motion) | already done |
| `hyperframes.json` | Project config | already done |
| `index.html` | The composition (timing + animation) | already done |
| `vo-part1.mp3` | 0:00–0:27 narration (Eric voice) | already baked |
| `vo-part2.mp3` | 0:42–1:24 narration (Eric voice) | already baked |
| `music-bed-long.mp3` | 100s ambient bed | already baked |
| `assets/anime-1.jpg` | City window at 3 AM | **YOU — Claude Design** |
| `assets/anime-2.jpg` | Vintage radio close-up | **YOU — Claude Design** |
| `assets/anime-3.jpg` | Empty studio | **YOU — Claude Design** |
| `assets/anime-4.jpg` | Reaching for phone | **YOU — Claude Design** |
| `assets/anime-5.jpg` | Wide closing cityscape | **YOU — Claude Design** |
| `assets/personal.mp4` | Your 10-12s selfie clip | **YOU — phone** |
| `assets/platform-1.mp4` | Landing → Allow Mic | **YOU — phone screen-rec** |
| `assets/platform-2.mp4` | Kai-is-writing card | **YOU — phone screen-rec** |
| `assets/platform-3.mp4` | Vinyl + song playing | **YOU — phone screen-rec** |
| `assets/platform-4.mp4` | DJ mode flip | **YOU — phone screen-rec** |

All asset files in `assets/` start as zero-byte placeholders so the project compiles.
Drop your real files in with the same names — that's it.

## Image prompts for Claude Design

All images: **1080×1920 vertical**. Style prefix on every prompt:

> Cinematic anime in the style of Makoto Shinkai (Your Name, 5 Centimeters per Second). Soft cel-shaded 2D animation. Warm walnut, amber, and cream palette with deep blacks. Slight film grain. Late-night 3 AM mood. No text in image.

| File | Prompt body (after the prefix) |
|---|---|
| `anime-1.jpg` | A single warmly-lit apartment window, third floor in a vast night cityscape of dark high-rises. Soft rain glittering through amber streetlights. Vertical composition, the lit window framed by silhouetted buildings. Lonely, beautiful, hopeful. |
| `anime-2.jpg` | Close-up of a vintage 1980s wood-paneled AM radio on a wooden bedside table. The dial glows soft amber. Reflection on polished walnut. A glass of water and an open paperback nearby. The room is dark except for the amber dial light. |
| `anime-3.jpg` | An empty 1980s radio studio at 4:30 AM. A vintage Shure SM7B microphone hanging from its boom arm. The ON AIR lamp is dark. Walnut mixing console. Empty chair. A coffee cup. Vinyl records stacked. Quiet, after-show melancholy. |
| `anime-4.jpg` | A young person seen from behind, sitting on the edge of a bed in a dim room at 3 AM. Their hand reaches for an old rotary phone on the nightstand. Their face is not shown — only silhouette and one ear. Soft amber light from a lamp. Heavy emotional weight in the posture. |
| `anime-5.jpg` | Wide cinematic city view at 4:00 AM, looking down a quiet rain-slicked street. In one apartment building, a single window glows amber — recognizable as the same window from the opening shot. The city is sleeping. The radio is still on. Hopeful melancholy. |

## Personal clip directions

- 1080×1920 vertical (selfie orientation)
- 10-12 seconds
- Hold platform phone in hand, hit TALK, speak one vulnerable line
- Lighting: warm side lamp; avoid overhead fluorescent
- Wear something dark
- Three takes minimum; pick the one where your voice catches naturally

Suggested lines (pick whichever is true):
- *"My mom died two years ago. I keep dreaming about her making chai."*
- *"I haven't talked to my best friend in eight months. I don't even know why."*
- *"I quit my job a month ago and I still haven't told my dad."*

## Platform screen-recording shot list

iOS: Settings → Control Center → Add Screen Recording. Long-press the recording icon → toggle Microphone OFF (we add audio in post).

Open https://after-midnight-nine.vercel.app on your phone in fresh Chrome, then:

| File | Length | Capture instructions |
|---|---|---|
| `platform-1.mp4` | 8s | Open landing → tap **Be a Caller** → tap **Allow Mic** → screen shows the booth ringing |
| `platform-2.mp4` | 8s | Continue the call after your personal clip → screen shows **"✎ KAI IS WRITING — [vibe]"** card pulsing |
| `platform-3.mp4` | 20s | Vinyl spinning, song title appearing, song with vocals playing through. The hero shot — let it ride. |
| `platform-4.mp4` | 12s | Quick cut to landing → tap **Be the DJ** → call comes in → answer → tap a song from stacks → vinyl spins |

## To assemble

Once all assets are in `assets/`:

```bash
cd /Users/aditya/elevenlabs/media/video
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect
npx hyperframes render --out after-midnight-demo.mp4
```

The render command will produce `after-midnight-demo.mp4` (1080×1920, 90 seconds, captioned).

For Devpost (horizontal), open the rendered file in CapCut → resize 1920×1080 → letterbox the original → re-export.
