import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // up to 5 minutes (music generation can be slow)

const DEFAULT_LENGTH_MS = 60_000; // 1 minute, with vocals when prompt allows
const MIN_LENGTH_MS = 10_000;
const MAX_LENGTH_MS = 300_000;

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  let body: { prompt?: string; lengthMs?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }
  const lengthMs = Math.max(
    MIN_LENGTH_MS,
    Math.min(MAX_LENGTH_MS, Math.floor(body.lengthMs ?? DEFAULT_LENGTH_MS)),
  );

  const r = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "content-type": "application/json",
      "accept": "audio/mpeg",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: lengthMs,
      output_format: "mp3_44100_128",
    }),
  });
  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    console.error(`[generate-song] ElevenLabs ${r.status}:`, errBody.slice(0, 400));
    return NextResponse.json({ error: `ElevenLabs ${r.status}: ${errBody.slice(0, 200)}` }, { status: 502 });
  }
  return new Response(r.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
