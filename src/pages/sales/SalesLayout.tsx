import { ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Briefcase, Store, UserPlus, LogOut, Loader2 } from "lucide-react";

const items = [
  { title: "Satış Paneli", url: "/sales", icon: Store, end: true },
  { title: "Yeni İşletme Kaydet", url: "/sales/onboarding/new", icon: UserPlus },
];

export default function SalesLayout({ children }: { children: ReactNode }) {
  const { user, isSales, isPlatformAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!isSales) return <Navigate to={isPlatformAdmin ? "/admin/merchants" : "/dashboard"} replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Satış</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {items.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Çıkış
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/50 px-4 backdrop-blur md:hidden">
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-semibold">Satış</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
