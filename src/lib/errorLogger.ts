import { supabase } from "@/integrations/supabase/client";

interface LogPayload {
  message: string;
  stack?: string;
  route?: string;
  severity?: "info" | "warn" | "error" | "fatal";
  context?: Record<string, unknown>;
}

async function getActiveMerchantId(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("merchant_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    return data?.merchant_id ?? null;
  } catch {
    return null;
  }
}

export async function logAppError(payload: LogPayload): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // RLS requires user_id = auth.uid()
    const merchantId = await getActiveMerchantId(user.id);
    await supabase.from("app_errors").insert({
      user_id: user.id,
      merchant_id: merchantId ?? undefined,
      message: payload.message.slice(0, 2000),
      stack: payload.stack?.slice(0, 8000),
      route: payload.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
      severity: payload.severity ?? "error",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      context_json: (payload.context ?? null) as any,
    } as any);
  } catch (e) {
    // Silent: never let logging break the app
    console.warn("[errorLogger] insert failed", e);
  }
}

let initialized = false;
export function initGlobalErrorHandlers() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    logAppError({
      message: event.message || "Uncaught error",
      stack: event.error?.stack,
      severity: "error",
      context: { type: "window.error", filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = event.reason;
    logAppError({
      message: typeof reason === "string" ? reason : (reason?.message ?? "Unhandled promise rejection"),
      stack: reason?.stack,
      severity: "error",
      context: { type: "unhandledrejection" },
    });
  });
}
