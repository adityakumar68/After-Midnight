"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { audioBus } from "@/lib/audio/audioBus";

/**
 * Mounted in app/layout.tsx. Listens for route changes and stops all audio
 * whenever the pathname changes — fixes "song keeps playing after going back".
 * Also stops audio when the page unloads / tab closes.
 */
export default function AudioBusGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Stop on every route change (the cleanup runs on the OLD pathname's effect)
    return () => { audioBus.stopAll(); };
  }, [pathname]);

  useEffect(() => {
    const onUnload = () => audioBus.stopAll();
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  return null;
}
