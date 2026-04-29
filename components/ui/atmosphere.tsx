"use client";

import React, { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/* ---------- Booth backdrop ---------- */
export function Booth({ dim = false, children }: { dim?: boolean; children: ReactNode }) {
  return (
    <>
      <div className="booth-floor" />
      <div className={"bulb-vignette" + (dim ? " dim" : "")} />
      {children}
      <Motes dim={dim} />
      <div className={"scanlines" + (dim ? " dim" : "")} />
      <div className={"grain" + (dim ? " dim" : "")} />
    </>
  );
}

/* ---------- Dust motes (client-only to avoid hydration mismatch) ---------- */
function Motes({ dim = false }: { dim?: boolean }) {
  const [motes, setMotes] = useState<Array<{ left: number; bottom: number; size: number; duration: number; delay: number; drift: number }>>([]);
  useEffect(() => {
    const n = 7;
    setMotes(Array.from({ length: n }, () => ({
      left: 8 + Math.random() * 84,
      bottom: -10 - Math.random() * 30,
      size: 3 + Math.random() * 5,
      duration: 22 + Math.random() * 18,
      delay: -Math.random() * 30,
      drift: (Math.random() - 0.5) * 80,
    })));
  }, []);

  return (
    <div className="motes" style={{ opacity: dim ? 0.5 : 1 }}>
      {motes.map((m, i) => (
        <div
          key={i}
          className="mote"
          style={{
            left: m.left + "%",
            bottom: m.bottom + "%",
            width: m.size + "px",
            height: m.size + "px",
            animationDuration: m.duration + "s",
            animationDelay: m.delay + "s",
            ["--drift" as string]: m.drift + "px",
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/* ---------- ON AIR lamp ---------- */
export type LampState = "pulse" | "solid" | "blink" | "dim";
export function OnAirLamp({ state = "pulse", size = 22 }: { state?: LampState; size?: number }) {
  return (
    <span className={"on-air-lamp " + state} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none">
        <defs>
          <radialGradient id="lampGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8a7a" />
            <stop offset="60%" stopColor="#E54B3C" />
            <stop offset="100%" stopColor="#7a1f17" />
          </radialGradient>
        </defs>
        <path
          d="M16 2 C 18 9, 23 14, 30 16 C 23 18, 18 23, 16 30 C 14 23, 9 18, 2 16 C 9 14, 14 9, 16 2 Z"
          fill="url(#lampGrad)"
        />
        <circle cx="16" cy="16" r="3" fill="#fff5ec" opacity="0.85" />
      </svg>
    </span>
  );
}

/* ---------- Typewriter ---------- */
export function Typewriter({
  text, delayMs = 30, startMs = 0, className = "", as: Tag = "span", onDone,
}: {
  text: string; delayMs?: number; startMs?: number; className?: string;
  as?: keyof React.JSX.IntrinsicElements; onDone?: () => void;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const start = setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (!mounted) return;
        i++;
        setCount(i);
        if (i < text.length) setTimeout(tick, delayMs);
        else if (onDone) onDone();
      };
      tick();
    }, startMs);
    return () => { mounted = false; clearTimeout(start); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delayMs, startMs]);
  const T = Tag as keyof React.JSX.IntrinsicElements;
  return (
    <T className={className}>
      {text.slice(0, count)}
      <span style={{ opacity: count < text.length ? 0.8 : 0, color: "var(--amber)" }}>▍</span>
    </T>
  );
}

/* ---------- Decorative VU bar ---------- */
export function VuBar({ width = 220, height = 8, freq = 0.2 }: { width?: number; height?: number; freq?: number }) {
  const segs = 28;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      setPhase(((t - start) / 1000) * freq * 2 * Math.PI);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [freq]);

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", width, height: height + 4 }}>
      {Array.from({ length: segs }, (_, i) => {
        const localPhase = phase - i * 0.18;
        const v = (Math.sin(localPhase) + 1) / 2;
        const lit = v > 0.35 + (i / segs) * 0.4;
        return (
          <div key={i} style={{
            flex: 1,
            height: lit ? height : Math.max(2, height * 0.35),
            background: lit ? "var(--amber)" : "rgba(255,179,71,0.18)",
            boxShadow: lit ? "0 0 6px var(--amber-glow)" : "none",
            borderRadius: 1,
            transition: "height 80ms linear",
          }} />
        );
      })}
    </div>
  );
}
