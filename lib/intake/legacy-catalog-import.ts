import { createAdminClient } from "@/lib/supabase/server";
import { SEED_COMPANIES_FALLBACK } from "@/lib/services/company-service";
import { normalizedDomain, queueCompanyCandidates } from "./daily-company-intake";

const LEGACY_CLASSIFICATION = "SOURCE_CLAIM";

export async function importLegacyCompanyCatalog() {
  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("companies")
    .select("slug");
  if (existingError) throw new Error(existingError.message);

  const existingSlugs = new Set(((existing || []) as Array<{ slug: string }>).map((row) => row.slug));
  const candidates = SEED_COMPANIES_FALLBACK.filter((company) =>
    company.name && company.slug && !existingSlugs.has(company.slug)
  );

  const rows = candidates.map((company) => ({
    name: company.name,
    slug: company.slug,
    legal_name: company.legal_name || null,
    description: company.description || null,
    company_type: company.company_type || "production_company",
    founded_year: company.founded_year || null,
    website_url: company.website_url || null,
    country_code: company.country_code || null,
    country_name: company.country_name || null,
    city: company.city || null,
    region: company.region || null,
    employee_count_min: company.employee_count_min || null,
    employee_count_max: company.employee_count_max || null,
    is_active: company.is_active !== false,
    provenance_type: "legacy_catalog",
    data_classification: LEGACY_CLASSIFICATION,
    data_quality_score: 40,
    is_demo: false,
    score_confidence: 0,
    ai_summary: company.ai_summary || null,
    last_verified_at: null,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error } = await (supabase.from("companies") as any).insert(rows);
    if (error) throw new Error(`Unable to restore legacy companies: ${error.message}`);
  }

  const { data: importedCompanies, error: importedError } = await supabase
    .from("companies")
    .select("id, slug")
    .in("slug", candidates.map((company) => company.slug));
  if (importedError) throw new Error(importedError.message);

  const idsBySlug = new Map(
    ((importedCompanies || []) as Array<{ id: string; slug: string }>).map((company) => [company.slug, company.id])
  );
  const categoryRows = candidates.flatMap((company) =>
    (company.categories || []).map((category: string) => ({
      company_id: idsBySlug.get(company.slug),
      category,
    })).filter((row: { company_id: string | undefined }) => Boolean(row.company_id))
  );
  if (categoryRows.length > 0) {
    const { error } = await (supabase.from("company_categories") as any)
      .upsert(categoryRows, { onConflict: "company_id,category", ignoreDuplicates: true });
    if (error) throw new Error(`Unable to restore categories: ${error.message}`);
  }

  const intakeCandidates = candidates
    .filter((company) => {
      if (!company.website_url) return false;
      try {
        normalizedDomain(company.website_url);
        return true;
      } catch {
        return false;
      }
    })
    .map((company) => ({
      name: company.name,
      officialWebsiteUrl: company.website_url,
      discoverySourceUrl: company.website_url,
      discoverySourceType: "LEGACY_CATALOG_REVIEW",
      countryCode: company.country_code,
    }));
  let queued = 0;
  for (let index = 0; index < intakeCandidates.length; index += 50) {
    try {
      const result = await queueCompanyCandidates(intakeCandidates.slice(index, index + 50));
      queued += result.length;
    } catch (error) {
      console.error("[LegacyCatalog] Unable to queue verification candidates", error);
    }
  }

  return {
    catalogSize: SEED_COMPANIES_FALLBACK.length,
    imported: rows.length,
    alreadyPresent: SEED_COMPANIES_FALLBACK.length - rows.length,
    queuedForOfficialReview: queued,
    classification: LEGACY_CLASSIFICATION,
  };
}
