import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_DJ_VOICE_ID;
  if (!key || !voiceId) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const audio = await req.arrayBuffer();
  if (audio.byteLength < 2000) {
    return NextResponse.json({ error: `Audio too short (${audio.byteLength} bytes)` }, { status: 400 });
  }
  const form = new FormData();
  form.append("audio", new Blob([audio], { type: "audio/webm" }), "in.webm");
  form.append("model_id", "eleven_multilingual_sts_v2");

  const r = await fetch(
    `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    { method: "POST", headers: { "xi-api-key": key }, body: form }
  );
  if (!r.ok || !r.body) {
    const errBody = await r.text().catch(() => "");
    console.error(`[voice-change] ElevenLabs ${r.status}:`, errBody.slice(0, 400));
    return NextResponse.json({ error: `ElevenLabs ${r.status}: ${errBody.slice(0, 200)}` }, { status: 502 });
  }
  return new Response(r.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
