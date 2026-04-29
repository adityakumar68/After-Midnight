"use client";

const MIN_BYTES = 4_000; // ~150ms of opus audio; below this S2S returns 400

export async function transformToDjVoice(input: Blob): Promise<Blob | null> {
  if (input.size < MIN_BYTES) {
    console.warn(`[voiceChanger] skipping — audio too short (${input.size} bytes)`);
    return null;
  }
  const buf = await input.arrayBuffer();
  const r = await fetch("/api/voice-change", {
    method: "POST",
    headers: { "Content-Type": "audio/webm" },
    body: buf,
  });
  if (!r.ok) {
    let body = "";
    try { body = await r.text(); } catch { /* ignore */ }
    throw new Error(`Voice changer ${r.status}: ${body.slice(0, 300)}`);
  }
  return await r.blob();
}

export function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.onended = () => { URL.revokeObjectURL(url); resolve(); };
    a.onerror = () => { URL.revokeObjectURL(url); reject(new Error("audio error")); };
    void a.play();
  });
}
