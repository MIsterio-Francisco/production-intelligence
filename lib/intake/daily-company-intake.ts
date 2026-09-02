import { createHash } from "node:crypto";
import { createAdminClient } from "../supabase/server";
import { normalizeEntityName, resolveCompanyEntity } from "../ingestion/entity-resolution";

export const DAILY_COMPANY_QUOTA = 2;

export interface CompanyIntakeCandidateInput {
  name: string;
  officialWebsiteUrl: string;
  discoverySourceUrl: string;
  discoverySourceType?: string;
  countryCode?: string;
}

const PRODUCTION_TERMS = [
  "film production company", "television production company", "film and television production",
  "film & television production", "motion picture production", "productora cinematográfica",
  "productora de cine", "productora audiovisual", "producción cinematográfica",
  "producción de televisión", "scripted production", "unscripted production",
  "documentary production", "producción documental",
];

const EXCLUDED_ONLY_TERMS = [
  "post-production studio", "post production studio", "visual effects studio", "vfx studio",
  "color grading studio", "sound post-production", "equipment rental", "software company",
];

export function normalizedDomain(value: string): string {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP(S) URLs are accepted.");
  const domain = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!domain.includes(".") || domain === "localhost") throw new Error("A public official domain is required.");
  return domain;
}

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function classifyOfficialProductionWebsite(html: string): {
  eligible: boolean;
  categories: string[];
  reason: string;
} {
  const text = visibleText(html).slice(0, 250_000);
  const matchedProductionTerms = PRODUCTION_TERMS.filter((term) => text.includes(term));
  if (matchedProductionTerms.length === 0) {
    const excluded = EXCLUDED_ONLY_TERMS.find((term) => text.includes(term));
    return {
      eligible: false,
      categories: [],
      reason: excluded
        ? `Official site identifies the company as a provider (${excluded}).`
        : "Official site does not provide enough evidence of film or TV production.",
    };
  }

  const categories = new Set<string>();
  if (/film|cinematogr|cine|motion picture/.test(text)) categories.add("film");
  if (/television|\btv\b|series|scripted|unscripted/.test(text)) categories.add("television");
  if (/documentary|documental/.test(text)) categories.add("documentary");
  if (categories.size === 0) categories.add("film");
  return { eligible: true, categories: [...categories], reason: matchedProductionTerms[0] };
}

function slugify(name: string, domain: string): string {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "production-company";
  const suffix = createHash("sha256").update(domain).digest("hex").slice(0, 6);
  return `${base}-${suffix}`;
}

export async function queueCompanyCandidates(inputs: CompanyIntakeCandidateInput[]) {
  if (inputs.length === 0 || inputs.length > 50) throw new Error("Submit between 1 and 50 candidates.");
  const uniqueInputs = [...new Map(inputs.map((input) => [normalizedDomain(input.officialWebsiteUrl), input])).values()];
  const rows = uniqueInputs.map((input) => ({
    name: input.name.trim(),
    official_website_url: input.officialWebsiteUrl,
    normalized_domain: normalizedDomain(input.officialWebsiteUrl),
    discovery_source_url: input.discoverySourceUrl,
    discovery_source_type: input.discoverySourceType || "MANUAL_RESEARCH",
    country_code: input.countryCode?.toUpperCase() || null,
    status: "QUEUED",
    updated_at: new Date().toISOString(),
  }));
  if (rows.some((row) => !row.name || !row.discovery_source_url)) throw new Error("Name and discovery source are required.");

  const supabase = createAdminClient();
  const { data: existingCompanies, error: existingCompaniesError } = await supabase
    .from("companies").select("name,website_url");
  if (existingCompaniesError) throw new Error(`Unable to check existing companies: ${existingCompaniesError.message}`);
  const companyIdentities = (existingCompanies || []) as Array<{ name: string; website_url: string | null }>;
  const existingDomains = new Set(companyIdentities.flatMap((company) => {
    if (!company.website_url) return [];
    try { return [normalizedDomain(company.website_url)]; } catch { return []; }
  }));
  const existingNames = new Set(companyIdentities.map((company) => normalizeEntityName(company.name)));
  const newRows = rows.filter((row) => !existingDomains.has(row.normalized_domain) && !existingNames.has(normalizeEntityName(row.name)));
  if (newRows.length === 0) return [];
  const { data, error } = await (supabase.from("company_intake_candidates") as any)
    .upsert(newRows, { onConflict: "normalized_domain", ignoreDuplicates: true })
    .select("id, name, normalized_domain, status");
  if (error) throw new Error(`Unable to queue company candidates: ${error.message}`);
  return data || [];
}

async function verifyOfficialSite(url: string) {
  const requestedDomain = normalizedDomain(url);
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "MisterioColorLabProductionIntelligence/1.0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Official website returned HTTP ${response.status}.`);
  const finalDomain = normalizedDomain(response.url);
  if (finalDomain !== requestedDomain && !finalDomain.endsWith(`.${requestedDomain}`)) {
    throw new Error("Official website redirected to a different domain.");
  }
  const html = await response.text();
  if (html.length < 500) throw new Error("Official website returned insufficient content.");
  return { ...classifyOfficialProductionWebsite(html), finalUrl: response.url };
}

async function processCandidate(candidate: any) {
  const supabase = createAdminClient();
  await (supabase.from("company_intake_candidates") as any).update({
    status: "PROCESSING", attempts: candidate.attempts + 1, last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", candidate.id);

  const { data: companies, error: companiesError } = await supabase
    .from("companies").select("id, name, website_url, country_code");
  if (companiesError) throw new Error(companiesError.message);
  const resolution = resolveCompanyEntity(candidate.name, candidate.official_website_url, companies || []);
  if (resolution.status === "MATCHED") {
    await (supabase.from("company_intake_candidates") as any).update({
      status: "DUPLICATE", admitted_company_id: resolution.matchedId, last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", candidate.id);
    return "DUPLICATE" as const;
  }

  const verification = await verifyOfficialSite(candidate.official_website_url);
  if (!verification.eligible) {
    await (supabase.from("company_intake_candidates") as any).update({
      status: "REJECTED", last_error: verification.reason, updated_at: new Date().toISOString(),
    }).eq("id", candidate.id);
    return "REJECTED" as const;
  }

  const now = new Date().toISOString();
  const { data: company, error: insertError } = await (supabase.from("companies") as any).insert({
    name: candidate.name,
    slug: slugify(candidate.name, candidate.normalized_domain),
    company_type: "production_company",
    website_url: verification.finalUrl,
    country_code: candidate.country_code,
    is_active: true,
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    score_confidence: 98,
    last_verified_at: now,
    updated_at: now,
  }).select("id").single();
  if (insertError || !company) throw new Error(insertError?.message || "Company insert failed.");

  await (supabase.from("company_categories") as any).insert(
    verification.categories.map((category) => ({ company_id: company.id, category }))
  );
  await (supabase.from("sources") as any).insert({
    source_type: "official_company_website",
    source_name: `${candidate.name} official website`,
    url: verification.finalUrl,
    title: candidate.name,
    publisher: candidate.name,
    credibility_score: 98,
    metadata: {
      intake_candidate_id: candidate.id,
      discovery_source_url: candidate.discovery_source_url,
      verification_reason: verification.reason,
      normalized_domain: candidate.normalized_domain,
    },
  });
  await (supabase.from("company_intake_candidates") as any).update({
    status: "ADMITTED", admitted_company_id: company.id, last_error: null, updated_at: now,
  }).eq("id", candidate.id);
  return "ADMITTED" as const;
}

export async function runDailyCompanyIntake(date = new Date()) {
  const supabase = createAdminClient();
  const runDate = date.toISOString().slice(0, 10);
  const { data: run, error: runError } = await (supabase.from("daily_company_intake_runs") as any)
    .insert({ run_date: runDate, quota: DAILY_COMPANY_QUOTA, status: "RUNNING" })
    .select("id").single();
  if (runError) {
    const { data: existing } = await (supabase.from("daily_company_intake_runs") as any)
      .select("*").eq("run_date", runDate).single();
    if (existing) return { ...existing, alreadyRan: true };
    throw new Error(`Unable to start daily intake: ${runError.message}`);
  }

  const { data: candidates, error: queueError } = await (supabase.from("company_intake_candidates") as any)
    .select("*").eq("status", "QUEUED").order("created_at", { ascending: true }).limit(10);
  if (queueError) throw new Error(queueError.message);

  let admitted = 0;
  let duplicates = 0;
  let rejected = 0;
  let checked = 0;
  const errors: string[] = [];
  for (const candidate of candidates || []) {
    if (admitted >= DAILY_COMPANY_QUOTA) break;
    checked += 1;
    try {
      const outcome = await processCandidate(candidate);
      if (outcome === "ADMITTED") admitted += 1;
      else if (outcome === "DUPLICATE") duplicates += 1;
      else rejected += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown intake error";
      errors.push(`${candidate.normalized_domain}: ${message}`);
      const nextStatus = candidate.attempts + 1 >= 3 ? "FAILED" : "QUEUED";
      await (supabase.from("company_intake_candidates") as any).update({
        status: nextStatus, last_error: message, updated_at: new Date().toISOString(),
      }).eq("id", candidate.id);
    }
  }

  const status = errors.length > 0 && checked === errors.length ? "FAILED" : "COMPLETED";
  const result = {
    status, candidates_checked: checked, companies_admitted: admitted,
    duplicates_found: duplicates, candidates_rejected: rejected, errors,
    completed_at: new Date().toISOString(),
  };
  await (supabase.from("daily_company_intake_runs") as any).update(result).eq("id", run.id);
  return { run_date: runDate, quota: DAILY_COMPANY_QUOTA, ...result, apollo_credits_used: 0 };
}

export function candidateIdentityKey(input: CompanyIntakeCandidateInput): string {
  return `${normalizeEntityName(input.name)}:${normalizedDomain(input.officialWebsiteUrl)}`;
}
