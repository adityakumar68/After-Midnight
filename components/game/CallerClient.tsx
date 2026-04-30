"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCallerGame } from "@/lib/game/callerMachine";
import { useLibrary, type LibrarySong } from "@/lib/library/songLibrary";
import { canonicalizeVibe, expandPrompt } from "@/lib/library/vibes";
import { startDjSession, type AgentSession } from "@/lib/elevenlabs/agent";
import { Sfx } from "@/lib/audio/sfx";
import { unlockAudio } from "@/lib/audio/unlock";
import { audioBus } from "@/lib/audio/audioBus";
import { DJS, type Dj } from "@/lib/game/djs";
import CallerDesign from "@/components/game/CallerDesign";
import CallerMobile from "@/components/game/CallerMobile";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
  const [chosenDj, setChosenDj] = useState<Dj | null>(null);
  const [recording, setRecording] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<LibrarySong | null>(null);
  const [lastAgentLine, setLastAgentLine] = useState<string | null>(null);
  const [lastUserLine, setLastUserLine] = useState<string | null>(null);
  const [djReason, setDjReason] = useState<string | null>(null);
  const sessionRef = useRef<AgentSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const orchestrationStartedRef = useRef(false);

  // Subscribe to stable Zustand slices, concat in render
  const baked = lib((s) => s.baked);
  const generated = lib((s) => s.generated);
  const latestGeneratedId = lib((s) => s.latestGeneratedId);
  const library = useMemo(() => [...baked, ...generated], [baked, generated]);

  useEffect(() => { lib.getState().hydrate(); }, [lib]);

  // Auto-pick a random DJ once the mic is granted
  const autoPickedRef = useRef(false);
  useEffect(() => {
    if (!micGranted) return;
    if (chosenDj) return;
    if (autoPickedRef.current) return;
    autoPickedRef.current = true;
    const random = DJS[Math.floor(Math.random() * DJS.length)];
    void startCallFlow(random);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micGranted]);

  async function grantMic() {
    // Run the audio unlock primer FIRST while we still have an active gesture.
    // This warms the global AudioContext + HTMLAudioElement so later async
    // .play() calls (delayed by dial/ring/agent-connect) actually emit sound
    // on iOS Safari and Android Chrome.
    await unlockAudio();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
    } catch { alert("Mic permission is required to call in."); }
  }

  // Use store.getState() inside async handlers so we don't depend on React-returned
  // refs (which churn every render and would invalidate useCallback identity).
  const handlePlaySong = useCallback(async (vibe: string, reason: string) => {
    const cmGame = useCallerGame.getState();
    const cmLib = useLibrary.getState();
    cmGame.djAskedForSong(vibe);
    setDjReason(reason || null);
    const cn = canonicalizeVibe(vibe);
    let song: LibrarySong | null = cmLib.find(vibe);

    if (!song) {
      const prompt = expandPrompt(vibe);
      console.log("[caller] generating song:", { vibe, prompt });
      const r = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, lengthMs: 60000 }),
      });
      if (!r.ok) {
        console.error("[caller] generate-song failed", r.status);
        song = cmLib.all().find((s) => s.origin === "baked") ?? null;
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
          durationSec: 60,
        };
        cmLib.addGenerated(newSong);
        song = newSong;
      }
    }

    if (!song) return;
    // Hang up the DJ immediately so the agent doesn't talk over the song
    if (sessionRef.current) {
      sessionRef.current.end().catch(() => {});
      sessionRef.current = null;
    }
    setNowPlaying(song);
    setFlashId(song.id);
    useCallerGame.getState().songReady(song.id);
    // Route playback through the global audio bus — guarantees navigation stops it.
    audioBus.play(song.id, song.src, {
      volume: 0.85,
      onended: () => {
        useCallerGame.getState().songEnded();
        setTimeout(() => useCallerGame.getState().hangUp({
          vibe, songId: song!.id, songTitle: song!.title, origin: song!.origin,
        }), 4000);
      },
    });
  }, []);

  // Event-driven orchestration (NOT useEffect): triggered when user picks a DJ.
  // Avoids React strict-mode double-invoke and state-dep cancellation traps.
  // Ring keeps playing until the agent actually picks up — no fixed ringing
  // timer, so a slow connection rings longer and a fast one rings less. We
  // floor at 1.5s so the ring is always audible for atmosphere.
  const startCallFlow = useCallback(async (dj: Dj) => {
    if (orchestrationStartedRef.current) return;
    orchestrationStartedRef.current = true;
    setChosenDj(dj);
    console.log("[caller] starting call with", dj.name);
    Sfx.ring();
    await wait(2200);
    useCallerGame.getState().dialingDone();
    console.log("[caller] dialing → ringing (waiting for host to pick up)");

    // Kick off the agent connection NOW. The phone keeps ringing until this
    // resolves. Floor at 1.5s so a cached/instant connection still feels like
    // a real ring.
    const minRing = wait(1500);
    let session: Awaited<ReturnType<typeof startDjSession>>;
    try {
      session = await startDjSession({
        dj,
        events: {
          onConnect: () => console.log("[caller] agent connected"),
          onError: (e) => console.error("[dj]", e),
          onAgentResponse: (text) => setLastAgentLine(text),
          onUserTranscript: (text) => setLastUserLine(text),
        },
        onPlaySong: handlePlaySong,
      });
    } catch (e) {
      console.error("[caller] DJ session failed", e);
      Sfx.stopAll();
      useCallerGame.getState().ringingDone();
      useCallerGame.getState().djSpoke();
      return;
    }

    // Hold the ring through the minimum-ring floor, then "pick up".
    await minRing;
    sessionRef.current = session;
    Sfx.stopAll();
    Sfx.onair();
    useCallerGame.getState().ringingDone();
    console.log("[caller] picked up → on air");

    // Start muted: the DJ should not hear ambient noise. Unmute only while PTT held.
    sessionRef.current.setMicMuted(true);
    useCallerGame.getState().djSpoke();
    console.log("[caller] DJ session started → conversation (mic muted by default)");
  }, [handlePlaySong]);

  useEffect(() => {
    if (game.callerState !== "hung_up") return;
    sessionRef.current?.end().catch(() => {});
    sessionRef.current = null;
    audioBus.stopAll();
    setTimeout(() => router.push("/caller-credits"), 1200);
  }, [game.callerState, router]);

  // Belt-and-braces: when this component unmounts, stop everything.
  useEffect(() => {
    return () => {
      sessionRef.current?.end().catch(() => {});
      sessionRef.current = null;
      audioBus.stopAll();
    };
  }, []);

  const onPtDown = useCallback(() => {
    setRecording(true);
    sessionRef.current?.setMicMuted(false); // open the line — DJ hears you
  }, []);
  const onPtUp = useCallback(() => {
    setRecording(false);
    sessionRef.current?.setMicMuted(true); // close the line — DJ stops hearing
  }, []);

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
              The host will pick up. They&apos;ll hear what&apos;s keeping you up.
            </p>
            <button onClick={grantMic} className="btn-walnut" style={{ marginTop: 22 }}>
              Allow Mic
            </button>
          </div>
        </div>
      )}

      {/* DJ is selected randomly — no picker UI. */}

      <div className="booth-desktop">
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
          djName={chosenDj?.name ?? "DJ"}
          djTagline={chosenDj?.tagline}
          latestGeneratedId={latestGeneratedId}
          lastAgentLine={lastAgentLine}
          lastUserLine={lastUserLine}
          djReason={djReason}
        />
      </div>
      <div className="booth-mobile">
        <CallerMobile
          callerState={game.callerState}
          ptDown={recording}
          onPtDown={onPtDown}
          onPtUp={onPtUp}
          onHangUp={onHangUp}
          pendingVibe={game.pendingVibe}
          nowPlaying={nowPlaying}
          library={library}
          flashSongId={flashId}
          djName={chosenDj?.name ?? "DJ"}
          djTagline={chosenDj?.tagline}
          latestGeneratedId={latestGeneratedId}
          lastAgentLine={lastAgentLine}
          lastUserLine={lastUserLine}
          djReason={djReason}
        />
      </div>
    </>
  );
}

function DjPicker({ djs, onPick }: { djs: Dj[]; onPick: (d: Dj) => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
      <div style={{
        maxWidth: 920, width: "100%",
        padding: "36px 32px",
        border: "1px solid rgba(255,179,71,0.4)",
        background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,179,71,0.15)",
        borderRadius: 10,
      }}>
        <div className="font-mono tracked" style={{
          fontSize: 11, color: "var(--cream-60)", letterSpacing: "0.36em",
          textAlign: "center", marginBottom: 6,
        }}>
          PICK A HOST
        </div>
        <h2 className="font-serif" style={{
          fontSize: 32, color: "var(--cream)",
          textAlign: "center", margin: 0, marginBottom: 28,
        }}>
          Who picks up tonight?
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {djs.map((dj) => (
            <button key={dj.id} onClick={() => onPick(dj)} style={{
              cursor: "pointer",
              background: "linear-gradient(180deg, #3a2515 0%, #2a1a0f 100%)",
              color: "var(--cream)",
              border: "1px solid rgba(255,179,71,0.25)",
              borderRadius: 6,
              padding: "20px 18px",
              textAlign: "left",
              transition: "all 200ms ease",
              boxShadow: "inset 0 1px 0 rgba(255,179,71,0.10), 0 6px 14px rgba(0,0,0,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--amber)";
              e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,179,71,0.2), 0 0 22px rgba(255,179,71,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,179,71,0.25)";
              e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,179,71,0.10), 0 6px 14px rgba(0,0,0,0.4)";
            }}>
              <div className="font-serif" style={{
                fontSize: 32, color: "var(--cream)", marginBottom: 8,
              }}>{dj.name}</div>
              <div className="font-mono" style={{
                fontSize: 11, color: "var(--amber)",
                letterSpacing: "0.18em", textTransform: "uppercase",
                marginBottom: 12,
              }}>
                {dj.id === "kai" ? "WARM HOST" : dj.id === "luna" ? "SULTRY HOST" : "COUNTRY HOST"}
              </div>
              <div style={{
                fontSize: 13, color: "var(--cream-60)",
                fontStyle: "italic", lineHeight: 1.4,
              }}>
                {dj.tagline}
              </div>
            </button>
          ))}
        </div>
        <div className="font-mono tracked" style={{
          fontSize: 10, color: "var(--cream-30)", letterSpacing: "0.32em",
          textAlign: "center", marginTop: 24,
        }}>
          THEY&apos;LL PICK UP IN A FEW SECONDS
        </div>
      </div>
    </div>
  );
}
