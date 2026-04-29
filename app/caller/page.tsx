import CallerClient from "@/components/game/CallerClient";

export default function CallerPage() {
  return (
    <div className="booth-page">
      <MobileGate />
      <CallerClient />
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
          Calling in works best with headphones and a real mic. Phones can&apos;t fit the booth.
          Visit <span style={{ color: "var(--amber)" }}>/caller</span> on a laptop.
        </p>
      </div>
    </div>
  );
}
