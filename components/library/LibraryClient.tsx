"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLibrary, type LibrarySong } from "@/lib/library/songLibrary";
import { Booth } from "@/components/ui/atmosphere";

const VIBE_LABELS: Record<string, string> = {
  "dusty-country": "Dusty Country",
  "synthwave-heartbreak": "Synthwave Heartbreak",
  "lullaby-piano": "Lullaby Piano",
  "cozy-lo-fi": "Cozy Lo-Fi",
};

export default function LibraryClient() {
  const baked = useLibrary((s) => s.baked);
  const generated = useLibrary((s) => s.generated);
  const latestGeneratedId = useLibrary((s) => s.latestGeneratedId);
  const all = useMemo(() => [...baked, ...generated], [baked, generated]);
  const [filter, setFilter] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => { useLibrary.getState().hydrate(); }, []);

  // Group by canonical vibe — anything outside the canonical 4 falls into "Generated tonight"
  const grouped = useMemo(() => {
    const byVibe: Record<string, LibrarySong[]> = {};
    for (const s of all) {
      const key = s.vibe in VIBE_LABELS ? s.vibe : "generated";
      (byVibe[key] ||= []).push(s);
    }
    return byVibe;
  }, [all]);

  const visibleGroups = filter
    ? { [filter]: grouped[filter] ?? [] }
    : grouped;

  return (
    <Booth>
      <main style={{
        position: "relative", zIndex: 10,
        maxWidth: 1100, margin: "0 auto",
        padding: "calc(var(--header-h) + 28px) 28px 80px",
        color: "var(--cream)",
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center", marginBottom: 28,
          animation: "fade-in 0.8s ease-out both",
        }}>
          <div className="font-mono tracked" style={{
            fontSize: 12, color: "var(--cream-60)",
            letterSpacing: "0.32em", marginBottom: 16,
          }}>
            THE GROWING ARCHIVE
          </div>
          <h1 className="font-serif" style={{
            fontSize: "clamp(48px, 7vw, 84px)", lineHeight: 0.95,
            margin: 0, color: "var(--cream)",
          }}>
            Every song tonight.
          </h1>
          <p style={{
            marginTop: 14, fontStyle: "italic",
            fontSize: 16, color: "var(--cream-60)",
            maxWidth: 540, marginLeft: "auto", marginRight: "auto",
            lineHeight: 1.5,
          }}>
            Songs Kai, Luna, and Hank have written for callers. Plus the original twelve from the stacks.
            The library grows every time a stranger calls in.
          </p>
        </div>

        {/* Counter pills */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10,
          justifyContent: "center", marginBottom: 36,
        }}>
          <FilterPill label={`ALL · ${all.length}`} active={filter === null} onClick={() => setFilter(null)} />
          {Object.keys(grouped).map((k) => (
            <FilterPill key={k}
              label={`${k === "generated" ? "WRITTEN TONIGHT" : VIBE_LABELS[k]?.toUpperCase()} · ${grouped[k].length}`}
              active={filter === k}
              onClick={() => setFilter(k)} />
          ))}
        </div>

        {/* Sections */}
        {Object.entries(visibleGroups).map(([vibe, songs]) => (
          <section key={vibe} style={{ marginBottom: 40 }}>
            <h2 className="font-serif" style={{
              fontSize: 28, color: "var(--cream)",
              borderBottom: "1px solid rgba(255,179,71,0.25)",
              paddingBottom: 8, marginBottom: 18,
            }}>
              {vibe === "generated" ? "Written Tonight" : VIBE_LABELS[vibe]}
              <span className="font-mono" style={{
                marginLeft: 14, fontSize: 12,
                color: "var(--cream-60)", letterSpacing: "0.28em",
              }}>{songs.length} TRACKS</span>
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {songs.map((s) => {
                const isFresh = s.id === latestGeneratedId;
                const isPlaying = playing === s.id;
                return (
                  <button key={s.id}
                    onClick={() => {
                      if (!s.src) return;
                      const a = new Audio(s.src);
                      void a.play().catch(() => {});
                      setPlaying(s.id);
                      a.onended = () => setPlaying(null);
                    }}
                    style={{
                      background: isFresh
                        ? "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)"
                        : "linear-gradient(180deg, #2a1a0f 0%, #1a0f08 100%)",
                      color: isFresh ? "#2a1a0f" : "var(--cream)",
                      border: "1px solid " + (isFresh ? "#c8b58a" : "rgba(255,179,71,0.20)"),
                      borderRadius: 6,
                      padding: "14px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 200ms ease",
                      boxShadow: isPlaying
                        ? "0 0 22px rgba(255,179,71,0.55), inset 0 1px 0 rgba(255,179,71,0.20)"
                        : "0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,179,71,0.08)",
                    }}
                  >
                    <div className="font-serif" style={{ fontSize: 18, marginBottom: 6 }}>
                      {s.title}
                    </div>
                    <div className="font-mono" style={{
                      fontSize: 10, opacity: 0.75,
                      letterSpacing: "0.22em", textTransform: "uppercase",
                    }}>
                      {isFresh ? "+ NEW" : s.origin === "generated" ? "WRITTEN" : "STACKS"} · {s.freeformLabel}
                    </div>
                    {isPlaying && (
                      <div className="font-mono" style={{
                        marginTop: 8, fontSize: 11,
                        color: isFresh ? "var(--on-air)" : "var(--amber)",
                        letterSpacing: "0.24em",
                      }}>♪ NOW PLAYING</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <div style={{ textAlign: "center", marginTop: 60 }}>
          <Link href="/" className="btn-walnut">← Back to the booth</Link>
        </div>
      </main>
    </Booth>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(255,179,71,0.15)" : "transparent",
      border: "1px solid " + (active ? "var(--amber)" : "rgba(255,179,71,0.25)"),
      color: active ? "var(--amber)" : "var(--cream-60)",
      padding: "8px 14px", borderRadius: 999,
      fontSize: 11, fontFamily: "var(--font-mono)",
      letterSpacing: "0.24em", cursor: "pointer",
      transition: "all 180ms ease",
    }}>{label}</button>
  );
}
