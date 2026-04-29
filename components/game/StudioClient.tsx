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
  const [callers] = useState<Caller[]>(() => drawThreeCallers());
  const [songs, setSongs] = useState<Song[]>(() => threeSongsForCaller(callersAt(0)));
  function callersAt(_i: number) { return drawThreeCallers()[0]; }

  const [recording, setRecording] = useState(false);
  const [djLevel, setDjLevel] = useState(0);
  const [callerLevel, setCallerLevel] = useState(0);
  const [micGranted, setMicGranted] = useState(false);
  const [clock, setClock] = useState(nowClock());

  const sessionRef = useRef<AgentSession | null>(null);
  const recRef = useRef<Recorder | null>(null);
  const meterRef = useRef<MeterTap | null>(null);

  const currentCaller = useMemo(
    () => callers[Math.min(game.roundIndex, callers.length - 1)],
    [callers, game.roundIndex]
  );

  // Keep songs in sync with current caller
  useEffect(() => {
    setSongs(threeSongsForCaller(currentCaller));
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
    if (game.callState !== "idle") return;
    if (game.isShowOver()) { router.push("/credits"); return; }
    const t = setTimeout(() => {
      Sfx.ring();
      game.startCall();
    }, 1000);
    return () => clearTimeout(t);
  }, [game.callState, game.roundIndex, micGranted]);

  const onAnswer = useCallback(async () => {
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
    transformToDjVoice(raw)
      .then((blob) => { if (blob) return playBlob(blob); })
      .catch((e) => console.error("voice change failed:", (e as Error).message));
  }, [recording]);

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
    const s = songs.find((x) => x.id === id);
    if (!s) return;
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
      sessionRef.current?.end().catch(() => {});
      sessionRef.current = null;
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

      <StudioDesign
        callState={mapState(game.callState)}
        caller={{ name: currentCaller.name, age: currentCaller.age, location: currentCaller.location }}
        callerVuLevel={callerLevel || undefined}
        djVuLevel={djLevel || (recording ? 0.05 : 0)}
        songs={designSongs}
        callIndex={Math.min(game.roundIndex + 1, 3)}
        callTotal={3}
        clock={clock}
        onAnswer={onAnswer}
        onPushToTalkStart={onPushToTalkStart}
        onPushToTalkEnd={onPushToTalkEnd}
        onPickSong={onPickSong}
      />
    </>
  );
}
