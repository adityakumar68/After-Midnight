"use client";

import Link from "next/link";
import Image from "next/image";

export default function AppHeader() {
  return (
    <header className="app-header" aria-label="After Midnight — A Radio Show">
      <Link href="/" className="app-header-link">
        <Image src="/logo/icon-192.png" alt="" width={28} height={28} priority style={{ borderRadius: 6 }} />
        <span className="app-header-wordmark">After Midnight</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Link href="/library" className="app-header-navlink">Library</Link>
        <span className="app-header-station">WMID · 88.7 FM</span>
      </div>
    </header>
  );
}
