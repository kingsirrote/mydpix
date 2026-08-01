import { describe, it, expect } from "vitest";
import { formatCount, slugify } from "@/lib/utils";

describe("formatCount", () => {
  it("returns raw numbers under 1000", () => {
    expect(formatCount(950)).toBe("950");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCount(1500)).toBe("1.5K");
    expect(formatCount(2000)).toBe("2K");
  });

  it("formats millions with M suffix", () => {
    expect(formatCount(2_500_000)).toBe("2.5M");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Office Humor & Work Life")).toBe("office-humor-work-life");
  });

  it("collapses repeated whitespace", () => {
    expect(slugify("too   many   spaces")).toBe("too-many-spaces");
  });
});
