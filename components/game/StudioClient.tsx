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

export default function StudioClient() {
  const router = useRouter();
  const game = useGame();
  const [callers] = useState<Caller[]>(() => drawThreeCallers());
  const [songs, setSongs] = useState<Song[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [djLevel, setDjLevel] = useState(0);
  const [micGranted, setMicGranted] = useState(false);

  const sessionRef = useRef<AgentSession | null>(null);
  const recRef = useRef<Recorder | null>(null);
  const meterRef = useRef<MeterTap | null>(null);

  const currentCaller = useMemo(
    () => callers[Math.min(game.roundIndex, callers.length - 1)],
    [callers, game.roundIndex]
  );

  async function grantMic() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
    } catch {
      alert("Mic permission is required to take callers.");
    }
  }

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
    setTranscript("");
    try {
      sessionRef.current = await startCallerSession(currentCaller, {
        onConnect: () => game.personaReady(),
        onAgentResponse: (text) => setTranscript((t) => `${t}\nCALLER: ${text}`),
        onUserTranscript: (text) => setTranscript((t) => `${t}\nYOU: ${text}`),
        onError: (e) => console.error(e),
      });
    } catch (e) {
      console.error("agent start failed", e);
      // Fall through so the UI is not stuck without keys
      game.personaReady();
    }
  }, [currentCaller, game]);

  const onPttDown = useCallback(async () => {
    if (game.callState !== "conversation" || recording) return;
    if (!recRef.current) recRef.current = await createRecorder();
    setRecording(true);
    await recRef.current.start();
    const stream = recRef.current.getStream();
    if (stream && !meterRef.current) meterRef.current = attachMeter(stream);
  }, [game.callState, recording]);

  const onPttUp = useCallback(async () => {
    if (!recording || !recRef.current) return;
    setRecording(false);
    const raw = await recRef.current.stop();
    transformToDjVoice(raw).then(playBlob).catch(console.error);
  }, [recording]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); void onPttDown(); } };
    const up   = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); void onPttUp(); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [onPttDown, onPttUp]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDjLevel(meterRef.current?.level() ?? 0);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPickSong = useCallback(async (s: Song) => {
    game.pickSong(s.id);
    const a = new Audio(s.src);
    a.volume = 0.85;
    void a.play().catch(() => {});
    const songMs = Math.min(15000, s.durationSec * 1000);
    setTimeout(() => {
      a.pause();
      game.songEnded();
      const reaction = reactionFor(currentCaller, s.vibe);
      setTranscript((t) => `${t}\nCALLER: ${reaction.line}`);
      sessionRef.current?.end().catch(() => {});
      sessionRef.current = null;
      setTimeout(() => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
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
  }, [currentCaller, game]);

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
      {!micGranted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="max-w-md rounded-lg border border-[--amber] bg-[--walnut-surface] p-8 text-center">
            <h2 className="font-serif text-2xl text-[--cream]">Allow mic to take callers</h2>
            <p className="mt-2 text-[--cream-60]">You&apos;ll be on air. The callers can hear you.</p>
            <button onClick={grantMic} className="mt-6 rounded-full bg-[--on-air] px-6 py-3 font-mono text-[--cream]">
              ALLOW MIC
            </button>
          </div>
        </div>
      )}

      <header className="mb-8 flex items-center justify-between font-mono text-[--cream-60]">
        <span className={`inline-flex items-center gap-2 ${game.callState === "conversation" ? "text-[--on-air]" : ""}`}>
          <span className={`h-3 w-3 rounded-full ${game.callState === "conversation" ? "bg-[--on-air] animate-pulse" : "bg-[--cream-30]"}`} />
          {game.callState === "conversation" ? "ON AIR" : "STANDBY"}
        </span>
        <span>
          CALL {String(Math.min(game.roundIndex + 1, 3)).padStart(2, "0")} / 03 — {currentCaller.name.toUpperCase()}, {currentCaller.age} — {currentCaller.location.toUpperCase()}
        </span>
      </header>

      {game.callState === "call_incoming" && (
        <div className="text-center">
          <p className="mb-6 font-mono text-lg text-[--amber] animate-pulse">☎ INCOMING CALL — {currentCaller.name.toUpperCase()}</p>
          <button onClick={onAnswer} className="rounded-full bg-[--on-air] px-8 py-4 font-mono text-[--cream]">
            ANSWER  ↵
          </button>
        </div>
      )}

      {(game.callState === "conversation" || game.callState === "persona_loading") && (
        <div className="space-y-4 text-center">
          <div
            className="mx-auto h-32 w-32 rounded-full border-2 border-[--amber] cursor-pointer"
            style={{
              transform: `scale(${1 + djLevel * 0.2})`,
              boxShadow: `0 0 ${30 + djLevel * 80}px rgba(255,179,71,${0.3 + djLevel * 0.6})`,
              background: recording ? "rgba(255,179,71,0.4)" : "var(--walnut-surface)",
              transition: "background 120ms",
            }}
            onMouseDown={onPttDown}
            onMouseUp={onPttUp}
            onMouseLeave={() => recording && onPttUp()}
            role="button" aria-label="Push to talk (hold Space)"
          />
          <p className="font-mono text-[--cream-60]">[HOLD SPACE OR THE BUTTON TO TALK]</p>
          {game.callState === "conversation" && (
            <button onClick={() => game.requestSong()} className="mx-auto block rounded border border-[--amber] px-4 py-2 font-mono text-[--cream]">
              CUE A SONG →
            </button>
          )}
          <pre className="mt-6 whitespace-pre-wrap text-left font-mono text-sm text-[--cream-60]">{transcript}</pre>
        </div>
      )}

      {game.callState === "song_select" && (
        <div className="grid grid-cols-3 gap-6">
          {songs.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onPickSong(s)}
              className="rounded-lg border border-[--amber] bg-[--walnut-surface] p-6 text-left hover:bg-black/30"
            >
              <div className="text-[10px] font-mono tracking-widest text-[--amber]">[{i + 1}] {s.vibe.replace(/-/g, " ").toUpperCase()}</div>
              <div className="mt-2 font-serif text-2xl text-[--cream]">{s.title}</div>
            </button>
          ))}
        </div>
      )}

      {(game.callState === "song_playing" || game.callState === "caller_reaction") && (
        <div className="text-center font-mono text-[--cream-60]">
          {game.callState === "song_playing" ? "♪ NOW PLAYING…" : "CALL ENDED"}
          <pre className="mt-6 whitespace-pre-wrap text-left text-sm text-[--cream-60]">{transcript}</pre>
        </div>
      )}
    </main>
  );
}
