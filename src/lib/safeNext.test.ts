import { describe, it, expect } from "vitest";
import { safeNext } from "./safeNext";

describe("safeNext", () => {
  it("falls back to /dashboard for empty/null/undefined", () => {
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs (open-redirect guard)", () => {
    expect(safeNext("//evil.com/path")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
  });

  it("rejects absolute http(s) URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("http://evil.com/x")).toBe("/dashboard");
  });

  it("rejects relative paths without leading slash", () => {
    expect(safeNext("dashboard")).toBe("/dashboard");
    expect(safeNext("invite/accept?token=x")).toBe("/dashboard");
  });

  it("accepts same-origin paths with query/hash", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/invite/accept?token=abc")).toBe("/invite/accept?token=abc");
    expect(safeNext("/dashboard#tab")).toBe("/dashboard#tab");
  });

  it("rejects non-string input defensively", () => {
    // @ts-expect-error runtime guard
    expect(safeNext(42)).toBe("/dashboard");
  });
});
