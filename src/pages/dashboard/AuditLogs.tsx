import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AuditLog {
  id: string;
  created_at: string;
  actor_type: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  before_json: any;
  after_json: any;
}

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const { merchant } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const fetchLogs = async (reset = false) => {
    if (!merchant) return;
    setLoading(true);
    const from = reset ? 0 : page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("audit_logs")
      .select("id, created_at, actor_type, actor_id, action, entity_type, entity_id, ip_address, before_json, after_json")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);
    if (search.trim()) q = q.eq("entity_id", search.trim());

    const { data, error } = await q;
    if (!error && data) {
      setLogs(reset ? (data as AuditLog[]) : [...logs, ...(data as AuditLog[])]);
      setHasMore(data.length === PAGE_SIZE);
      if (reset) setPage(1);
      else setPage(page + 1);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(0);
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id, actionFilter, entityFilter]);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs]
  );
  const entityOptions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entity_type))).sort(),
    [logs]
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Denetim Kayıtları</h1>
        <p className="text-sm text-muted-foreground">İşletmedeki tüm önemli işlemlerin geçmişi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="Aksiyon" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm aksiyonlar</SelectItem>
              {actionOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger><SelectValue placeholder="Varlık türü" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm türler</SelectItem>
              {entityOptions.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Varlık ID ara (tam eşleşme)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); fetchLogs(true); } }}
            className="md:col-span-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Aksiyon</TableHead>
                <TableHead>Varlık</TableHead>
                <TableHead>Aktör</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Kayıt bulunamadı.</TableCell></TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelected(log)}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{log.entity_type}</div>
                    <div className="font-mono text-muted-foreground">{log.entity_id?.slice(0, 8) ?? "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{log.actor_type ?? "—"}</div>
                    <div className="font-mono text-muted-foreground">{log.actor_id?.slice(0, 8) ?? "—"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ip_address ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        {hasMore && (
          <Button variant="outline" onClick={() => fetchLogs(false)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daha fazla yükle
          </Button>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kayıt Detayı</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Aksiyon:</span> {selected.action}</div>
                <div><span className="text-muted-foreground">Tarih:</span> {new Date(selected.created_at).toLocaleString("tr-TR")}</div>
                <div><span className="text-muted-foreground">Varlık:</span> {selected.entity_type}</div>
                <div className="font-mono text-xs"><span className="text-muted-foreground">ID:</span> {selected.entity_id ?? "—"}</div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Öncesi</div>
                <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(selected.before_json, null, 2)}</pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Sonrası</div>
                <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(selected.after_json, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
