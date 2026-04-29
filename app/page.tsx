import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex items-center gap-2 text-[12px] tracking-[0.25em] text-[--cream-60] font-mono">
        <span className="inline-block h-3 w-3 rounded-full bg-[--on-air] animate-pulse" />
        AFTER MIDNIGHT — A RADIO SHOW
      </div>
      <h1 className="font-serif text-7xl md:text-8xl text-[--cream]">After Midnight</h1>
      <p className="mt-4 text-lg italic text-[--cream-60]">
        Three callers. One quiet hour. You&apos;re the only one still up.
      </p>
      <Link
        href="/studio"
        className="mt-10 rounded-full border border-[--amber] bg-[--walnut-surface] px-8 py-3 text-[--amber] font-mono tracking-widest hover:shadow-[0_0_24px_rgba(255,179,71,0.45)] transition"
      >
        START THE SHOW
      </Link>
      <p className="mt-12 text-[11px] text-[--cream-30] font-mono">
        Built for ElevenHacks #6 — Zed × ElevenLabs
      </p>
    </main>
  );
}
