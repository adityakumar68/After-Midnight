import { create } from "zustand";

export type CallerState =
  | "dialing"
  | "ringing"
  | "connected"
  | "conversation"
  | "song_loading"
  | "song_playing"
  | "outro"
  | "hung_up";

export interface CallerLogEntry {
  vibe: string;
  songId: string;
  songTitle: string;
  origin: "baked" | "generated";
}

interface CallerStore {
  callerState: CallerState;
  pendingVibe: string | null;
  chosenSongId: string | null;
  history: CallerLogEntry[];
  dialingDone: () => void;
  ringingDone: () => void;
  djSpoke: () => void;
  djAskedForSong: (vibe: string) => void;
  songReady: (songId: string) => void;
  songEnded: () => void;
  hangUp: (entry?: CallerLogEntry) => void;
  reset: () => void;
}

export function createCallerMachine() {
  return create<CallerStore>((set) => ({
    callerState: "dialing",
    pendingVibe: null,
    chosenSongId: null,
    history: [],
    dialingDone: () => set({ callerState: "ringing" }),
    ringingDone: () => set({ callerState: "connected" }),
    djSpoke: () => set({ callerState: "conversation" }),
    djAskedForSong: (vibe) => set({ callerState: "song_loading", pendingVibe: vibe }),
    songReady: (songId) => set({ callerState: "song_playing", chosenSongId: songId }),
    songEnded: () => set({ callerState: "outro" }),
    hangUp: (entry) =>
      set((s) => ({
        callerState: "hung_up",
        history: entry ? [...s.history, entry] : s.history,
      })),
    reset: () => set({
      callerState: "dialing", pendingVibe: null, chosenSongId: null, history: [],
    }),
  }));
}

export const useCallerGame = createCallerMachine();
