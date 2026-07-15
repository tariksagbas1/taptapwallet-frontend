import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type State = "loading" | "valid" | "used" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState("invalid");
          return;
        }
        if (data.used) setState("used");
        else {
          setEmail(data.email ?? null);
          setState("valid");
        }
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setSubmitting(false);
    setState(error ? "error" : "success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>E-posta aboneliği</CardTitle>
          <CardDescription>TapTapWallet e-posta tercihleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Kontrol ediliyor…
            </div>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm">
                {email ?? "Bu e-posta adresi"} için tüm e-postalardan çıkmak üzeresiniz.
              </p>
              <Button onClick={confirm} disabled={submitting} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aboneliği iptal et
              </Button>
            </>
          )}
          {state === "used" && <p className="text-sm">Bu adres zaten abonelikten çıkmış.</p>}
          {state === "success" && (
            <p className="text-sm text-success">Aboneliğiniz başarıyla iptal edildi.</p>
          )}
          {state === "invalid" && (
            <p className="text-sm text-destructive">Geçersiz veya süresi dolmuş bağlantı.</p>
          )}
          {state === "error" && (
            <p className="text-sm text-destructive">Bir hata oluştu, lütfen tekrar deneyin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
