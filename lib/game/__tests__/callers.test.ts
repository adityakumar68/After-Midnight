import { describe, it, expect } from "vitest";
import { CALLERS, drawThreeCallers, reactionFor } from "../callers";

describe("callers", () => {
  it("exports exactly 4 personas", () => {
    expect(CALLERS).toHaveLength(4);
  });

  it("each persona has required fields", () => {
    for (const c of CALLERS) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.age).toBeGreaterThan(0);
      expect(c.location).toBeTruthy();
      expect(c.voiceId).toBeTruthy();
      expect(c.openingLine).toBeTruthy();
      expect(c.systemPrompt.length).toBeGreaterThan(50);
      expect(["dusty-country","synthwave-heartbreak","lullaby-piano","cozy-lo-fi"])
        .toContain(c.vibePreference);
    }
  });

  it("drawThreeCallers returns 3 unique personas", () => {
    const drawn = drawThreeCallers();
    expect(drawn).toHaveLength(3);
    const ids = new Set(drawn.map((c) => c.id));
    expect(ids.size).toBe(3);
  });

  it("reactionFor returns the perfect-match line on vibe match", () => {
    const tom = CALLERS.find((c) => c.id === "tom")!;
    const reaction = reactionFor(tom, "dusty-country");
    expect(reaction.kind).toBe("perfect");
    expect(reaction.line.length).toBeGreaterThan(5);
  });

  it("reactionFor returns the polite line on mismatch", () => {
    const tom = CALLERS.find((c) => c.id === "tom")!;
    const reaction = reactionFor(tom, "synthwave-heartbreak");
    expect(reaction.kind).toBe("polite");
  });
});
