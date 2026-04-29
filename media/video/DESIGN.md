# After Midnight — Demo Video Design

## Style Prompt

A 90-second cinematic vertical short film blending Makoto Shinkai-style anime stills, a warm walnut-and-amber 1987 radio booth aesthetic, and intimate phone-screen footage. Late-night, 3 AM mood. Soft, melancholy, hopeful. The narrator is the AI DJ from the platform — the same warm Eric voice — so the film and the product share a single voice. Cream paper textures, vinyl crackle, faint film grain, hand-drawn marker accents on subtitles when emphasis is needed.

## Colors

| Token | Hex | Role |
|---|---|---|
| `--walnut-deep` | `#2A1A0F` | Primary background |
| `--walnut-edge` | `#1A0F08` | Vignette edges |
| `--vinyl-black` | `#0A0A0A` | Deepest shadow / closing fade |
| `--amber` | `#FFB347` | Primary accent (CRT glow, lamp, key text highlights) |
| `--on-air` | `#E54B3C` | Secondary accent (ON AIR lamp, urgent overlay) |
| `--cream` | `#F2EAD3` | Foreground text / paper cards |
| `--cream-dim` | `rgba(242, 234, 211, 0.6)` | Secondary text |

Background gradient for default scenes: `radial-gradient(ellipse 100% 80% at 50% 30%, #2A1A0F 0%, #1A0F08 70%, #000 100%)`.

## Typography

- **Display / Hero**: `DM Serif Display`, 400 weight (matches the platform title).
- **Body / Subtitles**: `Inter`, 400 italic for emotional captions, 500 regular for callouts.
- **Mono / Tags / Station IDs**: `VT323` (CRT amber readouts) and `IBM Plex Mono` (typewriter playlist log).
- **Hand-drawn**: `Caveat` for any sleeve labels.

Caption sizes for vertical 1080×1920:
- Hero captions: 72px serif italic
- Tags / station IDs: 36px mono uppercase, 0.32em tracked
- Closing card: 96px serif

## Motion principles

- Slow, breathing motion. Nothing snaps in under 0.4s.
- Eases: `power3.out` for entrances, `power2.in` for exits, `expo.out` for the title beat.
- Anime stills get subtle Ken Burns (1.00 → 1.06 scale over their full duration) so they feel cinematic instead of static.
- Crossfades between scenes (0.6-0.8s opacity overlap), no hard cuts.
- The ON AIR lamp pulses (1.0 → 1.05) on a 2s loop throughout the booth scenes.
- Text caption entrances use a subtle 12px y-rise + opacity 0→1 over 0.5s.

## What NOT to do

- No neon / cyan / synthwave. This is warm late-night, not 80s nightclub.
- No pure `#000` or `#fff` — always tint toward walnut/amber. Closing card is `#0A0A0A`, not `#000`.
- No left-edge accent stripes on cards. Cream paper labels are rotated 1-3 degrees instead.
- No gradient text — use solid `--cream` over `--walnut-deep` and let the radial vignette do the depth work.
- No identical card grids. Library cards stack with ±2px y-jitter and 1deg rotation variance.
- No horizontal layouts — the entire video is shot vertically. Anime stills must be commissioned at 1080×1920.

## Visual references

- The platform itself: https://after-midnight-nine.vercel.app — booth, ON AIR lamp, library drawer, vinyl turntable.
- Makoto Shinkai films: *Your Name*, *5 Centimeters per Second*, *The Garden of Words* — for the anime cityscapes and warm window glow.
- ElevenLabs hackathon submissions style guide: viral, hook in 5 seconds, captioned for silent viewing.
