"use client";

const SOURCES = {
  ring: "/audio/sfx/ring.mp3",
  static: "/audio/sfx/static.mp3",
  onair: "/audio/sfx/onair.mp3",
  roomtone: "/audio/sfx/room-tone.mp3",
} as const;
type SfxKey = keyof typeof SOURCES;

const cache = new Map<SfxKey, HTMLAudioElement>();

function get(key: SfxKey, loop = false, volume = 0.6): HTMLAudioElement {
  let a = cache.get(key);
  if (!a) {
    a = new Audio(SOURCES[key]);
    a.preload = "auto";
    a.loop = loop;
    a.volume = volume;
    cache.set(key, a);
  }
  return a;
}

export const Sfx = {
  ring:    () => { const a = get("ring", true, 0.5);      a.currentTime = 0; void a.play().catch(() => {}); return () => a.pause(); },
  onair:   () => { const a = get("onair", false, 0.30);   a.currentTime = 0; void a.play().catch(() => {}); },
  static:  () => { const a = get("static", false, 0.4);   a.currentTime = 0; void a.play().catch(() => {}); },
  roomtone:() => { const a = get("roomtone", true, 0.25); void a.play().catch(() => {}); return () => a.pause(); },
  stopAll: () => { for (const a of cache.values()) { a.pause(); a.currentTime = 0; } },
  /**
   * Eager-create + warm every SFX HTMLAudioElement during the user gesture.
   * Mobile browsers reject `.play()` on Audio elements that weren't created
   * inside a gesture handler — this primes each one with a silent play+pause
   * so later programmatic `.play()` (after our dial/ring delay) actually works.
   */
  prewarm: async () => {
    const keys = Object.keys(SOURCES) as SfxKey[];
    for (const k of keys) {
      const a = get(k);
      a.muted = true;
      try { await a.play(); a.pause(); a.currentTime = 0; }
      catch (e) { console.warn(`[sfx-prewarm] ${k} failed:`, e); }
      a.muted = false;
    }
  },
};
