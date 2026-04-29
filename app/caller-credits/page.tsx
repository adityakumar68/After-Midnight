"use client";
import Link from "next/link";
import { useCallerGame } from "@/lib/game/callerMachine";
import { Booth, Typewriter } from "@/components/ui/atmosphere";

export default function CallerCredits() {
  const game = useCallerGame();
  const tweet = encodeURIComponent(
    "I called into After Midnight at 3 AM and Kai (an AI DJ) wrote a song just for me. Built with @zeddotdev + @elevenlabsio for #ElevenHacks 🎙️📻"
  );
  const last = game.history.at(-1);
  return (
    <Booth dim>
      <main className="relative z-10 mx-auto max-w-[600px] px-6 py-24 text-center">
        <h1 className="font-serif text-6xl text-[--cream]">
          <Typewriter text="Sleep tight." delayMs={90} startMs={300} />
        </h1>
        <p className="mt-4 italic text-[--cream-60]">
          Kai will be here tomorrow night, too.
        </p>

        {last && (
          <div className="mx-auto mt-12 max-w-[460px] rotate-[-1deg] rounded p-6 text-left"
            style={{
              background: "linear-gradient(180deg, #f2ead3 0%, #e6dcc0 100%)",
              color: "#2a1a0f",
              boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
              border: "1px solid #c8b58a",
              animation: "card-settle 1.2s 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
            }}>
            <div className="font-plex" style={{ fontSize: 10, letterSpacing: "0.36em", opacity: 0.5, marginBottom: 14 }}>
              KAI&apos;S PICK · TONIGHT
            </div>
            <div className="font-plex" style={{ fontSize: 16, fontWeight: 600 }}>{last.songTitle}</div>
            <div className="font-plex" style={{ fontSize: 12, marginTop: 2, opacity: 0.7 }}>
              {last.origin === "generated" ? "Written for you" : "From the stacks"} · {last.vibe}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          <Link href="/caller" onClick={() => game.reset()} className="btn-walnut">
            Call Again
          </Link>
          <a href={`https://twitter.com/intent/tweet?text=${tweet}`} target="_blank" rel="noopener noreferrer" className="btn-amber-outline">
            Share This Night
          </a>
          <Link href="/" onClick={() => game.reset()} className="btn-walnut">
            Back to Home
          </Link>
        </div>
        <div className="mt-6">
          <Link href="/library" className="btn-amber-outline">
            Browse Library
          </Link>
        </div>

        <p className="mt-16 text-[11px] text-[--cream-30]" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>
          KAI IS AI. THE SONG WAS REAL. THE FEELING WAS YOURS.
        </p>
      </main>
    </Booth>
  );
}
