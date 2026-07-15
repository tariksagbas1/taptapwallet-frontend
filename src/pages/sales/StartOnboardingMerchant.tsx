import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, Store, Users, Stamp } from "lucide-react";
import taptapwalletLogo from "@/assets/taptapwallet-logo.png";
import taptapwalletQr from "@/assets/taptapwallet-qr.png";

const MAX_LOGO_BYTES = 1 * 1024 * 1024; // 1 MB

const accountSchema = z
  .object({
    name: z.string().trim().min(2, "İşletme adı en az 2 karakter"),
    legalName: z.string().trim().max(200).optional(),
    email: z.string().trim().email("Geçerli bir işletme e-postası girin"),
    password: z.string().min(6, "İşletme şifresi en az 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "İşletme şifreleri eşleşmiyor",
    path: ["confirmPassword"],
  });

const programSchema = z.object({
  name: z.string().trim().min(2, "Program adı en az 2 karakter"),
  threshold: z.number().int().min(2).max(50),
  reward_label: z.string().trim().min(2, "Ödül başlığı gerekli"),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli birincil renk girin"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli ikincil renk girin"),
});

interface StaffRow {
  email: string;
  password: string;
  confirmPassword: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function WalletPreview({
  logoSrc,
  businessName,
  primary,
  secondary,
  threshold,
  qrSrc,
}: {
  logoSrc: string;
  businessName: string;
  primary: string;
  secondary: string;
  threshold: number;
  qrSrc: string;
}) {
  return (
    <div
      className="mx-auto flex aspect-[3/4] w-full max-w-[320px] flex-col rounded-3xl p-5 shadow-lg"
      style={{ backgroundColor: primary }}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/95">
          <img src={logoSrc} alt="" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 truncate text-base font-semibold text-white">{businessName}</div>
      </div>

      {/* Reserved empty space for the loyalty strip image (rendered later). */}
      <div className="flex-1" />

      <div className="flex items-end justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: secondary }}>
            Üye
          </div>
          <div className="mt-1 truncate text-base font-semibold text-white">İsim Soyisim</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: secondary }}>
            Damga
          </div>
          <div className="mt-1 text-base font-semibold text-white">0/{threshold}</div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="rounded-lg bg-white p-1.5">
          <img src={qrSrc} alt="QR" className="h-32 w-32" />
        </div>
      </div>
    </div>
  );
}

export default function StartOnboardingMerchant() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Part 1 — merchant account
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Part 2 — staff users
  const [staff, setStaff] = useState<StaffRow[]>([]);

  // Part 3 — first program
  const [program, setProgram] = useState({
    name: "",
    description: "",
    terms_text: "",
    threshold: 10,
    reward_label: "İkram Kahve",
    reset_after_redeem: true,
    max_stamps_per_day: 3,
    cooldown_minutes: 30,
    primary: "#566c86",
    secondary: "#7f8b55",
  });

  const [loading, setLoading] = useState(false);

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast({ title: "Dosya çok büyük", description: "Logo en fazla 1 MB olabilir.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const addStaff = () => setStaff((s) => [...s, { email: "", password: "", confirmPassword: "" }]);
  const removeStaff = (i: number) => setStaff((s) => s.filter((_, idx) => idx !== i));
  const updateStaff = (i: number, patch: Partial<StaffRow>) =>
    setStaff((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const acct = accountSchema.safeParse({ name, legalName, email, password, confirmPassword });
    if (!acct.success) {
      toast({ title: "Bölüm 1 — Hata", description: acct.error.issues[0].message, variant: "destructive" });
      return;
    }

    for (let i = 0; i < staff.length; i++) {
      const s = staff[i];
      const emailOk = z.string().trim().email().safeParse(s.email).success;
      if (!emailOk) {
        toast({ title: `Personel ${i + 1}`, description: "Geçerli bir e-posta girin.", variant: "destructive" });
        return;
      }
      if (s.password.length < 6) {
        toast({ title: `Personel ${i + 1}`, description: "Şifre en az 6 karakter olmalı.", variant: "destructive" });
        return;
      }
      if (s.password !== s.confirmPassword) {
        toast({ title: `Personel ${i + 1}`, description: "Şifreler eşleşmiyor.", variant: "destructive" });
        return;
      }
    }

    const prog = programSchema.safeParse(program);
    if (!prog.success) {
      toast({ title: "Bölüm 3 — Hata", description: prog.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let logo: { base64: string; content_type: string; filename: string } | null = null;
      if (logoFile) {
        logo = {
          base64: await fileToBase64(logoFile),
          content_type: logoFile.type || "image/png",
          filename: logoFile.name,
        };
      }

      const payload = {
        merchant: { name: name.trim(), legal_name: legalName.trim() || null },
        account: { email: email.trim(), password },
        staff: staff.map((s) => ({ email: s.email.trim(), password: s.password })),
        program: {
          name: program.name.trim(),
          description: program.description.trim() || null,
          terms_text: program.terms_text.trim() || null,
          threshold: program.threshold,
          reward_label: program.reward_label.trim(),
          reset_after_redeem: program.reset_after_redeem,
          max_stamps_per_day: program.max_stamps_per_day,
          cooldown_minutes: program.cooldown_minutes,
          primary_color: program.primary,
          secondary_color: program.secondary,
        },
        logo,
      };

      const { data, error } = await supabase.functions.invoke("sales-onboard-merchant", { body: payload });
      if (error) throw error;
      const res = data as { ok?: boolean; merchant_id?: string; error?: string };
      if (res?.error) throw new Error(res.error);

      toast({ title: "İşletme oluşturuldu", description: `${name} başarıyla kaydedildi.` });
      navigate("/sales");
    } catch (err: any) {
      toast({ title: "Hata", description: err.message ?? "Sunucu hatası", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni İşletme Kaydet</h1>
        <p className="text-sm text-muted-foreground">
          İşletme hesabını, personeli ve ilk programı doldurup tek seferde oluşturun.
        </p>
      </div>

      {/* Bölüm 1 — İşletme hesabı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" /> Bölüm 1 — İşletme Hesabı
          </CardTitle>
          <CardDescription>İşletmenin giriş bilgileri, yasal ünvanı ve logosu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">İşletme adı *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Karakter Kahve" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Yasal ünvan</Label>
              <Input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Karakter Gıda Ltd. Şti." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="isletme@ornek.com" autoComplete="off" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" autoComplete="new-password" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Şifre (tekrar) *</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Şifreyi tekrar girin" autoComplete="new-password" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {logoPreview && <img src={logoPreview} alt="" className="h-14 w-14 rounded-md object-contain" />}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {logoFile ? "Logoyu değiştir" : "Logo yükle"}
              </Button>
              {logoFile && (
                <span className="truncate text-xs text-muted-foreground">{logoFile.name}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bölüm 2 — Personel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Bölüm 2 — Personel
          </CardTitle>
          <CardDescription>İstediğiniz kadar personel hesabı ekleyin. (İsteğe bağlı)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz personel eklenmedi.</p>
          )}
          {staff.map((s, i) => (
            <div key={i} className="grid items-end gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label>E-posta</Label>
                <Input type="email" value={s.email} onChange={(e) => updateStaff(i, { email: e.target.value })} placeholder="personel@ornek.com" autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label>Şifre</Label>
                <Input type="password" value={s.password} onChange={(e) => updateStaff(i, { password: e.target.value })} placeholder="En az 6 karakter" autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label>Şifre (tekrar)</Label>
                <Input type="password" value={s.confirmPassword} onChange={(e) => updateStaff(i, { confirmPassword: e.target.value })} placeholder="Tekrar" autoComplete="new-password" />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeStaff(i)} aria-label="Personeli kaldır">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStaff}>
            <Plus className="mr-2 h-4 w-4" /> Personel Ekle
          </Button>
        </CardContent>
      </Card>

      {/* Bölüm 3 — İlk program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stamp className="h-4 w-4" /> Bölüm 3 — İlk Program
          </CardTitle>
          <CardDescription>İşletmenin ilk damga kartı programı.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Program adı *</Label>
              <Input value={program.name} onChange={(e) => setProgram({ ...program, name: e.target.value })} placeholder="Sadık Kahveseverler" />
            </div>
            <div className="space-y-1.5">
              <Label>Ödül başlığı *</Label>
              <Input value={program.reward_label} onChange={(e) => setProgram({ ...program, reward_label: e.target.value })} placeholder="Bedava Kahve" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Textarea value={program.description} onChange={(e) => setProgram({ ...program, description: e.target.value })} placeholder="Her kahveden 1 damga, 5 damga = 1 bedava kahve." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Şartlar metni</Label>
            <Textarea value={program.terms_text} onChange={(e) => setProgram({ ...program, terms_text: e.target.value })} placeholder="Promosyon süresince geçerlidir. Nakit değeri yoktur." rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Damga eşiği *</Label>
              <Input type="number" min={2} max={50} value={program.threshold} onChange={(e) => setProgram({ ...program, threshold: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Günlük max damga</Label>
              <Input type="number" min={1} max={20} value={program.max_stamps_per_day} onChange={(e) => setProgram({ ...program, max_stamps_per_day: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Bekleme (dk)</Label>
              <Input type="number" min={0} max={1440} value={program.cooldown_minutes} onChange={(e) => setProgram({ ...program, cooldown_minutes: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Birincil renk</Label>
              <div className="flex gap-2">
                <Input type="color" value={program.primary} onChange={(e) => setProgram({ ...program, primary: e.target.value })} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={program.primary} onChange={(e) => setProgram({ ...program, primary: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>İkincil renk</Label>
              <div className="flex gap-2">
                <Input type="color" value={program.secondary} onChange={(e) => setProgram({ ...program, secondary: e.target.value })} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={program.secondary} onChange={(e) => setProgram({ ...program, secondary: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-medium">Ödül sonrası sıfırla</div>
              <div className="text-xs text-muted-foreground">Ödül kullanıldıktan sonra damga sayacı sıfırlanır.</div>
            </div>
            <Switch checked={program.reset_after_redeem} onCheckedChange={(v) => setProgram({ ...program, reset_after_redeem: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Cüzdan önizlemesi */}
      <div>
        <div className="mb-2 text-center text-sm font-medium text-muted-foreground">Cüzdan önizlemesi</div>
        <WalletPreview
          logoSrc={logoPreview || taptapwalletLogo}
          businessName={name || "İşletme Adı"}
          primary={program.primary}
          secondary={program.secondary}
          threshold={program.threshold}
          qrSrc={taptapwalletQr}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <Button type="submit" size="lg" disabled={loading} className="px-10 text-base">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          İşletmeyi Oluştur
        </Button>
      </div>

      {/* Extra scroll space below the submit button. */}
      <div className="h-40" />
    </form>
  );
}
