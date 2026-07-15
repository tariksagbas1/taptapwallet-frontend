// Customer segmentation constants + pure helpers. Mirror of the SQL function
// public.recompute_customer_metrics so the dashboard can filter/label client-side.

export const LIFECYCLE_THRESHOLDS = {
  newWindowDays: 7,
  activeDays: 30,
  atRiskDays: 60,
  inactiveDays: 90,
} as const;

export const LOYALTY_THRESHOLDS = {
  vip: 10,
  regular: 5,
  repeat: 2,
} as const;

export type LifecycleStatus = "new" | "active" | "at_risk" | "inactive" | "churned";
export type LoyaltySegment = "first_timer" | "repeat_customer" | "regular" | "vip";
export type BirthdaySegment =
  | "birthday_this_week"
  | "birthday_this_month"
  | "birthday_next_30_days"
  | "no_birthday";

export const LIFECYCLE_LABEL_TR: Record<LifecycleStatus, string> = {
  new: "Yeni",
  active: "Aktif",
  at_risk: "Risk altında",
  inactive: "Pasif",
  churned: "Kayıp",
};

export const LOYALTY_LABEL_TR: Record<LoyaltySegment, string> = {
  first_timer: "İlk kez",
  repeat_customer: "Tekrarlayan",
  regular: "Düzenli",
  vip: "VIP",
};

export function birthdaySegment(
  birthMonth: number | null,
  birthDay: number | null,
  now = new Date(),
): BirthdaySegment {
  if (!birthMonth || !birthDay) return "no_birthday";
  const year = now.getFullYear();
  let next = new Date(year, birthMonth - 1, birthDay);
  if (next < startOfDay(now)) next = new Date(year + 1, birthMonth - 1, birthDay);
  const days = Math.floor((next.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (days <= 7) return "birthday_this_week";
  if (next.getMonth() === now.getMonth() && next.getFullYear() === year) return "birthday_this_month";
  if (days <= 30) return "birthday_next_30_days";
  return "no_birthday";
}

export function daysUntilBirthday(
  birthMonth: number | null,
  birthDay: number | null,
  now = new Date(),
): number | null {
  if (!birthMonth || !birthDay) return null;
  const year = now.getFullYear();
  let next = new Date(year, birthMonth - 1, birthDay);
  if (next < startOfDay(now)) next = new Date(year + 1, birthMonth - 1, birthDay);
  return Math.floor((next.getTime() - startOfDay(now).getTime()) / 86_400_000);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
