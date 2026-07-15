import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Apple, Stamp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PassView {
  id: string;
  programName: string;
  merchantName: string;
  rewardLabel: string;
  threshold: number;
  stamps: number;
  brand: string | null;
  terms: string | null;
  memberName: string;
}

export default function PublicPassView() {
  const { passId } = useParams<{ passId: string }>();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [view, setView] = useState<PassView | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    document.title = "Sadakat kartım";
    if (!passId || !token) {
      setLoading(false);
      setDenied(true);
      return;
    }
    (async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const infoRes = await fetch(
        `${supabaseUrl}/functions/v1/pass-info?pass_id=${passId}&token=${token}`,
      );
      if (!infoRes.ok) {
        setDenied(true);
        setLoading(false);
        return;
      }
      const data = await infoRes.json();
      setView(data);
      setLoading(false);
    })();
  }, [passId, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (denied || !view) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">Kart açılamadı</h1>
        <p className="mt-2 text-muted-foreground">Bu link geçersiz ya da süresi dolmuş olabilir.</p>
      </div>
    );
  }

  const brand = view.brand ?? "hsl(var(--primary))";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const downloadEndpoint = `${supabaseUrl}/functions/v1/pass-download?pass_id=${passId}&token=${token}`;
  const pct = Math.min(100, Math.round((view.stamps / Math.max(1, view.threshold)) * 100));

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pb-12 pt-12 text-center" style={{ background: `linear-gradient(180deg, ${brand}, transparent)` }}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-md">
          <Stamp className="h-7 w-7" style={{ color: brand }} />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-white">{view.merchantName}</h1>
        <p className="mt-1 text-sm text-white/85">{view.programName}</p>
      </div>

      <div className="-mt-6 px-6 pb-12">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Üye</div>
          <div className="mt-1 text-lg font-semibold">{view.memberName}</div>

          <div className="mt-6 flex items-baseline justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Damga</div>
              <div className="mt-1 text-4xl font-semibold tabular-nums">
                {view.stamps}
                <span className="text-xl text-muted-foreground"> / {view.threshold}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ödül</div>
              <div className="mt-1 max-w-[10rem] truncate text-sm font-medium">{view.rewardLabel}</div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: brand }} />
          </div>

          <a
            href={downloadEndpoint}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-base font-medium text-background transition-opacity hover:opacity-90"
          >
            <Apple className="h-5 w-5" />
            Apple Wallet'a Ekle
          </a>
        </div>

        {view.terms && (
          <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-center text-xs text-muted-foreground">
            {view.terms}
          </p>
        )}
      </div>
    </div>
  );
}
