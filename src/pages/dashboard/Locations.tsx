import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Store, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  address_line1: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
});

interface Location {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  address_line1: string | null;
  phone: string | null;
  is_active: boolean;
}

export default function Locations() {
  const { merchant } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", district: "", address_line1: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!merchant) return;
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });
    setLocations(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [merchant]);

  const handleCreate = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Hata", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (!merchant) return;
    setSubmitting(true);
    const { error } = await supabase.from("locations").insert({
      merchant_id: merchant.id,
      name: form.name,
      city: form.city || null,
      district: form.district || null,
      address_line1: form.address_line1 || null,
      phone: form.phone || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Şube eklendi" });
    setOpen(false);
    setForm({ name: "", city: "", district: "", address_line1: "", phone: "" });
    load();
  };

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Şubeler</h1>
          <p className="mt-1 text-muted-foreground">İşletmenize bağlı fiziksel noktalar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Yeni Şube
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni şube</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Şube adı *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Karakter Kahve - Moda"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="İstanbul" />
                </div>
                <div className="space-y-2">
                  <Label>İlçe</Label>
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Kadıköy"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder="Caferağa Mah. ..."
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+90 555 ..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Store className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Henüz şube yok. İlk şubenizi ekleyin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Şehir / İlçe</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[l.city, l.district].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.phone || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          l.is_active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {l.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
