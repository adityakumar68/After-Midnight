import { create } from "zustand";

export type GameState =
  | "idle"
  | "call_incoming"
  | "persona_loading"
  | "conversation"
  | "song_select"
  | "song_playing"
  | "caller_reaction";

export interface CallLogEntry {
  time: string;
  callerId: string;
  callerName: string;
  callerAge: number;
  callerLocation: string;
  songVibe: string;
  songTitle: string;
}

export interface GameStore {
  callState: GameState;
  roundIndex: number;
  totalRounds: number;
  chosenSongId: string | null;
  history: CallLogEntry[];
  startCall: () => void;
  answerCall: () => void;
  personaReady: () => void;
  requestSong: () => void;
  pickSong: (songId: string) => void;
  songEnded: () => void;
  endRound: (entry?: CallLogEntry) => void;
  reset: () => void;
  isShowOver: () => boolean;
  setTotalRounds: (n: number) => void;
}

export function createGameMachine() {
  return create<GameStore>((set, get) => ({
    callState: "idle",
    roundIndex: 0,
    totalRounds: 3,
    chosenSongId: null,
    history: [],
    startCall: () => set({ callState: "call_incoming" }),
    answerCall: () => set({ callState: "persona_loading" }),
    personaReady: () => set({ callState: "conversation" }),
    requestSong: () => set({ callState: "song_select" }),
    pickSong: (songId) => set({ callState: "song_playing", chosenSongId: songId }),
    songEnded: () => set({ callState: "caller_reaction" }),
    endRound: (entry) =>
      set((s) => ({
        callState: "idle",
        roundIndex: s.roundIndex + 1,
        chosenSongId: null,
        history: entry ? [...s.history, entry] : s.history,
      })),
    reset: () => set({ callState: "idle", roundIndex: 0, chosenSongId: null, history: [] }),
    isShowOver: () => get().roundIndex >= get().totalRounds,
    setTotalRounds: (n) => set({ totalRounds: Math.max(1, Math.min(5, Math.floor(n))) }),
  }));
}

export const useGame = createGameMachine();
