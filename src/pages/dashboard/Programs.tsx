import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stamp, Plus, Loader2, ArrowRight } from "lucide-react";

interface Program {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  description: string | null;
  brand_primary_color: string | null;
  created_at: string;
}

const statusLabel = { draft: "Taslak", published: "Yayında", archived: "Arşiv" };

export default function Programs() {
  const { merchant } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchant) return;
    (async () => {
      const { data } = await supabase
        .from("programs")
        .select("id,name,status,description,brand_primary_color,created_at")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false });
      setPrograms((data as Program[]) ?? []);
      setLoading(false);
    })();
  }, [merchant]);

  return (
    <div className="container max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Programlar</h1>
          <p className="mt-1 text-muted-foreground">Damga kartlarınızı oluşturun ve yönetin.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/programs/new">
            <Plus className="h-4 w-4" /> Yeni Program
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : programs.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <Stamp className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">Henüz program yok</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              İlk damga kartınızı oluşturun. Örneğin: "5 kahve al, 6.'sı bedava".
            </p>
            <Button asChild className="mt-2">
              <Link to="/dashboard/programs/new">
                <Plus className="h-4 w-4" /> İlk Programı Oluştur
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((p) => (
            <Link key={p.id} to={`/dashboard/programs/${p.id}`}>
              <Card className="group h-full shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <CardContent className="flex items-start gap-4 p-6">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: p.brand_primary_color || "hsl(var(--primary))", color: "white" }}
                  >
                    <Stamp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{p.name}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          p.status === "published"
                            ? "bg-success/10 text-success"
                            : p.status === "draft"
                              ? "bg-muted text-muted-foreground"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {statusLabel[p.status]}
                      </span>
                    </div>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
