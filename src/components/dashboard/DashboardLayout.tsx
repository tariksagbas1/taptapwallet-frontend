import { ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Stamp,
  Users,
  Store,
  UserCog,
  Settings,
  Coffee,
  LogOut,
  Loader2,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Genel Bakış", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Müşteri İçgörüleri", url: "/dashboard/insights", icon: Sparkles },
  { title: "Programlar", url: "/dashboard/programs", icon: Stamp },
  { title: "Üyeler", url: "/dashboard/members", icon: Users },
  { title: "Şubeler", url: "/dashboard/locations", icon: Store },
  { title: "Ekip", url: "/dashboard/team", icon: UserCog },
  { title: "Denetim Kayıtları", url: "/dashboard/audit", icon: ScrollText },
  { title: "Ayarlar", url: "/dashboard/settings", icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { merchant, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {merchant?.logo_url ? (
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md transform-gpu">
              <img
                src={merchant.logo_url}
                alt=""
                className="size-full scale-110 object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Coffee className="h-4 w-4" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {merchant?.name ?? "Sadakat Cüzdanı"}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/60">İşletme paneli</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Çıkış</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, merchant, isPlatformAdmin, isOwnerLike, isStaffLike, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!merchant) {
    return <Navigate to={isPlatformAdmin ? "/admin/merchants" : "/onboarding"} replace />;
  }
  // Staff/manager (without owner/admin rights) belong in the staff console, not the owner dashboard.
  if (isStaffLike && !isOwnerLike && !isPlatformAdmin) {
    return <Navigate to="/staff/scan" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border bg-card/50 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{merchant.name}</span>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
