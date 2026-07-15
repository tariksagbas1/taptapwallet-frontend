import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface MerchantContext {
  id: string;
  name: string;
  slug: string;
  default_locale: string;
  logo_url: string | null;
}

type AppRole = "owner" | "admin" | "manager" | "staff" | "analyst" | "support";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  merchant: MerchantContext | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  isOwnerLike: boolean; // owner/admin → can use business dashboard
  isStaffLike: boolean; // staff/manager → belongs in staff console
  isPlatformAdmin: boolean;
  isSales: boolean; // platform_roles.role === "sales" → sales console
  loading: boolean;
  refreshMerchant: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const OWNER_LIKE: AppRole[] = ["owner", "admin"];
const STAFF_LIKE: AppRole[] = ["staff", "manager"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<MerchantContext | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isSales, setIsSales] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMerchantAndRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role, merchant_id, merchants:merchant_id(id,name,slug,default_locale,logo_url)")
      .eq("user_id", userId);
    const rows = (data ?? []) as any[];
    if (rows.length === 0) {
      setMerchant(null);
      setRoles([]);
      return;
    }
    // Pick first merchant context, collect all roles for that merchant.
    const firstMerchant = rows.find((r) => r.merchants)?.merchants ?? null;
    setMerchant(firstMerchant as MerchantContext | null);
    const merchantId = firstMerchant?.id ?? rows[0].merchant_id;
    setRoles(rows.filter((r) => r.merchant_id === merchantId).map((r) => r.role as AppRole));
  };

  const loadPlatformRoles = async (userId: string) => {
    const { data } = await supabase
      .from("platform_roles")
      .select("role")
      .eq("user_id", userId);
    const platformRoles = (data ?? []).map((r: any) => r.role as string);
    setIsPlatformAdmin(platformRoles.includes("admin"));
    setIsSales(platformRoles.includes("sales"));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => {
          loadMerchantAndRoles(newSession.user.id);
          loadPlatformRoles(newSession.user.id);
        }, 0);
      } else {
        setMerchant(null);
        setRoles([]);
        setIsPlatformAdmin(false);
        setIsSales(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      if (!existing) {
        setLoading(false);
        return;
      }
      const { data: { user: validUser }, error } = await supabase.auth.getUser();
      if (error || !validUser) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setMerchant(null);
        setRoles([]);
        setIsPlatformAdmin(false);
        setIsSales(false);
        setLoading(false);
        return;
      }
      setSession(existing);
      setUser(validUser);
      Promise.all([loadMerchantAndRoles(validUser.id), loadPlatformRoles(validUser.id)])
        .finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshMerchant = async () => {
    if (user) await loadMerchantAndRoles(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMerchant(null);
    setRoles([]);
    setIsPlatformAdmin(false);
    setIsSales(false);
  };

  const value = useMemo<AuthContextValue>(() => {
    const primaryRole: AppRole | null =
      roles.find((r) => r === "owner") ??
      roles.find((r) => r === "admin") ??
      roles.find((r) => r === "manager") ??
      roles.find((r) => r === "staff") ??
      roles[0] ??
      null;
    return {
      session, user, merchant, roles, primaryRole,
      isOwnerLike: roles.some((r) => OWNER_LIKE.includes(r)),
      isStaffLike: roles.some((r) => STAFF_LIKE.includes(r)) && !roles.some((r) => OWNER_LIKE.includes(r)),
      isPlatformAdmin, isSales, loading, refreshMerchant, signOut,
    };
  }, [session, user, merchant, roles, isPlatformAdmin, isSales, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
