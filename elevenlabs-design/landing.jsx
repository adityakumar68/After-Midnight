/* LANDING SCENE — / */

const { useState, useEffect } = React;

function Landing({ onStart }) {
  return (
    <Booth>
      <div className="scene">
        <div style={{
          maxWidth: 720,
          width: "100%",
          padding: "0 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}>
          {/* ON AIR lamp */}
          <div style={{ marginBottom: 22 }}>
            <OnAirLamp state="pulse" size={26} />
          </div>

          {/* Tagline */}
          <div className="font-mono tracked" style={{
            fontSize: 13,
            color: "var(--cream-60)",
            letterSpacing: "0.36em",
            marginBottom: 38,
            animation: "fade-in 1.4s ease-out both",
          }}>
            AFTER MIDNIGHT &nbsp;—&nbsp; A RADIO SHOW
          </div>

          {/* Hero title */}
          <h1 className="font-serif type-grain" style={{
            margin: 0,
            fontSize: "clamp(64px, 9.5vw, 112px)",
            lineHeight: 0.95,
            color: "var(--cream)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            textShadow: "0 2px 24px rgba(0,0,0,0.6), 0 0 40px rgba(255,179,71,0.08)",
          }}>
            <TitleReveal text="After Midnight" />
          </h1>

          {/* Italic supporting line */}
          <p style={{
            marginTop: 28,
            marginBottom: 0,
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--cream)",
            opacity: 0.85,
            lineHeight: 1.45,
            maxWidth: 560,
            animation: "fade-up 1.2s 1.4s ease-out both",
          }}>
            Three callers. One quiet hour. You're the only one still up.
          </p>

          {/* CTA */}
          <button
            className="btn-walnut"
            onClick={onStart}
            style={{
              marginTop: 56,
              animation: "fade-up 1.2s 2.0s ease-out both",
            }}
          >
            Start the Show
            <span style={{ fontSize: 14, opacity: 0.7 }}>→</span>
          </button>

          {/* VU + credits */}
          <div style={{
            marginTop: 96,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            animation: "fade-in 1.5s 2.6s ease-out both",
          }}>
            <VuBar width={260} height={10} freq={0.2} />
            <div className="font-mono tracked" style={{
              fontSize: 11,
              color: "var(--cream-30)",
              letterSpacing: "0.3em",
            }}>
              BUILT FOR ELEVENHACKS #6 &nbsp;·&nbsp; ZED × ELEVENLABS
            </div>
          </div>
        </div>
      </div>
    </Booth>
  );
}

/* Title reveal: chars stagger 30ms, fade up 1.2s */
function TitleReveal({ text }) {
  const chars = text.split("");
  return (
    <span aria-label={text} style={{ display: "inline-block" }}>
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            transform: "translateY(28px)",
            animation: `title-rise 1.2s ${0.2 + i * 0.03}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
            whiteSpace: c === " " ? "pre" : "normal",
          }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

window.Landing = Landing;
