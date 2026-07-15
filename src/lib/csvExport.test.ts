import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCsv } from "./csvExport";

describe("downloadCsv", () => {
  let captured: string[] = [];
  let lastFilename = "";

  beforeEach(() => {
    captured = [];
    lastFilename = "";

    // Patch Blob to capture textual content (jsdom Blob has no .text()).
    const RealBlob = global.Blob;
    vi.stubGlobal(
      "Blob",
      class extends RealBlob {
        constructor(parts: any[], opts?: BlobPropertyBag) {
          super(parts, opts);
          captured.push(parts.map((p) => String(p)).join(""));
        }
      } as any,
    );

    (URL as any).createObjectURL = vi.fn(() => "blob:test");
    (URL as any).revokeObjectURL = vi.fn();

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as any;
      if (tag === "a") {
        el.click = vi.fn(() => {
          lastFilename = el.download;
        });
      }
      return el;
    });
  });

  it("alerts and exits when rows empty", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    downloadCsv("x.csv", []);
    expect(alertSpy).toHaveBeenCalled();
    expect(captured).toHaveLength(0);
  });

  it("writes a UTF-8 BOM and CSV header", () => {
    downloadCsv("members.csv", [{ name: "Ayşe", count: 3 }]);
    const text = captured[0];
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("name,count");
    expect(text).toContain("Ayşe,3");
    expect(lastFilename).toBe("members.csv");
  });

  it("escapes commas, quotes, and newlines", () => {
    downloadCsv("x.csv", [{ note: 'a,b "c"\nd' }]);
    expect(captured[0]).toContain('"a,b ""c""\nd"');
  });

  it("renders null/undefined as empty cells", () => {
    downloadCsv("x.csv", [{ a: null, b: undefined, c: 0 }]);
    expect(captured[0]).toContain("a,b,c");
    expect(captured[0]).toContain(",,0");
  });
});
