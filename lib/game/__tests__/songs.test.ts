import { describe, it, expect } from "vitest";
import { SONGS, threeSongsForCaller } from "../songs";
import { CALLERS } from "../callers";

describe("songs", () => {
  it("has 12 entries across 4 vibes", () => {
    expect(SONGS).toHaveLength(12);
    const byVibe = SONGS.reduce<Record<string, number>>((m, s) => {
      m[s.vibe] = (m[s.vibe] ?? 0) + 1; return m;
    }, {});
    expect(byVibe).toEqual({
      "dusty-country": 3, "synthwave-heartbreak": 3, "lullaby-piano": 3, "cozy-lo-fi": 3
    });
  });

  it("each song has src under /audio/songs/", () => {
    for (const s of SONGS) expect(s.src.startsWith("/audio/songs/")).toBe(true);
  });

  it("threeSongsForCaller returns 3 songs incl. at least one perfect-vibe match", () => {
    for (const caller of CALLERS) {
      const trio = threeSongsForCaller(caller);
      expect(trio).toHaveLength(3);
      expect(trio.some((s) => s.vibe === caller.vibePreference)).toBe(true);
    }
  });
});
