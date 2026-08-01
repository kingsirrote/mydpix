import { describe, it, expect } from "vitest";
import { suggestStyle, buildImagePrompt, captionSuggestion } from "@/lib/ai/promptEngine";

describe("suggestStyle", () => {
  it("detects office humor from workplace language", () => {
    expect(suggestStyle("My boss scheduled a meeting for 5:59pm on a Friday")).toBe("office-meme");
  });

  it("detects naija skit style from local cultural terms", () => {
    expect(suggestStyle("NEPA took light during the owambe in Lagos")).toBe("naija-skit");
  });

  it("detects drake format for comparison prompts", () => {
    expect(suggestStyle("Working out vs staying in bed")).toBe("drake-format");
  });

  it("falls back to classic macro for unmatched prompts", () => {
    expect(suggestStyle("A perfectly ordinary Tuesday")).toBe("classic-macro");
  });
});

describe("buildImagePrompt", () => {
  it("includes the situation and style directive", () => {
    const prompt = buildImagePrompt({
      situation: "My salary disappeared after paying rent",
      style: "reaction-face",
      aspectRatio: "1:1",
    });
    expect(prompt).toContain("My salary disappeared after paying rent");
    expect(prompt).toContain("reaction-face".replace("-", " ") === "reaction face" ? "reaction-face" : prompt);
  });

  it("always includes the safety and no-public-figure guardrails", () => {
    const prompt = buildImagePrompt({ situation: "test", style: "classic-macro", aspectRatio: "1:1" });
    expect(prompt).toContain("No real, named public figures");
  });

  it("varies phrasing across variation seeds", () => {
    const a = buildImagePrompt({ situation: "test", style: "classic-macro", aspectRatio: "1:1", variationSeed: 0 });
    const b = buildImagePrompt({ situation: "test", style: "classic-macro", aspectRatio: "1:1", variationSeed: 1 });
    expect(a).not.toBe(b);
  });
});

describe("captionSuggestion", () => {
  it("truncates long situations for the bottom caption", () => {
    const long = "a".repeat(100);
    const { bottom } = captionSuggestion(long);
    expect(bottom.length).toBeLessThanOrEqual(60);
  });
});
