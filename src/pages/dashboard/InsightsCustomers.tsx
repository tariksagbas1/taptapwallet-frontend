import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCustomersWithMetrics, type CustomerRow } from "@/lib/insights";
import {
  birthdaySegment,
  LIFECYCLE_LABEL_TR,
  LOYALTY_LABEL_TR,
  type LifecycleStatus,
} from "@/lib/segments";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Loader2 } from "lucide-react";

type FilterKey =
  | "all"
  | "new"
  | "active"
  | "loyal"
  | "at_risk"
  | "inactive"
  | "birthday_month"
  | "marketing"
  | "no_birthday"
  | "no_email"
  | "no_marketing"
  | "redeemed"
  | "never_redeemed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni" },
  { key: "active", label: "Aktif" },
  { key: "loyal", label: "Sadık / VIP" },
  { key: "at_risk", label: "Risk altında" },
  { key: "inactive", label: "Pasif" },
  { key: "birthday_month", label: "Bu ay doğum günü" },
  { key: "marketing", label: "Pazarlama izinli" },
  { key: "no_birthday", label: "Doğum günü yok" },
  { key: "no_email", label: "E-posta yok" },
  { key: "no_marketing", label: "Pazarlama izni yok" },
  { key: "redeemed", label: "Ödül kullandı" },
  { key: "never_redeemed", label: "Hiç kullanmadı" },
];

type SortKey = "newest" | "last_visit" | "most_visits" | "most_stamps" | "birthday_soon" | "inactive_longest";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "En yeni" },
  { key: "last_visit", label: "Son ziyaret" },
  { key: "most_visits", label: "En çok ziyaret" },
  { key: "most_stamps", label: "En çok damga" },
  { key: "birthday_soon", label: "Doğum günü yakın" },
  { key: "inactive_longest", label: "En uzun pasif" },
];

export default function InsightsCustomers() {
  const { merchant } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [params, setParams] = useSearchParams();
  const filter = (params.get("filter") as FilterKey) || "all";

  useEffect(() => {
    if (!merchant) return;
    setLoading(true);
    fetchCustomersWithMetrics(merchant.id).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [merchant]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    let arr = rows.filter((c) => {
      if (s) {
        const hay = `${c.first_name} ${c.last_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      const m = c.metrics;
      const ls = m?.lifecycle_status as LifecycleStatus | undefined;
      switch (filter) {
        case "new": return ls === "new";
        case "active": return ls === "active";
        case "loyal": return m?.loyalty_segment === "vip" || m?.loyalty_segment === "regular";
        case "at_risk": return ls === "at_risk";
        case "inactive": return ls === "inactive" || ls === "churned";
        case "birthday_month": {
          if (!c.birth_month) return false;
          return c.birth_month === new Date().getMonth() + 1;
        }
        case "marketing": return c.marketing_opt_in;
        case "no_birthday": return !c.birth_day || !c.birth_month;
        case "no_email": return !c.email;
        case "no_marketing": return !c.marketing_opt_in;
        case "redeemed": return (m?.total_rewards_redeemed ?? 0) > 0;
        case "never_redeemed": return (m?.total_rewards_redeemed ?? 0) === 0;
        default: return true;
      }
    });

    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case "last_visit": {
          const av = a.metrics?.last_visit_at ? new Date(a.metrics.last_visit_at).getTime() : 0;
          const bv = b.metrics?.last_visit_at ? new Date(b.metrics.last_visit_at).getTime() : 0;
          return bv - av;
        }
        case "most_visits": return (b.metrics?.total_visits ?? 0) - (a.metrics?.total_visits ?? 0);
        case "most_stamps": return (b.metrics?.total_stamps ?? 0) - (a.metrics?.total_stamps ?? 0);
        case "birthday_soon": {
          const da = a.birth_day && a.birth_month ? monthDayKey(a.birth_month, a.birth_day) : 99999;
          const db = b.birth_day && b.birth_month ? monthDayKey(b.birth_month, b.birth_day) : 99999;
          return da - db;
        }
        case "inactive_longest": {
          const av = a.metrics?.last_visit_at ? new Date(a.metrics.last_visit_at).getTime() : 0;
          const bv = b.metrics?.last_visit_at ? new Date(b.metrics.last_visit_at).getTime() : 0;
          return av - bv;
        }
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return arr;
  }, [rows, search, filter, sort]);

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Müşteriler</h1>
        <p className="mt-1 text-muted-foreground">Segmentlere göre filtreleyin, arayın ve detaya inin.</p>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setParams(f.key === "all" ? {} : { filter: f.key })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="İsim, e-posta, telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>Sırala: {s.label}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} müşteri</span>
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Sonuç yok. Müşterileriniz kartınıza eklendikçe burada görünecek.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Yaşam döngüsü</TableHead>
                  <TableHead className="text-right">Ziyaret</TableHead>
                  <TableHead className="text-right">Damga</TableHead>
                  <TableHead className="text-right">Ödül</TableHead>
                  <TableHead>Son ziyaret</TableHead>
                  <TableHead>Doğum günü</TableHead>
                  <TableHead>Pazarlama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 500).map((c) => {
                  const m = c.metrics;
                  const bd = birthdaySegment(c.birth_month, c.birth_day);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link to={`/dashboard/insights/customers/${c.id}`} className="block">
                          <div className="font-medium hover:underline">
                            {c.first_name} {c.last_name ?? ""}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.email || c.phone || "—"}</div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {m ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="w-fit">
                              {LIFECYCLE_LABEL_TR[m.lifecycle_status]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {LOYALTY_LABEL_TR[m.loyalty_segment]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{m?.total_visits ?? 0}</TableCell>
                      <TableCell className="text-right">{m?.total_stamps ?? 0}</TableCell>
                      <TableCell className="text-right">{m?.total_rewards_redeemed ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m?.last_visit_at
                          ? new Date(m.last_visit_at).toLocaleDateString("tr-TR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.birth_day && c.birth_month
                          ? `${c.birth_day}/${c.birth_month}`
                          : "—"}
                        {bd === "birthday_this_week" && <Badge className="ml-1" variant="default">Bu hafta</Badge>}
                      </TableCell>
                      <TableCell>
                        {c.marketing_opt_in ? (
                          <Badge variant="default">İzinli</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function monthDayKey(month: number, day: number): number {
  const now = new Date();
  const year = now.getFullYear();
  let d = new Date(year, month - 1, day);
  const today = new Date(year, now.getMonth(), now.getDate());
  if (d < today) d = new Date(year + 1, month - 1, day);
  return Math.floor((d.getTime() - today.getTime()) / 86_400_000);
}
