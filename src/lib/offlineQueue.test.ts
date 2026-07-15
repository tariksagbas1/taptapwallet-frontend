import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: vi.fn(async (k: string) => store.get(k)),
  set: vi.fn(async (k: string, v: unknown) => {
    store.set(k, v);
  }),
  del: vi.fn(async (k: string) => {
    store.delete(k);
  }),
}));

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

beforeEach(() => {
  store.clear();
  invoke.mockReset();
});

describe("offlineQueue", () => {
  it("enqueues with id+queuedAt and persists", async () => {
    const { enqueueAction, getQueue } = await import("./offlineQueue");
    const item = await enqueueAction({ fn: "stamp-action", body: { x: 1 } });
    expect(item.id).toBeTruthy();
    const q = await getQueue();
    expect(q).toHaveLength(1);
    expect(q[0].fn).toBe("stamp-action");
  });

  it("flushQueue calls supabase and clears when all succeed", async () => {
    const { enqueueAction, flushQueue, getQueue } = await import("./offlineQueue");
    await enqueueAction({ fn: "stamp-action", body: {} });
    await enqueueAction({ fn: "redeem-reward", body: {} });
    invoke.mockResolvedValue({ data: null, error: null });
    const r = await flushQueue();
    expect(r).toEqual({ ok: 2, failed: 0 });
    expect(await getQueue()).toEqual([]);
  });

  it("keeps failed items in queue", async () => {
    const { enqueueAction, flushQueue, getQueue } = await import("./offlineQueue");
    await enqueueAction({ fn: "stamp-action", body: { a: 1 } });
    await enqueueAction({ fn: "stamp-action", body: { a: 2 } });
    invoke
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
      .mockResolvedValueOnce({ data: null, error: null });
    const r = await flushQueue();
    expect(r).toEqual({ ok: 1, failed: 1 });
    expect(await getQueue()).toHaveLength(1);
  });

  it("empty queue is a no-op", async () => {
    const { flushQueue } = await import("./offlineQueue");
    expect(await flushQueue()).toEqual({ ok: 0, failed: 0 });
    expect(invoke).not.toHaveBeenCalled();
  });
});
