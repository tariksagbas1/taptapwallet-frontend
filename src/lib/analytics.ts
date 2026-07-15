export type Period = 7 | 30 | 90;

export function periodStart(period: Period): Date {
  return new Date(Date.now() - period * 24 * 60 * 60 * 1000);
}
export function previousPeriodStart(period: Period): Date {
  return new Date(Date.now() - 2 * period * 24 * 60 * 60 * 1000);
}

export function startOfDay(d: Date | string): Date {
  const date = typeof d === "string" ? new Date(d) : new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(d: Date | string): Date {
  // Monday-start
  const date = startOfDay(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

export function relativeFromNow(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "az önce";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} gün önce`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} hafta önce`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} ay önce`;
  return `${Math.floor(day / 365)} yıl önce`;
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function formatWeekLabel(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// Build a 12-week time-series bucketed by week start
export function bucketByWeek<T extends { created_at: string }>(
  rows: T[],
  weeks: number,
): Map<string, T[]> {
  const buckets = new Map<string, T[]>();
  const start = startOfWeek(new Date(Date.now() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000));
  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    buckets.set(d.toISOString(), []);
  }
  for (const row of rows) {
    const wk = startOfWeek(row.created_at).toISOString();
    if (buckets.has(wk)) buckets.get(wk)!.push(row);
  }
  return buckets;
}

export function pctDelta(current: number, previous: number): { value: number; positive: boolean } {
  if (previous === 0) return { value: current === 0 ? 0 : 100, positive: current >= 0 };
  const v = ((current - previous) / previous) * 100;
  return { value: Math.round(v), positive: v >= 0 };
}
