import { describe, it, expect, beforeEach } from "vitest";
import { createGameMachine, type GameState } from "../machine";

describe("game machine", () => {
  let store: ReturnType<typeof createGameMachine>;
  beforeEach(() => { store = createGameMachine(); });

  it("starts in idle with round 0 of 3", () => {
    const s = store.getState();
    expect(s.callState).toBe<GameState>("idle");
    expect(s.roundIndex).toBe(0);
    expect(s.totalRounds).toBe(3);
  });

  it("idle → call_incoming on startCall", () => {
    store.getState().startCall();
    expect(store.getState().callState).toBe("call_incoming");
  });

  it("call_incoming → persona_loading on answerCall", () => {
    store.getState().startCall();
    store.getState().answerCall();
    expect(store.getState().callState).toBe("persona_loading");
  });

  it("persona_loading → conversation on personaReady", () => {
    store.getState().startCall();
    store.getState().answerCall();
    store.getState().personaReady();
    expect(store.getState().callState).toBe("conversation");
  });

  it("conversation → song_select on requestSong", () => {
    const s = store.getState();
    s.startCall(); s.answerCall(); s.personaReady(); s.requestSong();
    expect(store.getState().callState).toBe("song_select");
  });

  it("song_select → song_playing on pickSong, retains chosen song", () => {
    const s = store.getState();
    s.startCall(); s.answerCall(); s.personaReady(); s.requestSong();
    s.pickSong("dusty-country-1");
    expect(store.getState().callState).toBe("song_playing");
    expect(store.getState().chosenSongId).toBe("dusty-country-1");
  });

  it("song_playing → caller_reaction on songEnded", () => {
    const s = store.getState();
    s.startCall(); s.answerCall(); s.personaReady(); s.requestSong();
    s.pickSong("dusty-country-1"); s.songEnded();
    expect(store.getState().callState).toBe("caller_reaction");
  });

  it("caller_reaction → idle and increments round", () => {
    const s = store.getState();
    s.startCall(); s.answerCall(); s.personaReady(); s.requestSong();
    s.pickSong("dusty-country-1"); s.songEnded(); s.endRound();
    expect(store.getState().callState).toBe("idle");
    expect(store.getState().roundIndex).toBe(1);
  });

  it("after totalRounds rounds, isShowOver is true", () => {
    const s = store.getState();
    for (let i = 0; i < 3; i++) {
      s.startCall(); s.answerCall(); s.personaReady(); s.requestSong();
      s.pickSong("dusty-country-1"); s.songEnded(); s.endRound();
    }
    expect(store.getState().isShowOver()).toBe(true);
  });
});
