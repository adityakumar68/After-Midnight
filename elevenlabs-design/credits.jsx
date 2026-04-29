/* CREDITS SCENE — /credits */

const { useState, useEffect } = React;

const DEFAULT_CALLS = [
  { time: "03:12 AM", name: "TOM",  age: 47, location: "NEBRASKA",  songVibe: "Dusty Country" },
  { time: "03:47 AM", name: "MIRA", age: 24, location: "PORTLAND",  songVibe: "Synthwave Heartbreak" },
  { time: "04:21 AM", name: "ELI",  age: 9,  location: "INDIANA",   songVibe: "Lullaby Piano" },
];

function Credits({ callsCompleted = DEFAULT_CALLS, onPlayAgain, onShare }) {
  const [titleDone, setTitleDone] = useState(false);
  const [breath, setBreath] = useState(false);
  const [crackle, setCrackle] = useState(0);

  // 8s idle breath
  useEffect(() => {
    const id = setTimeout(() => setBreath(true), 8000);
    return () => clearTimeout(id);
  }, []);

  // vinyl crackle bar
  useEffect(() => {
    let raf;
    const tick = (t) => { setCrackle(t / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleShare = () => {
    if (onShare) { onShare(); return; }
    const text = "I just spent an hour as a 3 AM radio DJ. Built with @zeddotdev + @elevenlabsio for #ElevenHacks 🎙️📻";
    const url = window.location.href;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: "After Midnight", text, url }).catch(()=>{});
    } else {
      const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(tweet, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Booth dim>
      <div className="credits-scroll" style={{
        animation: breath ? "deep-breath 6s ease-in-out infinite" : "none",
      }}>
        <div style={{
          maxWidth: 600,
          width: "100%",
          padding: "0 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          zIndex: 10,
        }}>
          {/* OFF AIR lamp */}
          <div style={{ marginBottom: 28, opacity: 0.5, animation: "fade-in 1.4s ease-out both" }}>
            <span className="on-air-lamp dim" style={{ width: 24, height: 24 }}>
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M16 2 C 18 9, 23 14, 30 16 C 23 18, 18 23, 16 30 C 14 23, 9 18, 2 16 C 9 14, 14 9, 16 2 Z" fill="#3a3a3a" />
                <circle cx="16" cy="16" r="3" fill="#666" />
              </svg>
            </span>
            <div className="font-mono tracked" style={{
              fontSize: 11,
              color: "rgba(242,234,211,0.2)",
              letterSpacing: "0.36em",
              marginTop: 6,
            }}>OFF AIR</div>
          </div>

          {/* Title */}
          <h1 className="font-serif" style={{
            margin: 0,
            fontSize: "clamp(54px, 7vw, 84px)",
            color: "var(--cream)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.0,
          }}>
            <Typewriter
              text="Good night."
              delayMs={90}
              startMs={300}
              as="span"
              onDone={() => setTitleDone(true)}
            />
            {titleDone && (
              <span style={{
                display: "inline-block",
                marginLeft: -18,
                color: "var(--cream)",
                animation: "period-glow 2.4s ease-out 0.2s 1",
              }} />
            )}
          </h1>

          <p style={{
            marginTop: 24,
            fontStyle: "italic",
            fontSize: 17,
            color: "var(--cream)",
            opacity: 0.8,
            animation: "fade-up 1.4s 1.6s ease-out both",
          }}>
            Thanks for staying up with us. The callers will remember.
          </p>

          {/* Recap card */}
          <div style={{
            marginTop: 48,
            background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
            color: "#2a1a0f",
            padding: "26px 32px",
            transform: "rotate(-1deg)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
            border: "1px solid #c8b58a",
            width: "100%",
            maxWidth: 520,
            position: "relative",
            animation: "card-settle 1.2s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
          }}>
            {/* paper grain */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.2'/></svg>\")",
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }} />

            <div className="font-plex" style={{
              fontSize: 10,
              letterSpacing: "0.36em",
              opacity: 0.5,
              textAlign: "left",
              marginBottom: 14,
              borderBottom: "1px dashed rgba(58,37,21,0.3)",
              paddingBottom: 8,
            }}>PLAYLIST LOG · WMID 88.7 · TONIGHT</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {callsCompleted.map((c, i) => (
                <div key={i} className="font-plex" style={{
                  fontSize: 14,
                  letterSpacing: "0.04em",
                  textAlign: "left",
                  display: "grid",
                  gridTemplateColumns: "92px 1fr auto",
                  gap: 14,
                  alignItems: "baseline",
                }}>
                  <span style={{ opacity: 0.6 }}>{c.time}</span>
                  <span>
                    <span style={{ fontWeight: 700 }}>{c.name}</span>
                    <span style={{ opacity: 0.55 }}>, {c.age} · {c.location}</span>
                  </span>
                  <span style={{
                    fontStyle: "italic",
                    opacity: 0.85,
                    transform: `rotate(${(i - 1) * 0.6}deg)`,
                    background: "rgba(229,75,60,0.08)",
                    padding: "1px 6px",
                  }}>"{c.songVibe}"</span>
                </div>
              ))}
            </div>

            {/* stamp */}
            <div className="font-plex" style={{
              position: "absolute",
              right: 18, bottom: 10,
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "var(--on-air)",
              border: "1.5px solid var(--on-air)",
              padding: "3px 8px",
              transform: "rotate(-6deg)",
              opacity: 0.7,
            }}>END OF SHOW</div>
          </div>

          {/* CTAs */}
          <div style={{
            marginTop: 44,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fade-up 1.4s 2.0s ease-out both",
          }}>
            <button className="btn-walnut" onClick={onPlayAgain}>
              Record Another Night
            </button>
            <button className="btn-amber-outline" onClick={handleShare}>
              Share the Show
            </button>
          </div>

          {/* footer credit */}
          <div className="font-mono" style={{
            marginTop: 56,
            fontSize: 11,
            color: "var(--cream-30)",
            letterSpacing: "0.18em",
            lineHeight: 1.6,
            maxWidth: 520,
            animation: "fade-in 2s 2.6s ease-out both",
          }}>
            BUILT IN 24H WITH ZED AND ELEVENLABS CONVERSATIONAL AI.<br />
            VOICES ARE AI. STORIES ARE MADE UP. FEELINGS ARE REAL.
          </div>
        </div>
      </div>

      {/* vinyl crackle waveform across bottom */}
      <div style={{
        position: "fixed",
        left: 0, right: 0, bottom: 0,
        height: 24,
        zIndex: 20,
        opacity: 0.18,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        gap: 1,
        padding: "0 4px",
      }}>
        {Array.from({ length: 200 }, (_, i) => {
          const v = Math.abs(Math.sin(crackle * 0.6 + i * 0.31) * Math.cos(crackle * 0.2 + i * 0.07));
          const spike = Math.random() < 0.04 ? 1.6 : 1;
          return <div key={i} style={{
            flex: 1,
            height: Math.max(1, v * 12 * spike),
            background: "var(--amber)",
            opacity: 0.6,
          }} />;
        })}
      </div>
    </Booth>
  );
}

window.Credits = Credits;
