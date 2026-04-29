import { describe, it, expect, beforeEach } from "vitest";
import { createLibraryStore } from "../songLibrary";

describe("song library", () => {
  let lib: ReturnType<typeof createLibraryStore>;
  beforeEach(() => { lib = createLibraryStore({ persist: false }); });

  it("starts with the 12 baked songs", () => {
    expect(lib.getState().all().length).toBe(12);
  });
  it("find by canonical vibe returns a baked song", () => {
    const found = lib.getState().find("dusty country");
    expect(found?.vibe).toBe("dusty-country");
    expect(found?.origin).toBe("baked");
  });
  it("find with no canonical match scores by keywords and returns best baked", () => {
    const found = lib.getState().find("rainy synth heartbreak");
    expect(found?.vibe).toBe("synthwave-heartbreak");
  });
  it("find returns null when no match and no generated", () => {
    expect(lib.getState().find("polka oompah party")).toBe(null);
  });
  it("addGenerated registers a freeform-vibed song findable by its label", () => {
    const { addGenerated, find } = lib.getState();
    addGenerated({
      id: "gen-1", title: "Tucson Quiet Rain", vibe: "rainy-synth-heartbreak",
      freeformLabel: "rainy synth heartbreak", src: "blob:fake",
      origin: "generated", durationSec: 15,
    });
    const f = find("rainy synth heartbreak");
    expect(f?.id).toBe("gen-1");
  });
  it("LRU caps generated songs at 20", () => {
    const { addGenerated, all } = lib.getState();
    for (let i = 0; i < 25; i++) {
      addGenerated({
        id: `gen-${i}`, title: `T${i}`, vibe: `vibe-${i}`,
        freeformLabel: `label ${i}`, src: `blob:${i}`,
        origin: "generated", durationSec: 15,
      });
    }
    const generated = all().filter((s) => s.origin === "generated");
    expect(generated.length).toBe(20);
    expect(generated.find((s) => s.id === "gen-0")).toBeUndefined();
    expect(generated.find((s) => s.id === "gen-24")).toBeDefined();
  });
});
