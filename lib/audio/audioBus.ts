"use client";

/**
 * Single global audio bus. The whole app shares ONE active audio element so:
 *   - Navigating away stops the song (route changes call stopAll())
 *   - Picking a new song interrupts the previous one (no overlap)
 *   - The library page's per-card play button can sync state with the booth
 *
 * Each component subscribes to `playingId` to render play/pause UI correctly.
 */

type Listener = () => void;

class AudioBus {
  private el: HTMLAudioElement | null = null;
  private currentId: string | null = null;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  get playingId(): string | null {
    return this.currentId;
  }

  /** Play a song. Stops any currently playing track first. Returns the audio element. */
  play(id: string, src: string, opts: { volume?: number; onended?: () => void } = {}): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    this.stopAll();
    const a = new Audio(src);
    a.volume = opts.volume ?? 0.85;
    a.onended = () => {
      if (this.currentId === id) {
        this.currentId = null;
        this.el = null;
        this.emit();
      }
      opts.onended?.();
    };
    a.onerror = () => {
      if (this.currentId === id) {
        this.currentId = null;
        this.el = null;
        this.emit();
      }
    };
    this.el = a;
    this.currentId = id;
    void a.play().catch(() => {
      this.currentId = null;
      this.el = null;
      this.emit();
    });
    this.emit();
    return a;
  }

  /** Toggle play/pause for a given song id. If a different song is playing, switches to this one. */
  toggle(id: string, src: string, opts: { volume?: number; onended?: () => void } = {}): void {
    if (this.currentId === id && this.el && !this.el.paused) {
      this.el.pause();
      this.currentId = null;
      this.el = null;
      this.emit();
      return;
    }
    this.play(id, src, opts);
  }

  /** Stop everything. Called on navigation, hangup, mode-end. */
  stopAll(): void {
    if (this.el) {
      try {
        this.el.pause();
        this.el.onended = null;
        this.el.onerror = null;
        this.el.src = "";
      } catch { /* ignore */ }
      this.el = null;
    }
    if (this.currentId !== null) {
      this.currentId = null;
      this.emit();
    }
  }
}

export const audioBus = new AudioBus();

/** React hook to subscribe to the bus. Returns the currently-playing song id. */
import { useSyncExternalStore } from "react";
export function usePlayingId(): string | null {
  return useSyncExternalStore(
    (cb) => audioBus.subscribe(cb),
    () => audioBus.playingId,
    () => null,
  );
}
