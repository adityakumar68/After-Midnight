import type { Metadata } from "next";
import { DM_Serif_Display, Inter, VT323 } from "next/font/google";
import "./globals.css";
import GrainOverlay from "@/components/ui/GrainOverlay";
import ScanlineOverlay from "@/components/ui/ScanlineOverlay";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = VT323({ subsets: ["latin"], weight: "400", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "After Midnight",
  description: "A late-night radio show. Three callers. One quiet hour.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-walnut text-cream font-body antialiased relative min-h-screen overflow-x-hidden">
        {children}
        <GrainOverlay />
        <ScanlineOverlay />
      </body>
    </html>
  );
}
