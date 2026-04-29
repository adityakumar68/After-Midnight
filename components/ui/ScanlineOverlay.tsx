export default function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[59] opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.6) 2px 4px)",
      }}
    />
  );
}
