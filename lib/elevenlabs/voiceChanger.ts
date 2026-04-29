"use client";

export async function transformToDjVoice(input: Blob): Promise<Blob> {
  const buf = await input.arrayBuffer();
  const r = await fetch("/api/voice-change", {
    method: "POST",
    headers: { "Content-Type": "audio/webm" },
    body: buf,
  });
  if (!r.ok) throw new Error(`Voice changer ${r.status}`);
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
