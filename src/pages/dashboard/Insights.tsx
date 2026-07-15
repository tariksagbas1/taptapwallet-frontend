import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCustomersWithMetrics, type CustomerRow } from "@/lib/insights";
import {
  birthdaySegment,
  daysUntilBirthday,
} from "@/lib/segments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/analytics/KpiCard";
import {
  Users,
  UserPlus,
  Activity,
  Crown,
  AlertTriangle,
  Mail,
  Cake,
  Gift,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Insights() {
  const { merchant } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchant) return;
    setLoading(true);
    fetchCustomersWithMetrics(merchant.id).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [merchant]);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 86_400_000;
    let newWeek = 0,
      newMonth = 0,
      active = 0,
      loyal = 0,
      atRisk = 0,
      inactive = 0,
      optIn = 0,
      hasBirthday = 0,
      totalRedeemed = 0,
      totalVisits = 0;
    for (const c of rows) {
      const created = new Date(c.created_at).getTime();
      if (now - created < 7 * day) newWeek++;
      if (now - created < 30 * day) newMonth++;
      if (c.marketing_opt_in) optIn++;
      if (c.birth_day && c.birth_month) hasBirthday++;
      const m = c.metrics;
      if (m) {
        if (m.lifecycle_status === "active" || m.lifecycle_status === "new") active++;
        if (m.loyalty_segment === "vip" || m.loyalty_segment === "regular") loyal++;
        if (m.lifecycle_status === "at_risk") atRisk++;
        if (m.lifecycle_status === "inactive" || m.lifecycle_status === "churned") inactive++;
        totalRedeemed += m.total_rewards_redeemed;
        totalVisits += m.total_visits;
      }
    }
    const total = rows.length;
    return {
      total,
      newWeek,
      newMonth,
      active,
      loyal,
      atRisk,
      inactive,
      optInRate: total ? Math.round((optIn / total) * 100) : 0,
      birthdayCoverage: total ? Math.round((hasBirthday / total) * 100) : 0,
      avgVisits: total ? (totalVisits / total).toFixed(1) : "0",
      totalRedeemed,
    };
  }, [rows]);

  const upcomingBirthdays = useMemo(() => {
    return rows
      .map((c) => ({ c, days: daysUntilBirthday(c.birth_month, c.birth_day) }))
      .filter((x): x is { c: CustomerRow; days: number } => x.days !== null && x.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  }, [rows]);

  const insightsBullets = useMemo(() => {
    const out: string[] = [];
    if (stats.atRisk > 0) out.push(`${stats.atRisk} müşteri 30-60 gündür uğramadı (risk altında).`);
    if (stats.inactive > 0) out.push(`${stats.inactive} müşteri uzun süredir pasif. Geri çağırma fırsatı.`);
    const bdThisMonth = upcomingBirthdays.filter(
      (x) => birthdaySegment(x.c.birth_month, x.c.birth_day) !== "no_birthday" &&
        new Date(new Date().getFullYear(), x.c.birth_month! - 1, x.c.birth_day!).getMonth() === new Date().getMonth(),
    ).length;
    if (bdThisMonth > 0) out.push(`${bdThisMonth} müşterinin doğum günü bu ay.`);
    if (stats.birthdayCoverage < 50 && stats.total > 0)
      out.push(`Doğum günü veri kapsamı %${stats.birthdayCoverage}. Daha fazla müşteriden doğum günü toplayın.`);
    if (stats.optInRate > 0)
      out.push(`Müşterilerin %${stats.optInRate}'i pazarlama izni verdi.`);
    return out;
  }, [stats, upcomingBirthdays]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Müşteri İçgörüleri</h1>
          <p className="mt-1 text-muted-foreground">
            Müşterilerinizi tanıyın, segmentlere ayırın ve davranışlarını takip edin.
          </p>
        </div>
        <Link to="/dashboard/insights/customers">
          <Button variant="outline">Tüm müşterileri görüntüle</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Toplam müşteri" value={stats.total.toLocaleString("tr-TR")} icon={Users} hint={`+${stats.newWeek} son 7g`} />
        <KpiCard label="Yeni (30g)" value={stats.newMonth.toLocaleString("tr-TR")} icon={UserPlus} />
        <KpiCard label="Aktif" value={stats.active.toLocaleString("tr-TR")} icon={Activity} />
        <KpiCard label="Sadık / VIP" value={stats.loyal.toLocaleString("tr-TR")} icon={Crown} />
        <KpiCard label="Risk altında" value={stats.atRisk.toLocaleString("tr-TR")} icon={AlertTriangle} />
        <KpiCard label="Pazarlama izni" value={`${stats.optInRate}%`} icon={Mail} />
        <KpiCard label="Doğum günü kapsamı" value={`${stats.birthdayCoverage}%`} icon={Cake} />
        <KpiCard label="Ortalama ziyaret" value={stats.avgVisits} icon={Gift} hint={`${stats.totalRedeemed} ödül kullanıldı`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Bu hafta öne çıkanlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsBullets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz veri yok. Müşterileriniz katıldıkça öneriler burada görünecek.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {insightsBullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-primary" /> Yaklaşan doğum günleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Önümüzdeki 30 günde doğum günü olan müşteri yok.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcomingBirthdays.map(({ c, days }) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <Link
                      to={`/dashboard/insights/customers/${c.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {c.first_name} {c.last_name ?? ""}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {days === 0 ? "Bugün 🎉" : `${days} gün`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Veri kalitesi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DataQualityItem
            label="E-posta eksik"
            count={rows.filter((c) => !c.email).length}
            total={rows.length}
            href="/dashboard/insights/customers?filter=no_email"
          />
          <DataQualityItem
            label="Doğum günü eksik"
            count={rows.filter((c) => !c.birth_day || !c.birth_month).length}
            total={rows.length}
            href="/dashboard/insights/customers?filter=no_birthday"
          />
          <DataQualityItem
            label="Pazarlama izni yok"
            count={rows.filter((c) => !c.marketing_opt_in).length}
            total={rows.length}
            href="/dashboard/insights/customers?filter=no_marketing"
          />
          <DataQualityItem
            label="Hiç ödül kullanmadı"
            count={rows.filter((c) => (c.metrics?.total_rewards_redeemed ?? 0) === 0).length}
            total={rows.length}
            href="/dashboard/insights/customers?filter=never_redeemed"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DataQualityItem({
  label,
  count,
  total,
  href,
}: {
  label: string;
  count: number;
  total: number;
  href: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Link
      to={href}
      className="flex flex-col rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-1 text-xl font-semibold">{count}</span>
      <span className="text-xs text-muted-foreground">/ {total} ({pct}%)</span>
    </Link>
  );
}
