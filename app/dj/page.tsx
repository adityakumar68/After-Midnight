import { Suspense } from "react";
import StudioClient from "@/components/game/StudioClient";

export default function DjPage() {
  return (
    <div className="booth-page">
      <MobileGate />
      <Suspense>
        <StudioClient />
      </Suspense>
    </div>
  );
}

function MobileGate() {
  return (
    <div className="mobile-only-warning" aria-hidden>
      <div className="inner">
        <div className="font-mono tracked" style={{
          fontSize: 11, letterSpacing: "0.32em", color: "var(--amber)",
          marginBottom: 12,
        }}>BEST ON DESKTOP</div>
        <h2 className="font-serif" style={{ fontSize: 28, color: "var(--cream)", margin: 0 }}>
          Open on a laptop
        </h2>
        <p style={{ marginTop: 12, fontStyle: "italic", color: "var(--cream-60)", lineHeight: 1.5 }}>
          The DJ console fits a 1280px studio — phones don&apos;t do it justice.
          Plug in headphones and come back to <span style={{ color: "var(--amber)" }}>after-midnight.app/dj</span>.
        </p>
      </div>
    </div>
  );
}
