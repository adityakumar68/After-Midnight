import type { Metadata } from "next";
import { DM_Serif_Display, Inter, VT323, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = VT323({ subsets: ["latin"], weight: "400", variable: "--font-mono" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "After Midnight — A Radio Show",
  description: "Three callers. One quiet hour. You're the only one still up.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${plex.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
