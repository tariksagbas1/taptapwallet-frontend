import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, Stamp, CheckCircle2, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { absoluteAppUrl } from "@/lib/appUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface ProgramInfo {
  id: string;
  name: string;
  description: string | null;
  brand_primary_color: string | null;
  terms_text: string | null;
  rule: { threshold?: number; reward_label?: string };
  merchant: { name: string; slug: string; logo_url: string | null };
}

function MerchantLogo({ logoUrl, brand }: { logoUrl: string | null; brand: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className="mx-auto size-20 object-contain" />;
  }
  return <Stamp className="mx-auto size-20" style={{ color: brand }} />;
}

function LoadingOverlay({ message }: { message: string }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex max-w-xs flex-col items-center gap-4 px-6 text-center">
        <p className="text-base font-medium text-foreground">{message}</p>
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    </div>,
    document.body,
  );
}

function normalizeTurkishPhone(raw: string): string {
  let phone = raw.trim();
  if (phone.startsWith("+90")) {
    phone = phone.slice(3);
  }
  phone = phone.replace(/\s/g, "");
  if (!phone.startsWith("0")) {
    phone = `0${phone}`;
  }
  return phone;
}

const FormSchema = z.object({
  first_name: z.string().trim().min(1, "Adınız gerekli").max(80),
  last_name: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .length(11, "Geçerli bir telefon girin")
    .regex(/^0[0-9]{10}$/, "Geçerli bir telefon girin"),
  consent_kvkk: z.literal(true, {
    errorMap: () => ({ message: "Devam etmek için onay vermeniz gerekiyor" }),
  }),
  consent_marketing: z.boolean().optional(),
});

const WALLET_SUCCESS_DELAY_MS = 2500;

export default function PublicJoin() {
  const { merchantSlug, programSlug } = useParams<{ merchantSlug: string; programSlug: string }>();
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingToWallet, setAddingToWallet] = useState(false);
  const [walletAdded, setWalletAdded] = useState(false);
  const walletFlowDoneRef = useRef(false);
  const [done, setDone] = useState<{ passId: string; downloadUrl: string; authToken: string } | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    consent_kvkk: false,
    consent_marketing: false,
  });

  useEffect(() => {
    document.title = "Sadakat kartına katıl";
    if (!merchantSlug || !programSlug) return;
    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/public-program-info?merchant_slug=${encodeURIComponent(
            merchantSlug,
          )}&program_slug=${encodeURIComponent(programSlug)}`,
          { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
        );
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProgram({
          id: data.program.id,
          name: data.program.name,
          description: data.program.description,
          brand_primary_color: data.program.brand_primary_color,
          terms_text: data.program.terms_text,
          rule: data.program.rule ?? {},
          merchant: {
            name: data.merchant.name,
            slug: data.merchant.slug,
            logo_url: data.merchant.logo_url ?? null,
          },
        });
      } catch (err) {
        console.error("Failed to load program info:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [merchantSlug, programSlug]);

  useEffect(() => {
    if (!done) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && addingToWallet) {
        window.setTimeout(() => {
          if (walletFlowDoneRef.current) return;
          walletFlowDoneRef.current = true;
          setAddingToWallet(false);
          setWalletAdded(true);
        }, 800);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [done, addingToWallet]);

  const handleAddToWallet = async () => {
    if (!done || addingToWallet || walletAdded) return;
    walletFlowDoneRef.current = false;
    flushSync(() => {
      setAddingToWallet(true);
    });
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const downloadEndpoint =
      done.downloadUrl ||
      `${supabaseUrl}/functions/v1/pass-download?pass_id=${done.passId}&token=${done.authToken}`;
    try {
      const res = await fetch(downloadEndpoint);
      if (!res.ok) throw new Error("Pass could not be prepared");
      window.setTimeout(() => {
        window.location.href = downloadEndpoint;
      }, 150);
      await new Promise((resolve) => window.setTimeout(resolve, WALLET_SUCCESS_DELAY_MS));
      if (walletFlowDoneRef.current) return;
      walletFlowDoneRef.current = true;
      setAddingToWallet(false);
      setWalletAdded(true);
    } catch {
      setAddingToWallet(false);
      toast({
        title: "Kart hazırlanamadı",
        description: "Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, phone: normalizeTurkishPhone(form.phone) };
    const parsed = FormSchema.safeParse(payload);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast({ title: "Lütfen kontrol edin", description: first ?? "Form geçersiz", variant: "destructive" });
      return;
    }
    flushSync(() => {
      setSubmitting(true);
    });
    const joinStartedAt = performance.now();
    console.info("[public-join] request started (browser console, not terminal)");
    try {
      const { data, error } = await supabase.functions.invoke("public-join", {
        body: {
          merchant_slug: merchantSlug,
          program_slug: programSlug,
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name || null,
          phone: parsed.data.phone,
          email: null,
          consent_kvkk: true,
          consent_marketing: !!parsed.data.consent_marketing,
        },
      });
      const joinElapsedSec = ((performance.now() - joinStartedAt) / 1000).toFixed(2);
      console.info(`[public-join] completed in ${joinElapsedSec}s`, { data, error });
      if (error) throw error;
      if (import.meta.env.DEV) {
        toast({
          title: "public-join timing (dev)",
          description: `Completed in ${joinElapsedSec}s — see browser console for details`,
        });
      }
      setDone({
        passId: (data as any).pass_id,
        downloadUrl: (data as any).download_url,
        authToken: (data as any).auth_token,
      });
    } catch (err) {
      const joinElapsedSec = ((performance.now() - joinStartedAt) / 1000).toFixed(2);
      console.error(`[public-join] failed after ${joinElapsedSec}s`, err);
      toast({
        title: "Üye olunamadı",
        description: err instanceof Error ? err.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!program) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">Program bulunamadı</h1>
        <p className="mt-2 text-muted-foreground">Bu link artık aktif olmayabilir.</p>
      </div>
    );
  }

  const brand = program.brand_primary_color ?? "hsl(var(--primary))";
  const threshold = program.rule.threshold ?? 10;
  const rewardLabel = program.rule.reward_label ?? "Ödül";

  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {(addingToWallet || walletAdded) &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
              aria-busy={addingToWallet}
              aria-label={addingToWallet ? "Kartınız ekleniyor..." : "Kart cüzdanınıza eklendi."}
            >
              <div className="flex max-w-xs flex-col items-center gap-4 px-6 text-center">
                {addingToWallet ? (
                  <>
                    <p className="text-base font-medium text-foreground">Kartınız ekleniyor...</p>
                    <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-success" />
                    <p className="text-base font-medium text-foreground">
                      Kartınızı Apple Wallet'tan görüntüleyebilirsiniz
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-2 min-w-[7rem] px-8 font-medium"
                      onClick={() => setWalletAdded(false)}
                    >
                      Tamam
                    </Button>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )}

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 animate-in zoom-in-0 fade-in duration-500 ease-out fill-mode-both">
            <CheckCircle2 className="h-11 w-11 text-success" />
          </div>

          <h1 className="mt-6 animate-in fade-in slide-in-from-bottom-3 text-4xl font-semibold tracking-tight duration-500 fill-mode-both delay-150">
            Hoş geldin!
          </h1>
          <p className="mt-3 max-w-sm animate-in fade-in slide-in-from-bottom-2 text-base text-muted-foreground duration-500 fill-mode-both delay-300">
            {program.merchant.name} sadakat kartınız oluşturuldu.
          </p>

          <p className="mt-10 text-lg text-foreground">
            <span className="font-semibold">{threshold}</span> damga doldur,{" "}
            <span className="font-semibold">{rewardLabel}</span> kazan.
          </p>

          <button
            type="button"
            onClick={handleAddToWallet}
            disabled={addingToWallet}
            className="mt-10 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-foreground px-6 text-lg font-semibold text-background shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            <Apple className="h-6 w-6" />
            Apple Wallet&apos;a Ekle
          </button>

          <a
            href={absoluteAppUrl(`/pass/${done.passId}?token=${done.authToken}`)}
            className="mt-5 text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
          >
            Kartı bağlantıyla aç
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {submitting && <LoadingOverlay message="Kartınız oluşturuluyor..." />}

      <div
        className="px-6 pb-8 pt-14 text-center"
        style={{ background: `linear-gradient(180deg, ${brand}, transparent)` }}
      >
        <MerchantLogo logoUrl={program.merchant.logo_url} brand={brand} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">{program.merchant.name}</h1>
        <p className="mt-1 text-base text-white/85">{program.name}</p>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-10">
        <p className="mx-auto max-w-sm text-center text-lg text-foreground">
          <span className="font-semibold">{threshold}</span> damga doldur,{" "}
          <span className="font-semibold">{rewardLabel}</span> kazan.
        </p>

        <form onSubmit={submit} className="mx-auto mt-8 flex w-full max-w-sm flex-1 flex-col">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium text-foreground">
                  Adın
                </Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                  maxLength={80}
                  className="h-12 border-border/60 bg-background text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium text-foreground">
                  Soyadın
                </Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  maxLength={80}
                  className="h-12 border-border/60 bg-background text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Telefon
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="05XX XXX XX XX"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                maxLength={20}
                className="h-12 border-border/60 bg-background text-base"
              />
            </div>

            <label className="grid grid-cols-[1.125rem_1fr] items-start gap-x-3 pt-1">
              <Checkbox
                checked={form.consent_kvkk}
                onCheckedChange={(v) => setForm((f) => ({ ...f, consent_kvkk: v === true }))}
                className="mt-0.5 size-[1.2rem] rounded-full border-foreground/30 bg-background shadow-none data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background [&_svg]:size-2.5"
              />
              <span className="text-left text-xs leading-relaxed text-muted-foreground">
                <Link
                  to="/privacy-policy"
                  className="font-semibold underline underline-offset-2 hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  KVKK aydınlatma metnini
                </Link>{" "}
                ve{" "}
                <Link
                  to="/user-agreement"
                  className="font-semibold underline underline-offset-2 hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  kullanım koşullarını
                </Link>{" "}
                okudum, kişisel verilerimin işlenmesine onay veriyorum.
              </span>
            </label>
          </div>

          <div className="mt-auto pt-8">
            <Button
              type="submit"
              className="h-14 w-full rounded-2xl text-lg font-semibold shadow-lg"
              disabled={submitting}
            >
              Sadakat kartımı oluştur
            </Button>

            {program.terms_text && (
              <p className="mt-4 whitespace-pre-line text-center text-xs text-muted-foreground">
                {program.terms_text}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
