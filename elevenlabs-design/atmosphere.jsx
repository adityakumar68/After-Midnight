/* Shared atmosphere overlays + tiny utilities used by all 3 scenes */

const { useEffect, useState, useRef, useMemo } = React;

/* ---------- Booth backdrop ---------- */
function Booth({ dim = false, children }) {
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

/* ---------- Dust motes (5–8 floaters) ---------- */
function Motes({ dim = false }) {
  const motes = useMemo(() => {
    const n = 7;
    return Array.from({ length: n }, (_, i) => ({
      left: 8 + Math.random() * 84,
      bottom: -10 - Math.random() * 30,
      size: 3 + Math.random() * 5,
      duration: 22 + Math.random() * 18,
      delay: -Math.random() * 30,
      drift: (Math.random() - 0.5) * 80,
    }));
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
            "--drift": m.drift + "px",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- ON AIR lamp icon (4-petal) ---------- */
function OnAirLamp({ state = "pulse", size = 22 }) {
  // state: pulse | solid | blink | dim
  const cls = "on-air-lamp " + state;
  return (
    <span className={cls} style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none">
        <defs>
          <radialGradient id="lampGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff8a7a" />
            <stop offset="60%" stopColor="#E54B3C" />
            <stop offset="100%" stopColor="#7a1f17" />
          </radialGradient>
        </defs>
        {/* 4 petals */}
        <path
          d="M16 2 C 18 9, 23 14, 30 16 C 23 18, 18 23, 16 30 C 14 23, 9 18, 2 16 C 9 14, 14 9, 16 2 Z"
          fill="url(#lampGrad)"
        />
        <circle cx="16" cy="16" r="3" fill="#fff5ec" opacity="0.85" />
      </svg>
    </span>
  );
}

/* ---------- Typewriter reveal (char by char) ---------- */
function Typewriter({ text, delayMs = 30, startMs = 0, className = "", as = "span", onDone }) {
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
  }, [text, delayMs, startMs]);
  const Tag = as;
  return <Tag className={className}>{text.slice(0, count)}<span style={{ opacity: count < text.length ? 0.8 : 0, color: "var(--amber)" }}>▍</span></Tag>;
}

/* ---------- Decorative slow-sine VU bar ---------- */
function VuBar({ width = 220, height = 8, freq = 0.2 }) {
  const segs = 28;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      setPhase(((t - start) / 1000) * freq * 2 * Math.PI);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [freq]);

  const env = (Math.sin(phase) + 1) / 2; // 0..1

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

/* expose */
Object.assign(window, { Booth, OnAirLamp, Typewriter, VuBar });
