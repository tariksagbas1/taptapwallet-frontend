import { describe, it, expect, vi, beforeEach } from "vitest";

const getUser = vi.fn();
const insert = vi.fn();
const fromSelect = {
  select: () => ({
    eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: { merchant_id: "m1" } }) }) }),
  }),
};
const fromInsert = { insert: (...a: unknown[]) => insert(...a) };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: () => getUser() },
    from: (t: string) => (t === "app_errors" ? fromInsert : (fromSelect as any)),
  },
}));

beforeEach(() => {
  getUser.mockReset();
  insert.mockReset();
});

describe("logAppError", () => {
  it("does nothing when no user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { logAppError } = await import("./errorLogger");
    await logAppError({ message: "x" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts error with truncated message", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    insert.mockResolvedValue({ error: null });
    const { logAppError } = await import("./errorLogger");
    await logAppError({ message: "a".repeat(5000), severity: "fatal" });
    expect(insert).toHaveBeenCalledOnce();
    const arg = insert.mock.calls[0][0];
    expect(arg.user_id).toBe("u1");
    expect(arg.merchant_id).toBe("m1");
    expect(arg.severity).toBe("fatal");
    expect(arg.message.length).toBe(2000);
  });

  it("never throws even when supabase fails", async () => {
    getUser.mockRejectedValue(new Error("network"));
    const { logAppError } = await import("./errorLogger");
    await expect(logAppError({ message: "x" })).resolves.toBeUndefined();
  });
});

describe("initGlobalErrorHandlers", () => {
  it("is idempotent", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const { initGlobalErrorHandlers } = await import("./errorLogger");
    initGlobalErrorHandlers();
    initGlobalErrorHandlers();
    const calls = add.mock.calls.filter(([t]) => t === "error" || t === "unhandledrejection");
    // Should only register once total (across both calls)
    expect(calls.length).toBeLessThanOrEqual(2);
  });
});
