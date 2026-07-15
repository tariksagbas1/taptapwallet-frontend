import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Stamp, Gift, TrendingUp, Loader2 } from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { TimeSeriesChart, TimeSeriesPoint } from "@/components/analytics/TimeSeriesChart";
import { LocationBars } from "@/components/analytics/LocationBars";
import { RetentionGrid, CohortRow } from "@/components/analytics/RetentionGrid";
import {
  Period,
  bucketByWeek,
  formatWeekLabel,
  pctDelta,
  periodStart,
  previousPeriodStart,
  startOfWeek,
} from "@/lib/analytics";

export default function Overview() {
  const { merchant } = useAuth();
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<{ id: string; created_at: string }[]>([]);
  const [stamps, setStamps] = useState<{ customer_id: string; created_at: string; location_id: string | null }[]>([]);
  const [redemptions, setRedemptions] = useState<{ created_at: string }[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!merchant) return;
    setLoading(true);
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      const [cs, ss, rs, rw, locs] = await Promise.all([
        supabase
          .from("customers")
          .select("id, created_at")
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("stamp_events")
          .select("customer_id, created_at, location_id")
          .eq("merchant_id", merchant.id)
          .gte("created_at", since)
          .gt("delta", 0)
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("redemption_events")
          .select("created_at")
          .eq("merchant_id", merchant.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("reward_state")
          .select("id", { count: "exact", head: true })
          .in("state", ["unlocked", "redeemed"]),
        supabase.from("locations").select("id, name").eq("merchant_id", merchant.id),
      ]);
      setCustomers(cs.data ?? []);
      setStamps(ss.data ?? []);
      setRedemptions(rs.data ?? []);
      setUnlockedCount(rw.count ?? 0);
      setLocations(locs.data ?? []);
      setLoading(false);
    })();
  }, [merchant]);

  const periodCutoff = useMemo(() => periodStart(period).getTime(), [period]);
  const prevCutoff = useMemo(() => previousPeriodStart(period).getTime(), [period]);

  const totalMembers = customers.length;

  const activeMemberIds = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const set = new Set<string>();
    for (const s of stamps) if (new Date(s.created_at).getTime() >= cutoff) set.add(s.customer_id);
    return set;
  }, [stamps]);

  const stampsThisPeriod = useMemo(
    () => stamps.filter((s) => new Date(s.created_at).getTime() >= periodCutoff).length,
    [stamps, periodCutoff],
  );
  const stampsPrevPeriod = useMemo(
    () =>
      stamps.filter((s) => {
        const t = new Date(s.created_at).getTime();
        return t >= prevCutoff && t < periodCutoff;
      }).length,
    [stamps, periodCutoff, prevCutoff],
  );
  const membersThisPeriod = useMemo(
    () => customers.filter((c) => new Date(c.created_at).getTime() >= periodCutoff).length,
    [customers, periodCutoff],
  );
  const membersPrevPeriod = useMemo(
    () =>
      customers.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= prevCutoff && t < periodCutoff;
      }).length,
    [customers, periodCutoff, prevCutoff],
  );
  const redemptionsThisPeriod = useMemo(
    () => redemptions.filter((r) => new Date(r.created_at).getTime() >= periodCutoff).length,
    [redemptions, periodCutoff],
  );
  const redemptionRate = unlockedCount === 0 ? 0 : Math.round((redemptions.length / unlockedCount) * 100);

  const series: TimeSeriesPoint[] = useMemo(() => {
    const weeks = 12;
    const memberBuckets = bucketByWeek(customers, weeks);
    const stampBuckets = bucketByWeek(stamps, weeks);
    const labels = Array.from(memberBuckets.keys());
    return labels.map((iso) => ({
      label: formatWeekLabel(new Date(iso)),
      members: memberBuckets.get(iso)!.length,
      stamps: stampBuckets.get(iso)?.length ?? 0,
    }));
  }, [customers, stamps]);

  const locationRows = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();
    for (const s of stamps) {
      if (!s.location_id) continue;
      if (new Date(s.created_at).getTime() < cutoff) continue;
      counts.set(s.location_id, (counts.get(s.location_id) ?? 0) + 1);
    }
    const nameMap = new Map(locations.map((l) => [l.id, l.name]));
    return Array.from(counts.entries())
      .map(([id, value]) => ({ name: nameMap.get(id) ?? "Bilinmeyen", value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [stamps, locations]);

  const cohorts: CohortRow[] = useMemo(() => {
    const weeks = 8;
    const start = startOfWeek(new Date(Date.now() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000));
    const stampsByCustomer = new Map<string, number[]>();
    for (const s of stamps) {
      const arr = stampsByCustomer.get(s.customer_id) ?? [];
      arr.push(new Date(s.created_at).getTime());
      stampsByCustomer.set(s.customer_id, arr);
    }
    const out: CohortRow[] = [];
    for (let i = 0; i < weeks; i++) {
      const wStart = new Date(start);
      wStart.setDate(wStart.getDate() + i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);
      const cohort = customers.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= wStart.getTime() && t < wEnd.getTime();
      });
      if (cohort.length === 0) {
        out.push({ weekLabel: formatWeekLabel(wStart), size: 0, d7: 0, d30: 0 });
        continue;
      }
      let d7 = 0;
      let d30 = 0;
      for (const c of cohort) {
        const signup = new Date(c.created_at).getTime();
        const visits = stampsByCustomer.get(c.id) ?? [];
        if (visits.some((t) => t > signup && t <= signup + 7 * 86400_000)) d7++;
        if (visits.some((t) => t > signup && t <= signup + 30 * 86400_000)) d30++;
      }
      out.push({
        weekLabel: formatWeekLabel(wStart),
        size: cohort.length,
        d7: d7 / cohort.length,
        d30: d30 / cohort.length,
      });
    }
    return out;
  }, [customers, stamps]);

  const periodLabel = period === 7 ? "7g" : period === 30 ? "30g" : "90g";

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Genel Bakış</h1>
          <p className="mt-1 text-muted-foreground">Sadakat programı performansı.</p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {([7, 30, 90] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setPeriod(p)}
            >
              Son {p}g
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Toplam üye"
              value={totalMembers.toLocaleString("tr-TR")}
              icon={Users}
              delta={pctDelta(membersThisPeriod, membersPrevPeriod)}
              hint={`+${membersThisPeriod} son ${periodLabel}`}
            />
            <KpiCard
              label="Aktif üye (30g)"
              value={activeMemberIds.size.toLocaleString("tr-TR")}
              icon={TrendingUp}
              hint={`${totalMembers > 0 ? Math.round((activeMemberIds.size / totalMembers) * 100) : 0}% / toplam`}
            />
            <KpiCard
              label={`Damga / ${periodLabel}`}
              value={stampsThisPeriod.toLocaleString("tr-TR")}
              icon={Stamp}
              delta={pctDelta(stampsThisPeriod, stampsPrevPeriod)}
            />
            <KpiCard
              label="Ödül kullanma"
              value={`${redemptionRate}%`}
              icon={Gift}
              hint={`${redemptionsThisPeriod} ödül son ${periodLabel}`}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader>
                <CardTitle>Son 12 hafta</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart data={series} />
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Damga
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Yeni üye
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Şube performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationBars rows={locationRows} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Geri dönüş kohort (D7 / D30)</CardTitle>
            </CardHeader>
            <CardContent>
              <RetentionGrid rows={cohorts} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
