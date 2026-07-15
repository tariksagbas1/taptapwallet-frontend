import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "İşletme adı en az 2 karakter").max(120),
  owner_email: z.string().trim().email("Geçerli bir e-posta girin").max(255),
  legal_name: z.string().trim().max(200).optional(),
});

export default function NewMerchant() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [legalName, setLegalName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultLink, setResultLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, owner_email: ownerEmail, legal_name: legalName });
    if (!parsed.success) {
      toast({ title: "Hata", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultLink(null);
    try {
      const { data, error } = await supabase.functions.invoke("superadmin-create-merchant", {
        body: parsed.data,
      });
      if (error) throw error;
      const res = data as { ok?: boolean; email_sent?: boolean; email_error?: string; link?: string; error?: string };
      if (res?.error) throw new Error(res.error);

      if (res.email_sent) {
        toast({ title: "Davet gönderildi", description: `${ownerEmail} adresine e-posta gitti.` });
        navigate("/admin/merchants");
      } else {
        toast({
          title: "İşletme oluşturuldu — e-posta gönderilemedi",
          description: res.email_error ?? "Bilinmeyen hata. Aşağıdaki bağlantıyı manuel paylaşın.",
          variant: "destructive",
        });
        setResultLink(res.link ?? null);
      }
    } catch (err: any) {
      toast({ title: "Hata", description: err.message ?? "Sunucu hatası", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni İşletme</h1>
        <p className="text-sm text-muted-foreground">
          İşletme oluşturulur ve sahip e-postasına owner daveti gönderilir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bilgiler</CardTitle>
          <CardDescription>Ödeme/anlaşma uygulama dışında tamamlanmış olmalı.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İşletme adı *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Karakter Kahve"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Sahip e-postası *</Label>
              <Input
                id="email"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="sahip@kafe.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal">Yasal ünvan (opsiyonel)</Label>
              <Textarea
                id="legal"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Karakter Gıda San. ve Tic. Ltd. Şti."
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur ve daveti gönder
            </Button>
          </form>

          {resultLink && (
            <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs">
              <div className="mb-1 font-medium">Davet bağlantısı (manuel paylaşın):</div>
              <code className="break-all">{resultLink}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
