import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search as SearchIcon, User } from "lucide-react";

interface Hit {
  pass_id: string;
  customer_name: string;
  phone: string | null;
  program_name: string;
}

export default function StaffSearch() {
  const { merchant } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);

  const search = async () => {
    if (!merchant || q.trim().length < 3) return;
    setLoading(true);
    const term = q.replace(/\s+/g, "");
    const { data } = await supabase
      .from("passes")
      .select("id, customers:customer_id(first_name,last_name,phone), programs:program_id(name)")
      .eq("merchant_id", merchant.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    const filtered: Hit[] = (data ?? [])
      .filter((p: any) => (p.customers?.phone ?? "").includes(term))
      .map((p: any) => ({
        pass_id: p.id,
        customer_name: `${p.customers?.first_name ?? ""} ${p.customers?.last_name ?? ""}`.trim(),
        phone: p.customers?.phone ?? null,
        program_name: p.programs?.name ?? "—",
      }));
    setHits(filtered);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          placeholder="Telefon (son 4 hane yeterli)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="h-12 text-base"
        />
        <Button onClick={search} disabled={loading || q.trim().length < 3} size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
        </Button>
      </div>

      {hits.length === 0 && !loading && q.length >= 3 && (
        <p className="text-center text-sm text-muted-foreground">Eşleşme yok</p>
      )}

      <div className="flex flex-col gap-2">
        {hits.map((h) => (
          <Card
            key={h.pass_id}
            className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-accent"
            onClick={() => navigate(`/staff/customer/${h.pass_id}`)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{h.customer_name || "Üye"}</div>
              <div className="truncate text-xs text-muted-foreground">{h.phone} • {h.program_name}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
