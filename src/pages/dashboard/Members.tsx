import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Loader2, Download } from "lucide-react";
import { downloadCsv } from "@/lib/csvExport";

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function Members() {
  const { merchant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!merchant) return;
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("id,first_name,last_name,phone,email,created_at")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
        .limit(500);
      setCustomers(data ?? []);
      setLoading(false);
    })();
  }, [merchant]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(s) ||
      c.last_name?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    );
  });

  const handleExport = async () => {
    if (!merchant) return;
    const { data: stamps } = await supabase
      .from("stamp_events")
      .select("customer_id, delta, created_at")
      .eq("merchant_id", merchant.id);
    const totals = new Map<string, { total: number; last: string | null }>();
    (stamps ?? []).forEach((s: any) => {
      const cur = totals.get(s.customer_id) ?? { total: 0, last: null };
      cur.total += s.delta ?? 0;
      if (!cur.last || s.created_at > cur.last) cur.last = s.created_at;
      totals.set(s.customer_id, cur);
    });
    const rows = customers.map((c) => {
      const t = totals.get(c.id) ?? { total: 0, last: null };
      return {
        ad: c.first_name,
        soyad: c.last_name ?? "",
        telefon: c.phone ?? "",
        eposta: c.email ?? "",
        kayit_tarihi: new Date(c.created_at).toISOString(),
        toplam_damga: Math.max(0, t.total),
        son_aktivite: t.last ? new Date(t.last).toISOString() : "",
      };
    });
    downloadCsv(`uyeler-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Üyeler</h1>
          <p className="mt-1 text-muted-foreground">Sadakat programlarınıza katılan müşteriler.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={customers.length === 0}>
          <Download className="mr-2 h-4 w-4" /> CSV indir
        </Button>
      </div>

      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="İsim, telefon, e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search ? "Sonuç bulunamadı." : "Henüz üye yok. Programınızı yayınlayın ve QR'ı paylaşın."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Katılım</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link to={`/dashboard/members/${c.id}`} className="font-medium hover:underline">
                        {c.first_name} {c.last_name ?? ""}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("tr-TR")}
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
