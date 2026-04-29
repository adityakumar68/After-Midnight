"use client";

export interface Recorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  getStream: () => MediaStream | null;
}

export async function createRecorder(mimeType = "audio/webm;codecs=opus"): Promise<Recorder> {
  let stream: MediaStream | null = null;
  let rec: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    getStream: () => stream,
    start: async () => {
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      rec = new MediaRecorder(stream, { mimeType });
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      // 50ms timeslice so even very short PTT presses capture at least one chunk
      rec.start(50);
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        if (!rec) return resolve(new Blob());
        rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        // Force a final dataavailable event before stopping so trailing audio is captured
        try { rec.requestData(); } catch { /* ignore */ }
        rec.stop();
      }),
  };
}
