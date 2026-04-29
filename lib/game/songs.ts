import type { Caller, Vibe } from "./callers";

export type { Vibe };

export interface Song {
  id: string;
  title: string;
  vibe: Vibe;
  src: string;
  durationSec: number;
}

const TITLES: Record<Vibe, string[]> = {
  "dusty-country":         ["Two-Lane Tongue", "I-80 At Three", "Janet's Stetson"],
  "synthwave-heartbreak":  ["Rainfade Portland", "His Name In Neon", "Bathroom Floor 3:47"],
  "lullaby-piano":         ["Goldfish Heaven", "Closet Stars", "A Song For Stella"],
  "cozy-lo-fi":            ["Tucson, Quiet", "Mary's Kettle", "Empty Side Of The Bed"],
};

export const SONGS: Song[] = (Object.keys(TITLES) as Vibe[]).flatMap((vibe) =>
  TITLES[vibe].map((title, i) => ({
    id: `${vibe}-${i + 1}`,
    title,
    vibe,
    src: `/audio/songs/${vibe}-${i + 1}.mp3`,
    durationSec: 15,
  }))
);

export function threeSongsForCaller(caller: Caller): Song[] {
  const match = SONGS.filter((s) => s.vibe === caller.vibePreference);
  const others = SONGS.filter((s) => s.vibe !== caller.vibePreference);
  const perfect = match[Math.floor(Math.random() * match.length)];
  const decoys = [...others].sort(() => Math.random() - 0.5).slice(0, 2);
  return [perfect, ...decoys].sort(() => Math.random() - 0.5);
}
