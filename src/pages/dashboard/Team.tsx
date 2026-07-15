import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCog, UserPlus, Mail, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const roleLabel: Record<string, string> = {
  owner: "Sahip", admin: "Yönetici", manager: "Şube Müdürü",
  staff: "Personel", analyst: "Analist", support: "Destek",
};
const invitableRoles = ["admin", "manager", "staff", "analyst", "support"] as const;

export default function Team() {
  const { merchant } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<typeof invitableRoles[number]>("staff");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!merchant) return;
    const { data: roles } = await supabase
      .from("user_roles").select("role, location_id, user_id").eq("merchant_id", merchant.id);
    const userIds = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: users } = await supabase
      .from("merchant_users").select("user_id, email, first_name, last_name, last_login_at")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    setMembers((users ?? []).map((u) => ({
      ...u, roles: (roles ?? []).filter((r) => r.user_id === u.user_id).map((r) => r.role),
    })));
    const { data: inv } = await supabase
      .from("merchant_invites")
      .select("id,email,role,status,created_at,expires_at")
      .eq("merchant_id", merchant.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setInvites(inv ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [merchant]);

  const sendInvite = async () => {
    if (!inviteEmail) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: { email: inviteEmail, role: inviteRole },
      });
      if (error) throw error;
      const res = data as { ok?: boolean; email_sent?: boolean; email_error?: string; link?: string; error?: string };
      if (res?.error) throw new Error(res.error);
      if (res?.link) {
        await navigator.clipboard.writeText(res.link).catch(() => {});
        toast({
          title: "Davet oluşturuldu",
          description: `E-posta gönderilemedi (${res.email_error ?? "bilinmeyen hata"}). Bağlantı panoya kopyalandı.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Davet gönderildi", description: inviteEmail });
      }
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
      load();
    } catch (e: any) {
      toast({ title: "Gönderilemedi", description: e?.message ?? "Hata", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const revokeInvite = async (id: string) => {
    await supabase.from("merchant_invites").update({ status: "revoked" }).eq("id", id);
    load();
  };

  return (
    <div className="container max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Ekip</h1>
          <p className="mt-1 text-muted-foreground">İşletmenize erişim sahibi kullanıcılar ve roller.</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" /> Davet et</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni üye davet et</DialogTitle>
              <DialogDescription>E-posta ile davet bağlantısı gönderilir. 7 gün geçerlidir.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ornek@kafe.com" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {invitableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>İptal</Button>
              <Button onClick={sendInvite} disabled={sending || !inviteEmail}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" /> Davet gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Üyeler</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <UserCog className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Üye bulunamadı.</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>E-posta</TableHead><TableHead>Roller</TableHead></TableRow></TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.user_id}>
                    <TableCell className="font-medium">{[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.roles.map((r: string) => (
                          <span key={r} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{roleLabel[r] ?? r}</span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bekleyen davetler</CardTitle>
            <CardDescription>Henüz kabul edilmemiş davet bağlantıları.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>E-posta</TableHead><TableHead>Rol</TableHead><TableHead>Sona eriyor</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.email}</TableCell>
                    <TableCell>{roleLabel[i.role] ?? i.role}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(i.expires_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => revokeInvite(i.id)}>İptal et</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
