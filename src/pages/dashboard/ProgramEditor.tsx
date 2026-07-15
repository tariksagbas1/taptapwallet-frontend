import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  threshold: z.number().int().min(2).max(50),
  reward_label: z.string().trim().min(2).max(80),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir HEX renk girin"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir HEX renk girin"),
});

interface Loc {
  id: string;
  name: string;
}

export default function ProgramEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { merchant } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    terms_text: "",
    threshold: 5,
    reward_label: "Bedava Kahve",
    reset_after_redeem: true,
    max_stamps_per_day: 3,
    cooldown_minutes: 30,
    primary: "#3b2415",
    secondary: "#d6803a",
  });

  useEffect(() => {
    if (!merchant) return;
    (async () => {
      const { data: locs } = await supabase
        .from("locations")
        .select("id,name")
        .eq("merchant_id", merchant.id)
        .order("name");
      setLocations(locs ?? []);

      if (!isNew && id) {
        const { data: prog } = await supabase
          .from("programs")
          .select("*, program_rules(*), program_locations(location_id)")
          .eq("id", id)
          .maybeSingle();
        if (prog) {
          const rule = (prog.program_rules?.[0]?.rule_json as any) ?? {};
          setForm({
            name: prog.name,
            description: prog.description ?? "",
            terms_text: prog.terms_text ?? "",
            threshold: rule.threshold ?? 5,
            reward_label: rule.reward_label ?? "Bedava Kahve",
            reset_after_redeem: rule.reset_after_redeem ?? true,
            max_stamps_per_day: rule.max_stamps_per_day ?? 3,
            cooldown_minutes: rule.cooldown_minutes ?? 30,
            primary: prog.brand_primary_color ?? "#3b2415",
            secondary: prog.brand_secondary_color ?? "#d6803a",
          });
          setSelectedLocs((prog.program_locations ?? []).map((pl: any) => pl.location_id));
        }
        setLoading(false);
      }
    })();
  }, [merchant, id, isNew]);

  const handleSave = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Hata", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (!merchant) return;
    setSaving(true);
    try {
      const baseSlug = slugify(form.name) || "program";
      const slug = isNew ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : undefined;

      const programPayload: any = {
        merchant_id: merchant.id,
        name: form.name,
        description: form.description || null,
        terms_text: form.terms_text || null,
        program_type: "stamp",
        brand_primary_color: form.primary,
        brand_secondary_color: form.secondary,
      };
      if (slug) programPayload.slug = slug;

      let programId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from("programs")
          .insert(programPayload)
          .select()
          .single();
        if (error) throw error;
        programId = data.id;
      } else {
        const { error } = await supabase.from("programs").update(programPayload).eq("id", id!);
        if (error) throw error;
      }

      const ruleJson = {
        threshold: form.threshold,
        reward_label: form.reward_label,
        reset_after_redeem: form.reset_after_redeem,
        max_stamps_per_day: form.max_stamps_per_day,
        cooldown_minutes: form.cooldown_minutes,
      };

      // Upsert rule
      const { data: existingRule } = await supabase
        .from("program_rules")
        .select("id")
        .eq("program_id", programId!)
        .eq("rule_type", "stamp")
        .maybeSingle();
      if (existingRule) {
        await supabase.from("program_rules").update({ rule_json: ruleJson }).eq("id", existingRule.id);
      } else {
        await supabase
          .from("program_rules")
          .insert({ program_id: programId!, rule_type: "stamp", rule_json: ruleJson });
      }

      // Reset program_locations
      await supabase.from("program_locations").delete().eq("program_id", programId!);
      if (selectedLocs.length > 0) {
        await supabase
          .from("program_locations")
          .insert(selectedLocs.map((lid) => ({ program_id: programId!, location_id: lid })));
      }

      // Default reward definition
      const { data: existingReward } = await supabase
        .from("reward_definitions")
        .select("id")
        .eq("program_id", programId!)
        .eq("reward_code", "default")
        .maybeSingle();
      if (existingReward) {
        await supabase
          .from("reward_definitions")
          .update({ reward_title: form.reward_label })
          .eq("id", existingReward.id);
      } else {
        await supabase.from("reward_definitions").insert({
          program_id: programId!,
          reward_code: "default",
          reward_title: form.reward_label,
          reward_type: "free_item",
        });
      }

      toast({ title: "Kaydedildi" });
      navigate(`/dashboard/programs/${programId}`);
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 md:py-12">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard/programs">
          <ArrowLeft className="h-4 w-4" /> Programlar
        </Link>
      </Button>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{isNew ? "Yeni Damga Kartı" : "Programı Düzenle"}</h1>
        <p className="mt-1 text-muted-foreground">Müşterilerinize sunacağınız sadakat kuralını tanımlayın.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel bilgiler</CardTitle>
            <CardDescription>Programın görünür ismi ve açıklaması.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Program adı *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sadık Kahveseverler" />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Her kahveden 1 damga, 5 damga = 1 bedava kahve."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Şartlar metni</Label>
              <Textarea
                value={form.terms_text}
                onChange={(e) => setForm({ ...form, terms_text: e.target.value })}
                placeholder="Promosyon süresince geçerlidir. Nakit değeri yoktur."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Damga kuralı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Damga eşiği *</Label>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ödül başlığı *</Label>
                <Input
                  value={form.reward_label}
                  onChange={(e) => setForm({ ...form, reward_label: e.target.value })}
                  placeholder="Bedava Kahve"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Günlük max damga</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.max_stamps_per_day}
                  onChange={(e) => setForm({ ...form, max_stamps_per_day: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bekleme süresi (dk)</Label>
                <Input
                  type="number"
                  min={0}
                  max={1440}
                  value={form.cooldown_minutes}
                  onChange={(e) => setForm({ ...form, cooldown_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Ödül sonrası sıfırla</div>
                <div className="text-xs text-muted-foreground">
                  Ödül kullanıldıktan sonra damga sayacı sıfırlanır.
                </div>
              </div>
              <Switch
                checked={form.reset_after_redeem}
                onCheckedChange={(v) => setForm({ ...form, reset_after_redeem: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marka renkleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Birincil renk</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.primary}
                    onChange={(e) => setForm({ ...form, primary: e.target.value })}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input value={form.primary} onChange={(e) => setForm({ ...form, primary: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>İkincil renk</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.secondary}
                    onChange={(e) => setForm({ ...form, secondary: e.target.value })}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.secondary}
                    onChange={(e) => setForm({ ...form, secondary: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geçerli şubeler</CardTitle>
            <CardDescription>Boş bırakırsanız tüm şubelerde geçerli olur.</CardDescription>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz şube yok. Önce <Link to="/dashboard/locations" className="text-primary underline">şube</Link> ekleyin.
              </p>
            ) : (
              <div className="space-y-2">
                {locations.map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <Checkbox
                      checked={selectedLocs.includes(l.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedLocs([...selectedLocs, l.id]);
                        else setSelectedLocs(selectedLocs.filter((x) => x !== l.id));
                      }}
                    />
                    <span className="text-sm">{l.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/dashboard/programs">İptal</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}
