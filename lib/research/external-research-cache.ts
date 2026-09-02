import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { ExternalCompanyResult } from "./free-company-research";

export interface ResearchDiagnostics {
  tavilyStatus: "OK" | "ERROR";
  tavilyError: string | null;
  tavilyReturned: number;
  tavilyAccepted: number;
  cacheHit?: boolean;
}

function cacheIdentity(query: string, countryCode?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const normalizedCountry = countryCode?.trim().toUpperCase() || "GLOBAL";
  return createHash("sha256").update(`${normalizedCountry}:${normalizedQuery}`).digest("hex");
}

export async function readExternalResearchCache(query: string, countryCode?: string) {
  const supabase = createAdminClient();
  const queryKey = cacheIdentity(query, countryCode);
  const { data, error } = await (supabase.from("external_research_cache") as any)
    .select("results,diagnostics,expires_at")
    .eq("query_key", queryKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`Unable to read research cache: ${error.message}`);
  if (!data) return null;
  await (supabase.from("external_research_cache") as any)
    .update({ last_used_at: new Date().toISOString() })
    .eq("query_key", queryKey);
  return {
    results: (data.results || []) as ExternalCompanyResult[],
    diagnostics: { ...(data.diagnostics || {}), cacheHit: true } as ResearchDiagnostics,
  };
}

export async function saveExternalResearchCache(
  query: string,
  countryCode: string | undefined,
  results: ExternalCompanyResult[],
  diagnostics: ResearchDiagnostics
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const supabase = createAdminClient();
  const { error } = await (supabase.from("external_research_cache") as any).upsert({
    query_key: cacheIdentity(query, countryCode),
    query_text: query.trim(),
    country_code: countryCode?.trim().toUpperCase() || null,
    results,
    diagnostics: { ...diagnostics, cacheHit: false },
    tavily_credits: diagnostics.tavilyStatus === "OK" ? 1 : 0,
    created_at: now.toISOString(),
    last_used_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: "query_key" });
  if (error) throw new Error(`Unable to save research cache: ${error.message}`);
}
