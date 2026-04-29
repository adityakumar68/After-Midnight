"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCallerGame } from "@/lib/game/callerMachine";
import { useLibrary } from "@/lib/library/songLibrary";
import { Booth, Typewriter } from "@/components/ui/atmosphere";
import { sharePayload, downloadAudio, safeFilename } from "@/lib/share/share";

export default function CallerCredits() {
  const game = useCallerGame();
  const last = game.history.at(-1);

  const allSongs = useLibrary((s) => [...s.baked, ...s.generated]);
  const lastSong = useMemo(
    () => (last ? allSongs.find((s) => s.id === last.songId) ?? null : null),
    [allSongs, last]
  );

  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);

  const tweetText = last
    ? `Kai wrote me a song at 3 AM. "${last.songTitle}" — ${last.vibe}. Built with @zeddotdev + @elevenlabsio for #ElevenHacks 🎙️📻`
    : "I called into After Midnight at 3 AM. Built with @zeddotdev + @elevenlabsio for #ElevenHacks 🎙️📻";

  const onShare = async () => {
    if (busy) return;
    setBusy("share");
    setShareMsg(null);
    const result = await sharePayload({
      text: tweetText,
      audioSrc: lastSong?.src && lastSong.origin === "generated" ? lastSong.src : undefined,
      filename: last ? safeFilename(last.songTitle) : "after-midnight.mp3",
    });
    setBusy(null);
    if (result === "shared-with-file") setShareMsg("Shared — your song's attached.");
    else if (result === "shared-text") setShareMsg("Shared.");
    else if (result === "tweeted") setShareMsg("Opened X — paste your song link there.");
    else if (result === "cancelled") setShareMsg(null);
    else setShareMsg("Couldn't share. Try Download instead.");
  };

  const onDownload = async () => {
    if (busy || !lastSong?.src) return;
    setBusy("download");
    setShareMsg(null);
    try {
      await downloadAudio(lastSong.src, safeFilename(last!.songTitle));
      setShareMsg("Saved to your downloads.");
    } catch {
      setShareMsg("Couldn't download — the song may have expired with the page.");
    } finally {
      setBusy(null);
    }
  };

  const canDownload = !!lastSong?.src && lastSong.origin === "generated";

  return (
    <Booth dim>
      <main className="relative z-10 mx-auto max-w-[600px] px-6 py-24 text-center">
        <h1 className="font-serif text-6xl text-[--cream]">
          <Typewriter text="Sleep tight." delayMs={90} startMs={300} />
        </h1>
        <p className="mt-4 italic text-[--cream-60]">
          Kai will be here tomorrow night, too.
        </p>

        {last && (
          <div className="mx-auto mt-12 max-w-[460px] rotate-[-1deg] rounded p-6 text-left"
            style={{
              background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
              color: "#2a1a0f",
              boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
              border: "1px solid #c8b58a",
              animation: "card-settle 1.2s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
            }}>
            <div className="font-plex" style={{ fontSize: 10, letterSpacing: "0.36em", opacity: 0.5, marginBottom: 14 }}>
              KAI&apos;S PICK · TONIGHT
            </div>
            <div className="font-plex" style={{ fontSize: 16, fontWeight: 600 }}>{last.songTitle}</div>
            <div className="font-plex" style={{ fontSize: 12, marginTop: 2, opacity: 0.7 }}>
              {last.origin === "generated" ? "Written for you" : "From the stacks"} · {last.vibe}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          <Link href="/caller" onClick={() => game.reset()} className="btn-walnut">
            Call Again
          </Link>
          <button
            type="button"
            onClick={onShare}
            disabled={busy !== null}
            className="btn-amber-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ShareIcon />
            {busy === "share" ? "Sharing…" : "Share This Song"}
          </button>
          {canDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={busy !== null}
              className="btn-amber-outline"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <DownloadIcon />
              {busy === "download" ? "Saving…" : "Download Song"}
            </button>
          )}
          <Link href="/" onClick={() => game.reset()} className="btn-walnut">
            Back to Home
          </Link>
        </div>

        {shareMsg && (
          <p className="mt-3 text-[12px]" style={{ color: "var(--cream-60)", letterSpacing: "0.04em" }}>
            {shareMsg}
          </p>
        )}

        <div className="mt-6">
          <Link href="/library" className="btn-amber-outline">
            Browse Library
          </Link>
        </div>

        <p className="mt-16 text-[11px] text-[--cream-30]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>
          KAI IS AI. THE SONG WAS REAL. THE FEELING WAS YOURS.
        </p>
      </main>
    </Booth>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
