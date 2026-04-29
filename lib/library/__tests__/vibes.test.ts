import { describe, it, expect } from "vitest";
import { canonicalizeVibe, scoreMatch, expandPrompt } from "../vibes";

describe("canonicalizeVibe", () => {
  it("returns canonical key for direct hit", () => {
    expect(canonicalizeVibe("dusty country")).toBe("dusty-country");
    expect(canonicalizeVibe("synthwave heartbreak")).toBe("synthwave-heartbreak");
    expect(canonicalizeVibe("lullaby piano")).toBe("lullaby-piano");
    expect(canonicalizeVibe("cozy lo-fi")).toBe("cozy-lo-fi");
  });
  it("hyphenates and lowercases freeform input", () => {
    expect(canonicalizeVibe("RAINY  Synth Heartbreak")).toBe("rainy-synth-heartbreak");
  });
  it("strips punctuation", () => {
    expect(canonicalizeVibe("late-night, jazzy noir!")).toBe("late-night-jazzy-noir");
  });
});

describe("scoreMatch", () => {
  it("perfect canonical match scores 1.0", () => {
    expect(scoreMatch("dusty country", "dusty-country")).toBe(1);
  });
  it("matching keywords boosts score above 0.5", () => {
    expect(scoreMatch("rainy synth heartbreak", "synthwave-heartbreak")).toBeGreaterThan(0.5);
  });
  it("unrelated vibes score below 0.3", () => {
    expect(scoreMatch("polka party", "lullaby-piano")).toBeLessThan(0.3);
  });
});

describe("expandPrompt", () => {
  it("appends 60s duration and vocals direction by default", () => {
    const out = expandPrompt("late night jazz noir");
    expect(out).toContain("late night jazz noir");
    expect(out).toMatch(/60 seconds/i);
    expect(out).toMatch(/vocals|verse|chorus|lyrics/i);
  });
  it("respects an explicit instrumental request", () => {
    const out = expandPrompt("instrumental piano lullaby");
    expect(out).toMatch(/instrumental/i);
    expect(out).toMatch(/no vocals/i);
  });
  it("adds rain ambience when 'rainy' is present", () => {
    expect(expandPrompt("rainy synth")).toMatch(/rain/i);
  });
  it("adds slide guitar for country", () => {
    expect(expandPrompt("dusty country road")).toMatch(/slide|steel/i);
  });
});
