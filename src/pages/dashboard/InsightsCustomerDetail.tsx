import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCustomerTimeline, type CustomerEventRow } from "@/lib/insights";
import { LIFECYCLE_LABEL_TR, LOYALTY_LABEL_TR } from "@/lib/segments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Stamp,
  Gift,
  UserPlus,
  Cake,
  Mail,
  Activity,
} from "lucide-react";

const EVENT_META: Record<string, { label: string; icon: any }> = {
  wallet_signup_completed: { label: "Wallet kartı oluşturuldu", icon: UserPlus },
  birthday_collected: { label: "Doğum günü kaydedildi", icon: Cake },
  marketing_consent_given: { label: "Pazarlama izni verildi", icon: Mail },
  stamp_added: { label: "Damga eklendi", icon: Stamp },
  stamp_reversed: { label: "Damga geri alındı", icon: Stamp },
  reward_earned: { label: "Ödül kazanıldı", icon: Gift },
  reward_redeemed: { label: "Ödül kullanıldı", icon: Gift },
};

export default function InsightsCustomerDetail() {
  const { merchant } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<CustomerEventRow[]>([]);

  useEffect(() => {
    if (!id || !merchant) return;
    setLoading(true);
    (async () => {
      const [{ data: c }, { data: m }, ev] = await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .eq("merchant_id", merchant.id)
          .maybeSingle(),
        supabase.from("customer_metrics").select("*").eq("customer_id", id).maybeSingle(),
        fetchCustomerTimeline(id),
      ]);
      setCustomer(c);
      setMetrics(m);
      setEvents(ev);
      setLoading(false);
    })();
  }, [id, merchant]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!customer) {
    return (
      <div className="container max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Müşteri bulunamadı.</p>
        <Link to="/dashboard/insights/customers" className="mt-4 inline-block text-sm underline">Geri dön</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl px-4 py-8 md:py-12">
      <Link
        to="/dashboard/insights/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Müşteriler
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">
            {customer.first_name} {customer.last_name ?? ""}
          </h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {customer.email && <span>{customer.email}</span>}
            {customer.phone && <span>{customer.phone}</span>}
            <span>Katılım: {new Date(customer.created_at).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
        {metrics && (
          <div className="flex gap-2">
            <Badge variant="secondary">{LIFECYCLE_LABEL_TR[metrics.lifecycle_status as keyof typeof LIFECYCLE_LABEL_TR]}</Badge>
            <Badge variant="outline">{LOYALTY_LABEL_TR[metrics.loyalty_segment as keyof typeof LOYALTY_LABEL_TR]}</Badge>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ziyaret" value={metrics?.total_visits ?? 0} />
        <Stat label="Damga" value={metrics?.total_stamps ?? 0} />
        <Stat label="Ödül kazanıldı" value={metrics?.total_rewards_earned ?? 0} />
        <Stat label="Ödül kullanıldı" value={metrics?.total_rewards_redeemed ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Doğum günü" value={customer.birth_day && customer.birth_month ? `${customer.birth_day}/${customer.birth_month}` : "Bilinmiyor"} />
            <Field label="Pazarlama izni" value={customer.marketing_opt_in ? `Var (${fmt(customer.marketing_opt_in_at)})` : "Yok"} />
            <Field label="Şartlar kabulü" value={fmt(customer.terms_accepted_at)} />
            <Field label="İlk ziyaret" value={fmt(metrics?.first_visit_at)} />
            <Field label="Son ziyaret" value={fmt(metrics?.last_visit_at)} />
            <Field
              label="Ortalama gün aralığı"
              value={metrics?.average_days_between_visits ? `${Number(metrics.average_days_between_visits).toFixed(1)} gün` : "—"}
            />
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Zaman çizelgesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz olay yok.</p>
            ) : (
              <ol className="space-y-3">
                {events.map((e) => {
                  const meta = EVENT_META[e.event_type] ?? { label: e.event_type, icon: Activity };
                  const Icon = meta.icon;
                  return (
                    <li key={e.id} className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString("tr-TR")}
                          {e.event_source && ` · ${e.event_source}`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function fmt(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("tr-TR") : "—";
}
