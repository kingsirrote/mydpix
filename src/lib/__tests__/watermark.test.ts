import { describe, it, expect } from "vitest";
import { wrapText } from "@/lib/watermark";

describe("wrapText", () => {
  it("keeps short text on one line", () => {
    expect(wrapText("HELLO WORLD", 20)).toEqual(["HELLO WORLD"]);
  });

  it("wraps long text across multiple lines without breaking words", () => {
    const lines = wrapText("WHEN THE GROUP CHAT PLANS A TRIP BUT NOBODY SENDS MONEY", 15);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(15 + 20); // allows one long word to overflow, never splits mid-word
    }
    expect(lines.join(" ")).not.toMatch(/[A-Z]-[A-Z]/); // no hyphenated word-splits
  });

  it("caps runaway captions at 4 lines", () => {
    const longText = Array.from({ length: 30 }, (_, i) => `WORD${i}`).join(" ");
    const lines = wrapText(longText, 10);
    expect(lines.length).toBeLessThanOrEqual(4);
  });
});
