import type { Metadata } from "next";
import { DM_Serif_Display, Inter, VT323, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/ui/AppHeader";
import AudioBusGuard from "@/components/audio/AudioBusGuard";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = VT323({ subsets: ["latin"], weight: "400", variable: "--font-mono" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "After Midnight — A Radio Show",
  description: "Some nights you host the show. Some nights you call in. Either way, the booth's still warm at 3 AM.",
  icons: {
    icon: [
      { url: "/logo/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/logo/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/logo/icon-512.png",
  },
  openGraph: {
    title: "After Midnight",
    description: "Call in for a song no one's heard. Or take the booth.",
    images: ["/logo/social.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "After Midnight",
    description: "Call in for a song no one's heard. Or take the booth.",
    images: ["/logo/social.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${plex.variable} ${caveat.variable}`}
    >
      <body>
        <AudioBusGuard />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
