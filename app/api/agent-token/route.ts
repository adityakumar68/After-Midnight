import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const r = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": key }, cache: "no-store" }
  );
  if (!r.ok) {
    return NextResponse.json({ error: `ElevenLabs ${r.status}` }, { status: 502 });
  }
  const data = (await r.json()) as { signed_url: string };
  return NextResponse.json({ signedUrl: data.signed_url });
}
