import { ReactNode, useEffect, useState } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ScanLine, Search, LogOut, MapPin, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { startQueueWatcher } from "@/lib/offlineQueue";
import { toast } from "@/hooks/use-toast";

const STAFF_ROLES = ["owner", "admin", "manager", "staff"];
const LOCATION_KEY = "staff_active_location_id";

interface Loc { id: string; name: string }

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { user, merchant, loading, signOut } = useAuth();
  const location = useLocation();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [activeLoc, setActiveLoc] = useState<string | null>(
    () => localStorage.getItem(LOCATION_KEY),
  );
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const stop = startQueueWatcher(({ ok, failed }) => {
      if (ok > 0) toast({ title: `${ok} bekleyen işlem gönderildi` });
      if (failed > 0) toast({ title: `${failed} işlem başarısız`, variant: "destructive" });
    });
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      stop();
    };
  }, []);

  useEffect(() => {
    if (!user || !merchant) {
      setAuthorized(null);
      return;
    }
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("merchant_id", merchant.id);
      setAuthorized((roles ?? []).some((r) => STAFF_ROLES.includes(r.role)));

      const { data: locs } = await supabase
        .from("locations")
        .select("id, name")
        .eq("merchant_id", merchant.id)
        .eq("is_active", true)
        .order("name");
      setLocations(locs ?? []);
      if (!activeLoc && locs && locs.length > 0) {
        setActiveLoc(locs[0].id);
        localStorage.setItem(LOCATION_KEY, locs[0].id);
      }
    })();
  }, [user, merchant]);

  // Guard order: global auth first, then user, then merchant, then role check.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?next=/staff/scan" state={{ from: location }} replace />;
  if (!merchant) return <Navigate to="/onboarding" replace />;
  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Yetkisiz erişim</h1>
        <p className="text-sm text-muted-foreground">Kasa konsoluna erişim için bir ekip rolüne ihtiyacınız var.</p>
        <Button onClick={signOut} variant="outline">Çıkış</Button>
      </div>
    );
  }

  const onLocChange = (v: string) => {
    setActiveLoc(v);
    localStorage.setItem(LOCATION_KEY, v);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-card px-3">
        <span className="truncate text-sm font-semibold">{merchant.name}</span>
        <span className="text-xs text-muted-foreground">Kasa</span>
        <div className="flex-1" />
        {!online && (
          <span className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
            <WifiOff className="h-3 w-3" /> Çevrimdışı
          </span>
        )}
        {locations.length > 0 && (
          <Select value={activeLoc ?? undefined} onValueChange={onLocChange}>
            <SelectTrigger className="h-9 w-[150px]">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              <SelectValue placeholder="Şube" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="ghost" size="icon" onClick={signOut} title="Çıkış">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-auto">{children}</main>

      <nav className="grid grid-cols-2 border-t border-border bg-card">
        <NavLink
          to="/staff/scan"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-3 text-xs ${
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            }`
          }
        >
          <ScanLine className="h-5 w-5" />
          Tara
        </NavLink>
        <NavLink
          to="/staff/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-3 text-xs ${
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            }`
          }
        >
          <Search className="h-5 w-5" />
          Ara
        </NavLink>
      </nav>
    </div>
  );
}

export function useActiveLocation(): string | null {
  return localStorage.getItem(LOCATION_KEY);
}
