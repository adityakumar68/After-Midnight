// scripts/bake-songs.ts
// Generates 12 ~15s music previews using ElevenLabs Music API.
// Run once: ELEVENLABS_API_KEY=sk_xxx npm run bake:songs
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Set ELEVENLABS_API_KEY"); process.exit(1); }

const PROMPTS: Record<string, string[]> = {
  "dusty-country": [
    "Lonely Americana, 3 AM I-80 in Nebraska, slide steel guitar, brushed snare, road-warm baritone hum, no vocals, melancholic but warm",
    "Old country trucker ballad instrumental, slow tempo, dusty mix, harmonica wail, no vocals, 15 seconds",
    "Resigned country instrumental with brushed drums, finger-picked steel string, the sound of headlights at 3 AM",
  ],
  "synthwave-heartbreak": [
    "Late-night synthwave with rain ambience, breathy pads, slow analog arpeggios, aching but pretty, no vocals",
    "Heartbroken neon ballad, lonely sax sample, reverb-soaked Rhodes, drum machine at half-tempo",
    "Slow synthwave instrumental, tape-warped pads, distant cars, the feeling of crying on a bathroom floor",
  ],
  "lullaby-piano": [
    "Tiny lullaby for a dead goldfish, child-safe felt piano, soft music box, gentle and tender, 15 seconds",
    "Gentle bedtime piano lullaby, soft Rhodes, twinkles, no vocals",
    "Music-box lullaby in a major key, very tender, the sound of a child trying to be brave",
  ],
  "cozy-lo-fi": [
    "Quiet lo-fi night-radio bed, vinyl crackle, soft jazz keys, half-time hip-hop drums, distant traffic, no vocals",
    "Sleepy lo-fi instrumental, dusty piano sample, gentle bass, the feeling of a quiet kitchen at 4 AM",
    "Slow lo-fi loop with rain, brushed kit, warm tape hiss, very gentle, no vocals",
  ],
};

import { existsSync } from "node:fs";

async function bake(vibe: string, prompt: string, n: number) {
  const out = resolve(process.cwd(), `public/audio/songs/${vibe}-${n}.mp3`);
  if (existsSync(out)) { console.log(`skip ${vibe}-${n} (exists)`); return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`baking ${vibe}-${n}${attempt > 1 ? ` (attempt ${attempt})` : ""}…`);
    const r = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: { "xi-api-key": KEY!, "content-type": "application/json", "accept": "audio/mpeg" },
      body: JSON.stringify({ prompt, music_length_ms: 15000, output_format: "mp3_44100_128" }),
    });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(out, buf);
      console.log(`✔ ${out} (${buf.length} bytes)`);
      return;
    }
    const body = await r.text();
    console.error(`fail ${vibe}-${n} attempt ${attempt}: ${r.status} ${body.slice(0, 200)}`);
    if (r.status >= 500 && attempt < 3) {
      await new Promise((res) => setTimeout(res, 1500 * attempt));
      continue;
    }
    return;
  }
}

(async () => {
  await mkdir("public/audio/songs", { recursive: true });
  for (const [vibe, prompts] of Object.entries(PROMPTS)) {
    for (let i = 0; i < prompts.length; i++) await bake(vibe, prompts[i], i + 1);
  }
  console.log("done.");
})();
