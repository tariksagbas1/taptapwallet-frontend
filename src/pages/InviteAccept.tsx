import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const OWNER_LIKE = ["owner", "admin"];
const STAFF_LIKE = ["staff", "manager"];

export default function InviteAccept() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, loading, refreshMerchant } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!token) { setError("Davet bağlantısı geçersiz."); return; }
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`);
      return;
    }
    (async () => {
      setAccepting(true);
      try {
        const { data, error } = await supabase.functions.invoke("accept-invite", { body: { token } });
        // supabase-js throws FunctionsHttpError for non-2xx but the JSON body
        // is still in `data` only sometimes. Read both.
        const res = (data ?? {}) as { ok?: boolean; error?: string; role?: string };
        if (res?.error) throw new Error(res.error);
        if (error) {
          // Try to surface server-provided error message
          const ctx: any = (error as any).context;
          let serverMsg: string | null = null;
          try {
            const body = await ctx?.json?.();
            serverMsg = body?.error ?? null;
          } catch {}
          throw new Error(serverMsg ?? error.message ?? "Davet kabul edilemedi");
        }
        toast({ title: "Hoş geldin!", description: "Ekibe katıldın." });
        await refreshMerchant();
        const role = res?.role ?? "";
        if (OWNER_LIKE.includes(role)) {
          window.location.href = "/dashboard";
        } else if (STAFF_LIKE.includes(role)) {
          window.location.href = "/staff/scan";
        } else {
          window.location.href = "/dashboard";
        }
      } catch (e: any) {
        const raw = e?.message ?? "Davet kabul edilemedi";
        let friendly = raw;
        if (/farklı bir e-posta/i.test(raw)) {
          friendly =
            `${raw}\n\nŞu anda giriş yaptığın hesap: ${user?.email ?? ""}. ` +
            `Lütfen çıkış yapıp davetin gönderildiği e-posta ile giriş yap.`;
        }
        setError(friendly);
      } finally {
        setAccepting(false);
      }
    })();
  }, [loading, user, token, navigate, refreshMerchant]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Daveti kabul et</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="whitespace-pre-line text-sm text-destructive">{error}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate("/")}>Ana sayfa</Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = `/auth?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`;
                  }}
                >
                  Çıkış yap ve doğru hesapla giriş yap
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {accepting ? "Davet onaylanıyor..." : "Yükleniyor..."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
