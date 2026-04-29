// Generate the demo-video VO + ambient music bed via ElevenLabs APIs.
// Run: ELEVENLABS_API_KEY=sk_xxx npx tsx scripts/bake-demo-assets.ts

import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Set ELEVENLABS_API_KEY"); process.exit(1); }

const ERIC = "3WqHLnw80rOZqJzW9YRB"; // Same voice as DJ Kai

const VO_SCRIPT = [
  "It's three fourteen in the morning. The city's asleep. Your thoughts aren't.",
  "There used to be radio shows for this. AM frequencies that picked up when no one else would. Most of them are gone now.",
  "So we made a new one. After Midnight. A radio show that didn't exist yesterday.",
  "You can call in. An AI DJ picks up. Pick a host — Kai is warm, Luna is sultry, Hank is gravelly country. Each one a different voice, a different listener.",
  "Hold push-to-talk. Tell them what's keeping you up.",
  // -- 12s pause baked in via separate render or post-edit --
  "After two or three exchanges, the DJ picks up something true about your night. And — while you're still on the line — they write you a song.",
  "Sixty seconds. With vocals. With lyrics. Drawn from what you said. Generated live by ElevenLabs Music API.",
  "Never heard before. Never heard again. It joins the stacks. Tomorrow, someone else's song will join too. The library grows every night.",
  "Or flip the booth. Take the chair yourself. Three strangers ringing in tonight. Mira, twenty-four. Tom, forty-seven, on I-eighty. Eli, nine, his goldfish died.",
  "ElevenLabs Conversational Agents pick up the line. Voice Changer makes you sound like the warm voice the night needs. You hear them out. You find each one a song.",
  "Visit slash library and you can see every song ever written here. Categorized. Yours and everyone else's.",
  "Built in twenty-four hours. With Zed. With ElevenLabs.",
  "After Midnight. The booth's still warm.",
].join("\n\n");

const VO_PRE_GAP = VO_SCRIPT
  .split("\n\n")
  .slice(0, 5)
  .join("\n\n"); // intro through "Tell them what's keeping you up"

const VO_POST_GAP = VO_SCRIPT
  .split("\n\n")
  .slice(5)
  .join("\n\n"); // from "After two or three exchanges" → end

const MUSIC_PROMPT = "Cinematic ambient bed for a melancholy late-night radio short film. Soft Rhodes piano, distant rain, faint vinyl crackle, very gentle string pad swelling and falling, no drums, no vocals. Late night, 3 AM, hopeful melancholy. Slow tempo. 110 seconds.";

async function tts(text: string, outName: string) {
  console.log(`TTS → ${outName} (${text.length} chars)…`);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ERIC}?output_format=mp3_44100_192`, {
    method: "POST",
    headers: { "xi-api-key": KEY!, "content-type": "application/json", "accept": "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.30, use_speaker_boost: true },
    }),
  });
  if (!r.ok) { console.error("FAIL:", r.status, await r.text()); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  const out = resolve(process.cwd(), `media/video/${outName}`);
  await writeFile(out, buf);
  console.log(`✔ ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function music(prompt: string, ms: number, outName: string) {
  console.log(`MUSIC → ${outName} (${ms}ms)…`);
  const r = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: { "xi-api-key": KEY!, "content-type": "application/json", "accept": "audio/mpeg" },
    body: JSON.stringify({ prompt, music_length_ms: ms, output_format: "mp3_44100_192" }),
  });
  if (!r.ok) { console.error("FAIL:", r.status, await r.text()); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  const out = resolve(process.cwd(), `media/video/${outName}`);
  await writeFile(out, buf);
  console.log(`✔ ${out} (${(buf.length / 1024).toFixed(1)} KB)`);
}

(async () => {
  await mkdir("media/video", { recursive: true });
  await Promise.all([
    tts(VO_SCRIPT, "vo-full.mp3"),
    tts(VO_PRE_GAP, "vo-part1.mp3"),
    tts(VO_POST_GAP, "vo-part2.mp3"),
    music(MUSIC_PROMPT, 110_000, "music-bed.mp3"),
  ]);
  console.log("done.");
})();
