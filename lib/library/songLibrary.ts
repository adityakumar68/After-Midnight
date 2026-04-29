import { create } from "zustand";
import { SONGS } from "@/lib/game/songs";
import { bestCanonicalMatch, canonicalizeVibe } from "./vibes";

export interface LibrarySong {
  id: string;
  title: string;
  vibe: string;
  freeformLabel: string;
  src: string;
  origin: "baked" | "generated";
  durationSec: number;
}

const LS_KEY = "lnr.library.v1";
const LRU_CAP = 20;

interface LibraryStore {
  baked: LibrarySong[];
  generated: LibrarySong[];
  all: () => LibrarySong[];
  find: (freeform: string) => LibrarySong | null;
  addGenerated: (s: LibrarySong) => void;
  hydrate: () => void;
}

const BAKED: LibrarySong[] = SONGS.map((s) => ({
  id: s.id,
  title: s.title,
  vibe: s.vibe,
  freeformLabel: s.vibe.replace(/-/g, " "),
  src: s.src,
  origin: "baked",
  durationSec: s.durationSec,
}));

export function createLibraryStore(opts: { persist: boolean } = { persist: true }) {
  return create<LibraryStore>((set, get) => ({
    baked: BAKED,
    generated: [],
    all: () => [...get().baked, ...get().generated],
    find: (freeform) => {
      const cn = canonicalizeVibe(freeform);
      const directBaked = get().baked.find((s) => s.vibe === cn);
      if (directBaked) return directBaked;
      const directGen = get().generated.find((s) => s.vibe === cn);
      if (directGen) return directGen;
      const labelGen = get().generated.find(
        (s) => canonicalizeVibe(s.freeformLabel) === cn
      );
      if (labelGen) return labelGen;
      const best = bestCanonicalMatch(freeform);
      if (best) return get().baked.find((s) => s.vibe === best.vibe) ?? null;
      return null;
    },
    addGenerated: (s) => {
      const next = [...get().generated, s].slice(-LRU_CAP);
      set({ generated: next });
      if (opts.persist) persist(next);
    },
    hydrate: () => {
      if (!opts.persist) return;
      const restored = restore();
      set({ generated: restored });
    },
  }));
}

function persist(generated: LibrarySong[]) {
  if (typeof window === "undefined") return;
  try {
    const meta = generated.map((s) => ({ ...s, src: "" }));
    localStorage.setItem(LS_KEY, JSON.stringify(meta));
  } catch { /* quota */ }
}

function restore(): LibrarySong[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LibrarySong[];
    return arr.filter((s) => s.id);
  } catch { return []; }
}

export const useLibrary = createLibraryStore({ persist: true });
