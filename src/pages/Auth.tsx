import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Coffee, Loader2 } from "lucide-react";
import { safeNext } from "@/lib/safeNext";
import { absoluteAppUrl } from "@/lib/appUrl";

const schema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta girin").max(255),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(72),
  firstName: z.string().trim().max(100).optional(),
});

export default function Auth() {
  const [params] = useSearchParams();
  const nextPath = safeNext(params.get("next"));
  // Signup is gated: only allowed when arriving from an invite link (next=/invite/accept...)
  // or when the URL explicitly carries ?mode=signup (used by future flows).
  const signupAllowed =
    params.get("mode") === "signup" || nextPath.startsWith("/invite/accept");
  const initialMode: "signin" | "signup" = signupAllowed ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // Sales users (platform_roles.role === "sales") land on the sales console,
      // unless an explicit ?next= target was provided.
      if (!params.get("next")) {
        const { data: salesRow } = await supabase
          .from("platform_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "sales")
          .maybeSingle();
        if (cancelled) return;
        if (salesRow) {
          navigate("/sales", { replace: true });
          return;
        }
      }
      navigate(nextPath, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate, nextPath, params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, firstName });
    if (!parsed.success) {
      toast({ title: "Hata", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: absoluteAppUrl(nextPath),
            data: { first_name: firstName },
          },
        });
        if (error) throw error;
        // If email confirmation is disabled in Supabase, signUp returns a session immediately.
        // If it's still enabled, attempt a password sign-in to surface a clear error.
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        toast({ title: "Hoş geldiniz!", description: "Hesabınız oluşturuldu." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = err?.message || "Bir hata oluştu";
      toast({
        title: "Giriş başarısız",
        description: msg.includes("Invalid login") ? "E-posta veya şifre hatalı." : msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-warm)] p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TapTapWallet</span>
        </Link>

        <Card className="shadow-[var(--shadow-elevated)]">
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}</CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "İşletme panelinize erişmek için giriş yapın."
                : "Sadakat programınızı dakikalar içinde başlatın."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="firstName">Adınız</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mehmet"
                    autoComplete="given-name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@kafe.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
              </Button>
            </form>
            {signupAllowed && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "Davetiniz mi var?" : "Zaten hesabınız var mı?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="font-medium text-primary hover:underline"
                >
                  {mode === "signin" ? "Hesap oluşturun" : "Giriş yapın"}
                </button>
              </div>
            )}
            {!signupAllowed && (
              <div className="mt-6 text-center text-xs text-muted-foreground">
                TapTapWallet paneli yalnızca davet ile açılır. Davet bağlantınız üzerinden devam edin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
