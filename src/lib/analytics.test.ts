import { describe, it, expect } from "vitest";
import {
  periodStart,
  previousPeriodStart,
  startOfDay,
  startOfWeek,
  relativeFromNow,
  bucketByWeek,
  pctDelta,
} from "./analytics";

describe("analytics helpers", () => {
  it("periodStart goes back N days", () => {
    const now = Date.now();
    const d = periodStart(7).getTime();
    expect(now - d).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("previousPeriodStart goes back 2N days", () => {
    const a = previousPeriodStart(30).getTime();
    const b = periodStart(30).getTime();
    expect(b - a).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
  });

  it("startOfDay zeroes time", () => {
    const d = startOfDay(new Date("2026-05-16T14:32:11Z"));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("startOfWeek snaps to Monday", () => {
    // Sat 2026-05-16 -> previous Monday 2026-05-11
    const m = startOfWeek(new Date(2026, 4, 16));
    expect(m.getDay()).toBe(1);
    expect(m.getDate()).toBe(11);
  });

  it("relativeFromNow buckets correctly", () => {
    const now = Date.now();
    expect(relativeFromNow(new Date(now - 30 * 1000).toISOString())).toBe("az önce");
    expect(relativeFromNow(new Date(now - 5 * 60 * 1000).toISOString())).toMatch(/dk önce/);
    expect(relativeFromNow(new Date(now - 3 * 60 * 60 * 1000).toISOString())).toMatch(/saat önce/);
    expect(relativeFromNow(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())).toMatch(/gün önce/);
  });

  it("bucketByWeek puts rows into weekly buckets", () => {
    const now = new Date();
    const rows = [
      { created_at: now.toISOString() },
      { created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const b = bucketByWeek(rows, 12);
    const totals = Array.from(b.values()).reduce((s, v) => s + v.length, 0);
    expect(totals).toBe(2);
    expect(b.size).toBe(12);
  });

  it("pctDelta handles zero baseline", () => {
    expect(pctDelta(0, 0)).toEqual({ value: 0, positive: true });
    expect(pctDelta(5, 0)).toEqual({ value: 100, positive: true });
    expect(pctDelta(10, 5)).toEqual({ value: 100, positive: true });
    expect(pctDelta(2, 4)).toEqual({ value: -50, positive: false });
  });
});
