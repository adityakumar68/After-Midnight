// Sharing helpers for the credits pages. The goal is "more intuitive" — try the
// native share sheet with the actual audio file attached when the platform allows
// it, otherwise fall back to a tweet intent so we always share *something*.
//
// File-attached navigator.share works on Chrome Android, iOS Safari 15+, Edge,
// and recent Chromium desktop builds. Where it doesn't, we still degrade to the
// tweet intent we've always had.

const SHARE_URL_FALLBACK =
  typeof window !== "undefined" ? window.location.origin : "https://after-midnight-nine.vercel.app";

export type ShareResult = "shared-with-file" | "shared-text" | "tweeted" | "cancelled" | "failed";

export async function sharePayload(args: {
  text: string;
  url?: string;
  /** Optional audio src to attach as a File. Blob: URLs and same-origin paths both work. */
  audioSrc?: string;
  filename?: string;
}): Promise<ShareResult> {
  const url = args.url ?? SHARE_URL_FALLBACK;
  const filename = args.filename ?? "after-midnight.mp3";

  if (args.audioSrc) {
    try {
      const file = await fetchAsFile(args.audioSrc, filename);
      // canShare with files isn't on every browser; guard before calling.
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      const data: ShareData = { title: "After Midnight", text: args.text, url, files: [file] };
      if (nav.canShare?.(data) && nav.share) {
        await nav.share(data);
        return "shared-with-file";
      }
    } catch (e) {
      // AbortError = user dismissed the sheet; treat as cancelled, don't fall through to tweet.
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // Otherwise fall through to text share / tweet.
    }
  }

  // Native share without a file (mobile-friendly fallback).
  const nav2 = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (nav2.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await nav2.share({ title: "After Midnight", text: args.text, url });
      return "shared-text";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
    }
  }

  // Last resort: tweet intent in a new tab.
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(args.text)}&url=${encodeURIComponent(url)}`;
  window.open(tweet, "_blank", "noopener,noreferrer");
  return "tweeted";
}

export async function downloadAudio(src: string, filename: string): Promise<void> {
  const file = await fetchAsFile(src, filename);
  const objUrl = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 1500);
}

async function fetchAsFile(src: string, filename: string): Promise<File> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch ${src} → ${res.status}`);
  const blob = await res.blob();
  const type = blob.type || guessMimeFromName(filename);
  return new File([blob], filename, { type });
}

function guessMimeFromName(name: string): string {
  if (name.endsWith(".mp3")) return "audio/mpeg";
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".webm")) return "audio/webm";
  if (name.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}

/** Sanitize a song title into a download-friendly filename. */
export function safeFilename(title: string, ext = "mp3"): string {
  const cleaned = title.toLowerCase().replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-");
  return `${cleaned || "after-midnight"}.${ext}`;
}
