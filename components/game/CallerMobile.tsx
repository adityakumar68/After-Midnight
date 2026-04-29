"use client";

import { useEffect, useState } from "react";
import { Booth, OnAirLamp } from "@/components/ui/atmosphere";
import type { CallerState } from "@/lib/game/callerMachine";
import type { LibrarySong } from "@/lib/library/songLibrary";

export interface CallerMobileProps {
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
  latestGeneratedId?: string | null;
}

export default function CallerMobile({
  callerState, djLevel, ptDown,
  onPtDown, onPtUp, onHangUp,
  pendingVibe, nowPlaying, library, flashSongId,
  djName = "DJ",
  latestGeneratedId,
}: CallerMobileProps) {
  // Animated DJ VU level when none is provided
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
    callerState === "conversation" || callerState === "song_playing" || callerState === "outro" ? "solid" :
    callerState === "ringing" ? "blink" :
    "dim";

  const crtLine =
    callerState === "dialing"      ? "DIALING…" :
    callerState === "ringing"      ? "RINGING — WMID 88.7" :
    callerState === "connected"    ? "CONNECTED" :
    callerState === "song_loading" ? `KAI IS WRITING — ${(pendingVibe ?? "").toUpperCase()}` :
    callerState === "song_playing" ? `NOW PLAYING — ${(nowPlaying?.title ?? "").toUpperCase()}` :
    callerState === "outro"        ? "WRAPPING UP" :
    callerState === "hung_up"      ? "CALL ENDED" :
    "ON THE LINE";

  const isPlaying = callerState === "song_playing";
  const isLoading = callerState === "song_loading";
  const canTalk = callerState === "conversation";

  return (
    <Booth>
      <main style={{
        position: "fixed", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        padding: "max(env(safe-area-inset-top), 14px) 14px max(env(safe-area-inset-bottom), 14px) 14px",
        gap: 12,
      }}>
        {/* HEADER: ON AIR / HANG UP */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          <button onClick={onHangUp}
            disabled={callerState === "dialing" || callerState === "hung_up"}
            style={{
              background: "transparent",
              border: "1px solid var(--on-air)",
              color: "var(--on-air)",
              padding: "6px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10, letterSpacing: "0.28em",
              borderRadius: 3, cursor: "pointer",
              opacity: (callerState === "dialing" || callerState === "hung_up") ? 0.3 : 1,
            }}>HANG UP ✕</button>
        </header>

        {/* CRT */}
        <div style={{
          height: 44,
          background: "#0a0905",
          borderRadius: 4,
          border: "1px solid rgba(255,179,71,0.18)",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,179,71,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 14px", overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(50,180,80,0.06) 2px, rgba(50,180,80,0.06) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 5px)",
            pointerEvents: "none",
          }} />
          <div className="font-mono" style={{
            fontSize: 13, color: "var(--amber)",
            letterSpacing: "0.14em",
            textShadow: "0 0 6px rgba(255,179,71,0.7), 0 0 12px rgba(255,179,71,0.3)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            position: "relative", zIndex: 2, maxWidth: "100%",
          }}>{crtLine}</div>
        </div>

        {/* HERO: speaker grille (when not playing) OR turntable (when playing) */}
        {!isPlaying && !isLoading && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, paddingTop: 20, paddingBottom: 8,
          }}>
            <SpeakerGrille active={callerState === "conversation" || callerState === "outro"} size={180} />
            <div className="font-serif" style={{
              fontSize: 32, color: "var(--cream)", letterSpacing: "0.04em",
            }}>{djName}</div>
            <div className="font-mono tracked" style={{
              fontSize: 10, color: "var(--cream-30)", letterSpacing: "0.32em",
            }}>HOST · ON THE AIR</div>
            <HorizontalVu level={dl} />
          </div>
        )}

        {isLoading && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, paddingTop: 30, paddingBottom: 8,
          }}>
            <PencilWriting />
            <div className="font-serif" style={{
              fontSize: 26, color: "var(--cream)", letterSpacing: "0.04em",
              textAlign: "center", padding: "0 12px",
            }}>{djName} is writing&hellip;</div>
            <div className="font-mono tracked" style={{
              fontSize: 11, color: "var(--amber)",
              letterSpacing: "0.22em", textAlign: "center",
            }}>{(pendingVibe ?? "").toUpperCase()}</div>
            <div className="font-plex" style={{
              fontSize: 12, color: "var(--cream-60)", fontStyle: "italic",
              marginTop: 8, textAlign: "center", padding: "0 16px",
            }}>This one&apos;s never been heard before.</div>
          </div>
        )}

        {isPlaying && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, paddingTop: 20, paddingBottom: 8,
          }}>
            <SpinningVinyl />
            <div className="font-mono tracked" style={{
              fontSize: 10, color: "var(--amber)", letterSpacing: "0.32em", opacity: 0.8,
            }}>NOW PLAYING</div>
            <div className="font-serif" style={{
              fontSize: 24, color: "var(--cream)",
              textAlign: "center", padding: "0 12px",
            }}>{nowPlaying?.title ?? "—"}</div>
            <div className="font-plex" style={{
              fontSize: 11, color: "var(--cream-60)", fontStyle: "italic",
            }}>
              {nowPlaying?.origin === "generated" ? "Written for you tonight" : "From the stacks"}
            </div>
          </div>
        )}

        {/* PTT BUTTON — only during conversation */}
        {canTalk && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, marginTop: "auto", paddingBottom: 8,
          }}>
            <button
              onMouseDown={onPtDown}
              onMouseUp={onPtUp}
              onMouseLeave={ptDown ? onPtUp : undefined}
              onTouchStart={(e) => { e.preventDefault(); onPtDown(); }}
              onTouchEnd={(e) => { e.preventDefault(); onPtUp(); }}
              aria-label="Hold to speak"
              style={{
                width: 160, height: 160, borderRadius: "50%", border: "none",
                cursor: "pointer",
                background: ptDown
                  ? "radial-gradient(circle at 50% 35%, #ffce6a 0%, #d18a2a 60%, #6a3f10 100%)"
                  : "radial-gradient(circle at 50% 35%, #c98a3a 0%, #8a571c 70%, #3a230d 100%)",
                boxShadow: ptDown
                  ? "inset 0 8px 14px rgba(0,0,0,0.5), 0 0 50px rgba(255,179,71,0.95), 0 0 90px rgba(229,75,60,0.5)"
                  : "inset 0 -8px 12px rgba(0,0,0,0.4), inset 0 4px 6px rgba(255,200,120,0.5), 0 0 24px rgba(255,179,71,0.4), 0 8px 18px rgba(0,0,0,0.5)",
                transform: ptDown ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
                transition: "transform 100ms ease, box-shadow 200ms ease, background 200ms ease",
                position: "relative",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
              <div className="font-mono" style={{
                color: "#3a1f08", fontSize: 16, letterSpacing: "0.28em",
                textShadow: "0 1px 0 rgba(255,220,170,0.5)", fontWeight: 700,
              }}>TALK</div>
              {ptDown && (
                <span style={{
                  position: "absolute", inset: -8, borderRadius: "50%",
                  border: "2px solid var(--on-air)", opacity: 0,
                  animation: "ring-expand 1.2s ease-out infinite",
                }} />
              )}
            </button>
            <div className="font-mono tracked" style={{
              fontSize: 11, color: ptDown ? "var(--amber)" : "var(--cream-60)",
              letterSpacing: "0.32em",
            }}>
              {ptDown ? "● LISTENING" : "HOLD TO SPEAK"}
            </div>
          </div>
        )}

        {/* LIBRARY PANEL — at the bottom */}
        <LibraryDrawer library={library} flashSongId={flashSongId} latestGeneratedId={latestGeneratedId ?? null} />
      </main>
    </Booth>
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

function HorizontalVu({ level }: { level: number }) {
  const segments = 24;
  const lit = Math.round(level * segments);
  return (
    <div style={{
      width: "min(280px, 100%)", height: 14,
      background: "#0a0805", borderRadius: 3,
      border: "1px solid rgba(255,179,71,0.15)",
      boxShadow: "inset 0 0 8px rgba(0,0,0,0.9)",
      padding: 3, display: "flex", gap: 2,
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
            boxShadow: isLit ? "0 0 4px " + color : "none",
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

function PencilWriting() {
  return (
    <div style={{
      width: 160, height: 160, borderRadius: "50%",
      background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
      color: "#3a2515",
      border: "1px solid #c8b58a",
      boxShadow: "0 8px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: "rotate(-3deg)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.3'/></svg>\")",
        mixBlendMode: "multiply", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 60%, rgba(255,179,71,0.18), transparent 60%)",
        animation: "amber-pulse-fast 1.4s ease-in-out infinite",
      }} />
      <span style={{
        fontSize: 56, transform: "rotate(15deg)",
        animation: "deep-breath 1.6s ease-in-out infinite",
      }}>✎</span>
    </div>
  );
}

function LibraryDrawer({ library, flashSongId, latestGeneratedId }: {
  library: LibrarySong[]; flashSongId: string | null; latestGeneratedId: string | null;
}) {
  // Show every track — the drawer scrolls so even 20+ entries are reachable.
  const all = library.slice().reverse();
  return (
    <section style={{
      background: "#1a0f08",
      border: "1px solid rgba(255,179,71,0.15)",
      borderRadius: 8, padding: 12,
      maxHeight: 280, overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 6,
      WebkitOverflowScrolling: "touch",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 4,
      }}>
        <span className="font-plex" style={{
          fontSize: 10, letterSpacing: "0.32em",
          color: "var(--cream-30)",
        }}>RECORD STACKS · {library.length}</span>
      </div>
      {all.map((s) => {
        const flash = s.id === flashSongId;
        // Only the freshest generated song wears the "WRITTEN FOR YOU" cream paper.
        // Previously generated tracks fade back into the regular dark "FROM THE STACKS" treatment.
        const isFreshGen = s.id === latestGeneratedId;
        return (
          <div key={s.id} style={{
            background: isFreshGen
              ? "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)"
              : "rgba(255,179,71,0.06)",
            color: isFreshGen ? "#2a1a0f" : "var(--cream)",
            padding: "8px 10px", borderRadius: 3,
            border: "1px solid " + (isFreshGen ? "#c8b58a" : "rgba(255,179,71,0.20)"),
            fontFamily: "var(--font-plex)", fontSize: 12,
            boxShadow: flash ? "0 0 16px rgba(255,179,71,0.7)" : "none",
            transition: "box-shadow 350ms ease",
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
