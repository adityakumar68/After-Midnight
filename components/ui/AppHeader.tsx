"use client";

import Link from "next/link";
import { OnAirLamp } from "@/components/ui/atmosphere";

export default function AppHeader() {
  return (
    <header className="app-header" aria-label="After Midnight — A Radio Show">
      <Link href="/" className="app-header-link">
        <OnAirLamp state="solid" size={14} />
        <span className="app-header-wordmark">After Midnight</span>
      </Link>
      <span className="app-header-station">WMID · 88.7 FM</span>
    </header>
  );
}
