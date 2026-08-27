import { createAdminClient } from "../supabase/server";

export async function reserveApolloCredit(companyId: string, personId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase as any).rpc("reserve_apollo_credit", {
    p_company_id: companyId,
    p_person_id: personId,
  });
  if (error) throw new Error(`Apollo budget check failed: ${error.message}`);
  if (!data) throw new Error("APOLLO_BUDGET_EXHAUSTED: Se alcanzó el presupuesto diario o del periodo.");
  return String(data);
}

export async function finalizeApolloUsage(
  usageId: string,
  status: "MATCHED" | "NO_MATCH" | "FAILED",
  providerRecordId?: string,
  errorCode?: string,
  estimatedCredits: number = 1
) {
  const { error } = await (createAdminClient().from("apollo_usage_log") as any).update({
    status,
    provider_record_id: providerRecordId || null,
    error_code: errorCode || null,
    estimated_credits: Math.max(0, estimatedCredits),
    completed_at: new Date().toISOString(),
  }).eq("id", usageId);
  if (error) console.error(`[ApolloBudget] Unable to finalize usage ${usageId}: ${error.message}`);
}

export async function refreshApolloBudgetPhase() {
  const { data, error } = await (createAdminClient() as any).rpc("refresh_apollo_budget_phase");
  if (error) throw new Error(error.message);
  return data as "PROMO" | "STANDARD";
}

export async function getApolloBudgetSummary() {
  const supabase = createAdminClient();
  await refreshApolloBudgetPhase();
  const [{ data: settings, error }, { data: usage }] = await Promise.all([
    (supabase.from("apollo_budget_settings") as any).select("*").eq("id", 1).single(),
    (supabase.from("apollo_usage_log") as any).select("estimated_credits, requested_at"),
  ]);
  if (error || !settings) throw new Error(error?.message || "Apollo budget settings unavailable.");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayUsed = (usage || []).filter((row: any) => row.requested_at.startsWith(today))
    .reduce((sum: number, row: any) => sum + row.estimated_credits, 0);
  const phaseUsed = settings.phase === "PROMO"
    ? (usage || []).filter((row: any) => row.requested_at >= settings.promo_started_at && row.requested_at < settings.promo_expires_at)
        .reduce((sum: number, row: any) => sum + row.estimated_credits, 0)
    : (usage || []).filter((row: any) => row.requested_at.startsWith(month))
        .reduce((sum: number, row: any) => sum + row.estimated_credits, 0);
  const periodLimit = settings.phase === "PROMO" ? settings.promo_credit_limit : settings.standard_monthly_limit;
  const dailyLimit = settings.phase === "PROMO" ? settings.promo_daily_limit : settings.standard_daily_limit;
  return {
    phase: settings.phase,
    promoExpiresAt: settings.promo_expires_at,
    todayUsed,
    dailyLimit,
    periodUsed: phaseUsed,
    periodLimit,
    estimatedRemaining: Math.max(0, periodLimit - phaseUsed),
    disclaimer: "Estimación interna por llamadas API; Apollo es la fuente definitiva del saldo.",
  };
}
