import { SEED_COMPANIES_FALLBACK } from "@/lib/services/company-service";
import { createAdminClient } from "@/lib/supabase/server";

const COMPANY_SELECT =
  "id, website_url, description, company_type, data_classification, provenance_type, company_categories(category)";

/**
 * Resolves both real Supabase UUIDs and the legacy catalog IDs used by fallback
 * profiles (for example `c1`). Legacy records are materialized as source claims
 * before contact discovery so Apollo results can be persisted against a real FK.
 */
export async function resolveContactCompany(reference: string) {
  const supabase = createAdminClient();
  // Existing seed/restored rows can use non-RFC-versioned UUIDs. PostgreSQL
  // accepts the canonical 8-4-4-4-12 shape regardless of version bits.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference);
  const existing = await (supabase.from("companies") as any)
    .select(COMPANY_SELECT)
    .eq(isUuid ? "id" : "slug", reference)
    .maybeSingle();
  if (existing.data) return existing.data;

  const legacy = SEED_COMPANIES_FALLBACK.find(
    (company) => company.id === reference || company.slug === reference
  );
  if (!legacy?.slug || !legacy?.name) return null;

  // The authenticated page can fall back because of RLS even when the admin
  // client can see an already-restored UUID. Preserve that record unchanged.
  const restored = await (supabase.from("companies") as any)
    .select(COMPANY_SELECT)
    .eq("slug", legacy.slug)
    .maybeSingle();
  if (restored.data) return restored.data;

  // Older catalogue restores may have generated a different slug. Reuse the
  // canonical company selected by the importer's name/domain deduplication.
  const sameName = await (supabase.from("companies") as any)
    .select(COMPANY_SELECT)
    .ilike("name", legacy.name)
    .limit(1)
    .maybeSingle();
  if (sameName.data) return sameName.data;

  if (legacy.website_url) {
    const domain = new URL(legacy.website_url).hostname.replace(/^www\./, "");
    const sameDomain = await (supabase.from("companies") as any)
      .select(COMPANY_SELECT)
      .ilike("website_url", `%${domain}%`)
      .limit(1)
      .maybeSingle();
    if (sameDomain.data) return sameDomain.data;
  }

  const row = {
    name: legacy.name,
    slug: legacy.slug,
    legal_name: legacy.legal_name || null,
    description: legacy.description || null,
    company_type: legacy.company_type || "production_company",
    founded_year: legacy.founded_year || null,
    website_url: legacy.website_url || null,
    country_code: legacy.country_code || null,
    country_name: legacy.country_name || null,
    city: legacy.city || null,
    employee_count_min: legacy.employee_count_min || null,
    employee_count_max: legacy.employee_count_max || null,
    is_active: legacy.is_active !== false,
    provenance_type: "legacy_catalog",
    data_classification: "SOURCE_CLAIM",
    data_quality_score: 40,
    is_demo: false,
    score_confidence: 0,
    ai_summary: legacy.ai_summary || null,
    last_verified_at: null,
    updated_at: new Date().toISOString(),
  };
  const materialized = await (supabase.from("companies") as any)
    .upsert(row, { onConflict: "slug" })
    .select(COMPANY_SELECT)
    .single();
  if (materialized.error || !materialized.data) {
    throw new Error(materialized.error?.message || "Unable to restore company record.");
  }

  const categories = (legacy.categories || []).map((category: string) => ({
    company_id: materialized.data.id,
    category,
  }));
  if (categories.length > 0) {
    await (supabase.from("company_categories") as any).upsert(categories, {
      onConflict: "company_id,category",
      ignoreDuplicates: true,
    });
  }

  const refreshed = await (supabase.from("companies") as any)
    .select(COMPANY_SELECT)
    .eq("id", materialized.data.id)
    .single();
  return refreshed.data || materialized.data;
}
