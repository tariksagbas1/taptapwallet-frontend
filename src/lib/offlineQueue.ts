import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

const KEY = "staff_pending_actions_v1";

export type PendingAction = {
  id: string;
  fn: "stamp-action" | "redeem-reward";
  body: Record<string, unknown>;
  queuedAt: number;
};

export async function enqueueAction(a: Omit<PendingAction, "id" | "queuedAt">): Promise<PendingAction> {
  const queue = ((await get(KEY)) as PendingAction[] | undefined) ?? [];
  const item: PendingAction = { ...a, id: crypto.randomUUID(), queuedAt: Date.now() };
  queue.push(item);
  await set(KEY, queue);
  return item;
}

export async function getQueue(): Promise<PendingAction[]> {
  return ((await get(KEY)) as PendingAction[] | undefined) ?? [];
}

export async function clearQueue() {
  await del(KEY);
}

export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { ok: 0, failed: 0 };
  let ok = 0, failed = 0;
  const remaining: PendingAction[] = [];
  for (const item of queue) {
    try {
      const { error } = await supabase.functions.invoke(item.fn, { body: item.body });
      if (error) { failed++; remaining.push(item); }
      else ok++;
    } catch {
      failed++;
      remaining.push(item);
    }
  }
  if (remaining.length > 0) await set(KEY, remaining);
  else await clearQueue();
  return { ok, failed };
}

export function startQueueWatcher(onFlush: (r: { ok: number; failed: number }) => void) {
  const handler = async () => {
    if (navigator.onLine) {
      const r = await flushQueue();
      if (r.ok > 0 || r.failed > 0) onFlush(r);
    }
  };
  window.addEventListener("online", handler);
  // Also try once on startup
  handler();
  return () => window.removeEventListener("online", handler);
}
