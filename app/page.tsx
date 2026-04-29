"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Booth, OnAirLamp, VuBar } from "@/components/ui/atmosphere";

export default function Landing() {
  const router = useRouter();
  const [n, setN] = useState(3);

  return (
    <Booth>
      <div className="scene">
        <div style={{
          maxWidth: 720, width: "100%", padding: "0 32px",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", position: "relative", zIndex: 10,
        }}>
          <div style={{ marginBottom: 22 }}>
            <OnAirLamp state="pulse" size={26} />
          </div>
          <div className="font-mono tracked" style={{
            fontSize: 13, color: "var(--cream-60)",
            letterSpacing: "0.36em", marginBottom: 38,
            animation: "fade-in 1.4s ease-out both",
          }}>
            AFTER MIDNIGHT &nbsp;—&nbsp; A RADIO SHOW
          </div>

          <h1 className="font-serif type-grain" style={{
            margin: 0,
            fontSize: "clamp(48px, 9.5vw, 112px)",
            lineHeight: 0.95,
            color: "var(--cream)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            textShadow: "0 2px 24px rgba(0,0,0,0.6), 0 0 40px rgba(255,179,71,0.08)",
            whiteSpace: "nowrap",
          }}>
            <TitleReveal text="After Midnight" />
          </h1>

          <p style={{
            marginTop: 28, fontSize: 18, fontStyle: "italic",
            color: "var(--cream)", opacity: 0.85, lineHeight: 1.45, maxWidth: 560,
            animation: "fade-up 1.2s 1.4s ease-out both",
          }}>
            Some nights you host the show. Some nights you call in. Either way, the booth&apos;s still warm at 3 AM.
          </p>

          <div style={{
            marginTop: 50, display: "flex", gap: 18, alignItems: "stretch",
            flexWrap: "wrap", justifyContent: "center",
            animation: "fade-up 1.2s 2.0s ease-out both",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <button className="btn-walnut" onClick={() => router.push(`/dj?n=${n}`)}>
                Be the DJ <span style={{ fontSize: 14, opacity: 0.7 }}>→</span>
              </button>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 11, color: "var(--cream-60)",
                letterSpacing: "0.24em", fontFamily: "var(--font-mono)",
              }}>
                CALLERS TONIGHT
                <button onClick={() => setN(Math.max(1, n - 1))} style={stepperBtn}>‹</button>
                <span style={{ minWidth: 12, color: "var(--amber)", fontSize: 14 }}>{n}</span>
                <button onClick={() => setN(Math.min(5, n + 1))} style={stepperBtn}>›</button>
              </div>
            </div>

            <button className="btn-amber-outline" onClick={() => router.push("/caller")}>
              Be a Caller <span style={{ fontSize: 14, opacity: 0.7 }}>→</span>
            </button>
          </div>

          <div className="lnr-built-block" style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 14,
            animation: "fade-in 1.5s 2.6s ease-out both",
          }}>
            <VuBar width={260} height={10} freq={0.2} />
            <div className="font-mono tracked lnr-built-text" style={{
              color: "var(--cream-60)", letterSpacing: "0.3em",
            }}>
              BUILT FOR ELEVENHACKS #6 &nbsp;·&nbsp; ZED × ELEVENLABS
            </div>
          </div>
        </div>
      </div>
    </Booth>
  );
}

const stepperBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,179,71,0.4)",
  color: "var(--amber)",
  width: 22, height: 22, borderRadius: 3,
  cursor: "pointer", fontFamily: "var(--font-mono)",
  fontSize: 14, lineHeight: 1,
};

function TitleReveal({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span aria-label={text} style={{ display: "inline-block" }}>
      {chars.map((c, i) => (
        <span key={i} style={{
          display: "inline-block", opacity: 0,
          transform: "translateY(28px)",
          animation: `title-rise 1.2s ${0.2 + i * 0.03}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
          whiteSpace: c === " " ? "pre" : "normal",
        }}>{c}</span>
      ))}
    </span>
  );
}
