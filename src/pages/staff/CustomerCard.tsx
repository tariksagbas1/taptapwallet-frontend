import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Gift, Undo2, ArrowLeft, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useActiveLocation } from "./StaffLayout";
import { enqueueAction } from "@/lib/offlineQueue";

interface PassData {
  id: string;
  merchant_id: string;
  program_id: string;
  customer: { first_name: string; last_name: string | null; phone: string | null };
  program: { name: string; brand_primary_color: string | null };
  threshold: number;
  reward_label: string;
  reward_definition_id: string | null;
  current_stamps: number;
}

const UNDO_WINDOW_MS = 30_000;

export default function CustomerCard() {
  const { passId } = useParams();
  const navigate = useNavigate();
  const locationId = useActiveLocation();
  const [data, setData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ id: string; at: number; kind: "stamp" } | null>(null);
  const [undoTick, setUndoTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setUndoTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    if (!passId) return;
    setLoading(true);
    const { data: pass } = await supabase
      .from("passes")
      .select("id, merchant_id, program_id, customers:customer_id(first_name,last_name,phone), programs:program_id(name,brand_primary_color,program_rules(rule_json),reward_definitions(id,reward_title,is_active))")
      .eq("id", passId)
      .maybeSingle();
    if (!pass) { setData(null); setLoading(false); return; }

    const { data: stampRows } = await supabase
      .from("stamp_events").select("delta").eq("pass_id", passId);
    const stamps = (stampRows ?? []).reduce((s, r: any) => s + (r.delta ?? 0), 0);

    const program: any = pass.programs;
    const rule = program?.program_rules?.[0]?.rule_json ?? {};
    const activeReward = (program?.reward_definitions ?? []).find((r: any) => r.is_active);

    setData({
      id: pass.id,
      merchant_id: pass.merchant_id,
      program_id: pass.program_id,
      customer: pass.customers as any,
      program: { name: program?.name ?? "—", brand_primary_color: program?.brand_primary_color },
      threshold: Number(rule.threshold ?? 10),
      reward_label: rule.reward_label ?? activeReward?.reward_title ?? "Ödül",
      reward_definition_id: activeReward?.id ?? null,
      current_stamps: Math.max(0, stamps),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [passId]);

  const callFn = async (fn: "stamp-action" | "redeem-reward", body: Record<string, unknown>) => {
    if (!navigator.onLine) {
      await enqueueAction({ fn, body });
      toast({ title: "Çevrimdışı: işlem kuyruğa alındı" });
      // Optimistic update for stamp
      if (fn === "stamp-action" && data) {
        setData({ ...data, current_stamps: data.current_stamps + ((body.delta as number) ?? 1) });
      }
      return { offline: true } as const;
    }
    const { data: res, error } = await supabase.functions.invoke(fn, { body });
    if (error) {
      const msg = (res as any)?.error ?? error.message ?? "Hata";
      toast({ title: msg, variant: "destructive" });
      return null;
    }
    return res as any;
  };

  const onStamp = async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    const res = await callFn("stamp-action", {
      pass_id: data.id,
      location_id: locationId,
      delta: 1,
    });
    setSubmitting(false);
    if (res && !("offline" in res)) {
      toast({ title: `Damga eklendi (${res.new_total}/${res.threshold})` });
      setLastEvent({ id: res.event_id, at: Date.now(), kind: "stamp" });
      setData({ ...data, current_stamps: res.new_total });
    }
  };

  const onUndo = async () => {
    if (!data || !lastEvent || submitting) return;
    setSubmitting(true);
    const res = await callFn("stamp-action", {
      pass_id: data.id,
      location_id: locationId,
      delta: -1,
      reversal_of_event_id: lastEvent.id,
    });
    setSubmitting(false);
    if (res && !("offline" in res)) {
      toast({ title: "İşlem geri alındı" });
      setLastEvent(null);
      setData({ ...data, current_stamps: res.new_total });
    }
  };

  const onRedeem = async () => {
    if (!data?.reward_definition_id || submitting) return;
    setSubmitting(true);
    const res = await callFn("redeem-reward", {
      pass_id: data.id,
      location_id: locationId,
      reward_definition_id: data.reward_definition_id,
    });
    setSubmitting(false);
    if (res && !("offline" in res)) {
      toast({ title: "Ödül kullanıldı 🎉" });
      setData({ ...data, current_stamps: res.new_total });
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Pass bulunamadı</p>
        <Button onClick={() => navigate("/staff/scan")} variant="outline">Geri</Button>
      </div>
    );
  }

  const unlocked = data.current_stamps >= data.threshold;
  const undoSecondsLeft = lastEvent ? Math.max(0, Math.ceil((UNDO_WINDOW_MS - (Date.now() - lastEvent.at)) / 1000)) : 0;
  const undoVisible = undoSecondsLeft > 0;
  // tick reference to avoid unused warning
  void undoTick;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
        <ArrowLeft className="h-4 w-4" /> Geri
      </Button>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Üye</div>
        <div className="mt-1 text-xl font-bold">
          {data.customer.first_name} {data.customer.last_name ?? ""}
        </div>
        <div className="text-sm text-muted-foreground">{data.customer.phone ?? ""}</div>
        <div className="mt-3 text-sm">{data.program.name}</div>
      </Card>

      <Card className="p-5 text-center">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Damga</div>
        <div className="my-2 text-5xl font-extrabold tabular-nums">
          {data.current_stamps}<span className="text-2xl text-muted-foreground"> / {data.threshold}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: data.threshold }).map((_, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-full border ${
                i < data.current_stamps ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"
              }`}
            >
              {i < data.current_stamps && <Check className="h-3 w-3" />}
            </div>
          ))}
        </div>
      </Card>

      {unlocked && data.reward_definition_id ? (
        <Button onClick={onRedeem} disabled={submitting} size="lg" className="h-16 text-lg">
          <Gift className="h-5 w-5" /> Ödülü kullan: {data.reward_label}
        </Button>
      ) : (
        <Button onClick={onStamp} disabled={submitting} size="lg" className="h-16 text-lg">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Damga ver
        </Button>
      )}

      {undoVisible && (
        <Button onClick={onUndo} variant="outline" disabled={submitting}>
          <Undo2 className="h-4 w-4" /> Geri al ({undoSecondsLeft}s)
        </Button>
      )}
    </div>
  );
}
