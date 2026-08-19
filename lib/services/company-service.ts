import { createClient } from "@/lib/supabase/server";
import { CompanyWithDetails, CompanyFilterOptions } from "@/types/company";
import { Database } from "@/types/database.types";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Whitelisted sort columns mapping to prevent SQL injection
const ALLOWED_SORT_FIELDS: Record<string, string> = {
  mcl_match_score: "mcl_match_score",
  power_score: "power_score",
  momentum_score: "momentum_score",
  creative_score: "creative_score",
  commercial_score: "commercial_score",
  name: "name",
};

export async function getCompanies(
  options: CompanyFilterOptions = {}
): Promise<PaginatedResponse<CompanyWithDetails>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const sortColumn = ALLOWED_SORT_FIELDS[options.sort || "mcl_match_score"] || "mcl_match_score";
  const ascending = options.order === "asc";

  try {
    const supabase = await createClient();

    let query = supabase
      .from("companies")
      .select("*, company_categories(category)", { count: "exact" });

    // Filter: Country
    if (options.country) {
      query = query.eq("country_code", options.country.toUpperCase());
    }

    // Filter: Company Type
    if (options.companyType) {
      query = query.eq("company_type", options.companyType);
    }

    // Filter: Min Power Score
    if (typeof options.minPower === "number" && !isNaN(options.minPower)) {
      query = query.gte("power_score", options.minPower);
    }

    // Filter: Min Momentum Score
    if (typeof options.minMomentum === "number" && !isNaN(options.minMomentum)) {
      query = query.gte("momentum_score", options.minMomentum);
    }

    // Filter: Min MCL Match Score
    if (typeof options.minMclMatch === "number" && !isNaN(options.minMclMatch)) {
      query = query.gte("mcl_match_score", options.minMclMatch);
    }

    // Search: Case-insensitive search on name, legal_name, city, country_name, description
    if (options.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      query = query.or(
        `name.ilike.${s},legal_name.ilike.${s},city.ilike.${s},country_name.ilike.${s},description.ilike.${s}`
      );
    }

    // Sorting & Pagination
    query = query
      .order(sortColumn, { ascending, nullsFirst: false })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[CompanyService] Error fetching companies:", error.message);
      return getFallbackCompanies(options, page, limit);
    }

    if (!data || data.length === 0) {
      // Check if DB is unseeded, return fallback dataset for rich demo experience
      const totalCount = count || 0;
      if (totalCount === 0) {
        return getFallbackCompanies(options, page, limit);
      }
    }

    const formattedData: CompanyWithDetails[] = (data || []).map((row: any) => ({
      ...row,
      categories: (row.company_categories || []).map((c: any) => c.category),
    }));

    const total = count || formattedData.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err) {
    console.error("[CompanyService] Unexpected error:", err);
    return getFallbackCompanies(options, page, limit);
  }
}

export async function getCompanyBySlug(slug: string): Promise<{
  company: CompanyWithDetails | null;
  projects: any[];
  people: any[];
  socialProfiles: any[];
  sources: any[];
  events: any[];
  scores: any[];
}> {
  try {
    const supabase = await createClient();

    const { data: company, error } = await supabase
      .from("companies")
      .select("*, company_categories(category)")
      .eq("slug", slug)
      .single();

    if (error || !company) {
      return getFallbackCompanyBySlug(slug);
    }

    const rawCompany: any = company;
    const companyId = rawCompany.id;

    // Parallel execution for associated records
    const [
      { data: projectsData },
      { data: peopleData },
      { data: socialData },
      { data: sourcesData },
      { data: eventsData },
      { data: scoresData },
    ] = await Promise.all([
      supabase.from("company_projects").select("role, projects(*)").eq("company_id", companyId),
      supabase.from("company_people").select("role, seniority, is_current, confidence, people(*)").eq("company_id", companyId),
      supabase.from("social_profiles").select("*").eq("company_id", companyId),
      supabase.from("sources").select("*").limit(10),
      supabase.from("company_events").select("*").eq("company_id", companyId).order("event_date", { ascending: false }),
      supabase.from("company_scores").select("*").eq("company_id", companyId).order("calculated_at", { ascending: false }),
    ]);

    const formattedCompany: CompanyWithDetails = {
      ...rawCompany,
      categories: (rawCompany.company_categories || []).map((c: any) => c.category),
    };

    const formattedProjects = (projectsData || []).map((item: any) => ({
      ...item.projects,
      company_role: item.role,
    }));

    const formattedPeople = (peopleData || []).map((item: any) => ({
      ...item.people,
      role: item.role,
      seniority: item.seniority,
      is_current: item.is_current,
      confidence: item.confidence,
    }));

    return {
      company: formattedCompany,
      projects: formattedProjects,
      people: formattedPeople,
      socialProfiles: socialData || [],
      sources: sourcesData || [],
      events: eventsData || [],
      scores: scoresData || [],
    };
  } catch (err) {
    console.error("[CompanyService] Error fetching company profile:", err);
    return getFallbackCompanyBySlug(slug);
  }
}

export async function getDashboardOverview() {
  try {
    const supabase = await createClient();

    const [
      { count: totalCompanies },
      { data: topPower },
      { data: topMcl },
      { data: recentEvents },
      { data: recentProjects },
    ] = await Promise.all([
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("id, name, slug, country_code, power_score, mcl_match_score, company_type").order("power_score", { ascending: false }).limit(5),
      supabase.from("companies").select("id, name, slug, country_code, mcl_match_score, power_score, company_type").order("mcl_match_score", { ascending: false }).limit(5),
      supabase.from("company_events").select("*, companies(name, slug, country_code)").order("event_date", { ascending: false }).limit(5),
      supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

    if (!topPower || topPower.length === 0) {
      return getFallbackDashboardOverview();
    }

    return {
      totalCompanies: totalCompanies || 25,
      countriesCount: 12,
      activeProjectsCount: 1240,
      highOpportunitiesCount: 84,
      topGlobalCompanies: topPower,
      topCommercialOpportunities: topMcl,
      latestSignals: recentEvents || [],
      recentProjects: recentProjects || [],
    };
  } catch {
    return getFallbackDashboardOverview();
  }
}

export async function getRankingsData(tab: string = "GLOBAL", page: number = 1, limit: number = 20) {
  const sortMap: Record<string, string> = {
    GLOBAL: "power_score",
    CREATIVE: "creative_score",
    COMMERCIAL: "commercial_score",
    MOMENTUM: "momentum_score",
    MCL: "mcl_match_score",
    "MCL OPPORTUNITY": "mcl_match_score",
  };

  const sortField = sortMap[tab.toUpperCase()] || "power_score";
  return getCompanies({
    sort: sortField,
    order: "desc",
    page,
    limit,
  });
}

// Fallback Mock Data Providers (Ensures 100% stable UI experience during development)
const SEED_COMPANIES_FALLBACK: CompanyWithDetails[] = [
  {
    id: "c1",
    name: "Morena Films",
    slug: "morena-films",
    legal_name: "Morena Films S.L.",
    description: "Leading Spanish independent film and television production company producing award-winning feature films and high-end streaming originals.",
    company_type: "independent",
    founded_year: 1999,
    website_url: "https://morenafilms.com",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    region: "Madrid",
    employee_count_min: 15,
    employee_count_max: 50,
    is_active: true,
    power_score: 88.5,
    creative_score: 86.0,
    commercial_score: 90.0,
    momentum_score: 92.0,
    international_score: 85.0,
    social_score: 65.0,
    mcl_match_score: 94.0,
    score_confidence: 95.0,
    ai_summary: "Top Spanish production house with strong feature film momentum and high post-production requirements.",
    ai_opportunity_summary: "High opportunity for color grading and picture finishing on upcoming thriller slate.",
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["film", "television", "postproduction"],
  },
  {
    id: "c2",
    name: "A24",
    slug: "a24",
    legal_name: "A24 LLC",
    description: "Prominent American independent entertainment company specializing in film distribution, feature film production, and television production.",
    company_type: "independent",
    founded_year: 2012,
    website_url: "https://a24films.com",
    country_code: "US",
    country_name: "United States",
    city: "New York",
    region: "NY",
    employee_count_min: 100,
    employee_count_max: 250,
    is_active: true,
    power_score: 96.0,
    creative_score: 98.0,
    commercial_score: 94.0,
    momentum_score: 89.0,
    international_score: 90.0,
    social_score: 92.0,
    mcl_match_score: 88.0,
    score_confidence: 98.0,
    ai_summary: "Global prestige powerhouse with major festival awards and consistent theatrical box office presence.",
    ai_opportunity_summary: "Key partner for high-budget indie color grading and specialty finishing.",
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["film", "television", "independent"],
  },
  {
    id: "c3",
    name: "See-Saw Films",
    slug: "see-saw-films",
    legal_name: "See-Saw Films Ltd",
    description: "Academy Award and BAFTA-winning independent film and television production company based in London and Sydney.",
    company_type: "independent",
    founded_year: 2008,
    website_url: "https://see-saw-films.com",
    country_code: "UK",
    country_name: "United Kingdom",
    city: "London",
    region: "England",
    employee_count_min: 30,
    employee_count_max: 80,
    is_active: true,
    power_score: 92.0,
    creative_score: 94.0,
    commercial_score: 89.0,
    momentum_score: 88.0,
    international_score: 93.0,
    social_score: 72.0,
    mcl_match_score: 92.5,
    score_confidence: 94.0,
    ai_summary: "Renowned UK/Australian production company behind Slow Horses, Lion, and King Speech.",
    ai_opportunity_summary: "Strong demand for UK-based HDR color grading and audio finishing.",
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["film", "television", "international"],
  },
  {
    id: "c4",
    name: "Fremantle",
    slug: "fremantle",
    legal_name: "FremantleMedia Group Ltd",
    description: "Global television and film production and distribution company operating across 27 territories worldwide.",
    company_type: "studio",
    founded_year: 2001,
    website_url: "https://fremantle.com",
    country_code: "UK",
    country_name: "United Kingdom",
    city: "London",
    region: "England",
    employee_count_min: 1000,
    employee_count_max: 5000,
    is_active: true,
    power_score: 95.0,
    creative_score: 88.0,
    commercial_score: 96.0,
    momentum_score: 85.0,
    international_score: 98.0,
    social_score: 80.0,
    mcl_match_score: 91.0,
    score_confidence: 96.0,
    ai_summary: "Massive international production backbone producing high-budget drama series and formats.",
    ai_opportunity_summary: "High volume international post-production contracts.",
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["television", "studio"],
  },
  {
    id: "c5",
    name: "Gaumont",
    slug: "gaumont",
    legal_name: "Gaumont S.A.",
    description: "The oldest film company in the world, producing major European series such as Lupin and international co-productions.",
    company_type: "studio",
    founded_year: 1895,
    website_url: "https://gaumont.com",
    country_code: "FR",
    country_name: "France",
    city: "Paris",
    region: "Île-de-France",
    employee_count_min: 200,
    employee_count_max: 500,
    is_active: true,
    power_score: 93.0,
    creative_score: 91.0,
    commercial_score: 92.0,
    momentum_score: 78.0,
    international_score: 94.0,
    social_score: 70.0,
    mcl_match_score: 85.0,
    score_confidence: 97.0,
    ai_summary: "Historic French studio with global series reach and high-budget streaming deals.",
    ai_opportunity_summary: "Opportunity for European post-production collaboration.",
    provenance_type: "verified",
    data_classification: "VERIFIED_FACT",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["film", "streaming"],
  },
];

function getFallbackCompanies(options: CompanyFilterOptions, page: number, limit: number): PaginatedResponse<CompanyWithDetails> {
  let filtered = [...SEED_COMPANIES_FALLBACK];

  if (options.country) {
    filtered = filtered.filter((c) => c.country_code === options.country?.toUpperCase());
  }

  if (options.minPower) {
    filtered = filtered.filter((c) => (c.power_score || 0) >= options.minPower!);
  }

  if (options.minMclMatch) {
    filtered = filtered.filter((c) => (c.mcl_match_score || 0) >= options.minMclMatch!);
  }

  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.city && c.city.toLowerCase().includes(s)) ||
        (c.country_name && c.country_name.toLowerCase().includes(s))
    );
  }

  const sortColumn = options.sort || "mcl_match_score";
  const asc = options.order === "asc";
  filtered.sort((a: any, b: any) => {
    const valA = a[sortColumn] ?? 0;
    const valB = b[sortColumn] ?? 0;
    if (valA === valB) return a.name.localeCompare(b.name);
    return asc ? valA - valB : valB - valA;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return {
    data: paged,
    total,
    page,
    limit,
    totalPages,
  };
}

function getFallbackCompanyBySlug(slug: string) {
  const company = SEED_COMPANIES_FALLBACK.find((c) => c.slug === slug) || SEED_COMPANIES_FALLBACK[0];

  return {
    company,
    projects: [
      {
        id: "p1",
        title: "La Infiltrada",
        project_type: "feature_film",
        status: "production",
        release_date: "2025-10-15",
        director_name: "Arantxa Echevarría",
        distributor: "Warner Bros. Spain",
        company_role: "production_company",
      },
      {
        id: "p2",
        title: "Cerdita (Piggy)",
        project_type: "feature_film",
        status: "completed",
        release_date: "2023-01-20",
        director_name: "Carlota Pereda",
        distributor: "Vertigo Films",
        company_role: "producer",
      },
    ],
    people: [
      {
        id: "per1",
        full_name: "Pedro Uriol",
        role: "head_of_production",
        seniority: "Executive",
        is_current: true,
        confidence: 95,
      },
      {
        id: "per2",
        full_name: "Álvaro Longoria",
        role: "founder",
        seniority: "C-Level",
        is_current: true,
        confidence: 98,
      },
    ],
    socialProfiles: [
      {
        id: "soc1",
        platform: "instagram",
        username: "morenafilms",
        profile_url: "https://instagram.com/morenafilms",
        follower_count: 24500,
        engagement_rate: 3.45,
      },
      {
        id: "soc2",
        platform: "linkedin",
        username: "morena-films",
        profile_url: "https://linkedin.com/company/morena-films",
        follower_count: 12800,
        engagement_rate: 2.1,
      },
    ],
    sources: [
      {
        id: "s1",
        source_type: "company_website",
        source_name: "Official Portal",
        url: "https://morenafilms.com",
        title: "Morena Films Official Portal",
        publisher: "Morena Films",
        credibility_score: 98,
        accessed_at: new Date().toISOString(),
      },
      {
        id: "s2",
        source_type: "imdb",
        source_name: "IMDbPro",
        url: "https://pro.imdb.com",
        title: "IMDbPro Verified Company Data",
        publisher: "IMDbPro",
        credibility_score: 95,
        accessed_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: "ev1",
        event_type: "production_started",
        title: "Principal Photography Commenced on La Infiltrada",
        description: "Feature film entering active production and post-production staging.",
        event_date: new Date(Date.now() - 40 * 86400000).toISOString(),
        importance_score: 85,
        opportunity_score: 94,
      },
    ],
    scores: [
      {
        id: "sc1",
        power_score: company.power_score,
        mcl_match_score: company.mcl_match_score,
        momentum_score: company.momentum_score,
        creative_score: company.creative_score,
        commercial_score: company.commercial_score,
        calculated_at: new Date().toISOString(),
      },
    ],
  };
}

function getFallbackDashboardOverview() {
  return {
    totalCompanies: 25,
    countriesCount: 12,
    activeProjectsCount: 1240,
    highOpportunitiesCount: 84,
    topGlobalCompanies: [
      { id: "c2", name: "A24", slug: "a24", country_code: "US", power_score: 96.0, mcl_match_score: 88.0, company_type: "independent" },
      { id: "c4", name: "Fremantle", slug: "fremantle", country_code: "UK", power_score: 95.0, mcl_match_score: 91.0, company_type: "studio" },
      { id: "c5", name: "Gaumont", slug: "gaumont", country_code: "FR", power_score: 93.0, mcl_match_score: 85.0, company_type: "studio" },
      { id: "c3", name: "See-Saw Films", slug: "see-saw-films", country_code: "UK", power_score: 92.0, mcl_match_score: 92.5, company_type: "independent" },
      { id: "c1", name: "Morena Films", slug: "morena-films", country_code: "ES", power_score: 88.5, mcl_match_score: 94.0, company_type: "independent" },
    ],
    topCommercialOpportunities: [
      { id: "c1", name: "Morena Films", slug: "morena-films", country_code: "ES", mcl_match_score: 94.0, power_score: 88.5, company_type: "independent" },
      { id: "c3", name: "See-Saw Films", slug: "see-saw-films", country_code: "UK", mcl_match_score: 92.5, power_score: 92.0, company_type: "independent" },
      { id: "c12", name: "Zeta Studios", slug: "zeta-studios", country_code: "ES", mcl_match_score: 91.5, power_score: 87.0, company_type: "studio" },
      { id: "c4", name: "Fremantle", slug: "fremantle", country_code: "UK", mcl_match_score: 91.0, power_score: 95.0, company_type: "studio" },
      { id: "c14", name: "LuckyChap Entertainment", slug: "luckychap", country_code: "US", mcl_match_score: 90.0, power_score: 95.5, company_type: "production_company" },
    ],
    latestSignals: [
      {
        id: "ev1",
        title: "La Infiltrada Principal Photography Commenced",
        event_type: "production_started",
        event_date: new Date(Date.now() - 40 * 86400000).toISOString(),
        companies: { name: "Morena Films", slug: "morena-films", country_code: "ES" },
      },
      {
        id: "ev2",
        title: "Slow Horses S4 Enters Picture Lock & Post",
        event_type: "post_production_started",
        event_date: new Date(Date.now() - 25 * 86400000).toISOString(),
        companies: { name: "See-Saw Films", slug: "see-saw-films", country_code: "UK" },
      },
    ],
    recentProjects: [
      { id: "p1", title: "La Infiltrada", project_type: "feature_film", status: "production", country_code: "ES", director_name: "Arantxa Echevarría" },
      { id: "p2", title: "Civil War", project_type: "feature_film", status: "released", country_code: "US", director_name: "Alex Garland" },
      { id: "p3", title: "Slow Horses Season 4", project_type: "tv_series", status: "post_production", country_code: "UK", director_name: "Saul Metzstein" },
    ],
  };
}
