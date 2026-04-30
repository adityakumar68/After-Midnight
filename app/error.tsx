"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[after-midnight] route error:", error);
    }
  }, [error]);

  return (
    <main
      className="relative z-10 mx-auto flex min-h-screen max-w-[600px] flex-col items-center justify-center px-6 text-center"
      style={{ color: "var(--cream)" }}
    >
      <h1 className="font-serif text-5xl">The line went dead.</h1>
      <p className="mt-4 italic" style={{ color: "var(--cream-60)" }}>
        Something glitched. Try the booth again — it&rsquo;s still warm.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-amber-outline">
          Reload this page
        </button>
        <Link href="/" className="btn-walnut">
          Back to Home
        </Link>
      </div>
      {error.digest && (
        <p
          className="mt-8 text-[11px]"
          style={{
            color: "var(--cream-30, rgba(242,234,211,0.3))",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.18em",
          }}
        >
          ref · {error.digest}
        </p>
      )}
    </main>
  );
}
