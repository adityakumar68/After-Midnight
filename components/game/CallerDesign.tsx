"use client";

import { useEffect, useState } from "react";
import { Booth, OnAirLamp } from "@/components/ui/atmosphere";
import type { CallerState } from "@/lib/game/callerMachine";
import type { LibrarySong } from "@/lib/library/songLibrary";

export interface CallerDesignProps {
  callerState: CallerState;
  djLevel?: number;
  ptDown: boolean;
  onPtDown: () => void;
  onPtUp: () => void;
  onHangUp: () => void;
  pendingVibe: string | null;
  nowPlaying: LibrarySong | null;
  library: LibrarySong[];
  flashSongId: string | null;
  djName?: string;
  djTagline?: string;
  latestGeneratedId?: string | null;
  lastAgentLine?: string | null;
  lastUserLine?: string | null;
  djReason?: string | null;
}

export default function CallerDesign({
  callerState, djLevel, ptDown,
  onPtDown, onPtUp, onHangUp,
  pendingVibe, nowPlaying, library, flashSongId,
  djName = "DJ",
  djTagline = "Late-night host",
  latestGeneratedId = null,
  lastAgentLine = null,
  lastUserLine = null,
  djReason = null,
}: CallerDesignProps) {
  const [simDj, setSimDj] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const ts = t / 1000;
      const lvl = callerState === "conversation" || callerState === "outro"
        ? 0.3 + 0.5 * Math.abs(Math.sin(ts * 4.6))
        : 0;
      setSimDj(lvl);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [callerState]);
  const dl = djLevel ?? simDj;

  const lampState =
    callerState === "conversation" || callerState === "song_playing" ? "solid" :
    callerState === "ringing" ? "blink" :
    callerState === "outro" ? "solid" :
    "dim";

  const crtLine =
    callerState === "dialing"      ? "DIALING…" :
    callerState === "ringing"      ? "RINGING — WMID 88.7" :
    callerState === "connected"    ? "CONNECTED — ON THE LINE" :
    callerState === "song_loading" ? `KAI IS DIGGING — “${pendingVibe ?? "…"}”` :
    callerState === "song_playing" ? `NOW PLAYING — ${(nowPlaying?.title ?? "—").toUpperCase()}` :
    callerState === "outro"        ? "KAI IS WRAPPING UP" :
    callerState === "hung_up"      ? "CALL ENDED" :
    "CONNECTED";

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const HEADER = 44;
      const PAD = 16;
      const sx = window.innerWidth / 1280;
      const sy = (window.innerHeight - HEADER - PAD) / 800;
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
            width: 1280, height: 800,
            padding: "28px 56px 36px",
            display: "flex", flexDirection: "column", gap: 20,
            position: "relative",
          }}>
            <div style={{
              height: 110,
              background: "linear-gradient(180deg, #2A1A0F 0%, #1c1108 100%)",
              borderRadius: 10,
              border: "1px solid rgba(255,179,71,0.10)",
              boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 8px rgba(0,0,0,0.7)",
              display: "grid",
              gridTemplateColumns: "200px 1fr 200px",
              alignItems: "center",
              padding: "0 28px", gap: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <OnAirLamp state={lampState} size={26} />
                <div className="font-mono tracked" style={{
                  fontSize: 14,
                  color: lampState === "solid" || lampState === "blink" ? "var(--on-air)" : "rgba(229,75,60,0.35)",
                  letterSpacing: "0.32em",
                  textShadow: lampState === "solid" ? "0 0 10px rgba(229,75,60,0.6)" : "none",
                }}>{lampState === "solid" ? "ON AIR" : "OFF AIR"}</div>
              </div>
              <CrtReadout text={crtLine} />
              <button onClick={onHangUp} disabled={callerState === "dialing" || callerState === "hung_up"}
                style={{
                  background: "transparent",
                  border: "1px solid var(--on-air)",
                  color: "var(--on-air)",
                  padding: "6px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11, letterSpacing: "0.28em",
                  borderRadius: 3, cursor: "pointer",
                  opacity: (callerState === "dialing" || callerState === "hung_up") ? 0.3 : 1,
                  justifySelf: "end",
                }}>HANG UP ✕</button>
            </div>

            <div style={{
              flex: 1, minHeight: 440,
              background: "linear-gradient(180deg, #3a2515 0%, #2a1a0f 60%, #1f130a 100%)",
              borderRadius: 14,
              border: "1px solid rgba(255,179,71,0.12)",
              boxShadow: "inset 0 1px 0 rgba(255,179,71,0.10), inset 0 -3px 12px rgba(0,0,0,0.7), 0 18px 40px rgba(0,0,0,0.6)",
              display: "grid",
              gridTemplateColumns: "1fr 220px 360px",
              padding: 32, gap: 20,
              position: "relative",
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <VuMeter level={dl} />
                <SpeakerGrille active={callerState === "conversation" || callerState === "outro" || callerState === "song_playing"} />
                <LabelPlate primary={djName.toUpperCase()} secondary="ON THE AIR" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <PushToTalkButton enabled={callerState === "conversation"} ptDown={ptDown} onDown={onPtDown} onUp={onPtUp} />
                <div className="font-mono tracked" style={{
                  fontSize: 11,
                  color: callerState === "conversation" ? "var(--amber)" : "var(--cream-30)",
                  letterSpacing: "0.32em",
                }}>YOUR LINE</div>
              </div>

              <TonightCard
                callerState={callerState}
                djName={djName}
                djTagline={djTagline}
                pendingVibe={pendingVibe}
                nowPlaying={nowPlaying}
                lastAgentLine={lastAgentLine}
                lastUserLine={lastUserLine}
                djReason={djReason}
                libraryCount={library.length}
              />
            </div>

            <Turntable visible={callerState === "song_playing"} song={nowPlaying} />
          </div>
        </div>
      </div>
    </Booth>
  );
}

function CrtReadout({ text }: { text: string }) {
  return (
    <div style={{
      height: 64, background: "#0a0905",
      borderRadius: 4, border: "1px solid rgba(255,179,71,0.18)",
      boxShadow: "inset 0 0 18px rgba(0,0,0,0.9), inset 0 0 30px rgba(255,179,71,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 20px", overflow: "hidden",
    }}>
      <div className="font-mono" style={{
        fontSize: 22, color: "var(--amber)",
        letterSpacing: "0.18em",
        textShadow: "0 0 8px rgba(255,179,71,0.7), 0 0 16px rgba(255,179,71,0.35)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{text}</div>
    </div>
  );
}

function VuMeter({ level }: { level: number }) {
  const segments = 22;
  const lit = Math.round(level * segments);
  return (
    <div style={{
      width: 56, height: 220,
      background: "#0a0805", borderRadius: 6,
      border: "1px solid rgba(255,179,71,0.15)",
      boxShadow: "inset 0 0 12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,179,71,0.08)",
      padding: 6, display: "flex", flexDirection: "column-reverse", gap: 2,
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
      width: 130, height: 130,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #4a2f1c 0%, #2a1a0f 60%, #15090a 100%)",
      border: "8px solid #1a0d05",
      boxShadow: "inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,179,71,0.06), 0 6px 16px rgba(0,0,0,0.6)",
      position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "82%", height: "82%", borderRadius: "50%",
        backgroundImage: "radial-gradient(circle, #0a0a0a 1.4px, transparent 1.6px)",
        backgroundSize: "9px 9px", backgroundColor: "#181004",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.9)",
      }} />
      {active && ripples.map((i) => (
        <div key={i} style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid var(--amber)", opacity: 0,
          animation: `ripple 2.4s ${i * 0.8}s ease-out infinite`,
          pointerEvents: "none",
        }} />
      ))}
    </div>
  );
}

function LabelPlate({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
      color: "#3a2515",
      padding: "8px 22px", borderRadius: 2,
      border: "1px solid #c8b58a",
      boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
      textAlign: "center", minWidth: 130, transform: "rotate(-1deg)",
    }}>
      <div className="font-plex" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" }}>{primary}</div>
      {secondary && <div className="font-plex" style={{ fontSize: 9, opacity: 0.55, letterSpacing: "0.32em", marginTop: 2 }}>{secondary}</div>}
    </div>
  );
}

function PushToTalkButton({ enabled, ptDown, onDown, onUp }: {
  enabled: boolean; ptDown: boolean; onDown: () => void; onUp: () => void;
}) {
  return (
    <button
      onMouseDown={enabled ? onDown : undefined}
      onMouseUp={enabled ? onUp : undefined}
      onMouseLeave={enabled && ptDown ? onUp : undefined}
      onTouchStart={enabled ? (e) => { e.preventDefault(); onDown(); } : undefined}
      onTouchEnd={enabled ? (e) => { e.preventDefault(); onUp(); } : undefined}
      disabled={!enabled}
      aria-label="Push to talk"
      style={{
        width: 100, height: 100, borderRadius: "50%", border: "none",
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
      }}
    >
      <div className="font-mono" style={{
        color: "#3a1f08", fontSize: 11, letterSpacing: "0.24em",
        textShadow: "0 1px 0 rgba(255,220,170,0.5)", fontWeight: 700,
      }}>TALK</div>
    </button>
  );
}

/* TONIGHT'S CARD — caller-side state-aware panel.
 * Replaces the "RECORD STACKS" view (which only made sense for the DJ).
 * Shows the AI host's PROCESS in real time: who picks up, what they hear,
 * what they're writing, and what tonight's song was when it ends. */
function TonightCard({
  callerState, djName, djTagline, pendingVibe, nowPlaying,
  lastAgentLine, lastUserLine, djReason, libraryCount,
}: {
  callerState: CallerState;
  djName: string;
  djTagline: string;
  pendingVibe: string | null;
  nowPlaying: LibrarySong | null;
  lastAgentLine: string | null;
  lastUserLine: string | null;
  djReason: string | null;
  libraryCount: number;
}) {
  const headerLabel =
    callerState === "dialing"      ? "DIALING…" :
    callerState === "ringing"      ? "RINGING …" :
    callerState === "connected"    ? "CONNECTED" :
    callerState === "conversation" ? "ON THE LINE" :
    callerState === "song_loading" ? "WRITING" :
    callerState === "song_playing" ? "NOW PLAYING" :
    callerState === "outro"        ? "WRAPPING" :
    "CALL ENDED";

  return (
    <div style={{
      background: "linear-gradient(180deg, #1a0f08 0%, #0f0805 100%)",
      border: "1px solid rgba(255,179,71,0.18)",
      borderRadius: 8, padding: 18, overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="font-plex" style={{
          fontSize: 10, letterSpacing: "0.32em", color: "var(--cream-30)",
        }}>TONIGHT&apos;S CARD</div>
        <div className="font-plex" style={{
          fontSize: 10, letterSpacing: "0.28em",
          color: "var(--amber)",
          opacity: 0.8,
        }}>{headerLabel}</div>
      </div>

      {/* Host name plate */}
      <div style={{
        background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
        color: "#2a1a0f",
        padding: "12px 14px",
        borderRadius: 3,
        border: "1px solid #c8b58a",
        transform: "rotate(-0.6deg)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}>
        <div className="font-plex" style={{ fontSize: 9, letterSpacing: "0.36em", opacity: 0.55 }}>
          HOST · WMID 88.7
        </div>
        <div className="font-serif" style={{ fontSize: 28, lineHeight: 1.1, marginTop: 4 }}>
          {djName}
        </div>
        <div className="font-plex" style={{ fontSize: 11, opacity: 0.7, marginTop: 2, fontStyle: "italic" }}>
          {djTagline}
        </div>
      </div>

      {/* State-aware center block */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
        {(callerState === "dialing" || callerState === "ringing") && (
          <div className="font-plex" style={{
            color: "var(--cream-60)", fontStyle: "italic", fontSize: 13,
            lineHeight: 1.5, padding: "8px 0",
          }}>
            <span style={{ color: "var(--amber)" }}>{djName}</span> is reaching for the receiver…
          </div>
        )}

        {(callerState === "connected" || callerState === "conversation" || callerState === "outro") && (
          <>
            {lastAgentLine && (
              <TranscriptLine who={djName.toUpperCase()} text={lastAgentLine} amber />
            )}
            {lastUserLine && (
              <TranscriptLine who="YOU" text={lastUserLine} />
            )}
            {!lastAgentLine && !lastUserLine && (
              <div className="font-plex" style={{
                color: "var(--cream-30)", fontSize: 12,
                fontStyle: "italic", padding: "8px 0",
              }}>
                Hold <span style={{ color: "var(--amber)" }}>SPACE</span> or the TALK button to speak.
                {djName} is listening.
              </div>
            )}
          </>
        )}

        {callerState === "song_loading" && (
          <div style={{
            background: "rgba(255,179,71,0.10)",
            border: "1px dashed var(--amber)",
            padding: "12px 14px", borderRadius: 4,
          }}>
            <div className="font-mono" style={{
              color: "var(--amber)", fontSize: 11,
              letterSpacing: "0.22em",
              animation: "amber-pulse-fast 1.1s ease-in-out infinite",
            }}>
              ✎ {djName.toUpperCase()} IS WRITING
            </div>
            <div className="font-serif" style={{
              color: "var(--cream)", fontSize: 18, marginTop: 6, lineHeight: 1.25,
            }}>
              {pendingVibe ?? "Tuning in…"}
            </div>
            {djReason && (
              <div className="font-plex" style={{
                color: "var(--cream-60)", fontStyle: "italic",
                fontSize: 11, marginTop: 8, lineHeight: 1.5,
                borderTop: "1px dashed rgba(255,179,71,0.25)", paddingTop: 6,
              }}>
                {djReason}
              </div>
            )}
          </div>
        )}

        {callerState === "song_playing" && nowPlaying && (
          <div style={{
            background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
            color: "#2a1a0f", padding: "14px 14px", borderRadius: 4,
            border: "1px solid #c8b58a",
            boxShadow: "0 0 22px rgba(255,179,71,0.45)",
          }}>
            <div className="font-plex" style={{ fontSize: 9, letterSpacing: "0.32em", opacity: 0.6 }}>
              {nowPlaying.origin === "generated" ? "+ WRITTEN FOR YOU" : "FROM THE STACKS"}
            </div>
            <div className="font-serif" style={{ fontSize: 24, lineHeight: 1.15, marginTop: 6 }}>
              {nowPlaying.title}
            </div>
            <div className="font-plex" style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              {nowPlaying.freeformLabel}
            </div>
          </div>
        )}
      </div>

      {/* Footer — library nudge */}
      <a href="/library" style={{
        display: "block", textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 10, letterSpacing: "0.32em",
        color: "var(--cream-60)",
        padding: "8px 0",
        borderTop: "1px solid rgba(255,179,71,0.15)",
        textDecoration: "none",
        transition: "color 180ms ease",
      }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--amber)"; }}
         onMouseLeave={(e) => { e.currentTarget.style.color = "var(--cream-60)"; }}>
        {libraryCount} TRACKS IN THE ARCHIVE · /LIBRARY
      </a>
    </div>
  );
}

function TranscriptLine({ who, text, amber = false }: { who: string; text: string; amber?: boolean }) {
  return (
    <div style={{
      borderLeft: `2px solid ${amber ? "var(--amber)" : "rgba(242,234,211,0.35)"}`,
      paddingLeft: 10,
    }}>
      <div className="font-mono" style={{
        fontSize: 9, letterSpacing: "0.32em",
        color: amber ? "var(--amber)" : "var(--cream-60)",
      }}>{who}</div>
      <div className="font-plex" style={{
        fontSize: 13, lineHeight: 1.4,
        color: "var(--cream)", fontStyle: amber ? "italic" : "normal",
        marginTop: 3,
      }}>
        {text}
      </div>
    </div>
  );
}

function Turntable({ visible, song }: { visible: boolean; song: LibrarySong | null }) {
  return (
    <div style={{
      height: 200, padding: 18,
      background: "linear-gradient(180deg, #2A1A0F 0%, #1a0f08 100%)",
      borderRadius: 10, border: "1px solid rgba(255,179,71,0.10)",
      boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 8px rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", gap: 14,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      opacity: visible ? 1 : 0.0,
      transition: "all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    }}>
      <div style={{
        width: 150, height: 150, borderRadius: "50%",
        background: "radial-gradient(circle, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)",
        border: "2px solid #2a2a2a",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), 0 4px 10px rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "94%", height: "94%", borderRadius: "50%",
          background: "repeating-radial-gradient(circle at center, #0a0a0a 0px, #0a0a0a 1px, #1a1a1a 1px, #1a1a1a 2px), radial-gradient(circle, #1a1a1a, #050505)",
          animation: visible ? "vinyl-spin 1.8s linear infinite" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "38%", height: "38%", borderRadius: "50%",
            background: "radial-gradient(circle, var(--on-air) 0%, #8a2a1c 80%, #3a1208 100%)",
          }} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="font-mono tracked" style={{ fontSize: 10, color: "var(--amber)", opacity: 0.7 }}>NOW PLAYING</div>
        <div className="font-plex" style={{ fontSize: 18, color: "var(--cream)", marginTop: 6 }}>{song?.title ?? "—"}</div>
        <div className="font-plex" style={{ fontSize: 11, color: "var(--cream-60)", marginTop: 2 }}>
          {song?.origin === "generated" ? "Written for you tonight" : "From the stacks"}
        </div>
      </div>
    </div>
  );
}
