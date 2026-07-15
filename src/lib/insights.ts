import { supabase } from "@/integrations/supabase/client";
import type { LifecycleStatus, LoyaltySegment } from "@/lib/segments";

export interface CustomerRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_day: number | null;
  birth_month: number | null;
  marketing_opt_in: boolean;
  created_at: string;
  tags: string[];
  metrics: {
    total_visits: number;
    total_stamps: number;
    total_rewards_earned: number;
    total_rewards_redeemed: number;
    first_visit_at: string | null;
    last_visit_at: string | null;
    lifecycle_status: LifecycleStatus;
    loyalty_segment: LoyaltySegment;
  } | null;
}

export async function fetchCustomersWithMetrics(merchantId: string): Promise<CustomerRow[]> {
  const [{ data: customers }, { data: metrics }] = await Promise.all([
    supabase
      .from("customers")
      .select("id,first_name,last_name,email,phone,birth_day,birth_month,marketing_opt_in,created_at,tags")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("customer_metrics")
      .select(
        "customer_id,total_visits,total_stamps,total_rewards_earned,total_rewards_redeemed,first_visit_at,last_visit_at,lifecycle_status,loyalty_segment",
      )
      .eq("merchant_id", merchantId)
      .limit(2000),
  ]);
  const mMap = new Map((metrics ?? []).map((m: any) => [m.customer_id, m]));
  return (customers ?? []).map((c: any) => ({
    ...c,
    metrics: mMap.get(c.id) ?? null,
  }));
}

export interface CustomerEventRow {
  id: string;
  event_type: string;
  event_source: string | null;
  metadata: any;
  pass_id: string | null;
  program_id: string | null;
  location_id: string | null;
  created_at: string;
}

export async function fetchCustomerTimeline(
  customerId: string,
  limit = 100,
): Promise<CustomerEventRow[]> {
  const { data } = await supabase
    .from("customer_events")
    .select("id,event_type,event_source,metadata,pass_id,program_id,location_id,created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CustomerEventRow[];
}
