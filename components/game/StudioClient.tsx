"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/game/machine";
import { drawThreeCallers, reactionFor, type Caller } from "@/lib/game/callers";
import { threeSongsForCaller, type Song } from "@/lib/game/songs";
import { startCallerSession, type AgentSession } from "@/lib/elevenlabs/agent";
import { transformToDjVoice, playBlob } from "@/lib/elevenlabs/voiceChanger";
import { createRecorder, type Recorder } from "@/lib/audio/recorder";
import { attachMeter, type MeterTap } from "@/lib/audio/analyser";
import { Sfx } from "@/lib/audio/sfx";
import StudioDesign, { mapState } from "@/components/game/StudioDesign";

const VIBE_LABEL: Record<string, string> = {
  "dusty-country":         "Dusty Country",
  "synthwave-heartbreak":  "Synthwave Heartbreak",
  "lullaby-piano":         "Lullaby Piano",
  "cozy-lo-fi":            "Cozy Lo-Fi",
};

function nowClock(): string {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export default function StudioClient() {
  const router = useRouter();
  const game = useGame();
  // Defer all randomized state to the client mount to avoid SSR hydration mismatch
  const [callers, setCallers] = useState<Caller[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const [recording, setRecording] = useState(false);
  const [djLevel, setDjLevel] = useState(0);
  const [callerLevel, setCallerLevel] = useState(0);
  const [micGranted, setMicGranted] = useState(false);
  const [clock, setClock] = useState("");
  // Voice Changer is the demo-day magic, but it confuses the player during live play.
  // Default OFF; flip ON when recording the 60s demo.
  const [djVoiceOn, setDjVoiceOn] = useState(false);

  const sessionRef = useRef<AgentSession | null>(null);
  const recRef = useRef<Recorder | null>(null);
  const meterRef = useRef<MeterTap | null>(null);

  // Initialize randomized state on the client only
  useEffect(() => {
    const drawn = drawThreeCallers();
    setCallers(drawn);
    setSongs(threeSongsForCaller(drawn[0]));
    setClock(nowClock());
  }, []);

  const currentCaller = useMemo<Caller | null>(
    () => callers[Math.min(game.roundIndex, callers.length - 1)] ?? null,
    [callers, game.roundIndex]
  );

  // Refresh songs whenever the caller advances
  useEffect(() => {
    if (currentCaller) setSongs(threeSongsForCaller(currentCaller));
  }, [currentCaller]);

  // Update wall clock every minute (cosmetic)
  useEffect(() => {
    const id = setInterval(() => setClock(nowClock()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function grantMic() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
    } catch {
      alert("Mic permission is required to take callers.");
    }
  }

  // Trigger the next call after a brief idle pause
  useEffect(() => {
    if (!micGranted) return;
    if (!currentCaller) return;
    if (game.callState !== "idle") return;
    if (game.isShowOver()) { router.push("/credits"); return; }
    const t = setTimeout(() => {
      Sfx.ring();
      game.startCall();
    }, 1000);
    return () => clearTimeout(t);
  }, [game.callState, game.roundIndex, micGranted, currentCaller]);

  const onAnswer = useCallback(async () => {
    if (!currentCaller) return;
    Sfx.stopAll();
    Sfx.onair();
    game.answerCall();
    setSongs(threeSongsForCaller(currentCaller));
    try {
      sessionRef.current = await startCallerSession(currentCaller, {
        onConnect: () => game.personaReady(),
        onError: (e) => console.error("agent error", e),
      });
    } catch (e) {
      console.error("agent start failed", e);
      // Fall through so the UI is still functional without a key
      game.personaReady();
    }
  }, [currentCaller, game]);

  const onPushToTalkStart = useCallback(async () => {
    if (recording) return;
    if (!recRef.current) recRef.current = await createRecorder();
    setRecording(true);
    await recRef.current.start();
    const stream = recRef.current.getStream();
    if (stream && !meterRef.current) meterRef.current = attachMeter(stream);
  }, [recording]);

  const onPushToTalkEnd = useCallback(async () => {
    if (!recording || !recRef.current) return;
    setRecording(false);
    const raw = await recRef.current.stop();
    if (!djVoiceOn) return; // toggle off → skip the playback echo entirely
    transformToDjVoice(raw)
      .then((blob) => { if (blob) return playBlob(blob); })
      .catch((e) => console.error("voice change failed:", (e as Error).message));
  }, [recording, djVoiceOn]);

  // VU meter tick
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDjLevel(meterRef.current?.level() ?? 0);
      // Caller level is animated by StudioDesign's simulator; we don't tap into the agent's audio yet
      setCallerLevel((l) => l); // placeholder; design simulator runs when undefined
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPickSong = useCallback((id: string) => {
    if (!currentCaller) return;
    const s = songs.find((x) => x.id === id);
    if (!s) return;
    // Hang up the caller IMMEDIATELY so the song doesn't overlap their voice
    sessionRef.current?.end().catch(() => {});
    sessionRef.current = null;
    game.pickSong(s.id);
    const a = new Audio(s.src);
    a.volume = 0.85;
    void a.play().catch(() => {});
    const songMs = Math.min(15000, s.durationSec * 1000);
    setTimeout(() => {
      a.pause();
      game.songEnded();
      const reaction = reactionFor(currentCaller, s.vibe);
      console.log("[caller reaction]", reaction.line);
      setTimeout(() => {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        game.endRound({
          time: `${hh}:${mm}`,
          callerId: currentCaller.id,
          callerName: currentCaller.name,
          callerAge: currentCaller.age,
          callerLocation: currentCaller.location,
          songVibe: s.vibe,
          songTitle: s.title,
        });
      }, 3500);
    }, songMs);
  }, [currentCaller, game, songs]);

  const designSongs = songs.map((s) => ({
    id: s.id,
    title: s.title,
    vibe: VIBE_LABEL[s.vibe] ?? s.vibe,
  }));

  return (
    <>
      {!micGranted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          <div
            style={{
              maxWidth: 460,
              padding: "32px 28px",
              border: "1px solid rgba(255,179,71,0.4)",
              background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,179,71,0.15)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <h2 className="font-serif" style={{ fontSize: 28, color: "var(--cream)", margin: 0 }}>
              Allow mic to take callers
            </h2>
            <p style={{ marginTop: 10, color: "var(--cream-60)", fontStyle: "italic" }}>
              You&apos;ll be on air. The callers can hear you.
            </p>
            <button onClick={grantMic} className="btn-walnut" style={{ marginTop: 22 }}>
              Allow Mic
            </button>
          </div>
        </div>
      )}

      {/* DJ Voice toggle — flip ON only when recording the demo */}
      <button
        onClick={() => setDjVoiceOn((v) => !v)}
        title="Transforms your voice into the DJ voice for the listener. Adds ~800ms playback echo for the player. Turn on for demo recordings."
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 80,
          padding: "8px 14px",
          fontSize: 11,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono), monospace",
          color: djVoiceOn ? "var(--on-air)" : "var(--cream-60)",
          background: djVoiceOn ? "rgba(229,75,60,0.10)" : "rgba(255,179,71,0.05)",
          border: "1px solid " + (djVoiceOn ? "var(--on-air)" : "rgba(255,179,71,0.25)"),
          borderRadius: 3,
          cursor: "pointer",
        }}
      >
        {djVoiceOn ? "● DJ VOICE ON" : "○ DJ VOICE OFF"}
      </button>

      <StudioDesign
        callState={mapState(game.callState)}
        caller={
          currentCaller
            ? { name: currentCaller.name, age: currentCaller.age, location: currentCaller.location }
            : { name: "—", age: 0, location: "—" }
        }
        callerVuLevel={callerLevel || undefined}
        djVuLevel={djLevel || (recording ? 0.05 : 0)}
        songs={designSongs}
        callIndex={Math.min(game.roundIndex + 1, 3)}
        callTotal={3}
        clock={clock || "—"}
        onAnswer={onAnswer}
        onPushToTalkStart={onPushToTalkStart}
        onPushToTalkEnd={onPushToTalkEnd}
        onPickSong={onPickSong}
      />
    </>
  );
}
