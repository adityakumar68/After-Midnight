"use client";

import { useEffect, useState } from "react";
import { Booth, OnAirLamp } from "@/components/ui/atmosphere";
import type { GameState } from "@/lib/game/machine";
import type { LibrarySong } from "@/lib/library/songLibrary";

type DesignCallState =
  | "idle" | "incoming" | "conversation" | "song_select" | "song_playing" | "caller_reaction";

export function mapStateMobile(s: GameState): DesignCallState {
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

export interface StudioMobileProps {
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
  onCueSong?: () => void;
  /** Full library (baked + generated). Optional — when provided, the stacks drawer is shown. */
  library?: LibrarySong[];
  latestGeneratedId?: string | null;
}

export default function StudioMobile({
  callState, caller, callerVuLevel, djVuLevel, songs,
  callIndex = 1, callTotal = 3, clock = "",
  onAnswer, onPushToTalkStart, onPushToTalkEnd, onPickSong, onCueSong,
  library, latestGeneratedId,
}: StudioMobileProps) {
  const [simCaller, setSimCaller] = useState(0);
  const [ptDown, setPtDown] = useState(false);

  useEffect(() => {
    let raf = 0;
    const tick = (t: number) => {
      const ts = t / 1000;
      const lvl = callState === "conversation"
        ? 0.35 + 0.45 * Math.abs(Math.sin(ts * 5.2))
        : callState === "caller_reaction" ? 0.25 + 0.4 * Math.max(0, Math.sin(ts * 3))
        : callState === "song_playing" ? 0.06
        : 0;
      setSimCaller(lvl);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [callState]);

  const cv = callerVuLevel ?? simCaller;
  const dv = djVuLevel ?? (ptDown ? 0.4 + 0.4 * Math.random() : 0);

  const lampState =
    callState === "conversation" || callState === "song_playing" || callState === "caller_reaction" ? "solid" :
    callState === "incoming" ? "blink" :
    "dim";

  const crtLine =
    callState === "idle"            ? "STANDBY" :
    callState === "incoming"        ? "INCOMING CALL — TAP ANSWER" :
    callState === "caller_reaction" ? "CALL ENDED" :
    callState === "song_playing"    ? "NOW PLAYING" :
    callState === "song_select"     ? "PICK A SONG" :
    `CALL 0${callIndex} / 0${callTotal} · ${caller.name.toUpperCase()}, ${caller.age}`;

  const isPlaying = callState === "song_playing";
  const isSelecting = callState === "song_select";
  const canTalk = callState === "conversation";
  const isIncoming = callState === "incoming";

  const handlePtDown = () => { setPtDown(true); onPushToTalkStart?.(); };
  const handlePtUp = () => { setPtDown(false); onPushToTalkEnd?.(); };

  return (
    <Booth>
      <main style={{
        position: "fixed", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        padding: "max(env(safe-area-inset-top), 14px) 14px max(env(safe-area-inset-bottom), 14px) 14px",
        gap: 12,
      }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(180deg, #2A1A0F 0%, #1c1108 100%)",
          borderRadius: 8,
          border: "1px solid rgba(255,179,71,0.10)",
          boxShadow: "inset 0 1px 0 rgba(255,179,71,0.08), inset 0 -2px 6px rgba(0,0,0,0.6)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <OnAirLamp state={lampState} size={20} />
            <span className="font-mono tracked" style={{
              fontSize: 11, letterSpacing: "0.28em",
              color: lampState === "solid" || lampState === "blink" ? "var(--on-air)" : "rgba(229,75,60,0.4)",
              textShadow: lampState === "solid" ? "0 0 8px rgba(229,75,60,0.5)" : "none",
            }}>{lampState === "solid" ? "ON AIR" : "OFF AIR"}</span>
          </div>
          <span className="font-mono tracked" style={{
            fontSize: 10, color: "var(--cream-30)", letterSpacing: "0.28em",
          }}>{clock}</span>
        </header>

        {/* CRT */}
        <div style={{
          height: 44, background: "#0a0905", borderRadius: 4,
          border: "1px solid rgba(255,179,71,0.18)",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,179,71,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 14px", overflow: "hidden", position: "relative",
        }}>
          <div className="font-mono" style={{
            fontSize: 13, color: "var(--amber)",
            letterSpacing: "0.14em",
            textShadow: "0 0 6px rgba(255,179,71,0.7)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: "100%",
          }}>{crtLine}</div>
        </div>

        {/* INCOMING CALL: rotary phone */}
        {isIncoming && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 18, paddingTop: 30,
          }}>
            <RotaryPhone />
            <div className="font-serif" style={{ fontSize: 24, color: "var(--cream)" }}>
              {caller.name}, {caller.age}
            </div>
            <div className="font-mono" style={{
              fontSize: 11, color: "var(--cream-60)", letterSpacing: "0.22em",
            }}>{caller.location.toUpperCase()}</div>
            <button onClick={onAnswer} style={{
              marginTop: 14,
              background: "var(--on-air)", color: "var(--cream)",
              border: "none", borderRadius: 999,
              padding: "16px 38px", fontSize: 14,
              fontFamily: "var(--font-mono)", letterSpacing: "0.32em", fontWeight: 600,
              boxShadow: "0 0 30px rgba(229,75,60,0.7), 0 6px 18px rgba(0,0,0,0.6)",
              cursor: "pointer",
              animation: "amber-pulse-fast 1.4s ease-in-out infinite",
            }}>
              ANSWER ↵
            </button>
          </div>
        )}

        {/* CONVERSATION: caller speaker grille + VUs */}
        {(callState === "conversation" || callState === "caller_reaction") && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, paddingTop: 12,
          }}>
            <SpeakerGrille active size={150} />
            <div className="font-serif" style={{
              fontSize: 26, color: "var(--cream)",
            }}>{caller.name}</div>
            <div className="font-mono tracked" style={{
              fontSize: 10, color: "var(--cream-30)", letterSpacing: "0.32em",
            }}>{caller.location.toUpperCase()}</div>
            <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <HorizontalVu level={cv} width={120} />
                <span className="font-mono" style={{ fontSize: 9, color: "var(--cream-30)", letterSpacing: "0.24em" }}>CALLER</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <HorizontalVu level={dv} width={120} />
                <span className="font-mono" style={{ fontSize: 9, color: "var(--cream-30)", letterSpacing: "0.24em" }}>YOU</span>
              </div>
            </div>
          </div>
        )}

        {/* SONG SELECT: 3 vinyl sleeves */}
        {isSelecting && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 14, marginTop: 10,
          }}>
            <div className="font-mono tracked" style={{ fontSize: 11, color: "var(--amber)", letterSpacing: "0.32em" }}>
              PICK A SONG FOR {caller.name.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {songs.map((s, i) => (
                <button key={s.id} onClick={() => onPickSong?.(s.id)} style={{
                  background: "linear-gradient(135deg, #c4a878 0%, #9d8255 50%, #7a6238 100%)",
                  border: "1px solid rgba(0,0,0,0.4)",
                  borderRadius: 6, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", textAlign: "left",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
                }}>
                  <div style={{
                    background: "#f2ead3", padding: "6px 8px", borderRadius: 2,
                    minWidth: 44, textAlign: "center",
                    transform: `rotate(${(i - 1) * 1.5}deg)`,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-caveat), 'Caveat', cursive",
                      fontSize: 13, color: "#3a2515", fontWeight: 700,
                    }}>{i + 1}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 11, color: "rgba(0,0,0,0.6)", letterSpacing: "0.2em",
                      fontFamily: "var(--font-mono)", textTransform: "uppercase",
                    }}>{s.vibe}</div>
                    <div className="font-serif" style={{ fontSize: 18, color: "#1f130a", marginTop: 2 }}>
                      {s.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SONG PLAYING: spinning vinyl */}
        {isPlaying && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, paddingTop: 20,
          }}>
            <SpinningVinyl />
            <div className="font-mono tracked" style={{ fontSize: 10, color: "var(--amber)", letterSpacing: "0.32em" }}>NOW PLAYING</div>
            <div className="font-serif" style={{ fontSize: 22, color: "var(--cream)", textAlign: "center", padding: "0 12px" }}>
              {songs[0]?.title ?? "—"}
            </div>
          </div>
        )}

        {/* PTT button — pinned to bottom during conversation */}
        {canTalk && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 12, marginTop: "auto", paddingBottom: 8,
          }}>
            <button
              onMouseDown={handlePtDown}
              onMouseUp={handlePtUp}
              onMouseLeave={ptDown ? handlePtUp : undefined}
              onTouchStart={(e) => { e.preventDefault(); handlePtDown(); }}
              onTouchEnd={(e) => { e.preventDefault(); handlePtUp(); }}
              aria-label="Hold to speak"
              style={{
                width: 140, height: 140, borderRadius: "50%", border: "none",
                cursor: "pointer",
                background: ptDown
                  ? "radial-gradient(circle at 50% 35%, #ffce6a 0%, #d18a2a 60%, #6a3f10 100%)"
                  : "radial-gradient(circle at 50% 35%, #c98a3a 0%, #8a571c 70%, #3a230d 100%)",
                boxShadow: ptDown
                  ? "inset 0 8px 14px rgba(0,0,0,0.5), 0 0 50px rgba(255,179,71,0.95), 0 0 90px rgba(229,75,60,0.5)"
                  : "inset 0 -8px 12px rgba(0,0,0,0.4), inset 0 4px 6px rgba(255,200,120,0.5), 0 0 24px rgba(255,179,71,0.4), 0 8px 18px rgba(0,0,0,0.5)",
                transform: ptDown ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
                transition: "transform 100ms ease, box-shadow 200ms ease, background 200ms ease",
                position: "relative", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
              }}
            >
              <div className="font-mono" style={{
                color: "#3a1f08", fontSize: 14, letterSpacing: "0.28em",
                textShadow: "0 1px 0 rgba(255,220,170,0.5)", fontWeight: 700,
              }}>TALK</div>
            </button>
            <div className="font-mono tracked" style={{
              fontSize: 11, color: ptDown ? "var(--amber)" : "var(--cream-60)",
              letterSpacing: "0.32em",
            }}>
              {ptDown ? "● ON AIR" : "HOLD TO SPEAK"}
            </div>
            <button onClick={() => onCueSong?.()}
              style={{
                marginTop: 6,
                background: "transparent",
                border: "1px solid rgba(255,179,71,0.4)",
                color: "var(--amber)",
                padding: "10px 22px", borderRadius: 999,
                fontSize: 11, fontFamily: "var(--font-mono)",
                letterSpacing: "0.24em", cursor: "pointer",
              }}>
              CUE A SONG ♫
            </button>
          </div>
        )}

        {/* Stacks drawer — same library as Caller Mode. Visible always (when not picking). */}
        {library && library.length > 0 && callState !== "song_select" && (
          <StacksDrawer library={library} latestGeneratedId={latestGeneratedId ?? null} />
        )}
      </main>
    </Booth>
  );
}

function StacksDrawer({ library, latestGeneratedId }: {
  library: LibrarySong[]; latestGeneratedId: string | null;
}) {
  const recent = library.slice().reverse().slice(0, 6);
  return (
    <section style={{
      background: "#1a0f08",
      border: "1px solid rgba(255,179,71,0.15)",
      borderRadius: 8, padding: 10,
      maxHeight: 180, overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 6,
      WebkitOverflowScrolling: "touch",
      marginTop: 8,
    }}>
      <span className="font-plex" style={{
        fontSize: 10, letterSpacing: "0.32em", color: "var(--cream-30)",
      }}>RECORD STACKS · {library.length}</span>
      {recent.map((s) => {
        const isFreshGen = s.id === latestGeneratedId;
        return (
          <div key={s.id} style={{
            background: isFreshGen
              ? "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)"
              : "rgba(255,179,71,0.06)",
            color: isFreshGen ? "#2a1a0f" : "var(--cream)",
            padding: "6px 10px", borderRadius: 3,
            border: "1px solid " + (isFreshGen ? "#c8b58a" : "rgba(255,179,71,0.18)"),
            fontFamily: "var(--font-plex)", fontSize: 11,
          }}>
            <div style={{ fontWeight: 600 }}>{s.title}</div>
            <div style={{
              fontSize: 9, opacity: 0.6, letterSpacing: "0.2em",
              textTransform: "uppercase", marginTop: 2,
            }}>
              {isFreshGen ? "+ WRITTEN FOR YOU" : "FROM THE STACKS"} · {s.freeformLabel}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function SpeakerGrille({ active, size = 150 }: { active: boolean; size?: number }) {
  const ripples = [0, 1, 2];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
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

function HorizontalVu({ level, width = 140 }: { level: number; width?: number }) {
  const segments = 18;
  const lit = Math.round(level * segments);
  return (
    <div style={{
      width, height: 12,
      background: "#0a0805", borderRadius: 3,
      border: "1px solid rgba(255,179,71,0.15)",
      boxShadow: "inset 0 0 6px rgba(0,0,0,0.9)",
      padding: 2, display: "flex", gap: 1,
    }}>
      {Array.from({ length: segments }, (_, i) => {
        const isLit = i < lit;
        const isPeak = i >= segments - 3;
        const color = isPeak ? "#ff5a3d" : isLit ? "var(--amber)" : "rgba(255,179,71,0.10)";
        return (
          <div key={i} style={{
            flex: 1,
            background: isLit ? color : "rgba(255,179,71,0.08)",
            borderRadius: 1,
            boxShadow: isLit ? "0 0 3px " + color : "none",
            transition: "all 60ms linear",
          }} />
        );
      })}
    </div>
  );
}

function SpinningVinyl() {
  return (
    <div style={{
      width: 180, height: 180, borderRadius: "50%",
      background: "radial-gradient(circle, #1a1a1a 0%, #0a0a0a 60%, #050505 100%)",
      border: "2px solid #2a2a2a",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), 0 8px 18px rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "94%", height: "94%", borderRadius: "50%",
        background: "repeating-radial-gradient(circle at center, #0a0a0a 0px, #0a0a0a 1px, #1a1a1a 1px, #1a1a1a 2px), radial-gradient(circle, #1a1a1a, #050505)",
        animation: "vinyl-spin 1.8s linear infinite",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: "38%", height: "38%", borderRadius: "50%",
          background: "radial-gradient(circle, var(--on-air) 0%, #8a2a1c 80%, #3a1208 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a0a0a" }} />
        </div>
      </div>
    </div>
  );
}

function RotaryPhone() {
  return (
    <div style={{
      width: 140, height: 140,
      animation: "phone-shake 1.8s ease-in-out infinite",
      filter: "drop-shadow(0 0 12px rgba(229,75,60,0.6))",
    }}>
      <svg viewBox="0 0 140 140" width="140" height="140">
        <defs>
          <radialGradient id="phoneBodyM" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#3a1208" />
            <stop offset="60%" stopColor="#1a0905" />
            <stop offset="100%" stopColor="#0a0302" />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="100" rx="48" ry="14" fill="url(#phoneBodyM)" stroke="#000" />
        <circle cx="70" cy="92" r="22" fill="#1a0905" stroke="#3a1f0d" />
        <circle cx="70" cy="92" r="6" fill="#3a2515" />
        <g transform="rotate(-12, 70, 60)">
          <rect x="20" y="50" width="100" height="22" rx="11" fill="url(#phoneBodyM)" stroke="#000" />
          <circle cx="32" cy="61" r="10" fill="#0a0a0a" stroke="#3a1f0d" />
          <circle cx="108" cy="61" r="10" fill="#0a0a0a" stroke="#3a1f0d" />
        </g>
      </svg>
    </div>
  );
}
