"use client";
import Link from "next/link";
import { useGame } from "@/lib/game/machine";

export default function Credits() {
  const game = useGame();
  const tweet = encodeURIComponent(
    "I just spent an hour as a 3 AM radio DJ. Built with @zeddotdev + @elevenlabsio for #ElevenHacks 🎙️📻"
  );
  const log = game.history.length
    ? game.history
    : [
        { time: "03:12", callerName: "TOM", callerAge: 47, callerLocation: "NEBRASKA", songTitle: "—", songVibe: "—", callerId: "tom" },
        { time: "03:47", callerName: "MIRA", callerAge: 24, callerLocation: "PORTLAND", songTitle: "—", songVibe: "—", callerId: "mira" },
        { time: "04:21", callerName: "ELI", callerAge: 9, callerLocation: "INDIANA", songTitle: "—", songVibe: "—", callerId: "eli" },
      ];

  return (
    <main className="relative z-10 mx-auto max-w-[600px] px-6 py-24 text-center">
      <h1 className="font-serif text-6xl text-[--cream]">Good night.</h1>
      <p className="mt-4 italic text-[--cream-60]">Thanks for staying up with us. The callers will remember.</p>

      <div className="mx-auto mt-12 max-w-[420px] rotate-[-1deg] rounded bg-[--cream] p-6 text-left font-mono text-[--walnut] shadow-2xl">
        <div className="mb-3 text-[10px] tracking-widest opacity-70">— TONIGHT&apos;S LOG —</div>
        <div className="text-sm leading-7">
          {log.map((l, i) => (
            <div key={i}>
              {l.time} — {l.callerName.toUpperCase()}, {l.callerAge} — {l.callerLocation.toUpperCase()}
              {l.songTitle && l.songTitle !== "—" ? ` — “${l.songTitle}”` : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/studio"
          onClick={() => game.reset()}
          className="rounded-full bg-[--walnut-surface] px-6 py-3 font-mono text-[--cream] hover:opacity-80"
        >
          RECORD ANOTHER NIGHT
        </Link>
        <a
          href={`https://twitter.com/intent/tweet?text=${tweet}`}
          target="_blank" rel="noopener noreferrer"
          className="rounded-full border border-[--amber] px-6 py-3 font-mono text-[--amber] hover:shadow-[0_0_24px_rgba(255,179,71,0.45)]"
        >
          SHARE THE SHOW
        </a>
      </div>

      <p className="mt-16 text-[11px] text-[--cream-30]">
        Built in 24h with Zed and ElevenLabs Conversational AI. Voices are AI. Stories are made up. Feelings are real.
      </p>
    </main>
  );
}
