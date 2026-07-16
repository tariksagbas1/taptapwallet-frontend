import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { absoluteAppUrl } from "@/lib/appUrl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, Loader2, QrCode, LayoutTemplate } from "lucide-react";
import type { QrPosterLocationState } from "./QrPosterDesigner";

interface JoinItem {
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  programSlug: string;
  programName: string;
  joinUrl: string;
  logoUrl: string | null;
}

export default function Sales() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JoinItem[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1. Merchant ids this salesperson onboarded.
        const { data: onboarded, error: obErr } = await (supabase as any)
          .from("onboarded_merchants")
          .select("merchant_id")
          .eq("user_id_of_salesman", user.id);
        if (obErr) throw obErr;

        const merchantIds = ((onboarded ?? []) as { merchant_id: string }[]).map((r) => r.merchant_id);

        if (merchantIds.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        // 2. Merchant slugs (+ names + logo) from the merchants table.
        const { data: merchants, error: mErr } = await supabase
          .from("merchants")
          .select("id, slug, name, logo_url")
          .in("id", merchantIds);
        if (mErr) throw mErr;
        const merchantById = new Map((merchants ?? []).map((m) => [m.id, m]));

        // 3. Program slugs from the programs table.
        const { data: programs, error: pErr } = await supabase
          .from("programs")
          .select("merchant_id, slug, name")
          .in("merchant_id", merchantIds);
        if (pErr) throw pErr;

        // 4. Build a join link per merchant per program.
        const built: JoinItem[] = (programs ?? [])
          .map((p) => {
            const m = merchantById.get(p.merchant_id);
            if (!m?.slug || !p.slug) return null;
            return {
              merchantId: p.merchant_id,
              merchantName: m.name ?? m.slug,
              merchantSlug: m.slug,
              programSlug: p.slug,
              programName: p.name ?? p.slug,
              joinUrl: absoluteAppUrl(`/join/${m.slug}/${p.slug}`),
              logoUrl: m.logo_url ?? null,
            } satisfies JoinItem;
          })
          .filter((x): x is JoinItem => x !== null);

        if (!cancelled) setItems(built);
      } catch (err: any) {
        if (!cancelled) {
          toast({ title: "Yüklenemedi", description: err?.message ?? "Bilinmeyen hata", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const downloadQR = (index: number, item: JoinItem) => {
    const canvas = document.getElementById(`sales-qr-${index}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${item.merchantSlug}-${item.programSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      toast({ title: "Link kopyalandı" });
    } catch {
      toast({ title: "Link kopyalanamadı", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Satış Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Kaydettiğiniz işletmelerin programları için katılım linkleri ve QR kodları.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <QrCode className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Henüz kaydettiğiniz bir işletme yok. Soldaki menüden “Yeni İşletme Kaydet” ile başlayın.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Card key={`${item.merchantId}:${item.programSlug}`}>
              <CardHeader className="pb-3">
                <CardTitle className="truncate text-base" title={item.programName}>
                  {item.programName}
                </CardTitle>
                <p className="truncate text-xs text-muted-foreground" title={item.merchantName}>
                  {item.merchantName}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-center rounded-lg border border-border bg-white p-3">
                  <QRCodeCanvas id={`sales-qr-${i}`} value={item.joinUrl} size={176} level="M" />
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(item.joinUrl)}
                  className="flex w-full items-start gap-2 rounded-md border border-border bg-muted/50 p-2 text-left text-xs hover:bg-muted"
                  aria-label="Katılım linkini kopyala"
                >
                  <span className="flex-1 break-all">{item.joinUrl}</span>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => downloadQR(i, item)}>
                  <Download className="mr-2 h-4 w-4" /> QR indir
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const posterState: QrPosterLocationState = {
                      joinUrl: item.joinUrl,
                      merchantName: item.merchantName,
                      merchantId: item.merchantId,
                      merchantSlug: item.merchantSlug,
                      programName: item.programName,
                      programSlug: item.programSlug,
                      logoUrl: item.logoUrl,
                    };
                    navigate("/sales/poster", { state: posterState });
                  }}
                >
                  <LayoutTemplate className="mr-2 h-4 w-4" /> QR Posteri Hazırla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
