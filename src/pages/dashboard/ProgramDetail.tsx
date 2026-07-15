import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  Stamp,
  Copy,
  CheckCircle2,
  Archive,
  Send,
  FileText,
} from "lucide-react";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { generatePosterPdf } from "@/components/programs/PosterPdf";
import { absoluteAppUrl } from "@/lib/appUrl";
import { useAuth } from "@/contexts/AuthContext";

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  merchants: { slug: string; name: string };
  program_rules: { rule_json: any }[];
}

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const { merchant } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [funnel, setFunnel] = useState<{ joined: number; firstStamp: number; unlocked: number; redeemed: number }>({
    joined: 0,
    firstStamp: 0,
    unlocked: 0,
    redeemed: 0,
  });
  const [avgDays, setAvgDays] = useState<number | null>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("programs")
      .select("*, merchants:merchant_id(slug, name), program_rules(rule_json)")
      .eq("id", id)
      .maybeSingle();
    setProgram(data as any);
    const { count } = await supabase
      .from("passes")
      .select("*", { count: "exact", head: true })
      .eq("program_id", id);
    setMemberCount(count ?? 0);

    // Funnel + avg
    const { data: passes } = await supabase
      .from("passes")
      .select("id, customer_id")
      .eq("program_id", id);
    const passIds = (passes ?? []).map((p: any) => p.id);

    let firstStamp = 0;
    let avg: number | null = null;
    if (passIds.length > 0) {
      const { data: stamps } = await supabase
        .from("stamp_events")
        .select("pass_id, created_at")
        .in("pass_id", passIds)
        .gt("delta", 0)
        .order("created_at", { ascending: true });
      const seen = new Set<string>();
      const perPassTimes = new Map<string, number[]>();
      for (const s of stamps ?? []) {
        seen.add(s.pass_id);
        const arr = perPassTimes.get(s.pass_id) ?? [];
        arr.push(new Date(s.created_at).getTime());
        perPassTimes.set(s.pass_id, arr);
      }
      firstStamp = seen.size;
      // avg days between stamps for passes with 2+
      const gaps: number[] = [];
      for (const arr of perPassTimes.values()) {
        if (arr.length < 2) continue;
        for (let i = 1; i < arr.length; i++) gaps.push((arr[i] - arr[i - 1]) / 86400_000);
      }
      if (gaps.length > 0) avg = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;
    }

    let unlocked = 0;
    let redeemed = 0;
    if (passIds.length > 0) {
      const { count: u } = await supabase
        .from("reward_state")
        .select("*", { count: "exact", head: true })
        .in("pass_id", passIds)
        .in("state", ["unlocked", "redeemed"]);
      unlocked = u ?? 0;
      const { count: r } = await supabase
        .from("redemption_events")
        .select("*", { count: "exact", head: true })
        .in("pass_id", passIds);
      redeemed = r ?? 0;
    }

    setFunnel({ joined: count ?? 0, firstStamp, unlocked, redeemed });
    setAvgDays(avg);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: "published" | "archived" | "draft") => {
    if (!id) return;
    const { error } = await supabase.from("programs").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "published" ? "Yayınlandı" : status === "archived" ? "Arşivlendi" : "Taslağa alındı" });
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!program) return <div className="p-12 text-center text-muted-foreground">Program bulunamadı.</div>;

  const joinUrl = absoluteAppUrl(`/join/${program.merchants.slug}/${program.slug}`);
  const rule = program.program_rules?.[0]?.rule_json ?? {};

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${program.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(joinUrl);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      toast({ title: "Link kopyalandı" });
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = joinUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("execCommand failed");
        toast({ title: "Link kopyalandı" });
      } catch {
        toast({ title: "Link kopyalanamadı", variant: "destructive" });
      }
    }
  };

  const downloadPoster = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const qrDataUrl = canvas.toDataURL("image/png");
    const doc = generatePosterPdf({
      programName: program.name,
      merchantName: program.merchants.name ?? merchant?.name ?? "",
      joinUrl,
      qrDataUrl,
      primaryColor: program.brand_primary_color,
    });
    doc.save(`poster-${program.slug}.pdf`);
  };

  return (
    <div className="container max-w-5xl px-4 py-8 md:py-12">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard/programs">
          <ArrowLeft className="h-4 w-4" /> Programlar
        </Link>
      </Button>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: program.brand_primary_color ?? "hsl(var(--primary))", color: "white" }}
          >
            <Stamp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold">{program.name}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  program.status === "published"
                    ? "bg-success/10 text-success"
                    : program.status === "draft"
                      ? "bg-muted text-muted-foreground"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {program.status === "published" ? "Yayında" : program.status === "draft" ? "Taslak" : "Arşiv"}
              </span>
            </div>
            {program.description && <p className="mt-1 text-muted-foreground">{program.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/dashboard/programs/${program.id}/edit`}>
              <Pencil className="h-4 w-4" /> Düzenle
            </Link>
          </Button>
          {program.status !== "published" ? (
            <Button onClick={() => updateStatus("published")}>
              <Send className="h-4 w-4" /> Yayınla
            </Button>
          ) : (
            <Button variant="outline" onClick={() => updateStatus("archived")}>
              <Archive className="h-4 w-4" /> Arşivle
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Genel</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="qr">QR & Poster</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Damga kuralı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-muted-foreground">Eşik</div>
                    <div className="mt-1 text-2xl font-semibold">{rule.threshold ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ödül</div>
                    <div className="mt-1 truncate font-medium">{rule.reward_label ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Günlük max</div>
                    <div className="mt-1 font-medium">{rule.max_stamps_per_day ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bekleme</div>
                    <div className="mt-1 font-medium">{rule.cooldown_minutes ?? 0} dk</div>
                  </div>
                </div>
                {rule.reset_after_redeem && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Ödül sonrası sayaç sıfırlanır
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Üye sayısı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold">{memberCount.toLocaleString("tr-TR")}</div>
                <p className="mt-1 text-sm text-muted-foreground">Bu programa kayıtlı toplam üye.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Dönüşüm hunisi</CardTitle>
                <CardDescription>Üyelikten ödüle kadar her adımdaki düşüş.</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart
                  steps={[
                    { label: "Katıldı", count: funnel.joined },
                    { label: "İlk damga", count: funnel.firstStamp },
                    { label: "Ödül açıldı", count: funnel.unlocked },
                    { label: "Ödül kullanıldı", count: funnel.redeemed },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ortalama damga aralığı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold">{avgDays !== null ? `${avgDays}g` : "—"}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bir üyenin iki damgası arasındaki ortalama gün sayısı.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qr" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Katılım QR kodu</CardTitle>
                <CardDescription>Müşteriler bu kodu okutarak üye olur.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center rounded-lg border border-border bg-white p-4">
                  <QRCodeCanvas id="qr-canvas" value={joinUrl} size={220} level="M" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={downloadQR}>
                    <Download className="h-4 w-4" /> QR
                  </Button>
                  <Button onClick={downloadPoster}>
                    <FileText className="h-4 w-4" /> Poster (A4)
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Katılım linki</div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex w-full items-start gap-2 rounded-md border border-border bg-muted/50 p-2 text-left text-xs hover:bg-muted"
                    aria-label="Katılım linkini kopyala"
                  >
                    <span className="flex-1 break-all">{joinUrl}</span>
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yazdırılabilir poster</CardTitle>
                <CardDescription>Tezgahın üstüne koy, müşterin telefonuyla tarasın.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>A4 boyutunda, marka renginle hazır PDF. Yerel kırtasiyede bastırabilirsin.</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Marka rengi başlıkta</li>
                  <li>Büyük tarama QR'ı</li>
                  <li>"Telefonunla tara" yönlendirmesi</li>
                </ul>
                <Button onClick={downloadPoster} className="w-full">
                  <FileText className="h-4 w-4" /> Posteri indir
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
