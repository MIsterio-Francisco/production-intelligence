import { createClient } from "@/lib/supabase/server";
import { calculateAllCompanyScores } from "@/lib/scoring/engine";
import { CompanyScoringInput, ComprehensiveScoreResult, SCORING_ENGINE_VERSION } from "@/lib/scoring/types";

export async function calculateAndPersistCompanyScores(companyId: string): Promise<ComprehensiveScoreResult | null> {
  try {
    const supabase = await createClient();

    const { data: company, error } = await supabase
      .from("companies")
      .select("*, company_categories(category)")
      .eq("id", companyId)
      .single();

    if (error || !company) return null;

    const rawCompany: any = company;

    const [
      { data: projectsData },
      { data: peopleData },
      { data: eventsData },
      { data: awardsData },
      { data: socialData },
    ] = await Promise.all([
      supabase.from("company_projects").select("role, projects(*)").eq("company_id", companyId),
      supabase.from("company_people").select("role, seniority, is_current, people(*)").eq("company_id", companyId),
      supabase.from("company_events").select("*").eq("company_id", companyId),
      supabase.from("awards").select("*").eq("company_id", companyId),
      supabase.from("social_profiles").select("*").eq("company_id", companyId),
    ]);

    const input: CompanyScoringInput = {
      id: rawCompany.id,
      name: rawCompany.name,
      country_code: rawCompany.country_code,
      company_type: rawCompany.company_type,
      employee_count_min: rawCompany.employee_count_min,
      employee_count_max: rawCompany.employee_count_max,
      founded_year: rawCompany.founded_year,
      is_active: rawCompany.is_active ?? true,
      categories: (rawCompany.company_categories || []).map((c: any) => c.category),
      projects: (projectsData || []).map((cp: any) => ({
        id: cp.projects?.id,
        project_type: cp.projects?.project_type,
        status: cp.projects?.status,
        country_code: cp.projects?.country_code,
        budget_min: cp.projects?.budget_min,
        budget_max: cp.projects?.budget_max,
        release_date: cp.projects?.release_date,
        company_role: cp.role,
      })),
      people: (peopleData || []).map((cp: any) => ({
        id: cp.people?.id,
        role: cp.role,
        seniority: cp.seniority,
        is_current: cp.is_current ?? true,
      })),
      events: (eventsData || []).map((ev: any) => ({
        id: ev.id,
        event_type: ev.event_type,
        event_date: ev.event_date,
        importance_score: ev.importance_score,
      })),
      awards: (awardsData || []).map((aw: any) => ({
        id: aw.id,
        organization: aw.organization || aw.name,
        category: aw.category,
        result: aw.result,
        year: aw.year,
      })),
      socialProfiles: (socialData || []).map((soc: any) => ({
        platform: soc.platform,
        follower_count: soc.follower_count,
        engagement_rate: soc.engagement_rate,
      })),
    };

    const scores = calculateAllCompanyScores(input);

    // 1. Persist snapshot to company_scores ledger
    await (supabase.from("company_scores") as any).insert({
      company_id: companyId,
      power_score: scores.powerScore,
      creative_score: scores.creativeScore,
      commercial_score: scores.commercialScore,
      momentum_score: scores.momentumScore,
      international_score: scores.internationalScore,
      social_score: scores.socialScore,
      mcl_match_score: scores.mclMatchScore,
      score_version: SCORING_ENGINE_VERSION,
      score_breakdown: scores.breakdown as any,
      calculated_at: scores.calculatedAt,
    });

    // 2. Synchronize current scores on companies table
    await (supabase.from("companies") as any).update({
      power_score: scores.powerScore,
      creative_score: scores.creativeScore,
      commercial_score: scores.commercialScore,
      momentum_score: scores.momentumScore,
      international_score: scores.internationalScore,
      social_score: scores.socialScore,
      mcl_match_score: scores.mclMatchScore,
      score_confidence: scores.confidence,
      updated_at: new Date().toISOString(),
    }).eq("id", companyId);

    return scores;
  } catch (err) {
    console.error("[ScoringService] Error persisting scores for company:", companyId, err);
    return null;
  }
}

export async function calculateAndPersistAllCompanies(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: companies } = await supabase.from("companies").select("id");

    if (!companies || companies.length === 0) return 0;

    let count = 0;
    for (const c of (companies as any[])) {
      const res = await calculateAndPersistCompanyScores(c.id);
      if (res) count++;
    }

    return count;
  } catch (err) {
    console.error("[ScoringService] Error batch recalculating scores:", err);
    return 0;
  }
}

export async function getScoreHistory(companyId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("company_scores")
      .select("*")
      .eq("company_id", companyId)
      .order("calculated_at", { ascending: false });

    return data || [];
  } catch {
    return [];
  }
}
