"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLibrary, type LibrarySong } from "@/lib/library/songLibrary";
import { audioBus, usePlayingId } from "@/lib/audio/audioBus";
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
  const playingId = usePlayingId();

  useEffect(() => { useLibrary.getState().hydrate(); }, []);

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

  const onCard = (s: LibrarySong) => {
    if (!s.src) return;
    audioBus.toggle(s.id, s.src);
  };

  return (
    <div className="library-page">
      <Booth>
        <main className="library-main">
          <div className="library-header">
            <div className="library-pretitle">THE GROWING ARCHIVE</div>
            <h1 className="library-title">Every song tonight.</h1>
            <p className="library-subtitle">
              Songs Kai, Luna, and Hank have written for callers. Plus the original twelve from the stacks.
              The library grows every time a stranger calls in.
            </p>
          </div>

          <div className="library-filters">
            <FilterPill label={`ALL · ${all.length}`} active={filter === null} onClick={() => setFilter(null)} />
            {Object.keys(grouped).map((k) => (
              <FilterPill key={k}
                label={`${k === "generated" ? "WRITTEN TONIGHT" : VIBE_LABELS[k]?.toUpperCase()} · ${grouped[k].length}`}
                active={filter === k}
                onClick={() => setFilter(k)} />
            ))}
          </div>

          {Object.entries(visibleGroups).map(([vibe, songs]) => (
            <section key={vibe} className="library-section">
              <h2 className="library-section-title">
                {vibe === "generated" ? "Written Tonight" : VIBE_LABELS[vibe]}
                <span className="library-section-count">{songs.length} TRACKS</span>
              </h2>
              <div className="library-grid">
                {songs.map((s) => {
                  const isFresh = s.id === latestGeneratedId;
                  const isPlaying = playingId === s.id;
                  return (
                    <button key={s.id}
                      onClick={() => onCard(s)}
                      className={"library-card" + (isFresh ? " is-fresh" : "") + (isPlaying ? " is-playing" : "")}
                      aria-pressed={isPlaying}>
                      <div className="library-card-content">
                        <div className="library-card-title">{s.title}</div>
                        <div className="library-card-meta">
                          {isFresh ? "+ NEW" : s.origin === "generated" ? "WRITTEN" : "STACKS"} · {s.freeformLabel}
                        </div>
                      </div>
                      <div className="library-card-control" aria-label={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="library-footer">
            <Link href="/" className="btn-walnut">← Back to the booth</Link>
          </div>
        </main>
      </Booth>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={"library-pill" + (active ? " is-active" : "")}>{label}</button>
  );
}
