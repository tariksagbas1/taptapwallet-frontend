import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Stamp, Gift, Wallet, Undo2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { relativeFromNow } from "@/lib/analytics";

interface PassRow {
  id: string;
  program_id: string;
  pass_status: string;
  programs: { name: string; slug: string } | null;
}

interface EventRow {
  id: string;
  type: "stamp" | "redemption";
  delta?: number;
  created_at: string;
  reversal_of_event_id?: string | null;
  pass_id?: string;
  program_id?: string;
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [passes, setPasses] = useState<PassRow[]>([]);
  const [stampsByPass, setStampsByPass] = useState<Map<string, number>>(new Map());
  const [thresholdsByProgram, setThresholdsByProgram] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleKvkkDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-customer-data", {
        body: { customer_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Üye silindi", description: "Tüm KVKK kapsamındaki veriler kaldırıldı." });
      navigate("/dashboard/members");
    } catch (e: any) {
      toast({ title: "Silinemedi", description: e?.message ?? "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const load = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    const { data: stamps } = await supabase
      .from("stamp_events")
      .select("id,delta,reason,created_at,reversal_of_event_id,pass_id,program_id")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });
    const { data: redeems } = await supabase
      .from("redemption_events")
      .select("id,created_at,pass_id")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });
    const { data: ps } = await supabase
      .from("passes")
      .select("id, program_id, pass_status, programs:program_id(name, slug)")
      .eq("customer_id", id);

    setData(c);
    setPasses((ps ?? []) as any);

    // current stamp totals per pass
    const totals = new Map<string, number>();
    for (const s of stamps ?? []) {
      totals.set(s.pass_id, (totals.get(s.pass_id) ?? 0) + (s.delta ?? 0));
    }
    setStampsByPass(totals);

    // thresholds per program
    const programIds = Array.from(new Set((ps ?? []).map((p: any) => p.program_id)));
    if (programIds.length > 0) {
      const { data: rules } = await supabase
        .from("program_rules")
        .select("program_id, rule_json")
        .in("program_id", programIds);
      const map = new Map<string, number>();
      for (const r of rules ?? []) {
        const merged = (r.rule_json as any) ?? {};
        const t = Number(merged.threshold ?? 0);
        if (t > 0) map.set(r.program_id, t);
      }
      setThresholdsByProgram(map);
    }

    const merged: EventRow[] = [
      ...(stamps ?? []).map((s: any) => ({ ...s, type: "stamp" as const })),
      ...(redeems ?? []).map((r: any) => ({ ...r, type: "redemption" as const })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setEvents(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, EventRow[]>();
    for (const e of events) {
      const key = new Date(e.created_at).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const arr = groups.get(key) ?? [];
      arr.push(e);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [events]);

  const generatePass = async (programId: string) => {
    if (!id) return;
    setGenerating(programId);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-pass", {
        body: { customer_id: id, program_id: programId },
      });
      if (error) throw error;
      if (result?.download_url) {
        window.open(result.download_url, "_blank");
        toast({ title: "Pass oluşturuldu", description: ".pkpass dosyası indiriliyor." });
      }
      load();
    } catch (e: any) {
      toast({
        title: "Pass oluşturulamadı",
        description: e?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return <div className="p-12 text-center text-muted-foreground">Üye bulunamadı.</div>;

  return (
    <div className="container max-w-4xl px-4 py-8 md:py-12">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard/members">
          <ArrowLeft className="h-4 w-4" /> Üyeler
        </Link>
      </Button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">
            {data.first_name} {data.last_name ?? ""}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {data.phone && <span>{data.phone}</span>}
            {data.email && <span>{data.email}</span>}
            <span>Katılım: {new Date(data.created_at).toLocaleDateString("tr-TR")}</span>
          </div>
        </div>
        <AlertDialog onOpenChange={(o) => !o && setDeleteConfirm("")}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="mr-1 h-4 w-4" /> KVKK — Verileri sil
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Üyenin tüm verileri silinsin mi?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Üye, kartlar, damgalar, ödüller ve onaylar kalıcı olarak silinir.
                Onaylamak için aşağıya <strong>SIL</strong> yazın.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SIL"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirm !== "SIL" || deleting}
                onClick={handleKvkkDelete}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kalıcı olarak sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kartlar</CardTitle>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz program kaydı yok. Üye katılım QR kodu ile katılınca pass üretilebilir.
            </p>
          ) : (
            <div className="space-y-4">
              {passes.map((p) => {
                const current = stampsByPass.get(p.id) ?? 0;
                const threshold = thresholdsByProgram.get(p.program_id) ?? 0;
                const pct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{p.programs?.name ?? "Program"}</div>
                        <div className="text-xs text-muted-foreground">Durum: {p.pass_status}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePass(p.program_id)}
                        disabled={generating === p.program_id}
                      >
                        {generating === p.program_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                        .pkpass indir
                      </Button>
                    </div>
                    {threshold > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Damga ilerlemesi</span>
                          <span className="tabular-nums">
                            {current} / {threshold}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etkinlik geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <div className="space-y-6">
              {groupedEvents.map(([dayLabel, dayEvents]) => (
                <div key={dayLabel}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dayLabel}
                  </div>
                  <div className="space-y-2 border-l-2 border-border pl-4">
                    {dayEvents.map((e) => {
                      const isReversal = !!e.reversal_of_event_id;
                      const isStamp = e.type === "stamp";
                      const negative = isStamp && (e.delta ?? 0) < 0;
                      return (
                        <div
                          key={`${e.type}-${e.id}`}
                          className="relative flex items-center gap-3 rounded-md border border-border bg-card p-3"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              isReversal || negative
                                ? "bg-muted text-muted-foreground"
                                : isStamp
                                  ? "bg-primary/10 text-primary"
                                  : "bg-accent/15 text-accent"
                            }`}
                          >
                            {isReversal || negative ? (
                              <Undo2 className="h-4 w-4" />
                            ) : isStamp ? (
                              <Stamp className="h-4 w-4" />
                            ) : (
                              <Gift className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {isStamp
                                ? isReversal
                                  ? "Damga geri alındı"
                                  : `${(e.delta ?? 0) > 0 ? "+" : ""}${e.delta} damga`
                                : "Ödül kullanıldı"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {relativeFromNow(e.created_at)} ·{" "}
                              {new Date(e.created_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
