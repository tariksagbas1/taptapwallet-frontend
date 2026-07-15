import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { absoluteAppUrl } from "./appUrl";

describe("absoluteAppUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://tariksagbas1.github.io" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes BASE_URL prefix for GitHub Pages subpath", () => {
    vi.stubEnv("BASE_URL", "/taptapwallet-frontend/");
    expect(absoluteAppUrl("/join/cafe/stamp")).toBe(
      "https://tariksagbas1.github.io/taptapwallet-frontend/join/cafe/stamp",
    );
  });

  it("works at site root when BASE_URL is /", () => {
    vi.stubEnv("BASE_URL", "/");
    expect(absoluteAppUrl("/join/cafe/stamp")).toBe(
      "https://tariksagbas1.github.io/join/cafe/stamp",
    );
  });
});
