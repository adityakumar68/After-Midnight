// scripts/bake-sfx.ts
// Generates 4 SFX clips using ElevenLabs Sound Effects API.
// Run once: ELEVENLABS_API_KEY=sk_xxx npm run bake:sfx
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Set ELEVENLABS_API_KEY"); process.exit(1); }

const TARGETS: Record<string, { prompt: string; duration: number }> = {
  ring:        { prompt: "vintage rotary phone ringing, single ring then pause, 3 seconds",   duration: 3 },
  static:      { prompt: "AM radio static crackle, brief warm hiss, 2 seconds",                duration: 2 },
  onair:       { prompt: "very soft warm analog phone-connecting click, gentle quiet vintage telephone latch, no buzzer, half second, calming and unobtrusive", duration: 1 },
  "room-tone": { prompt: "quiet 1980s radio studio room tone, faint hum, 8 seconds",           duration: 8 },
};

async function bake(name: string, prompt: string, duration: number) {
  const out = resolve(process.cwd(), `public/audio/sfx/${name}.mp3`);
  const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": KEY!, "content-type": "application/json", "accept": "audio/mpeg" },
    body: JSON.stringify({ text: prompt, duration_seconds: duration, prompt_influence: 0.4 }),
  });
  if (!r.ok) { console.error(`${name} fail ${r.status}`); return; }
  await writeFile(out, Buffer.from(await r.arrayBuffer()));
  console.log("✔", out);
}

(async () => {
  await mkdir("public/audio/sfx", { recursive: true });
  for (const [n, t] of Object.entries(TARGETS)) await bake(n, t.prompt, t.duration);
})();
