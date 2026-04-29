"use client";

/**
 * Mobile browsers (iOS Safari, Android Chrome) require a user gesture before
 * any audio can play. Async/delayed audio (timeouts, fetch responses, blob URLs)
 * loses the gesture's "audio activation token" by the time it tries to play —
 * so our song playback fires `.play()` and silently rejects with NotAllowedError.
 *
 * This primer must be called INSIDE a click/touch handler. It:
 *   1. Creates / resumes a global AudioContext (used by Web Audio playback).
 *   2. Plays a tiny silent buffer through it so iOS marks it "started".
 *   3. Plays + pauses an `HTMLAudioElement` so subsequent `new Audio()` calls
 *      inherit the same activation.
 *
 * Idempotent: only runs once per session.
 */
let unlocked = false;

// 1-byte silent MP3 (a valid frame; ~50ms of silence)
const SILENT_MP3 =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMQAAAAAAAAAAAAAA" +
  "//uQAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAACWQAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAA";

export async function unlockAudio(): Promise<void> {
  if (unlocked) return;
  unlocked = true;

  // 1. AudioContext primer (used by ElevenLabs SDK + Web Audio playback)
  try {
    const Ctx: typeof AudioContext | undefined =
      typeof window !== "undefined"
        ? (window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (Ctx) {
      const ctx = new Ctx();
      if (ctx.state === "suspended") await ctx.resume();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch (e) {
    console.warn("[audio-unlock] AudioContext primer failed:", e);
  }

  // 2. HTMLAudioElement primer (so future `new Audio(blobUrl).play()` works async)
  try {
    const a = new Audio(SILENT_MP3);
    a.preload = "auto";
    a.muted = true;
    await a.play().catch(() => {});
    a.pause();
  } catch (e) {
    console.warn("[audio-unlock] HTMLAudioElement primer failed:", e);
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
