# After Midnight — demo video (LANDSCAPE 1920×1080)

90-second cinematic landscape HyperFrames composition. Designed for laptop-recorded footage of the desktop platform.

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
| `assets/personal.mp4` | Your 10-12s laptop webcam selfie | **YOU — laptop webcam** |
| `assets/platform-1.mp4` | Landing → Allow Mic | **YOU — laptop screen-rec** |
| `assets/platform-2.mp4` | Kai-is-writing card | **YOU — laptop screen-rec** |
| `assets/platform-3.mp4` | Vinyl + song playing | **YOU — laptop screen-rec** |
| `assets/platform-4.mp4` | DJ mode flip | **YOU — laptop screen-rec** |

All asset files in `assets/` start as zero-byte placeholders so the project compiles.
Drop your real files in with the same names — that's it.

## Image prompts for Claude Design — 1920×1080 LANDSCAPE

All images: **1920×1080 horizontal**. Style prefix on every prompt:

> Cinematic anime in the style of Makoto Shinkai (Your Name, 5 Centimeters per Second). Soft cel-shaded 2D animation. Warm walnut, amber, and cream palette with deep blacks. Slight film grain. Late-night 3 AM mood. No text in image. Wide cinematic horizontal composition.

| File | Prompt body (after the prefix) |
|---|---|
| `anime-1.jpg` | A vast wide-angle night cityscape of dark high-rises, a single warmly-lit apartment window glowing amber on the third floor of a building near the center-left third of the frame. Soft rain glittering through amber streetlights. Lonely, beautiful, hopeful. |
| `anime-2.jpg` | Wide cinematic close-up of a vintage 1980s wood-paneled AM radio on a wooden bedside table. The dial glows soft amber. Reflection on polished walnut. A glass of water and an open paperback nearby. Soft amber glow falling off into the dark room on either side. Composed for horizontal frame. |
| `anime-3.jpg` | Wide horizontal shot of an empty 1980s radio studio at 4:30 AM. A vintage Shure SM7B microphone hanging from its boom arm centered in frame. The ON AIR lamp is dark. Walnut mixing console stretches across the bottom of the frame. Empty chair, coffee cup, vinyl records stacked on the right. Quiet after-show melancholy. |
| `anime-4.jpg` | Wide cinematic shot of a young person seen from behind, sitting on the edge of a bed in a dim room at 3 AM. Their hand reaches across the frame for an old rotary phone on the nightstand. Their face is not shown — only silhouette and one ear in profile. Soft amber light from a lamp on the right side of the frame. Heavy emotional weight. |
| `anime-5.jpg` | Wide cinematic city overlook at 4:00 AM, looking down a quiet rain-slicked street, vanishing point in the center distance. In one apartment building visible in the middle distance, a single window glows amber — recognizable as the same window from the opening shot. The city is sleeping. Hopeful melancholy. |

## Personal clip directions — laptop webcam

- **1920×1080 horizontal** (laptop's native webcam orientation)
- 10-12 seconds
- Sit centered in frame, soft warm lamp lighting from the side
- Look slightly off-camera (not directly into the lens — it breaks the intimacy)
- Speak ONE vulnerable line slowly, with feeling

Use **QuickTime → New Movie Recording**:
1. Choose the **FaceTime HD camera**
2. Click the dropdown next to record button → **Quality: High**
3. Click record, count 1-2 seconds of silence, then deliver your line, then 1-2 seconds of silence
4. Stop, save as `media/video/assets/personal.mp4`

Suggested lines (pick whichever is true to you):
- *"My mom died two years ago. I keep dreaming about her making chai."*
- *"I haven't talked to my best friend in eight months. I don't even know why."*
- *"I quit my job a month ago and I still haven't told my dad."*
- Or any honest 8-10 word emotional fragment from your actual life

You'll be on the LEFT half of the frame in the final video; the right half shows the platform in parallel. So look slightly to your right (toward the imaginary platform) when speaking.

## Platform screen recording — laptop

Use **QuickTime → New Screen Recording** with:
- Click the dropdown arrow → enable **Microphone OFF** (audio gets added later)
- Click record → drag-select a region matching your browser viewport (1280×800 ideal, or full browser)
- Open https://after-midnight-nine.vercel.app in **Chrome in fullscreen / kiosk mode** (Cmd+Ctrl+F)

| File | Length | Capture instructions |
|---|---|---|
| `platform-1.mp4` | 8s | Open landing → click **Be a Caller** → click **Allow Mic** → screen shows the booth dialing/ringing |
| `platform-2.mp4` | 8s | Continue the call after your personal clip → screen shows **"✎ KAI IS WRITING — [vibe]"** card pulsing in the library panel |
| `platform-3.mp4` | 20s | Vinyl spinning, song title appearing, song with vocals playing through. Hero shot — let it ride. |
| `platform-4.mp4` | 12s | Cut to landing → click **Be the DJ** → call comes in → answer → tap a song from the stacks → vinyl spins |

For Plat 2 + 3 you'll need to **actually have a real conversation with Kai** to trigger the `play_song` tool. Plan a quiet moment — you have to wait the 30-50s for music gen during recording, then trim.

## To assemble (after assets are in `assets/`)

```bash
cd /Users/aditya/elevenlabs/media/video
hyperframes lint
hyperframes inspect       # checks layout / overflow at hero frames
hyperframes render --out after-midnight-demo.mp4
```

Output: `after-midnight-demo.mp4` (1920×1080, 90 seconds).

**Already lint-clean (0 errors).** The 4 remaining warnings are about file size — non-blocking for a 90-second hackathon demo.
