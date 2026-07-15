import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

export default function Settings() {
  const { merchant, refreshMerchant } = useAuth();
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadDemoCount = async (merchantId: string) => {
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchantId)
      .eq("is_demo", true);
    setDemoCount(count ?? 0);
  };

  useEffect(() => {
    if (!merchant) return;
    (async () => {
      const { data } = await supabase
        .from("merchants")
        .select("name,legal_name")
        .eq("id", merchant.id)
        .maybeSingle();
      if (data) {
        setName(data.name);
        setLegalName(data.legal_name ?? "");
      }
      await loadDemoCount(merchant.id);
      setLoading(false);
    })();
  }, [merchant]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchant) return;
    const maxBytes = 1 * 1024 * 1024; // 1 MB
    if (file.size > maxBytes) {
      toast({
        title: "Dosya çok büyük",
        description: "Logo en fazla 1 MB olabilir.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${merchant.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("merchants")
        .update({ logo_url: publicUrl })
        .eq("id", merchant.id);
      if (updErr) throw updErr;
      refreshMerchant();
      toast({ title: "Logo güncellendi" });
    } catch (err: any) {
      toast({ title: "Yüklenemedi", description: err?.message ?? "Bilinmeyen hata", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!merchant) return;
    setSaving(true);
    const { error } = await supabase
      .from("merchants")
      .update({ name, legal_name: legalName || null })
      .eq("id", merchant.id);
    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Kaydedildi" });
    refreshMerchant();
  };

  const seedDemo = async () => {
    if (!merchant) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data", {
        body: { action: "seed", merchant_id: merchant.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: "Demo verisi yüklendi",
        description: `${(data as any).customers} üye, ${(data as any).stamps} damga, ${(data as any).redemptions} ödül.`,
      });
      await loadDemoCount(merchant.id);
    } catch (e: any) {
      toast({
        title: "Yüklenemedi",
        description: e?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const clearDemo = async () => {
    if (!merchant) return;
    if (!confirm("Tüm demo verisi silinecek. Devam edilsin mi?")) return;
    setClearing(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data", {
        body: { action: "clear", merchant_id: merchant.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Demo verisi silindi", description: `${(data as any).cleared} kayıt temizlendi.` });
      await loadDemoCount(merchant.id);
    } catch (e: any) {
      toast({
        title: "Silinemedi",
        description: e?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="container max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Ayarlar</h1>
        <p className="mt-1 text-muted-foreground">İşletme profili ve genel ayarlar.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>İşletme profili</CardTitle>
          <CardDescription>Müşterilere ve cüzdan kartlarında görünen bilgiler.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="space-y-2">
                <Label>İşletme adı</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Yasal ünvan</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>

              <div className="space-y-2 pt-2">
                <Label>Logo</Label>
                {merchant?.logo_url && (
                  <img
                    src={merchant.logo_url}
                    alt="İşletme logosu"
                    className="h-20 w-20 object-contain"
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {merchant?.logo_url ? "Yeni Logo Yükle" : "Logo Yükle"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo verisi</CardTitle>
          <CardDescription>
            Sunum ve ekran görüntüleri için 50 sahte üye, 6 haftalık damga geçmişi ve birkaç ödül kullanımı yükle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoCount > 0 && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              Aktif demo üye sayısı: <span className="font-semibold">{demoCount}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={seedDemo} disabled={seeding || clearing}>
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Demo verisi yükle
            </Button>
            {demoCount > 0 && (
              <Button variant="outline" onClick={clearDemo} disabled={clearing || seeding}>
                {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Demo verisini sil
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Önce yayında bir program oluşturmalısın. Demo üyeleri "is_demo" bayrağıyla işaretlenir, gerçek üyelerini etkilemez.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
