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
      // No timeslice → single complete webm container emitted on stop()
      rec.start();
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        if (!rec) return resolve(new Blob());
        rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        rec.stop();
      }),
  };
}
