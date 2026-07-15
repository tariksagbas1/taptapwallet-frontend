import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and replaces Turkish diacritics", () => {
    expect(slugify("Karakter Kahve")).toBe("karakter-kahve");
    expect(slugify("İstanbul Şubesi")).toBe("istanbul-subesi");
    expect(slugify("Çiğdem Öğüt")).toBe("cigdem-ogut");
  });

  it("collapses runs of non-alphanumerics into single hyphens", () => {
    expect(slugify("a  b   c")).toBe("a-b-c");
    expect(slugify("a!@#b")).toBe("a-b");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
    expect(slugify("---x---")).toBe("x");
  });

  it("caps at 60 chars", () => {
    const s = slugify("a".repeat(120));
    expect(s.length).toBeLessThanOrEqual(60);
  });

  it("returns empty for purely non-alphanumeric input", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
