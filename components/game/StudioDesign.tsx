"use client";

import { useEffect, useRef, useState } from "react";
import { Booth, OnAirLamp } from "@/components/ui/atmosphere";
import type { GameState } from "@/lib/game/machine";

/* Map our state machine into the design's expected callStates */
type DesignCallState =
  | "idle" | "incoming" | "conversation" | "song_select" | "song_playing" | "caller_reaction";

export function mapState(s: GameState): DesignCallState {
  switch (s) {
    case "call_incoming": return "incoming";
    case "persona_loading": return "conversation";
    case "idle": return "idle";
    case "conversation": return "conversation";
    case "song_select": return "song_select";
    case "song_playing": return "song_playing";
    case "caller_reaction": return "caller_reaction";
  }
}

export interface StudioDesignProps {
  callState: DesignCallState;
  caller: { name: string; age: number; location: string };
  callerVuLevel?: number;
  djVuLevel?: number;
  songs: { id: string; title: string; vibe: string }[];
  callIndex?: number;
  callTotal?: number;
  clock?: string;
  onAnswer?: () => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
  onPickSong?: (id: string) => void;
}

export default function StudioDesign({
  callState,
  caller,
  callerVuLevel,
  djVuLevel,
  songs,
  callIndex = 1,
  callTotal = 3,
  clock = "03:47 AM",
  onAnswer,
  onPushToTalkStart,
  onPushToTalkEnd,
  onPickSong,
}: StudioDesignProps) {
  // Simulated VU levels when not provided (e.g. before mic granted)
  const [simCaller, setSimCaller] = useState(0);
  const [simDj, setSimDj] = useState(0);
  const ptDownRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const ts = t / 1000;
      const isConv = callState === "conversation";
      const isReact = callState === "caller_reaction";
      const isSongPlaying = callState === "song_playing";

      let cv = 0;
      if (isConv) {
        cv = 0.35 + 0.45 * Math.abs(Math.sin(ts * 5.2)) + 0.15 * Math.abs(Math.sin(ts * 11));
        cv = Math.min(1, cv);
      } else if (isReact) {
        cv = 0.25 + 0.5 * Math.max(0, Math.sin(ts * 3));
      } else if (isSongPlaying) {
        cv = 0.1 + 0.05 * Math.abs(Math.sin(ts * 1.5));
      }
      const dv = ptDownRef.current ? 0.4 + 0.5 * Math.abs(Math.sin(ts * 7.3)) : 0;

      setSimCaller(cv);
      setSimDj(dv);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [callState]);

  const cv = callerVuLevel ?? simCaller;
  const dv = djVuLevel ?? simDj;

  /* KEYBOARD */
  const [ptDown, setPtDown] = useState(false);
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Enter" && callState === "incoming") {
        e.preventDefault();
        onAnswer?.();
      } else if (e.code === "Space" && callState === "conversation") {
        e.preventDefault();
        ptDownRef.current = true;
        setPtDown(true);
        onPushToTalkStart?.();
      } else if (callState === "song_select" && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3")) {
        const idx = Number(e.code.replace("Digit", "")) - 1;
        if (songs[idx]) onPickSong?.(songs[idx].id);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && callState === "conversation") {
        e.preventDefault();
        ptDownRef.current = false;
        setPtDown(false);
        onPushToTalkEnd?.();
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [callState, songs, onAnswer, onPushToTalkStart, onPushToTalkEnd, onPickSong]);

  const handlePtDown = () => {
    ptDownRef.current = true;
    setPtDown(true);
    onPushToTalkStart?.();
  };
  const handlePtUp = () => {
    ptDownRef.current = false;
    setPtDown(false);
    onPushToTalkEnd?.();
  };

  const showTurntable = callState === "song_playing";
  const songsActive = callState === "song_select";
  const songsDimmed = !songsActive && !showTurntable;
  const pickedSong = songs[0]; // visual fallback for turntable

  // Fit 1280x800 canvas to viewport
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const sx = window.innerWidth / 1280;
      const sy = window.innerHeight / 800;
      setScale(Math.min(sx, sy, 1));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <Booth>
      <div className="fit-stage">
        <div className="fit-canvas" style={{ transform: `scale(${scale})` }}>
          <div style={{
            width: 1280,
            height: 800,
            padding: "28px 56px 36px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            position: "relative",
          }}>
            <DeckStrip
              callState={callState}
              caller={caller}
              callIndex={callIndex}
              callTotal={callTotal}
              clock={clock}
            />
            <Console
              callState={callState}
              cv={cv}
              dv={dv}
              ptDown={ptDown}
              onPtDown={handlePtDown}
              onPtUp={handlePtUp}
            />
            <RecordCrate
              songs={songs}
              dimmed={songsDimmed}
              active={songsActive}
              showTurntable={showTurntable}
              pickedSong={pickedSong}
              onPick={(id) => onPickSong?.(id)}
            />
            {callState === "incoming" && <IncomingPhone onAnswer={() => onAnswer?.()} />}
          </div>
        </div>
      </div>
    </Booth>
  );
}

/* ============== DECK STRIP ============== */
function DeckStrip({ callState, caller, callIndex, callTotal, clock }: {
  callState: DesignCallState;
  caller: { name: string; age: number; location: string };
  callIndex: number; callTotal: number; clock: string;
}) {
  const lampState =
    callState === "conversation" || callState === "song_playing" ? "solid" :
    callState === "incoming" ? "blink" :
    callState === "caller_reaction" ? "solid" :
    "dim";

  let crtLine: string;
  if (callState === "idle") crtLine = "STANDBY";
  else if (callState === "incoming") crtLine = "INCOMING CALL — PRESS ENTER TO ANSWER";
  else if (callState === "caller_reaction") crtLine = "CALL ENDED";
  else crtLine = `CALL 0${callIndex} / 0${callTotal}  •  ${caller.name.toUpperCase()}, ${caller.age}  •  ${caller.location.toUpperCase()}  •  ${clock}`;

  return (
    <div style={{
      height: 110,
      background: "linear-gradient(180deg, #2A1A0F 0%, #1c1108 100%)",
      borderRadius: 10,
      border: "1px solid rgba(255,179,71,0.10)",
      boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 8px rgba(0,0,0,0.7), 0 6px 16px rgba(0,0,0,0.5)",
      display: "grid",
      gridTemplateColumns: "200px 1fr 200px",
      alignItems: "center",
      padding: "0 28px",
      gap: 24,
      position: "relative",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <OnAirLamp state={lampState} size={26} />
        <div className="font-mono tracked" style={{
          fontSize: 14,
          color: lampState === "solid" || lampState === "blink" ? "var(--on-air)" : "rgba(229,75,60,0.35)",
          letterSpacing: "0.32em",
          textShadow: lampState === "solid" ? "0 0 10px rgba(229,75,60,0.6)" : "none",
        }}>ON AIR</div>
      </div>
      <CrtReadout text={crtLine} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
        {Array.from({ length: callTotal }, (_, i) => {
          const done = i + 1 < callIndex;
          const active = i + 1 === callIndex;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 12, height: 12,
                borderRadius: "50%",
                background: done ? "var(--amber)" : active ? "var(--amber)" : "transparent",
                border: "1.5px solid " + (done || active ? "var(--amber)" : "rgba(255,179,71,0.35)"),
                boxShadow: active ? "0 0 12px var(--amber-glow), 0 0 4px var(--amber)" : done ? "0 0 4px var(--amber-glow)" : "none",
                animation: active ? "amber-pulse-fast 1.4s ease-in-out infinite" : "none",
              }} />
              <div className="font-mono" style={{ fontSize: 10, color: "var(--cream-30)", letterSpacing: "0.2em" }}>
                0{i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrtReadout({ text }: { text: string }) {
  return (
    <div style={{
      height: 64,
      background: "#0a0905",
      borderRadius: 4,
      border: "1px solid rgba(255,179,71,0.18)",
      boxShadow: "inset 0 0 18px rgba(0,0,0,0.9), inset 0 0 30px rgba(255,179,71,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(50,180,80,0.06) 2px, rgba(50,180,80,0.06) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 5px)",
        pointerEvents: "none",
      }} />
      <div className="font-mono" style={{
        fontSize: 22,
        color: "var(--amber)",
        letterSpacing: "0.18em",
        textShadow: "0 0 8px rgba(255,179,71,0.7), 0 0 16px rgba(255,179,71,0.35)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        position: "relative",
        zIndex: 2,
      }}>{text}</div>
    </div>
  );
}

/* ============== CONSOLE ============== */
function Console({ callState, cv, dv, ptDown, onPtDown, onPtUp }: {
  callState: DesignCallState; cv: number; dv: number;
  ptDown: boolean; onPtDown: () => void; onPtUp: () => void;
}) {
  const dimmed = callState === "song_select";
  return (
    <div style={{
      flex: 1,
      minHeight: 440,
      background: "linear-gradient(180deg, #3a2515 0%, #2a1a0f 60%, #1f130a 100%)",
      borderRadius: 14,
      border: "1px solid rgba(255,179,71,0.12)",
      boxShadow:
        "inset 0 1px 0 rgba(255,179,71,0.10), inset 0 -3px 12px rgba(0,0,0,0.7), 0 18px 40px rgba(0,0,0,0.6)",
      display: "grid",
      gridTemplateColumns: "1fr 220px 1fr",
      gap: 0,
      alignItems: "stretch",
      padding: 32,
      position: "relative",
      opacity: dimmed ? 0.6 : 1,
      transition: "opacity 400ms ease",
      backgroundImage:
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.0) 0, rgba(0,0,0,0.0) 60px, rgba(0,0,0,0.15) 60px, rgba(0,0,0,0.15) 61px), linear-gradient(180deg, #3a2515 0%, #2a1a0f 60%, #1f130a 100%)",
    }}>
      <ChannelStrip side="left"  label="CALLER"     sublabel="LINE IN" level={cv} callState={callState} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <PushToTalkButton callState={callState} ptDown={ptDown} onDown={onPtDown} onUp={onPtUp} />
      </div>
      <ChannelStrip side="right" label="ON-AIR MIC" sublabel="DJ"      level={dv} callState={callState} />
    </div>
  );
}

function ChannelStrip({ side, label, sublabel, level, callState }: {
  side: "left" | "right"; label: string; sublabel: string; level: number; callState: DesignCallState;
}) {
  const isCaller = side === "left";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "0 20px", position: "relative" }}>
      <VuMeter level={level} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {isCaller
          ? <SpeakerGrille active={callState === "conversation" || callState === "caller_reaction"} />
          : <BroadcastMic active={callState === "conversation"} />}
      </div>
      <LabelPlate primary={label} secondary={sublabel} />
    </div>
  );
}

function VuMeter({ level }: { level: number }) {
  const segments = 22;
  const lit = Math.round(level * segments);
  return (
    <div style={{
      width: 56, height: 220,
      background: "#0a0805",
      borderRadius: 6,
      border: "1px solid rgba(255,179,71,0.15)",
      boxShadow: "inset 0 0 12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,179,71,0.08)",
      padding: 6,
      display: "flex",
      flexDirection: "column-reverse",
      gap: 2,
    }}>
      {Array.from({ length: segments }, (_, i) => {
        const isLit = i < lit;
        const isPeak = i >= segments - 4;
        const color = isPeak ? "#ff5a3d" : isLit ? "var(--amber)" : "rgba(255,179,71,0.10)";
        return (
          <div key={i} style={{
            flex: 1,
            background: isLit ? color : "rgba(255,179,71,0.08)",
            borderRadius: 1,
            boxShadow: isLit ? "0 0 5px " + color : "none",
            transition: "all 60ms linear",
          }} />
        );
      })}
    </div>
  );
}

function SpeakerGrille({ active }: { active: boolean }) {
  const ripples = [0, 1, 2];
  return (
    <div style={{
      width: 150, height: 150,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #4a2f1c 0%, #2a1a0f 60%, #15090a 100%)",
      border: "8px solid #1a0d05",
      boxShadow: "inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,179,71,0.06), 0 6px 16px rgba(0,0,0,0.6)",
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "82%", height: "82%",
        borderRadius: "50%",
        backgroundImage: "radial-gradient(circle, #0a0a0a 1.4px, transparent 1.6px)",
        backgroundSize: "9px 9px",
        backgroundColor: "#181004",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.9)",
      }} />
      {active && ripples.map((i) => (
        <div key={i} style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid var(--amber)",
          opacity: 0,
          animation: `ripple 2.4s ${i * 0.8}s ease-out infinite`,
          pointerEvents: "none",
        }} />
      ))}
    </div>
  );
}

function BroadcastMic({ active }: { active: boolean }) {
  return (
    <div style={{
      width: 150, height: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: "rotate(-15deg)",
      filter: active ? "drop-shadow(0 0 12px rgba(255,179,71,0.35))" : "drop-shadow(0 6px 12px rgba(0,0,0,0.6))",
      transition: "filter 300ms ease",
    }}>
      <svg viewBox="0 0 120 180" width="120" height="180" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="micBody" x1="0" x2="1">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="40%" stopColor="#1a1a1a" />
            <stop offset="60%" stopColor="#222" />
            <stop offset="100%" stopColor="#080808" />
          </linearGradient>
          <linearGradient id="chrome" x1="0" x2="1">
            <stop offset="0%" stopColor="#888" />
            <stop offset="50%" stopColor="#ddd" />
            <stop offset="100%" stopColor="#666" />
          </linearGradient>
          <radialGradient id="grilleG" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="60%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
        </defs>
        <rect x="22" y="18" width="76" height="124" rx="14" fill="url(#micBody)" stroke="#000" />
        <rect x="32" y="30" width="56" height="50" rx="4" fill="url(#grilleG)" />
        <g opacity="0.7">
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 7 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={36 + c * 7.5} cy={34 + r * 7.5} r="1.4" fill="#000" />
            ))
          )}
        </g>
        <rect x="28" y="86" width="64" height="6" rx="2" fill="url(#chrome)" />
        <rect x="34" y="100" width="52" height="16" rx="2" fill="#0d0d0d" stroke="#2a2a2a" />
        <text x="60" y="111" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#999" letterSpacing="2">SM7B</text>
        <rect x="14" y="60" width="6" height="60" rx="2" fill="#1a1a1a" stroke="#000" />
        <rect x="100" y="60" width="6" height="60" rx="2" fill="#1a1a1a" stroke="#000" />
        <circle cx="17" cy="90" r="3" fill="url(#chrome)" stroke="#000" />
        <circle cx="103" cy="90" r="3" fill="url(#chrome)" stroke="#000" />
        <rect x="56" y="138" width="8" height="40" fill="#1a1a1a" stroke="#000" />
        <rect x="48" y="170" width="24" height="8" rx="2" fill="#0a0a0a" stroke="#000" />
      </svg>
    </div>
  );
}

function LabelPlate({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
      color: "#3a2515",
      padding: "8px 22px",
      borderRadius: 2,
      border: "1px solid #c8b58a",
      boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
      textAlign: "center",
      minWidth: 130,
      transform: "rotate(-1deg)",
    }}>
      <div className="font-plex" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" }}>
        {primary}
      </div>
      {secondary && (
        <div className="font-plex" style={{ fontSize: 9, opacity: 0.55, letterSpacing: "0.32em", marginTop: 2 }}>
          {secondary}
        </div>
      )}
    </div>
  );
}

function PushToTalkButton({ callState, ptDown, onDown, onUp }: {
  callState: DesignCallState; ptDown: boolean; onDown: () => void; onUp: () => void;
}) {
  const enabled = callState === "conversation";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <button
        onMouseDown={enabled ? onDown : undefined}
        onMouseUp={enabled ? onUp : undefined}
        onMouseLeave={enabled && ptDown ? onUp : undefined}
        onTouchStart={enabled ? (e) => { e.preventDefault(); onDown(); } : undefined}
        onTouchEnd={enabled ? (e) => { e.preventDefault(); onUp(); } : undefined}
        disabled={!enabled}
        aria-label="Push to talk"
        style={{
          width: 100, height: 100,
          borderRadius: "50%",
          border: "none",
          cursor: enabled ? "pointer" : "not-allowed",
          background: ptDown
            ? "radial-gradient(circle at 50% 35%, #ffce6a 0%, #d18a2a 60%, #6a3f10 100%)"
            : "radial-gradient(circle at 50% 35%, #c98a3a 0%, #8a571c 70%, #3a230d 100%)",
          boxShadow: ptDown
            ? "inset 0 6px 12px rgba(0,0,0,0.5), 0 0 30px rgba(255,179,71,0.9), 0 0 60px rgba(229,75,60,0.45)"
            : "inset 0 -6px 10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,200,120,0.5), 0 0 14px rgba(255,179,71,0.35)",
          transform: ptDown ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
          transition: "transform 80ms ease, box-shadow 200ms ease, background 200ms ease",
          opacity: enabled ? 1 : 0.45,
          position: "relative",
        }}
      >
        <div className="font-mono" style={{
          color: "#3a1f08",
          fontSize: 11,
          letterSpacing: "0.24em",
          textShadow: "0 1px 0 rgba(255,220,170,0.5)",
          fontWeight: 700,
        }}>TALK</div>
        {ptDown && (
          <span style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "2px solid var(--on-air)",
            opacity: 0,
            animation: "ring-expand 1.2s ease-out infinite",
          }} />
        )}
      </button>
      <div className="font-mono" style={{
        fontSize: 11,
        color: enabled ? "var(--amber)" : "var(--cream-30)",
        letterSpacing: "0.32em",
        padding: "3px 10px",
        border: "1px solid " + (enabled ? "rgba(255,179,71,0.5)" : "rgba(242,234,211,0.15)"),
        borderRadius: 3,
      }}>[SPACE]</div>
    </div>
  );
}

/* ============== RECORD CRATE ============== */
function RecordCrate({ songs, dimmed, active, showTurntable, pickedSong, onPick }: {
  songs: { id: string; title: string; vibe: string }[];
  dimmed: boolean; active: boolean; showTurntable: boolean;
  pickedSong: { id: string; title: string; vibe: string } | undefined;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{
      height: 220,
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: 24,
      alignItems: "stretch",
      flexShrink: 0,
    }}>
      <div style={{
        background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
        borderRadius: 10,
        border: "1px solid rgba(255,179,71,0.10)",
        boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 8px rgba(0,0,0,0.7)",
        padding: "22px 28px",
        display: "flex",
        gap: 28,
        alignItems: "center",
        justifyContent: "center",
        opacity: dimmed ? 0.4 : 1,
        transform: active ? "scale(1.02)" : "scale(1)",
        transition: "all 400ms ease",
        position: "relative",
        filter: active ? "drop-shadow(0 0 18px rgba(255,179,71,0.25))" : "none",
      }}>
        {songs.map((s, i) => (
          <RecordSleeve
            key={s.id}
            song={s}
            angle={(i - 1) * 6}
            disabled={dimmed || showTurntable}
            onClick={() => onPick(s.id)}
            shortcut={i + 1}
          />
        ))}
        <div className="font-plex" style={{
          position: "absolute",
          left: 22, top: 12,
          fontSize: 10,
          color: "var(--cream-30)",
          letterSpacing: "0.32em",
        }}>RECORD CRATE · PICK ONE [1/2/3]</div>
      </div>
      <Turntable visible={showTurntable} song={pickedSong} />
    </div>
  );
}

function RecordSleeve({ song, angle, disabled, onClick, shortcut }: {
  song: { id: string; title: string; vibe: string };
  angle: number; disabled: boolean; onClick: () => void; shortcut: number;
}) {
  const [hover, setHover] = useState(false);
  const lift = hover && !disabled ? -20 : 0;
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: `translateY(${lift}px) rotate(${hover && !disabled ? 0 : angle}deg)`,
        transition: "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 150, height: 150,
        background: "linear-gradient(135deg, #c4a878 0%, #9d8255 50%, #7a6238 100%)",
        borderRadius: 4,
        boxShadow: hover && !disabled
          ? "0 14px 24px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.4)"
          : "0 6px 12px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.4)",
        position: "relative",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence baseFrequency='0.7'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.35'/></svg>\")",
          mixBlendMode: "multiply",
          pointerEvents: "none",
          borderRadius: 4,
        }} />
        <div style={{
          position: "absolute",
          top: -6, right: 14,
          width: 30, height: 6,
          background: "linear-gradient(90deg, #0a0a0a 0%, #2a2a2a 100%)",
          borderRadius: 2,
          boxShadow: "0 1px 0 rgba(255,255,255,0.1)",
        }} />
        <div style={{
          background: "var(--cream)",
          padding: "10px 8px",
          transform: `rotate(${(shortcut - 2) * 1.5}deg)`,
          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          position: "relative",
          marginTop: 14,
        }}>
          <div style={{
            fontFamily: "var(--font-caveat), 'Caveat', cursive",
            fontSize: 18,
            color: "#3a2515",
            textAlign: "center",
            lineHeight: 1.05,
            fontWeight: 600,
          }}>
            {song.vibe.toUpperCase()}
          </div>
        </div>
        <div className="font-mono" style={{
          alignSelf: "flex-end",
          fontSize: 12,
          color: "rgba(0,0,0,0.5)",
          background: "rgba(255,255,255,0.25)",
          padding: "1px 6px",
          borderRadius: 2,
        }}>[{shortcut}]</div>
      </div>
    </button>
  );
}

function Turntable({ visible, song }: { visible: boolean; song: { title: string } | undefined }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
      borderRadius: 10,
      border: "1px solid rgba(255,179,71,0.10)",
      boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 8px rgba(0,0,0,0.7)",
      padding: 18,
      position: "relative",
      overflow: "hidden",
      transform: visible ? "translateX(0)" : "translateX(40px)",
      opacity: visible ? 1 : 0,
      transition: "all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      <div style={{
        width: 170, height: 170,
        borderRadius: "50%",
        background: "radial-gradient(circle, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)",
        border: "2px solid #2a2a2a",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), 0 4px 10px rgba(0,0,0,0.6)",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "94%", height: "94%",
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle at center, #0a0a0a 0px, #0a0a0a 1px, #1a1a1a 1px, #1a1a1a 2px), radial-gradient(circle, #1a1a1a, #050505)",
          animation: visible ? "vinyl-spin 1.8s linear infinite" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 0 12px rgba(255,179,71,0.04)",
        }}>
          <div style={{
            width: "38%", height: "38%",
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--on-air) 0%, #8a2a1c 80%, #3a1208 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 10px rgba(0,0,0,0.6)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a0a0a" }} />
          </div>
        </div>
      </div>

      <svg width="100" height="170" style={{ position: "absolute", right: 16, top: 12 }}>
        <defs>
          <linearGradient id="armG" x1="0" x2="1">
            <stop offset="0%" stopColor="#888" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
        </defs>
        <circle cx="84" cy="22" r="14" fill="#1a1a1a" stroke="#444" />
        <circle cx="84" cy="22" r="6" fill="#444" />
        <line x1="84" y1="22" x2="20" y2={visible ? 110 : 60} stroke="url(#armG)" strokeWidth="3" style={{ transition: "y2 800ms ease" }} />
        <circle cx="20" cy={visible ? 110 : 60} r="4" fill="#222" stroke="#666" style={{ transition: "cy 800ms ease" }} />
      </svg>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginLeft: 8 }}>
        <div className="font-mono tracked" style={{
          fontSize: 10,
          color: "var(--amber)",
          letterSpacing: "0.32em",
          opacity: 0.7,
        }}>NOW PLAYING</div>
        <div className="font-plex" style={{
          fontSize: 18,
          color: "var(--cream)",
          letterSpacing: "0.04em",
          lineHeight: 1.2,
        }}>
          {song?.title || "—"}
        </div>
        <MiniWaveform />
      </div>
    </div>
  );
}

function MiniWaveform() {
  const bars = 24;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => { setPhase((t - start) / 200); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 22 }}>
      {Array.from({ length: bars }, (_, i) => {
        const v = (Math.sin(phase + i * 0.7) + 1) / 2;
        const h = 4 + v * 18;
        return (
          <div key={i} style={{
            width: 2, height: h,
            background: "var(--amber)",
            opacity: 0.6,
            boxShadow: "0 0 4px var(--amber-glow)",
            borderRadius: 1,
          }} />
        );
      })}
    </div>
  );
}

/* ============== INCOMING PHONE ============== */
function IncomingPhone({ onAnswer }: { onAnswer: () => void }) {
  return (
    <button
      onClick={onAnswer}
      aria-label="Answer call"
      style={{
        position: "absolute",
        top: 28,
        right: 56,
        width: 140,
        height: 140,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        zIndex: 50,
        animation: "phone-shake 1.8s ease-in-out infinite",
        filter: "drop-shadow(0 0 12px rgba(229,75,60,0.55))",
      }}
    >
      <svg viewBox="0 0 140 140" width="140" height="140">
        <defs>
          <radialGradient id="phoneBody" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#3a1208" />
            <stop offset="60%" stopColor="#1a0905" />
            <stop offset="100%" stopColor="#0a0302" />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="100" rx="48" ry="14" fill="url(#phoneBody)" stroke="#000" />
        <circle cx="70" cy="92" r="22" fill="#1a0905" stroke="#3a1f0d" />
        <circle cx="70" cy="92" r="6" fill="#3a2515" />
        <g transform="rotate(-12, 70, 60)">
          <rect x="20" y="50" width="100" height="22" rx="11" fill="url(#phoneBody)" stroke="#000" />
          <circle cx="32" cy="61" r="10" fill="#0a0a0a" stroke="#3a1f0d" />
          <circle cx="108" cy="61" r="10" fill="#0a0a0a" stroke="#3a1f0d" />
        </g>
        <g stroke="#E54B3C" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M 130 30 q 8 8 0 16" opacity="0.9">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" />
          </path>
          <path d="M 138 22 q 14 14 0 32" opacity="0.7">
            <animate attributeName="opacity" values="0.1;0.7;0.1" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
      <div className="font-mono" style={{
        position: "absolute",
        bottom: -22,
        left: 0, right: 0,
        textAlign: "center",
        color: "var(--on-air)",
        fontSize: 12,
        letterSpacing: "0.28em",
        textShadow: "0 0 8px rgba(229,75,60,0.6)",
        animation: "amber-pulse-fast 0.6s ease-in-out infinite",
      }}>RING — RING</div>
    </button>
  );
}
