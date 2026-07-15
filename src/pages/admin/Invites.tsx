import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InviteRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  merchant_id: string;
  merchants?: { name: string } | null;
}

export default function AdminInvites() {
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("merchant_invites")
      .select("id,email,role,status,expires_at,created_at,merchant_id,merchants:merchant_id(name)")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as unknown as InviteRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id: string) => {
    const { error } = await supabase
      .from("merchant_invites")
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Davet iptal edildi" });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Davetler</h1>
        <p className="text-sm text-muted-foreground">Tüm işletmeler için açık ve geçmiş davetler.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>{rows.length} davet</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">Henüz davet yok.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>İşletme</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const expired = new Date(r.expires_at).getTime() < Date.now();
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.merchants?.name ?? r.merchant_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "pending" ? "default" : "secondary"}>
                          {r.status === "pending" && expired ? "expired" : r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.expires_at).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <Button size="sm" variant="ghost" onClick={() => revoke(r.id)}>
                            İptal
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
