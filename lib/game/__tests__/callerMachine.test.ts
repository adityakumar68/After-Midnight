import { describe, it, expect, beforeEach } from "vitest";
import { createCallerMachine, type CallerState } from "../callerMachine";

describe("caller machine", () => {
  let store: ReturnType<typeof createCallerMachine>;
  beforeEach(() => { store = createCallerMachine(); });

  it("starts in dialing", () => {
    expect(store.getState().callerState).toBe<CallerState>("dialing");
  });

  it("dialing → ringing → connected → conversation", () => {
    const s = store.getState();
    s.dialingDone(); expect(store.getState().callerState).toBe("ringing");
    s.ringingDone(); expect(store.getState().callerState).toBe("connected");
    s.djSpoke();     expect(store.getState().callerState).toBe("conversation");
  });

  it("conversation → song_loading → song_playing → outro → hung_up", () => {
    const s = store.getState();
    s.dialingDone(); s.ringingDone(); s.djSpoke();
    s.djAskedForSong("rainy synth heartbreak");
    expect(store.getState().callerState).toBe("song_loading");
    expect(store.getState().pendingVibe).toBe("rainy synth heartbreak");
    s.songReady("song-id-1");
    expect(store.getState().callerState).toBe("song_playing");
    expect(store.getState().chosenSongId).toBe("song-id-1");
    s.songEnded();
    expect(store.getState().callerState).toBe("outro");
    s.hangUp();
    expect(store.getState().callerState).toBe("hung_up");
  });
});
