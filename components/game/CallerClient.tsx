"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCallerGame } from "@/lib/game/callerMachine";
import { useLibrary, type LibrarySong } from "@/lib/library/songLibrary";
import { canonicalizeVibe, expandPrompt } from "@/lib/library/vibes";
import { startDjSession, type AgentSession } from "@/lib/elevenlabs/agent";
import { Sfx } from "@/lib/audio/sfx";
import CallerDesign from "@/components/game/CallerDesign";

const TITLES = [
  "Three AM Window", "Tucson Quiet", "If You're Up", "Tape Hiss Lullaby",
  "Headlights, Highway", "Empty Side", "Closet Stars", "Rain on Glass",
  "Long Way Home", "Coffee Cold",
];
function pickTitle() { return TITLES[Math.floor(Math.random() * TITLES.length)]; }

export default function CallerClient() {
  const router = useRouter();
  const game = useCallerGame();
  const lib = useLibrary;

  const [micGranted, setMicGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<LibrarySong | null>(null);
  const sessionRef = useRef<AgentSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to the two stable underlying arrays — concat them in render via useMemo
  // (avoids the infinite-loop trap of selecting a function-derived new array on each render)
  const baked = lib((s) => s.baked);
  const generated = lib((s) => s.generated);
  const library = useMemo(() => [...baked, ...generated], [baked, generated]);

  useEffect(() => { lib.getState().hydrate(); }, [lib]);

  async function grantMic() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
    } catch { alert("Mic permission is required to call in."); }
  }

  const handlePlaySong = useCallback(async (vibe: string, _reason: string) => {
    game.djAskedForSong(vibe);
    const cn = canonicalizeVibe(vibe);
    let song: LibrarySong | null = lib.getState().find(vibe);

    if (!song) {
      const prompt = expandPrompt(vibe);
      const r = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) {
        console.error("[caller] generate-song failed", r.status);
        const all = lib.getState().all();
        song = all.find((s) => s.origin === "baked") ?? null;
      } else {
        const blob = await r.blob();
        const src = URL.createObjectURL(blob);
        const newSong: LibrarySong = {
          id: `gen-${Date.now()}`,
          title: pickTitle(),
          vibe: cn,
          freeformLabel: vibe,
          src,
          origin: "generated",
          durationSec: 15,
        };
        lib.getState().addGenerated(newSong);
        song = newSong;
      }
    }

    if (!song) return;
    setNowPlaying(song);
    setFlashId(song.id);
    game.songReady(song.id);
    const a = new Audio(song.src);
    audioRef.current = a;
    a.volume = 0.85;
    void a.play().catch(() => {});
    a.onended = () => {
      game.songEnded();
      setTimeout(() => game.hangUp({
        vibe, songId: song!.id, songTitle: song!.title, origin: song!.origin,
      }), 6000);
    };
  }, [game, lib]);

  useEffect(() => {
    if (!micGranted) return;
    if (game.callerState !== "dialing") return;
    let cancelled = false;
    (async () => {
      Sfx.ring();
      await new Promise((r) => setTimeout(r, 2200));
      if (cancelled) return;
      game.dialingDone();
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;
      Sfx.stopAll(); Sfx.onair();
      game.ringingDone();
      try {
        sessionRef.current = await startDjSession({
          events: { onError: (e) => console.error("[kai]", e) },
          onPlaySong: handlePlaySong,
        });
        game.djSpoke();
      } catch (e) {
        console.error("DJ session failed", e);
        game.djSpoke();
      }
    })();
    return () => { cancelled = true; };
  }, [micGranted, game.callerState, handlePlaySong]);

  useEffect(() => {
    if (game.callerState !== "hung_up") return;
    sessionRef.current?.end().catch(() => {});
    sessionRef.current = null;
    audioRef.current?.pause();
    setTimeout(() => router.push("/caller-credits"), 1200);
  }, [game.callerState, router]);

  const onPtDown = useCallback(() => setRecording(true), []);
  const onPtUp = useCallback(() => setRecording(false), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && game.callerState === "conversation") {
        e.preventDefault(); onPtDown();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && game.callerState === "conversation") {
        e.preventDefault(); onPtUp();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [game.callerState, onPtDown, onPtUp]);

  const onHangUp = useCallback(() => {
    if (!nowPlaying) {
      game.hangUp();
    } else {
      game.hangUp({
        vibe: nowPlaying.freeformLabel,
        songId: nowPlaying.id,
        songTitle: nowPlaying.title,
        origin: nowPlaying.origin,
      });
    }
  }, [game, nowPlaying]);

  return (
    <>
      {!micGranted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          <div style={{
            maxWidth: 460, padding: "32px 28px",
            border: "1px solid rgba(255,179,71,0.4)",
            background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,179,71,0.15)",
            borderRadius: 8, textAlign: "center",
          }}>
            <h2 className="font-serif" style={{ fontSize: 28, color: "var(--cream)", margin: 0 }}>
              Allow mic to call in
            </h2>
            <p style={{ marginTop: 10, color: "var(--cream-60)", fontStyle: "italic" }}>
              Kai will pick up. He&apos;ll hear what&apos;s keeping you up.
            </p>
            <button onClick={grantMic} className="btn-walnut" style={{ marginTop: 22 }}>
              Allow Mic
            </button>
          </div>
        </div>
      )}

      <CallerDesign
        callerState={game.callerState}
        ptDown={recording}
        onPtDown={onPtDown}
        onPtUp={onPtUp}
        onHangUp={onHangUp}
        pendingVibe={game.pendingVibe}
        nowPlaying={nowPlaying}
        library={library}
        flashSongId={flashId}
      />
    </>
  );
}
