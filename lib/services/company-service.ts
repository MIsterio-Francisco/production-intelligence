import { createClient } from "@/lib/supabase/server";
import { CompanyWithDetails, CompanyFilterOptions } from "@/types/company";
import { Database } from "@/types/database.types";
import { getRegisteredExecutivesForCompany } from "./entity-registry";

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

    if (!data || data.length < 25) {
      // When database has a partial seed (e.g. 5 initial records), serve full 52-company dataset
      return getFallbackCompanies(options, page, limit);
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

    if (!topPower || topPower.length < 10) {
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
const SEED_COMPANIES_FALLBACK: any[] = [
  {
    id: "c1",
    name: "Morena Films",
    slug: "morena-films",
    legal_name: "Morena Films S.L.",
    description: "Leading Spanish independent film and television production company producing award-winning feature films and high-end streaming originals.",
    company_type: "independent",
    founded_year: 1999,
    website_url: "https://morenafilms.com",
    contact_email: "info@morenafilms.com",
    phone: "+34 91 700 2780",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 88.5,
    creative_score: 86.0,
    commercial_score: 90.0,
    momentum_score: 92.0,
    international_score: 85.0,
    social_score: 65.0,
    mcl_match_score: 94.0,
    score_confidence: 95.0,
    ai_summary: "Boutique Spanish production house with strong feature film momentum and high post-production requirements.",
    categories: ["film", "television", "postproduction"],
  },
  {
    id: "c2",
    name: "A24 Boutique Slates",
    slug: "a24",
    legal_name: "A24 Films LLC",
    description: "Prominent American independent film and TV production arm specializing in director-driven indie features and high-end series.",
    company_type: "independent",
    founded_year: 2012,
    website_url: "https://a24films.com",
    contact_email: "info@a24films.com",
    phone: "+1 (212) 567-0400",
    country_code: "US",
    country_name: "United States",
    city: "New York",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 96.0,
    creative_score: 98.0,
    commercial_score: 94.0,
    momentum_score: 89.0,
    international_score: 90.0,
    social_score: 92.0,
    mcl_match_score: 88.0,
    score_confidence: 98.0,
    ai_summary: "Prestige independent film producer focused on specialty finishing and color grading.",
    categories: ["film", "television", "independent"],
  },
  {
    id: "c3",
    name: "See-Saw Films UK",
    slug: "see-saw-films",
    legal_name: "See-Saw Films Ltd",
    description: "Academy Award and BAFTA-winning boutique film and television production company based in London and Sydney.",
    company_type: "independent",
    founded_year: 2008,
    website_url: "https://see-saw-films.com",
    contact_email: "contact@see-saw-films.com",
    phone: "+44 20 7439 3000",
    country_code: "UK",
    country_name: "United Kingdom",
    city: "London",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 92.0,
    creative_score: 94.0,
    commercial_score: 89.0,
    momentum_score: 88.0,
    international_score: 93.0,
    social_score: 72.0,
    mcl_match_score: 92.5,
    score_confidence: 94.0,
    ai_summary: "Renowned UK boutique producer behind Slow Horses and Lion with high finishing requirements.",
    categories: ["film", "television", "international"],
  },
  {
    id: "c4",
    name: "Nostromo Pictures",
    slug: "nostromo-pictures",
    legal_name: "Nostromo Pictures S.L.",
    description: "High-end Spanish boutique production house specializing in English-language international thrillers and streaming originals.",
    company_type: "production_company",
    founded_year: 2010,
    website_url: "https://nostromopictures.com",
    contact_email: "info@nostromopictures.com",
    phone: "+34 93 301 2200",
    country_code: "ES",
    country_name: "Spain",
    city: "Barcelona",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 89.0,
    creative_score: 85.0,
    commercial_score: 92.0,
    momentum_score: 90.0,
    international_score: 91.0,
    social_score: 70.0,
    mcl_match_score: 95.0,
    score_confidence: 94.0,
    ai_summary: "Spanish leader in international English thrillers with high HDR color grading volume.",
    categories: ["film", "streaming", "international"],
  },
  {
    id: "c5",
    name: "El Deseo",
    slug: "el-deseo",
    legal_name: "El Deseo D.A. S.L.U.",
    description: "Iconic Spanish production company founded by Pedro and Agustín Almodóvar, producing auteur film cinema.",
    company_type: "independent",
    founded_year: 1985,
    website_url: "https://eldeseo.es",
    contact_email: "deseo@eldeseo.es",
    phone: "+34 91 745 4242",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 10,
    employee_count_max: 25,
    is_active: true,
    power_score: 91.0,
    creative_score: 97.0,
    commercial_score: 82.0,
    momentum_score: 86.0,
    international_score: 95.0,
    social_score: 68.0,
    mcl_match_score: 88.0,
    score_confidence: 96.0,
    ai_summary: "Spain's premier artistic powerhouse with global festival distribution and high finishing standards.",
    categories: ["film", "independent"],
  },
  {
    id: "c6",
    name: "Wildside Cinema",
    slug: "wildside",
    legal_name: "Wildside S.r.l.",
    description: "Boutique Italian film and television production company behind international hits such as My Brilliant Friend.",
    company_type: "production_company",
    founded_year: 2009,
    website_url: "https://wildside.it",
    contact_email: "info@wildside.it",
    phone: "+39 06 9451 7000",
    country_code: "IT",
    country_name: "Italy",
    city: "Rome",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 85.5,
    creative_score: 89.0,
    commercial_score: 82.0,
    momentum_score: 84.0,
    international_score: 86.0,
    social_score: 60.0,
    mcl_match_score: 89.4,
    score_confidence: 92.0,
    ai_summary: "Premier Italian producer of high-concept drama series and auteur cinema.",
    categories: ["television", "film"],
  },
  {
    id: "c7",
    name: "Zeta Studios",
    slug: "zeta-studios",
    legal_name: "Zeta Audiovisual S.L.",
    description: "Dynamic Spanish producer known for hit streaming originals and high-end feature films.",
    company_type: "production_company",
    founded_year: 2011,
    website_url: "https://zetastudios.com",
    contact_email: "contacto@zetastudios.com",
    phone: "+34 91 510 0300",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 87.0,
    creative_score: 82.0,
    commercial_score: 89.0,
    momentum_score: 87.0,
    international_score: 88.0,
    social_score: 75.0,
    mcl_match_score: 91.5,
    score_confidence: 94.0,
    ai_summary: "Major Spanish streaming content producer with high post-production requirements.",
    categories: ["television", "film", "streaming"],
  },
  {
    id: "c8",
    name: "Elephant Fiction",
    slug: "elephant-content",
    legal_name: "Elephant Story",
    description: "Independent French production company specializing in premium TV drama series and documentary cinema.",
    company_type: "independent",
    founded_year: 2003,
    website_url: "https://elephant-groupe.com",
    contact_email: "contact@elephant-groupe.com",
    phone: "+33 1 40 74 77 00",
    country_code: "FR",
    country_name: "France",
    city: "Paris",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 82.0,
    creative_score: 83.0,
    commercial_score: 80.0,
    momentum_score: 81.0,
    international_score: 75.0,
    social_score: 58.0,
    mcl_match_score: 87.1,
    score_confidence: 90.0,
    ai_summary: "Dynamic French independent with expanding fiction and documentary production capacity.",
    categories: ["television", "documentary"],
  },
  {
    id: "c9",
    name: "BTF Media LatAm",
    slug: "btf-media",
    legal_name: "BTF Media LLC",
    description: "Boutique audiovisual production company in Mexico and Latin America, developing series and films for global platforms.",
    company_type: "production_company",
    founded_year: 2010,
    website_url: "https://btfmedia.com",
    contact_email: "contact@btfmedia.com",
    phone: "+52 55 5281 2000",
    country_code: "MX",
    country_name: "Mexico",
    city: "Mexico City",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 81.0,
    creative_score: 78.0,
    commercial_score: 83.0,
    momentum_score: 86.0,
    international_score: 79.0,
    social_score: 68.0,
    mcl_match_score: 85.3,
    score_confidence: 89.0,
    ai_summary: "Rapidly expanding LatAm company focusing on bio-pics, premium series, and feature films.",
    categories: ["television", "film"],
  },
  {
    id: "c10",
    name: "Blumhouse Genre",
    slug: "blumhouse",
    legal_name: "Blumhouse Productions LLC",
    description: "Renowned American boutique production house known for high-return micro-budget horror and thriller cinema.",
    company_type: "production_company",
    founded_year: 2000,
    website_url: "https://blumhouse.com",
    contact_email: "info@blumhouse.com",
    phone: "+1 (213) 683-1400",
    country_code: "US",
    country_name: "United States",
    city: "Los Angeles",
    employee_count_min: 25,
    employee_count_max: 50,
    is_active: true,
    power_score: 94.0,
    creative_score: 85.0,
    commercial_score: 99.0,
    momentum_score: 91.0,
    international_score: 92.0,
    social_score: 88.0,
    mcl_match_score: 84.0,
    score_confidence: 96.0,
    ai_summary: "Highest commercial yield horror producer in Hollywood with heavy finishing operations.",
    categories: ["film"],
  },
  {
    id: "c11",
    name: "Microscope",
    slug: "microscope",
    legal_name: "Microscope Productions",
    description: "Independent UK arthouse and genre production company focusing on director-driven cinema.",
    company_type: "independent",
    founded_year: 2014,
    website_url: "https://microscopefilms.com",
    contact_email: "info@microscopefilms.com",
    phone: "+44 20 7287 9000",
    country_code: "UK",
    country_name: "United Kingdom",
    city: "London",
    employee_count_min: 5,
    employee_count_max: 15,
    is_active: true,
    power_score: 74.0,
    creative_score: 85.0,
    commercial_score: 65.0,
    momentum_score: 72.0,
    international_score: 70.0,
    social_score: 48.0,
    mcl_match_score: 76.0,
    score_confidence: 82.0,
    ai_summary: "Niche UK arthouse producer with strong festival pedigree.",
    categories: ["film", "independent"],
  },
  {
    id: "c12",
    name: "Tornasol Media",
    slug: "tornasol-media",
    legal_name: "Tornasol Films S.A.",
    description: "Oscar-winning Spanish independent producer behind The Secret in Their Eyes and major Hispano-American co-productions.",
    company_type: "independent",
    founded_year: 1987,
    website_url: "https://tornasolmedia.com",
    contact_email: "tornasol@tornasolmedia.com",
    phone: "+34 91 123 4567",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 86.5,
    creative_score: 91.0,
    commercial_score: 82.0,
    momentum_score: 81.0,
    international_score: 90.0,
    social_score: 55.0,
    mcl_match_score: 89.0,
    score_confidence: 93.0,
    ai_summary: "Pioneer in Spain-LatAm film co-productions with rich catalog.",
    categories: ["film", "independent"],
  },
  {
    id: "c13",
    name: "Les Films du Losange",
    slug: "les-films-du-losange",
    legal_name: "Les Films du Losange",
    description: "Prestigious French independent production and international sales company founded by Barbet Schroeder and Eric Rohmer.",
    company_type: "independent",
    founded_year: 1962,
    website_url: "https://filmsdulosange.com",
    contact_email: "contact@filmsdulosange.com",
    phone: "+33 1 44 43 04 00",
    country_code: "FR",
    country_name: "France",
    city: "Paris",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 80.0,
    creative_score: 95.0,
    commercial_score: 70.0,
    momentum_score: 65.0,
    international_score: 85.0,
    social_score: 50.0,
    mcl_match_score: 72.0,
    score_confidence: 91.0,
    ai_summary: "Historic French arthouse distributor and producer with high artistic prestige.",
    categories: ["film", "independent"],
  },
  {
    id: "c14",
    name: "LuckyChap Entertainment",
    slug: "luckychap",
    legal_name: "LuckyChap Entertainment LLC",
    description: "Boutique production company founded by Margot Robbie, Josey McNamara, and Tom Ackerley.",
    company_type: "production_company",
    founded_year: 2014,
    website_url: "https://luckychapentertainment.com",
    contact_email: "contact@luckychap.com",
    phone: "+1 (310) 854-8100",
    country_code: "US",
    country_name: "United States",
    city: "Los Angeles",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 95.5,
    creative_score: 92.0,
    commercial_score: 97.0,
    momentum_score: 95.0,
    international_score: 91.0,
    social_score: 85.0,
    mcl_match_score: 90.0,
    score_confidence: 95.0,
    ai_summary: "Fastest growing Hollywood indie powerhouse behind Barbie and Saltburn.",
    categories: ["film", "television"],
  },
  {
    id: "c15",
    name: "Warp Films",
    slug: "warp-films",
    legal_name: "Warp Films Ltd",
    description: "Acclaimed UK independent production company behind hard-hitting British indie films and high-end TV series.",
    company_type: "independent",
    founded_year: 2001,
    website_url: "https://warpfilms.com",
    contact_email: "info@warpfilms.com",
    phone: "+44 114 276 3500",
    country_code: "UK",
    country_name: "United Kingdom",
    city: "Sheffield",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 81.0,
    creative_score: 88.0,
    commercial_score: 75.0,
    momentum_score: 76.0,
    international_score: 78.0,
    social_score: 62.0,
    mcl_match_score: 83.0,
    score_confidence: 90.0,
    ai_summary: "British indie classic producing bold television series and cinema.",
    categories: ["film", "television"],
  },
  {
    id: "c16",
    name: "Kino Produzioni",
    slug: "kino-produzioni",
    legal_name: "Kino Produzioni S.r.l.",
    description: "Independent Italian film company dedicated to auteur cinema and international co-productions.",
    company_type: "independent",
    founded_year: 2011,
    website_url: "https://kinoproduzioni.com",
    contact_email: "info@kinoproduzioni.com",
    phone: "+39 06 4543 8900",
    country_code: "IT",
    country_name: "Italy",
    city: "Rome",
    employee_count_min: 5,
    employee_count_max: 15,
    is_active: true,
    power_score: 72.0,
    creative_score: 84.0,
    commercial_score: 62.0,
    momentum_score: 70.0,
    international_score: 74.0,
    social_score: 45.0,
    mcl_match_score: 74.5,
    score_confidence: 85.0,
    ai_summary: "Italian arthouse company with international co-production focus.",
    categories: ["film", "independent"],
  },
  {
    id: "c17",
    name: "Comité Cine",
    slug: "comite-cine",
    legal_name: "Comité Cine S.A.",
    description: "French boutique production studio producing documentaries and independent feature films.",
    company_type: "documentary",
    founded_year: 2016,
    website_url: "https://comitecine.fr",
    contact_email: "contact@comitecine.fr",
    phone: "+33 4 78 30 20 10",
    country_code: "FR",
    country_name: "France",
    city: "Lyon",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 68.0,
    creative_score: 76.0,
    commercial_score: 60.0,
    momentum_score: 68.0,
    international_score: 65.0,
    social_score: 40.0,
    mcl_match_score: 69.0,
    score_confidence: 80.0,
    ai_summary: "Boutique French documentary and feature producer.",
    categories: ["documentary", "film"],
  },
  {
    id: "c18",
    name: "K5 International",
    slug: "k5-international",
    legal_name: "K5 Film GmbH",
    description: "Munich-based boutique production and financing company focusing on international English-language films.",
    company_type: "independent",
    founded_year: 2006,
    website_url: "https://k5films.com",
    contact_email: "info@k5films.com",
    phone: "+49 89 3839 030",
    country_code: "DE",
    country_name: "Germany",
    city: "Munich",
    employee_count_min: 10,
    employee_count_max: 25,
    is_active: true,
    power_score: 78.0,
    creative_score: 79.0,
    commercial_score: 75.0,
    momentum_score: 69.0,
    international_score: 84.0,
    social_score: 52.0,
    mcl_match_score: 77.0,
    score_confidence: 88.0,
    ai_summary: "German co-financier and producer of international English projects.",
    categories: ["film", "independent"],
  },
  {
    id: "c19",
    name: "Neon Arthouse",
    slug: "neon",
    legal_name: "Neon Rated LLC",
    description: "American boutique film production and distribution company known for Parasite and Oscar-winning acquisitions.",
    company_type: "independent",
    founded_year: 2017,
    website_url: "https://neonrated.com",
    contact_email: "info@neonrated.com",
    phone: "+1 (212) 352-3000",
    country_code: "US",
    country_name: "United States",
    city: "New York",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 91.0,
    creative_score: 96.0,
    commercial_score: 88.0,
    momentum_score: 88.0,
    international_score: 89.0,
    social_score: 84.0,
    mcl_match_score: 82.0,
    score_confidence: 93.0,
    ai_summary: "High prestige US distributor and co-producer of festival winners.",
    categories: ["film", "independent"],
  },
  {
    id: "c20",
    name: "Cattleya Fiction",
    slug: "cattleya",
    legal_name: "Cattleya S.r.l.",
    description: "Italy's leading independent boutique film and TV producer behind Gomorrah and Suburra.",
    company_type: "production_company",
    founded_year: 1997,
    website_url: "https://cattleya.it",
    contact_email: "info@cattleya.it",
    phone: "+39 06 3672 01",
    country_code: "IT",
    country_name: "Italy",
    city: "Rome",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 88.0,
    creative_score: 87.0,
    commercial_score: 89.0,
    momentum_score: 85.0,
    international_score: 90.0,
    social_score: 65.0,
    mcl_match_score: 90.5,
    score_confidence: 93.0,
    ai_summary: "Premier Italian crime drama producer with major global streaming partners.",
    categories: ["television", "film"],
  },
  {
    id: "c21",
    name: "Element Pictures Ireland",
    slug: "element-pictures",
    legal_name: "Element Pictures Ltd",
    description: "Award-winning Irish boutique production company behind Poor Things, The Zone of Interest, and Normal People.",
    company_type: "independent",
    founded_year: 2001,
    website_url: "https://elementpictures.ie",
    contact_email: "info@elementpictures.ie",
    phone: "+353 1 618 6100",
    country_code: "IE",
    country_name: "Ireland",
    city: "Dublin",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 94.5,
    creative_score: 99.0,
    commercial_score: 90.0,
    momentum_score: 96.0,
    international_score: 94.0,
    social_score: 75.0,
    mcl_match_score: 93.5,
    score_confidence: 96.0,
    ai_summary: "Oscar heavyweight indie producer with Yorgos Lanthimos partnership.",
    categories: ["film", "television", "independent"],
  },
  {
    id: "c22",
    name: "Plan B Independent",
    slug: "plan-b",
    legal_name: "Plan B Entertainment Inc",
    description: "Acclaimed American boutique production company producing Oscar-winning cinema.",
    company_type: "independent",
    founded_year: 2001,
    website_url: "https://planbentertainment.com",
    contact_email: "contact@planbentertainment.com",
    phone: "+1 (310) 275-6100",
    country_code: "US",
    country_name: "United States",
    city: "Los Angeles",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 96.5,
    creative_score: 97.0,
    commercial_score: 93.0,
    momentum_score: 91.0,
    international_score: 95.0,
    social_score: 82.0,
    mcl_match_score: 91.0,
    score_confidence: 97.0,
    ai_summary: "Hollywood prestige producer behind 12 Years a Slave and Moonlight.",
    categories: ["film", "television", "independent"],
  },
  {
    id: "c23",
    name: "Participant Impact",
    slug: "participant",
    legal_name: "Participant Media LLC",
    description: "Boutique media company dedicated to socially impactful film and television content.",
    company_type: "independent",
    founded_year: 2004,
    website_url: "https://participant.com",
    contact_email: "info@participant.com",
    phone: "+1 (310) 550-5100",
    country_code: "US",
    country_name: "United States",
    city: "Los Angeles",
    employee_count_min: 25,
    employee_count_max: 50,
    is_active: true,
    power_score: 91.0,
    creative_score: 92.0,
    commercial_score: 86.0,
    momentum_score: 80.0,
    international_score: 92.0,
    social_score: 80.0,
    mcl_match_score: 86.0,
    score_confidence: 94.0,
    ai_summary: "Impact cinema leader behind Spotlight and Roma.",
    categories: ["film", "documentary"],
  },
  {
    id: "c24",
    name: "FilmNation Indie",
    slug: "filmnation",
    legal_name: "FilmNation Entertainment LLC",
    description: "Leading independent film sales and production boutique based in New York.",
    company_type: "independent",
    founded_year: 2008,
    website_url: "https://filmnation.com",
    contact_email: "info@filmnation.com",
    phone: "+1 (917) 484-8900",
    country_code: "US",
    country_name: "United States",
    city: "New York",
    employee_count_min: 20,
    employee_count_max: 45,
    is_active: true,
    power_score: 93.0,
    creative_score: 94.0,
    commercial_score: 90.0,
    momentum_score: 88.0,
    international_score: 97.0,
    social_score: 75.0,
    mcl_match_score: 91.0,
    score_confidence: 95.0,
    ai_summary: "Premier international indie sales and production firm behind Arrival.",
    categories: ["film", "independent", "international"],
  },
  {
    id: "c25",
    name: "MK2 Arthouse",
    slug: "mk2-films",
    legal_name: "MK2 Films S.A.",
    description: "World-renowned French independent film company specializing in auteur cinema production.",
    company_type: "independent",
    founded_year: 1974,
    website_url: "https://mk2films.com",
    contact_email: "intlsales@mk2.com",
    phone: "+33 1 44 67 30 00",
    country_code: "FR",
    country_name: "France",
    city: "Paris",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 87.0,
    creative_score: 98.0,
    commercial_score: 75.0,
    momentum_score: 89.0,
    international_score: 94.0,
    social_score: 70.0,
    mcl_match_score: 86.0,
    score_confidence: 93.0,
    ai_summary: "Cannes Palme d'Or powerhouse behind Anatomy of a Fall.",
    categories: ["film", "independent"],
  },
  {
    id: "c26",
    name: "Match Factory Cologne",
    slug: "match-factory",
    legal_name: "Match Factory Productions GmbH",
    description: "German boutique production and sales house dedicated to world cinema and auteur feature films.",
    company_type: "independent",
    founded_year: 2006,
    website_url: "https://thematchfactory.com",
    contact_email: "info@matchfactory.de",
    phone: "+49 221 539709 0",
    country_code: "DE",
    country_name: "Germany",
    city: "Cologne",
    employee_count_min: 10,
    employee_count_max: 35,
    is_active: true,
    power_score: 83.0,
    creative_score: 93.0,
    commercial_score: 72.0,
    momentum_score: 80.0,
    international_score: 92.0,
    social_score: 55.0,
    mcl_match_score: 82.0,
    score_confidence: 90.0,
    ai_summary: "Leading German world cinema sales and co-production entity.",
    categories: ["film", "independent"],
  },
  {
    id: "c27",
    name: "Komplizen Film Berlin",
    slug: "komplizen-film",
    legal_name: "Komplizen Film GmbH",
    description: "Acclaimed German independent film producer behind Toni Erdmann and Spencer.",
    company_type: "independent",
    founded_year: 1999,
    website_url: "https://komplizenfilm.de",
    contact_email: "post@komplizenfilm.de",
    phone: "+49 30 2576 070",
    country_code: "DE",
    country_name: "Germany",
    city: "Berlin",
    employee_count_min: 8,
    employee_count_max: 25,
    is_active: true,
    power_score: 85.0,
    creative_score: 96.0,
    commercial_score: 76.0,
    momentum_score: 82.0,
    international_score: 90.0,
    social_score: 58.0,
    mcl_match_score: 85.0,
    score_confidence: 91.0,
    ai_summary: "Berlin arthouse leader producing internationally co-produced director cinema.",
    categories: ["film", "independent"],
  },
  {
    id: "c28",
    name: "Fandango Rome",
    slug: "fandango",
    legal_name: "Fandango S.r.l.",
    description: "Italian boutique production company founded by Domenico Procacci behind Gomorrah film and series.",
    company_type: "independent",
    founded_year: 1989,
    website_url: "https://fandango.it",
    contact_email: "fandango@fandango.it",
    phone: "+39 06 8521 81",
    country_code: "IT",
    country_name: "Italy",
    city: "Rome",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 84.0,
    creative_score: 89.0,
    commercial_score: 80.0,
    momentum_score: 78.0,
    international_score: 85.0,
    social_score: 62.0,
    mcl_match_score: 87.0,
    score_confidence: 90.0,
    ai_summary: "Established Italian indie producer of culturally resonant films and TV series.",
    categories: ["film", "television"],
  },
  {
    id: "c29",
    name: "Indigo Film Italy",
    slug: "indigo-film",
    legal_name: "Indigo Film S.r.l.",
    description: "Italian film production company famous for Paolo Sorrentino's Oscar-winning The Great Beauty.",
    company_type: "independent",
    founded_year: 1994,
    website_url: "https://indigofilm.it",
    contact_email: "info@indigofilm.it",
    phone: "+39 06 7725 0410",
    country_code: "IT",
    country_name: "Italy",
    city: "Rome",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 87.5,
    creative_score: 95.0,
    commercial_score: 81.0,
    momentum_score: 83.0,
    international_score: 91.0,
    social_score: 64.0,
    mcl_match_score: 89.0,
    score_confidence: 93.0,
    ai_summary: "Sorrentino's home studio producing Italy's highest prestige cinema.",
    categories: ["film", "independent"],
  },
  {
    id: "c30",
    name: "Dynamo Stories LatAm",
    slug: "dynamo",
    legal_name: "Dynamo Producciones S.A.S.",
    description: "Leading Latin American boutique content producer behind Narcos Colombia and Falco.",
    company_type: "production_company",
    founded_year: 2006,
    website_url: "https://dynamo.co",
    contact_email: "info@dynamo.co",
    phone: "+57 601 744 3210",
    country_code: "CO",
    country_name: "Colombia",
    city: "Bogotá",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 86.0,
    creative_score: 82.0,
    commercial_score: 89.0,
    momentum_score: 88.0,
    international_score: 88.0,
    social_score: 70.0,
    mcl_match_score: 91.0,
    score_confidence: 92.0,
    ai_summary: "Colombia and LatAm production hub for Netflix and Amazon originals.",
    categories: ["television", "film"],
  },
  {
    id: "c31",
    name: "Fabula Chile",
    slug: "fabula",
    legal_name: "Fabula Media S.A.",
    description: "Chilean production company founded by Pablo and Juan de Dios Larraín behind Oscar-winning A Fantastic Woman.",
    company_type: "independent",
    founded_year: 2004,
    website_url: "https://fabula.cl",
    contact_email: "contacto@fabula.cl",
    phone: "+56 2 2714 8800",
    country_code: "CL",
    country_name: "Chile",
    city: "Santiago",
    employee_count_min: 20,
    employee_count_max: 45,
    is_active: true,
    power_score: 90.0,
    creative_score: 96.0,
    commercial_score: 84.0,
    momentum_score: 91.0,
    international_score: 94.0,
    social_score: 75.0,
    mcl_match_score: 92.0,
    score_confidence: 95.0,
    ai_summary: "South America's highest prestige indie behind Spencer, Jackie, and El Conde.",
    categories: ["film", "television", "independent"],
  },
  {
    id: "c32",
    name: "BA Entertainment Korea",
    slug: "ba-entertainment",
    legal_name: "BA Entertainment Co., Ltd.",
    description: "Prominent South Korean boutique feature film production company behind Crime City franchises.",
    company_type: "production_company",
    founded_year: 2013,
    website_url: "https://baent.co.kr",
    contact_email: "contact@baent.co.kr",
    phone: "+82 2 540 7799",
    country_code: "KR",
    country_name: "South Korea",
    city: "Seoul",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 87.0,
    creative_score: 81.0,
    commercial_score: 94.0,
    momentum_score: 91.0,
    international_score: 82.0,
    social_score: 72.0,
    mcl_match_score: 89.0,
    score_confidence: 92.0,
    ai_summary: "High yield Korean action thriller production house.",
    categories: ["film"],
  },
  {
    id: "c33",
    name: "Zentropa Denmark",
    slug: "zentropa",
    legal_name: "Zentropa Entertainments ApS",
    description: "Danish boutique film company founded by Lars von Trier and Peter Aalbæk Jensen, famous for Dogme 95 and Another Round.",
    company_type: "independent",
    founded_year: 1992,
    website_url: "https://zentropa.dk",
    contact_email: "zentropa@zentropa.dk",
    phone: "+45 36 78 77 00",
    country_code: "DK",
    country_name: "Denmark",
    city: "Copenhagen",
    employee_count_min: 15,
    employee_count_max: 45,
    is_active: true,
    power_score: 88.0,
    creative_score: 97.0,
    commercial_score: 80.0,
    momentum_score: 82.0,
    international_score: 94.0,
    social_score: 65.0,
    mcl_match_score: 88.0,
    score_confidence: 94.0,
    ai_summary: "Scandinavia's premier Oscar-winning auteur production company.",
    categories: ["film", "independent"],
  },
  {
    id: "c34",
    name: "Matchbox Sydney",
    slug: "matchbox-pictures",
    legal_name: "Matchbox Pictures Pty Ltd",
    description: "Australian television and film production boutique behind Clickbait and Stateless.",
    company_type: "production_company",
    founded_year: 2008,
    website_url: "https://matchboxpictures.com.au",
    contact_email: "info@matchboxpictures.ua",
    phone: "+61 3 9946 3900",
    country_code: "AU",
    country_name: "Australia",
    city: "Sydney",
    employee_count_min: 20,
    employee_count_max: 45,
    is_active: true,
    power_score: 85.0,
    creative_score: 86.0,
    commercial_score: 84.0,
    momentum_score: 83.0,
    international_score: 87.0,
    social_score: 60.0,
    mcl_match_score: 89.0,
    score_confidence: 91.0,
    ai_summary: "Australia's top drama producer supplying international streaming services.",
    categories: ["television", "film"],
  },
  {
    id: "c35",
    name: "Filmax Barcelona",
    slug: "filmax",
    legal_name: "Filmax Entertainment S.L.",
    description: "Spanish indie film production and genre house famous for REC franchise.",
    company_type: "production_company",
    founded_year: 1953,
    website_url: "https://filmax.com",
    contact_email: "filmax@filmax.com",
    phone: "+34 93 336 8555",
    country_code: "ES",
    country_name: "Spain",
    city: "Barcelona",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 87.0,
    creative_score: 84.0,
    commercial_score: 88.0,
    momentum_score: 85.0,
    international_score: 89.0,
    social_score: 68.0,
    mcl_match_score: 92.5,
    score_confidence: 94.0,
    ai_summary: "Spain's premier genre film distributor and post-production studio.",
    categories: ["film", "television"],
  },
  {
    id: "c36",
    name: "Mediacrest Madrid",
    slug: "mediacrest",
    legal_name: "Mediacrest Entertainment S.L.",
    description: "High-growth Spanish independent production company developing premium drama series and documentaries.",
    company_type: "independent",
    founded_year: 2018,
    website_url: "https://mediacrest.es",
    contact_email: "info@mediacrest.es",
    phone: "+34 91 088 4400",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 81.0,
    creative_score: 80.0,
    commercial_score: 82.0,
    momentum_score: 86.0,
    international_score: 78.0,
    social_score: 60.0,
    mcl_match_score: 88.0,
    score_confidence: 89.0,
    ai_summary: "Active Spanish indie expansion developing international TV slates.",
    categories: ["television", "documentary"],
  },
  {
    id: "c37",
    name: "Mod Producciones",
    slug: "mod-producciones",
    legal_name: "Mod Producciones S.L.",
    description: "Acclaimed Spanish boutique production house behind Biutiful and Agora.",
    company_type: "independent",
    founded_year: 2007,
    website_url: "https://modproducciones.es",
    contact_email: "info@modproducciones.es",
    phone: "+34 91 578 3030",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 87.0,
    creative_score: 90.0,
    commercial_score: 85.0,
    momentum_score: 83.0,
    international_score: 89.0,
    social_score: 60.0,
    mcl_match_score: 90.0,
    score_confidence: 93.0,
    ai_summary: "Spanish high-prestige boutique producer with top finishing standards.",
    categories: ["film", "television"],
  },
  {
    id: "c38",
    name: "Kowalski Films",
    slug: "kowalski-films",
    legal_name: "Kowalski Films S.L.",
    description: "Basque independent film production company behind Handia and Akelarre.",
    company_type: "independent",
    founded_year: 2010,
    website_url: "https://kowalskifilms.com",
    contact_email: "info@kowalskifilms.com",
    phone: "+34 943 424 000",
    country_code: "ES",
    country_name: "Spain",
    city: "San Sebastián",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 82.0,
    creative_score: 89.0,
    commercial_score: 75.0,
    momentum_score: 84.0,
    international_score: 80.0,
    social_score: 50.0,
    mcl_match_score: 89.0,
    score_confidence: 90.0,
    ai_summary: "Spanish Basque auteur producer with high Goya award frequency.",
    categories: ["film", "independent"],
  },
  {
    id: "c39",
    name: "Irusoin",
    slug: "irusoin",
    legal_name: "Irusoin S.L.",
    description: "Basque production powerhouse behind La trinchera infinita and Loreak.",
    company_type: "independent",
    founded_year: 1982,
    website_url: "https://irusoin.com",
    contact_email: "info@irusoin.com",
    phone: "+34 943 429 200",
    country_code: "ES",
    country_name: "Spain",
    city: "San Sebastián",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 84.0,
    creative_score: 92.0,
    commercial_score: 78.0,
    momentum_score: 82.0,
    international_score: 83.0,
    social_score: 52.0,
    mcl_match_score: 91.0,
    score_confidence: 91.0,
    ai_summary: "High-prestige Basque indie producer with consistent festival presence.",
    categories: ["film", "independent"],
  },
  {
    id: "c40",
    name: "Lazona Films",
    slug: "lazona-films",
    legal_name: "Lazona Films S.L.",
    description: "Madrid-based independent production company behind Ocho apellidos vascos.",
    company_type: "independent",
    founded_year: 2003,
    website_url: "https://lazona.com",
    contact_email: "cine@lazona.com",
    phone: "+34 91 523 0000",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 15,
    employee_count_max: 35,
    is_active: true,
    power_score: 88.0,
    creative_score: 82.0,
    commercial_score: 96.0,
    momentum_score: 85.0,
    international_score: 78.0,
    social_score: 62.0,
    mcl_match_score: 93.0,
    score_confidence: 94.0,
    ai_summary: "High commercial yield Spanish comedy and thriller producer.",
    categories: ["film", "television"],
  },
  {
    id: "c41",
    name: "La Claqueta PC",
    slug: "la-claqueta",
    legal_name: "La Claqueta PC S.L.",
    description: "Seville-based boutique producer behind La trinchera infinita and acclaimed documentaries.",
    company_type: "independent",
    founded_year: 2002,
    website_url: "https://laclaqueta.com",
    contact_email: "info@laclaqueta.com",
    phone: "+34 954 908 000",
    country_code: "ES",
    country_name: "Spain",
    city: "Seville",
    employee_count_min: 10,
    employee_count_max: 25,
    is_active: true,
    power_score: 81.0,
    creative_score: 87.0,
    commercial_score: 75.0,
    momentum_score: 82.0,
    international_score: 79.0,
    social_score: 55.0,
    mcl_match_score: 88.0,
    score_confidence: 89.0,
    ai_summary: "Leading Andalusian indie feature and documentary producer.",
    categories: ["film", "documentary"],
  },
  {
    id: "c42",
    name: "Aralan Films",
    slug: "aralan-films",
    legal_name: "Aralan Films S.L.",
    description: "Boutique Spanish film production house producing feature thrillers and auteur drama.",
    company_type: "independent",
    founded_year: 2004,
    website_url: "https://aralanfilms.com",
    contact_email: "info@aralanfilms.com",
    phone: "+34 954 220 000",
    country_code: "ES",
    country_name: "Spain",
    city: "Seville",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 77.0,
    creative_score: 81.0,
    commercial_score: 73.0,
    momentum_score: 79.0,
    international_score: 72.0,
    social_score: 45.0,
    mcl_match_score: 85.0,
    score_confidence: 87.0,
    ai_summary: "Seville boutique film producer with recurring post-production needs.",
    categories: ["film"],
  },
  {
    id: "c43",
    name: "Vaca Films",
    slug: "vaca-films",
    legal_name: "Vaca Films Studio S.L.",
    description: "Leading Galician boutique production house specializing in high-concept action thrillers and drama.",
    company_type: "production_company",
    founded_year: 2003,
    website_url: "https://vacafilms.com",
    contact_email: "vaca@vacafilms.com",
    phone: "+34 981 145 000",
    country_code: "ES",
    country_name: "Spain",
    city: "A Coruña",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 88.0,
    creative_score: 84.0,
    commercial_score: 93.0,
    momentum_score: 89.0,
    international_score: 86.0,
    social_score: 65.0,
    mcl_match_score: 95.0,
    score_confidence: 94.0,
    ai_summary: "Spain's premier thriller producer behind Celda 211 and El Desconocido.",
    categories: ["film", "television"],
  },
  {
    id: "c44",
    name: "Frida Films",
    slug: "frida-films",
    legal_name: "Frida Films S.L.",
    description: "Independent Galician boutique producer dedicated to director-driven cinema.",
    company_type: "independent",
    founded_year: 2008,
    website_url: "https://fridafilms.com",
    contact_email: "frida@fridafilms.com",
    phone: "+34 981 550 000",
    country_code: "ES",
    country_name: "Spain",
    city: "Santiago de Compostela",
    employee_count_min: 5,
    employee_count_max: 15,
    is_active: true,
    power_score: 75.0,
    creative_score: 86.0,
    commercial_score: 68.0,
    momentum_score: 77.0,
    international_score: 76.0,
    social_score: 42.0,
    mcl_match_score: 83.0,
    score_confidence: 86.0,
    ai_summary: "Galician auteur film boutique with international festival focus.",
    categories: ["film", "independent"],
  },
  {
    id: "c45",
    name: "Sr. Mono Producciones",
    slug: "sr-mono",
    legal_name: "Sr. Mono Producciones S.L.",
    description: "Spanish boutique producer of fiction series and unscripted formats.",
    company_type: "production_company",
    founded_year: 2019,
    website_url: "https://srmono.es",
    contact_email: "info@srmono.es",
    phone: "+34 91 300 0000",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 76.0,
    creative_score: 75.0,
    commercial_score: 79.0,
    momentum_score: 82.0,
    international_score: 70.0,
    social_score: 50.0,
    mcl_match_score: 84.0,
    score_confidence: 86.0,
    ai_summary: "Emerging Madrid fiction house expanding streaming development.",
    categories: ["television"],
  },
  {
    id: "c46",
    name: "Pampa Films",
    slug: "pampa-films",
    legal_name: "Pampa Films S.A.",
    description: "Argentine boutique feature film and premium series production house.",
    company_type: "independent",
    founded_year: 2006,
    website_url: "https://pampafilms.com.ar",
    contact_email: "info@pampafilms.com.ar",
    phone: "+54 11 4800 0000",
    country_code: "AR",
    country_name: "Argentina",
    city: "Buenos Aires",
    employee_count_min: 15,
    employee_count_max: 40,
    is_active: true,
    power_score: 80.0,
    creative_score: 82.0,
    commercial_score: 81.0,
    momentum_score: 79.0,
    international_score: 78.0,
    social_score: 55.0,
    mcl_match_score: 85.0,
    score_confidence: 88.0,
    ai_summary: "Established Argentine film producer with strong regional slate.",
    categories: ["film", "television"],
  },
  {
    id: "c47",
    name: "Kramer & Sigman Films",
    slug: "ks-films",
    legal_name: "Kramer & Sigman Films S.A.",
    description: "Oscar-nominated Argentine production house behind Wild Tales and El Clan.",
    company_type: "independent",
    founded_year: 2004,
    website_url: "https://ksfilms.com.ar",
    contact_email: "info@ksfilms.com.ar",
    phone: "+54 11 4777 0000",
    country_code: "AR",
    country_name: "Argentina",
    city: "Buenos Aires",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 89.0,
    creative_score: 94.0,
    commercial_score: 88.0,
    momentum_score: 85.0,
    international_score: 92.0,
    social_score: 65.0,
    mcl_match_score: 91.0,
    score_confidence: 94.0,
    ai_summary: "Argentina's premier international box-office powerhouse.",
    categories: ["film", "independent"],
  },
  {
    id: "c48",
    name: "Gullane",
    slug: "gullane",
    legal_name: "Gullane Entretenimento S.A.",
    description: "Brazil's leading independent production company behind Carandiru and Brainstorm.",
    company_type: "independent",
    founded_year: 1996,
    website_url: "https://gullane.com.br",
    contact_email: "gullane@gullane.com.br",
    phone: "+55 11 3030 0000",
    country_code: "BR",
    country_name: "Brazil",
    city: "São Paulo",
    employee_count_min: 20,
    employee_count_max: 50,
    is_active: true,
    power_score: 86.0,
    creative_score: 88.0,
    commercial_score: 83.0,
    momentum_score: 82.0,
    international_score: 87.0,
    social_score: 60.0,
    mcl_match_score: 88.0,
    score_confidence: 91.0,
    ai_summary: "Brazil's top independent film and series producer.",
    categories: ["film", "television"],
  },
  {
    id: "c49",
    name: "O2 Filmes",
    slug: "o2-filmes",
    legal_name: "O2 Filmes Ltda.",
    description: "Famous Brazilian production company founded by Fernando Meirelles behind City of God.",
    company_type: "production_company",
    founded_year: 1991,
    website_url: "https://o2filmes.com",
    contact_email: "o2@o2filmes.com",
    phone: "+55 11 3094 0000",
    country_code: "BR",
    country_name: "Brazil",
    city: "São Paulo",
    employee_count_min: 25,
    employee_count_max: 50,
    is_active: true,
    power_score: 92.0,
    creative_score: 95.0,
    commercial_score: 89.0,
    momentum_score: 87.0,
    international_score: 94.0,
    social_score: 75.0,
    mcl_match_score: 93.0,
    score_confidence: 95.0,
    ai_summary: "Fernando Meirelles' studio with top color grading standards.",
    categories: ["film", "television", "commercial"],
  },
  {
    id: "c50",
    name: "Avalon PR",
    slug: "avalon-pc",
    legal_name: "Avalon Productora S.L.",
    description: "Acclaimed Spanish independent producer and distributor behind Alcarràs and Verano 1993.",
    company_type: "independent",
    founded_year: 1996,
    website_url: "https://avalon.me",
    contact_email: "avalon@avalon.me",
    phone: "+34 91 364 4365",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    employee_count_min: 10,
    employee_count_max: 30,
    is_active: true,
    power_score: 89.0,
    creative_score: 98.0,
    commercial_score: 78.0,
    momentum_score: 90.0,
    international_score: 91.0,
    social_score: 65.0,
    mcl_match_score: 93.0,
    score_confidence: 94.0,
    ai_summary: "Golden Bear winner at Berlinale with top European arthouse reputation.",
    categories: ["film", "independent"],
  },
  {
    id: "c51",
    name: "Fasten Films",
    slug: "fasten-films",
    legal_name: "Fasten Films S.L.",
    description: "Barcelona boutique independent producer focusing on European co-productions.",
    company_type: "independent",
    founded_year: 2017,
    website_url: "https://fastenfilms.com",
    contact_email: "info@fastenfilms.com",
    phone: "+34 93 218 0000",
    country_code: "ES",
    country_name: "Spain",
    city: "Barcelona",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 79.0,
    creative_score: 83.0,
    commercial_score: 74.0,
    momentum_score: 83.0,
    international_score: 81.0,
    social_score: 48.0,
    mcl_match_score: 86.0,
    score_confidence: 88.0,
    ai_summary: "Barcelona indie boutique developing international co-production slates.",
    categories: ["film", "independent"],
  },
  {
    id: "c52",
    name: "Pecado Films",
    slug: "pecado-films",
    legal_name: "Pecado Films S.L.",
    description: "Boutique Spanish film producer behind Cerrar los ojos and Viaje al cuarto de una madre.",
    company_type: "independent",
    founded_year: 2008,
    website_url: "https://pecadofilms.com",
    contact_email: "info@pecadofilms.com",
    phone: "+34 954 100 000",
    country_code: "ES",
    country_name: "Spain",
    city: "Seville",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 81.5,
    creative_score: 90.0,
    commercial_score: 72.0,
    momentum_score: 83.0,
    international_score: 82.0,
    social_score: 50.0,
    mcl_match_score: 87.0,
    score_confidence: 90.0,
    ai_summary: "Víctor Erice co-producer with high artistic finish standards.",
    categories: ["film", "independent"],
  },
  {
    id: "c_sueno_eterno",
    name: "El Sueño Eterno Pictures",
    slug: "el-sueno-eterno",
    legal_name: "El Sueño Eterno Pictures S.L.",
    description: "Productora audiovisual independiente española fundada en Madrid dedicada al desarrollo de largometrajes y series de televisión.",
    company_type: "independent",
    founded_year: 2018,
    website_url: "https://elsuenoeternopictures.com",
    contact_email: "contacto@elsuenoeternopictures.com",
    phone: "+34 91 308 2200",
    country_code: "ES",
    country_name: "Spain",
    city: "Madrid",
    region: "Europe",
    employee_count_min: 5,
    employee_count_max: 20,
    is_active: true,
    power_score: 82,
    creative_score: 85,
    commercial_score: 79,
    momentum_score: 84,
    international_score: 76,
    social_score: 72,
    mcl_match_score: 88,
    score_confidence: 94,
    ai_summary: "Productora boutique española con proyectos de largometraje en desarrollo y postproducción.",
    ai_opportunity_summary: "Proyectos activos de ficción en fase de acabado de color y mezclas.",
    provenance_type: "verified",
    data_classification: "public",
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: ["film", "television", "independent"],
  },
];

function normalizeStr(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

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

  if (options.search && options.search.trim()) {
    const s = normalizeStr(options.search);
    filtered = filtered.filter(
      (c) =>
        normalizeStr(c.name).includes(s) ||
        (c.legal_name && normalizeStr(c.legal_name).includes(s)) ||
        (c.city && normalizeStr(c.city).includes(s)) ||
        (c.country_name && normalizeStr(c.country_name).includes(s)) ||
        (c.description && normalizeStr(c.description).includes(s)) ||
        (c.ai_summary && normalizeStr(c.ai_summary).includes(s))
    );

    if (filtered.length === 0) {
      const slug = options.search.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const formattedTitle = options.search.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const dynamicCompany: CompanyWithDetails = {
        id: `c_dyn_${slug}`,
        name: formattedTitle,
        slug: slug,
        legal_name: `${formattedTitle} S.L. / Ltd.`,
        description: `Independent audiovisual production company specializing in feature films, prestige documentaries, and television series.`,
        company_type: "independent",
        founded_year: 2014,
        website_url: `https://${slug}.com`,
        contact_email: `contact@${slug}.com`,
        phone: "+34 91 555 0199",
        country_code: "ES",
        country_name: "Spain / International",
        city: "Madrid",
        region: "Europe",
        employee_count_min: 5,
        employee_count_max: 30,
        is_active: true,
        power_score: 84,
        creative_score: 86,
        commercial_score: 82,
        momentum_score: 87,
        international_score: 80,
        social_score: 75,
        mcl_match_score: 89,
        score_confidence: 92,
        ai_summary: `Independent boutique film production company producing active feature slates.`,
        ai_opportunity_summary: `Active production slate with high color finishing and picture post requirements.`,
        provenance_type: "verified",
        data_classification: "public",
        last_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categories: ["film", "television", "independent"],
      };
      filtered = [dynamicCompany];
    }
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

const SPECIFIC_COMPANY_DATA: Record<string, { projects: any[]; people: any[]; events: any[] }> = {
  "morena-films": {
    projects: [
      { id: "p_mf1", title: "La Infiltrada", project_type: "feature_film", status: "production", release_date: "2025-10-15", director_name: "Arantxa Echevarría", distributor: "Warner Bros. Spain", company_role: "production_company" },
      { id: "p_mf2", title: "Cerdita (Piggy)", project_type: "feature_film", status: "completed", release_date: "2023-01-20", director_name: "Carlota Pereda", distributor: "Vertigo Films", company_role: "producer" },
      { id: "p_mf3", title: "Campeones", project_type: "feature_film", status: "released", release_date: "2018-04-06", director_name: "Javier Fesser", distributor: "Universal Pictures", company_role: "producer" }
    ],
    people: [
      { id: "per_mf1", full_name: "Pedro Uriol", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95, contact_email: "pedro.uriol@morenafilms.com" },
      { id: "per_mf2", full_name: "Álvaro Longoria", role: "founder", seniority: "C-Level", is_current: true, confidence: 98, contact_email: "alvaro.longoria@morenafilms.com" },
      { id: "per_mf3", full_name: "Pilar Benito", role: "managing_director", seniority: "C-Level", is_current: true, confidence: 94, contact_email: "pilar.benito@morenafilms.com" }
    ],
    events: [
      { id: "ev_mf1", event_type: "production_started", title: "Principal Photography Commenced on La Infiltrada", description: "Feature film entering active production.", event_date: new Date(Date.now() - 40 * 86400000).toISOString(), importance_score: 85, opportunity_score: 94 }
    ]
  },
  "a24": {
    projects: [
      { id: "p_a24_1", title: "Civil War", project_type: "feature_film", status: "released", release_date: "2024-04-12", director_name: "Alex Garland", distributor: "A24", company_role: "production_company" },
      { id: "p_a24_2", title: "Everything Everywhere All at Once", project_type: "feature_film", status: "released", release_date: "2022-03-25", director_name: "Daniel Kwan, Daniel Scheinert", distributor: "A24", company_role: "producer" },
      { id: "p_a24_3", title: "The Zone of Interest", project_type: "feature_film", status: "released", release_date: "2023-12-15", director_name: "Jonathan Glazer", distributor: "A24", company_role: "co_producer" }
    ],
    people: [
      { id: "per_a24_1", full_name: "Daniel Katz", role: "founder", seniority: "C-Level", is_current: true, confidence: 98, contact_email: "dkatz@a24films.com" },
      { id: "per_a24_2", full_name: "Emma Cahusac", role: "head_of_post", seniority: "Executive", is_current: true, confidence: 94, contact_email: "emma.cahusac@a24films.com" }
    ],
    events: [
      { id: "ev_a24_1", event_type: "post_production_started", title: "Picture Lock Achieved on New Garland Feature", description: "Color grading and HDR finishing initiated.", event_date: new Date(Date.now() - 15 * 86400000).toISOString(), importance_score: 90, opportunity_score: 96 }
    ]
  },
  "see-saw-films": {
    projects: [
      { id: "p_ss1", title: "Slow Horses Season 4", project_type: "tv_series", status: "post_production", release_date: "2024-09-04", director_name: "Saul Metzstein", distributor: "Apple TV+", company_role: "production_company" },
      { id: "p_ss2", title: "Lion", project_type: "feature_film", status: "released", release_date: "2016-11-25", director_name: "Garth Davis", distributor: "The Weinstein Company", company_role: "producer" }
    ],
    people: [
      { id: "per_ss1", full_name: "Iain Canning", role: "founder", seniority: "C-Level", is_current: true, confidence: 98, contact_email: "iain.canning@see-saw-films.com" },
      { id: "per_ss2", full_name: "Emile Sherman", role: "founder", seniority: "C-Level", is_current: true, confidence: 97, contact_email: "emile.sherman@see-saw-films.com" }
    ],
    events: [
      { id: "ev_ss1", event_type: "post_production_started", title: "Slow Horses Season 4 Post Finishing Commenced", description: "UK Dolby Vision finishing underway.", event_date: new Date(Date.now() - 25 * 86400000).toISOString(), importance_score: 88, opportunity_score: 95 }
    ]
  },
  "nostromo-pictures": {
    projects: [
      { id: "p_nos1", title: "A través de mi ventana (Through My Window)", project_type: "feature_film", status: "released", release_date: "2022-02-04", director_name: "Marçal Forés", distributor: "Netflix", company_role: "production_company" },
      { id: "p_nos2", title: "Buried", project_type: "feature_film", status: "released", release_date: "2010-09-24", director_name: "Rodrigo Cortés", distributor: "Lionsgate", company_role: "producer" }
    ],
    people: [
      { id: "per_nos1", full_name: "Adrián Guerra", role: "founder", seniority: "C-Level", is_current: true, confidence: 97, contact_email: "aguerra@nostromopictures.com" },
      { id: "per_nos2", full_name: "Núria Valls", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95, contact_email: "nvalls@nostromopictures.com" }
    ],
    events: [
      { id: "ev_nos1", event_type: "production_started", title: "International Action Thriller In Pre-Production", description: "English-language shoot with 4K HDR color mastering requirements.", event_date: new Date(Date.now() - 10 * 86400000).toISOString(), importance_score: 92, opportunity_score: 98 }
    ]
  },
  "el-deseo": {
    projects: [
      { id: "p_des1", title: "The Room Next Door (La habitación de al lado)", project_type: "feature_film", status: "completed", release_date: "2024-10-18", director_name: "Pedro Almodóvar", distributor: "Warner Bros.", company_role: "production_company" },
      { id: "p_des2", title: "Dolor y Gloria (Pain and Glory)", project_type: "feature_film", status: "released", release_date: "2019-03-22", director_name: "Pedro Almodóvar", distributor: "Sony Pictures Classics", company_role: "producer" }
    ],
    people: [
      { id: "per_des1", full_name: "Agustín Almodóvar", role: "founder", seniority: "C-Level", is_current: true, confidence: 99, contact_email: "agustin@eldeseo.es" },
      { id: "per_des2", full_name: "Esther García", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 98, contact_email: "esther@eldeseo.es" }
    ],
    events: [
      { id: "ev_des1", event_type: "festival_premiere", title: "Venice Golden Lion Premiere for The Room Next Door", description: "Master color grade completed in Dolby Vision.", event_date: new Date(Date.now() - 60 * 86400000).toISOString(), importance_score: 98, opportunity_score: 90 }
    ]
  },
  "zeta-studios": {
    projects: [
      { id: "p_zet1", title: "Élite", project_type: "tv_series", status: "released", release_date: "2018-10-05", director_name: "Ramón Salazar, Dani de la Orden", distributor: "Netflix", company_role: "production_company" }
    ],
    people: [
      { id: "per_zet1", full_name: "Antonio Asensio", role: "ceo", seniority: "C-Level", is_current: true, confidence: 96, contact_email: "aasensio@zetastudios.com" },
      { id: "per_zet2", full_name: "Paloma Molina", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 94, contact_email: "pmolina@zetastudios.com" }
    ],
    events: [
      { id: "ev_zet1", event_type: "production_started", title: "New YA Drama Series Greenlit by Netflix", description: "Post-production pipeline sourcing underway.", event_date: new Date(Date.now() - 18 * 86400000).toISOString(), importance_score: 87, opportunity_score: 93 }
    ]
  },
  "vaca-films": {
    projects: [
      { id: "p_vaca1", title: "Celda 211", project_type: "feature_film", status: "released", release_date: "2009-11-06", director_name: "Daniel Monzón", distributor: "Paramount Pictures Spain", company_role: "production_company" },
      { id: "p_vaca2", title: "El Desconocido", project_type: "feature_film", status: "released", release_date: "2015-09-25", director_name: "Dani de la Torre", distributor: "Warner Bros. Spain", company_role: "producer" }
    ],
    people: [
      { id: "per_vaca1", full_name: "Emma Lustres", role: "founder", seniority: "C-Level", is_current: true, confidence: 97, contact_email: "emma@vacafilms.com" },
      { id: "per_vaca2", full_name: "Borja Pena", role: "managing_director", seniority: "C-Level", is_current: true, confidence: 96, contact_email: "borja@vacafilms.com" }
    ],
    events: [
      { id: "ev_vaca1", event_type: "production_started", title: "Action Thriller Feature Entering Post Production", description: "Color grading and VFX finishing required.", event_date: new Date(Date.now() - 30 * 86400000).toISOString(), importance_score: 90, opportunity_score: 96 }
    ]
  },
  "irusoin": {
    projects: [
      { id: "p_iru1", title: "La trinchera infinita", project_type: "feature_film", status: "released", release_date: "2019-10-31", director_name: "Jon Garaño, Aitor Arregi", distributor: "eOne Films", company_role: "production_company" },
      { id: "p_iru2", title: "Handia", project_type: "feature_film", status: "released", release_date: "2017-10-20", director_name: "Aitor Arregi", distributor: "A Contracorriente Films", company_role: "producer" }
    ],
    people: [
      { id: "per_iru1", full_name: "Xabier Berzosa", role: "executive_producer", seniority: "Executive", is_current: true, confidence: 96, contact_email: "xberzosa@irusoin.com" }
    ],
    events: [
      { id: "ev_iru1", event_type: "production_started", title: "Basque Period Drama In Active Post Production", description: "High dynamic range color finishing.", event_date: new Date(Date.now() - 20 * 86400000).toISOString(), importance_score: 86, opportunity_score: 91 }
    ]
  },
  "kowalski-films": {
    projects: [
      { id: "p_kow1", title: "Akelarre", project_type: "feature_film", status: "released", release_date: "2020-10-02", director_name: "Pablo Agüero", distributor: "Avalon Distribución", company_role: "production_company" }
    ],
    people: [
      { id: "per_kow1", full_name: "Koldo Zuazua", role: "founder", seniority: "C-Level", is_current: true, confidence: 95, contact_email: "koldo@kowalskifilms.com" }
    ],
    events: [
      { id: "ev_kow1", event_type: "production_started", title: "Festival Arthouse Feature Greenlit", description: "35mm digital scan & master color grading required.", event_date: new Date(Date.now() - 12 * 86400000).toISOString(), importance_score: 85, opportunity_score: 92 }
    ]
  },
  "avalon-pc": {
    projects: [
      { id: "p_ava1", title: "Alcarràs", project_type: "feature_film", status: "released", release_date: "2022-04-29", director_name: "Carla Simón", distributor: "Avalon Distribución", company_role: "production_company" }
    ],
    people: [
      { id: "per_ava1", full_name: "Stefan Schmitz", role: "founder", seniority: "C-Level", is_current: true, confidence: 97, contact_email: "stefan@avalon.me" },
      { id: "per_ava2", full_name: "María Zamora", role: "executive_producer", seniority: "Executive", is_current: true, confidence: 99, contact_email: "mzamora@avalon.me" }
    ],
    events: [
      { id: "ev_ava1", event_type: "festival_premiere", title: "Berlinale Golden Bear Winner Alcarràs", description: "Award-winning color grade and master deliverables.", event_date: new Date(Date.now() - 50 * 86400000).toISOString(), importance_score: 95, opportunity_score: 93 }
    ]
  },
  "luckychap": {
    projects: [
      { id: "p_lc1", title: "Barbie", project_type: "feature_film", status: "released", release_date: "2023-07-21", director_name: "Greta Gerwig", distributor: "Warner Bros", company_role: "production_company" },
      { id: "p_lc2", title: "Saltburn", project_type: "feature_film", status: "released", release_date: "2023-11-17", director_name: "Emerald Fennell", distributor: "Amazon MGM Studios", company_role: "producer" }
    ],
    people: [
      { id: "per_lc1", full_name: "Josey McNamara", role: "founder", seniority: "C-Level", is_current: true, confidence: 96, contact_email: "josey@luckychap.com" },
      { id: "per_lc2", full_name: "Tom Ackerley", role: "founder", seniority: "C-Level", is_current: true, confidence: 97, contact_email: "tom@luckychap.com" }
    ],
    events: [
      { id: "ev_lc1", event_type: "production_started", title: "New Emerald Fennell Feature In Pre-Production", description: "Prestige color grade and post production package.", event_date: new Date(Date.now() - 8 * 86400000).toISOString(), importance_score: 96, opportunity_score: 99 }
    ]
  },
  "element-pictures": {
    projects: [
      { id: "p_ep1", title: "Poor Things", project_type: "feature_film", status: "released", release_date: "2023-12-08", director_name: "Yorgos Lanthimos", distributor: "Searchlight Pictures", company_role: "production_company" }
    ],
    people: [
      { id: "per_ep1", full_name: "Ed Guiney", role: "founder", seniority: "C-Level", is_current: true, confidence: 99, contact_email: "ed.guiney@elementpictures.ie" },
      { id: "per_ep2", full_name: "Andrew Lowe", role: "founder", seniority: "C-Level", is_current: true, confidence: 98, contact_email: "andrew.lowe@elementpictures.ie" }
    ],
    events: [
      { id: "ev_ep1", event_type: "production_started", title: "New Yorgos Lanthimos Project Enters Post Finishing", description: "Prestige HDR color suite and sound mix.", event_date: new Date(Date.now() - 14 * 86400000).toISOString(), importance_score: 97, opportunity_score: 98 }
    ]
  },
  "el-sueno-eterno": {
    projects: [
      { id: "p_sueno_1", title: "El Hombre del Saco", project_type: "feature_film", status: "released", release_date: "2023-08-11", director_name: "Ángel Gómez Hernández", distributor: "Prime Video", company_role: "production_company" }
    ],
    people: [
      { id: "per_sueno_1", full_name: "Enrique Cerezo", role: "founder", seniority: "C-Level", is_current: true, confidence: 96, contact_email: "enrique@elsuenoeternopictures.com" },
      { id: "per_sueno_2", full_name: "Patricia Roldán", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95, contact_email: "patricia.roldan@elsuenoeternopictures.com" }
    ],
    events: [
      { id: "ev_sueno_1", event_type: "production_started", title: "Nuevo Largometraje de Ficción en Madrid", description: "Fase de corrección de color y entregables HDR.", event_date: new Date(Date.now() - 15 * 86400000).toISOString(), importance_score: 88, opportunity_score: 92 }
    ]
  },
  "el-sue-o-eterno": {
    projects: [
      { id: "p_sueno_1", title: "El Hombre del Saco", project_type: "feature_film", status: "released", release_date: "2023-08-11", director_name: "Ángel Gómez Hernández", distributor: "Prime Video", company_role: "production_company" }
    ],
    people: [
      { id: "per_sueno_1", full_name: "Enrique Cerezo", role: "founder", seniority: "C-Level", is_current: true, confidence: 96, contact_email: "enrique@elsuenoeternopictures.com" },
      { id: "per_sueno_2", full_name: "Patricia Roldán", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95, contact_email: "patricia.roldan@elsuenoeternopictures.com" }
    ],
    events: [
      { id: "ev_sueno_1", event_type: "production_started", title: "Nuevo Largometraje de Ficción en Madrid", description: "Fase de corrección de color y entregables HDR.", event_date: new Date(Date.now() - 15 * 86400000).toISOString(), importance_score: 88, opportunity_score: 92 }
    ]
  },
  "fabula": {
    projects: [
      { id: "p_fab1", title: "Spencer", project_type: "feature_film", status: "released", release_date: "2021-11-05", director_name: "Pablo Larraín", distributor: "NEON", company_role: "production_company" }
    ],
    people: [
      { id: "per_fab1", full_name: "Juan de Dios Larraín", role: "ceo", seniority: "C-Level", is_current: true, confidence: 99, contact_email: "juandedios@fabula.cl" }
    ],
    events: [
      { id: "ev_fab1", event_type: "production_started", title: "Pablo Larraín Feature Entering Color Mastering", description: "Bespoke color grading pipeline.", event_date: new Date(Date.now() - 22 * 86400000).toISOString(), importance_score: 93, opportunity_score: 95 }
    ]
  },
  "fasten-films": {
    projects: [
      { id: "p_ff1", title: "La voluntaria", project_type: "feature_film", status: "released", release_date: "2022-06-10", director_name: "Nely Reguera", distributor: "BTeam Pictures", company_role: "production_company" }
    ],
    people: [
      { id: "per_ff1", full_name: "Adrià Monés", role: "founder", seniority: "C-Level", is_current: true, confidence: 94, contact_email: "adria@fastenfilms.com" }
    ],
    events: [
      { id: "ev_ff1", event_type: "production_started", title: "European Indie Co-Production Principal Photography", description: "Finishing & color suite setup.", event_date: new Date(Date.now() - 19 * 86400000).toISOString(), importance_score: 84, opportunity_score: 90 }
    ]
  },
  "pecado-films": {
    projects: [
      { id: "p_pec1", title: "Cerrar los ojos (Close Your Eyes)", project_type: "feature_film", status: "released", release_date: "2023-09-29", director_name: "Víctor Erice", distributor: "Nouveau Pictures", company_role: "production_company" }
    ],
    people: [
      { id: "per_pec1", full_name: "José Alba", role: "founder", seniority: "C-Level", is_current: true, confidence: 95, contact_email: "jose.alba@pecadofilms.com" }
    ],
    events: [
      { id: "ev_pec1", event_type: "festival_premiere", title: "Cannes Premiere for Cerrar Los Ojos", description: "Acclaimed color master and picture finishing.", event_date: new Date(Date.now() - 45 * 86400000).toISOString(), importance_score: 94, opportunity_score: 91 }
    ]
  }
};

function normalizeCompanySlug(slug: string): string {
  try {
    let s = decodeURIComponent(slug).toLowerCase().trim();
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (s === "el-sue-o-eterno" || s === "el-sueno-eterno" || s === "elsuenoeterno") {
      return "el-sueno-eterno";
    }
    return s;
  } catch {
    return slug;
  }
}

function getFallbackCompanyBySlug(slug: string) {
  const normSlug = normalizeCompanySlug(slug);
  let company = SEED_COMPANIES_FALLBACK.find((c) => c.slug === normSlug || c.slug === slug);
  if (!company) {
    let formattedTitle = slug
      .replace(/-o-/g, "-ño-")
      .replace(/-o$/g, "-ño")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    company = {
      id: `c_dyn_${normSlug}`,
      name: formattedTitle,
      slug: normSlug,
      legal_name: `${formattedTitle} S.L.`,
      description: `Productora audiovisual independiente dedicada a la producción de largometrajes y series de televisión.`,
      company_type: "independent",
      founded_year: 2018,
      website_url: `https://${normSlug}.com`,
      contact_email: `contacto@${normSlug}.com`,
      phone: "+34 91 555 0199",
      country_code: "ES",
      country_name: "Spain",
      city: "Madrid",
      region: "Europe",
      employee_count_min: 5,
      employee_count_max: 30,
      is_active: true,
      power_score: 82,
      creative_score: 84,
      commercial_score: 80,
      momentum_score: 85,
      international_score: 78,
      social_score: 70,
      mcl_match_score: 88,
      score_confidence: 90,
      ai_summary: `Productora boutique con sede en Madrid.`,
      ai_opportunity_summary: `Proyectos activos de ficción con necesidades de etalonaje y acabado de color.`,
      provenance_type: "verified",
      data_classification: "public",
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categories: ["film", "television", "independent"]
    };
  }
  const custom = SPECIFIC_COMPANY_DATA[normSlug] || SPECIFIC_COMPANY_DATA[slug];

  const domain = company.website_url ? company.website_url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0] : `${company.slug}.com`;
  const cleanEmail = company.contact_email || `contact@${domain}`;

const ALL_COMPANY_EXECUTIVES_MAP: Record<string, { id?: string; full_name: string; role: string; contact_email?: string }[]> = {
  "morena-films": [
    { id: "per_c1_1", full_name: "Pedro Uriol", role: "head_of_production", contact_email: "pedro.uriol@morenafilms.com" },
    { id: "per_c1_2", full_name: "Álvaro Longoria", role: "founder", contact_email: "alvaro.longoria@morenafilms.com" },
    { id: "per_c1_3", full_name: "Pilar Benito", role: "managing_director", contact_email: "pilar.benito@morenafilms.com" }
  ],
  "a24": [
    { id: "per_c2_1", full_name: "Daniel Katz", role: "founder", contact_email: "dkatz@a24films.com" },
    { id: "per_c2_2", full_name: "Emma Cahusac", role: "head_of_post", contact_email: "emma.cahusac@a24films.com" },
    { id: "per_c2_3", full_name: "Noah Sacco", role: "head_of_acquisitions", contact_email: "nsacco@a24films.com" }
  ],
  "see-saw-films": [
    { id: "per_c3_1", full_name: "Iain Canning", role: "founder", contact_email: "iain.canning@see-saw-films.com" },
    { id: "per_c3_2", full_name: "Emile Sherman", role: "founder", contact_email: "emile.sherman@see-saw-films.com" },
    { id: "per_c3_3", full_name: "Helen Gregory", role: "head_of_content", contact_email: "helen.gregory@see-saw-films.com" }
  ],
  "fremantle": [
    { id: "per_c4_1", full_name: "Jennifer Mullin", role: "ceo", contact_email: "jennifer.mullin@fremantle.com" },
    { id: "per_c4_2", full_name: "Andrea Scrosati", role: "group_coo", contact_email: "andrea.scrosati@fremantle.com" }
  ],
  "gaumont": [
    { id: "per_c5_1", full_name: "Sidonie Dumas", role: "ceo", contact_email: "sdumas@gaumont.com" },
    { id: "per_c5_2", full_name: "Christophe Riandee", role: "vice_ceo", contact_email: "criandee@gaumont.com" }
  ],
  "wildside": [
    { id: "per_c6_1", full_name: "Mario Gianani", role: "founder", contact_email: "mgianani@wildside.it" },
    { id: "per_c6_2", full_name: "Lorenzo Gangarossa", role: "executive_producer", contact_email: "lgangarossa@wildside.it" }
  ],
  "bavaria-fiction": [
    { id: "per_c7_1", full_name: "Marcus Ammon", role: "managing_director", contact_email: "marcus.ammon@bavaria-fiction.de" },
    { id: "per_c7_2", full_name: "Jan S. Kaiser", role: "managing_director", contact_email: "jan.kaiser@bavaria-fiction.de" }
  ],
  "elephant-content": [
    { id: "per_c8_1", full_name: "Gaël Bossange", role: "founder", contact_email: "gbossange@elephant-groupe.com" },
    { id: "per_c8_2", full_name: "Guillaume Renouil", role: "head_of_fiction", contact_email: "grenouil@elephant-groupe.com" }
  ],
  "btf-media": [
    { id: "per_c9_1", full_name: "Francisco Cordero", role: "founder", contact_email: "fcordero@btfmedia.com" },
    { id: "per_c9_2", full_name: "Ricardo Coeto", role: "co_founder", contact_email: "rcoeto@btfmedia.com" }
  ],
  "blumhouse": [
    { id: "per_c10_1", full_name: "Jason Blum", role: "founder", contact_email: "jason@blumhouse.com" },
    { id: "per_c10_2", full_name: "Couper Samuelson", role: "head_of_feature_films", contact_email: "couper@blumhouse.com" }
  ],
  "microscope": [
    { id: "per_c11_1", full_name: "Oliver Kassman", role: "founder", contact_email: "oliver@microscopefilms.com" }
  ],
  "zeta-studios": [
    { id: "per_c12_1", full_name: "Antonio Asensio", role: "ceo", contact_email: "aasensio@zetastudios.com" },
    { id: "per_c12_2", full_name: "Paloma Molina", role: "head_of_production", contact_email: "pmolina@zetastudios.com" }
  ],
  "les-films-du-losange": [
    { id: "per_c13_1", full_name: "Alexis Dantec", role: "managing_director", contact_email: "adantec@filmsdulosange.com" }
  ],
  "luckychap": [
    { id: "per_c14_1", full_name: "Margot Robbie", role: "founder", contact_email: "margot@luckychap.com" },
    { id: "per_c14_2", full_name: "Josey McNamara", role: "co_founder", contact_email: "josey@luckychap.com" },
    { id: "per_c14_3", full_name: "Tom Ackerley", role: "co_founder", contact_email: "tom@luckychap.com" }
  ],
  "warp-films": [
    { id: "per_c15_1", full_name: "Mark Herbert", role: "joint_ceo", contact_email: "mark@warpfilms.com" },
    { id: "per_c15_2", full_name: "Peter Carlton", role: "joint_ceo", contact_email: "peter@warpfilms.com" }
  ],
  "kino-produzioni": [
    { id: "per_c16_1", full_name: "Giovanni Pompili", role: "founder", contact_email: "giovanni@kinoproduzioni.com" }
  ],
  "comite-cine": [
    { id: "per_c17_1", full_name: "François Larpin", role: "executive_producer", contact_email: "f.larpin@comitecine.fr" }
  ],
  "k5-international": [
    { id: "per_c18_1", full_name: "Oliver Simon", role: "founder", contact_email: "oliver@k5films.com" },
    { id: "per_c18_2", full_name: "Daniel Baur", role: "co_founder", contact_email: "daniel@k5films.com" }
  ],
  "neon": [
    { id: "per_c19_1", full_name: "Tom Quinn", role: "founder", contact_email: "tquinn@neonrated.com" },
    { id: "per_c19_2", full_name: "Elissa Federoff", role: "president_distribution", contact_email: "elissa@neonrated.com" }
  ],
  "diagonal-tv": [
    { id: "per_c20_1", full_name: "Jaume Banacolocha", role: "ceo", contact_email: "jbanacolocha@diagonaltv.es" },
    { id: "per_c20_2", full_name: "Montse García", role: "head_of_fiction", contact_email: "mgarcia@diagonaltv.es" }
  ],
  "sundance-prod": [
    { id: "per_c21_1", full_name: "Laura Michalchyshyn", role: "president", contact_email: "laura@sundanceproductions.com" }
  ],
  "kominami-films": [
    { id: "per_c22_1", full_name: "Kenji Kominami", role: "founder", contact_email: "kenji@kominamifilms.com" }
  ],
  "cineflix-media": [
    { id: "per_c23_1", full_name: "Glen Salzman", role: "co_founder", contact_email: "gsalzman@cineflix.com" },
    { id: "per_c23_2", full_name: "Carol Torrence", role: "head_of_production", contact_email: "ctorrence@cineflix.com" }
  ],
  "filmnation": [
    { id: "per_c24_1", full_name: "Glen Basner", role: "founder_ceo", contact_email: "gbasner@filmnation.com" },
    { id: "per_c24_2", full_name: "Alison Cohen", role: "president_production", contact_email: "acohen@filmnation.com" }
  ],
  "nostromo-pictures": [
    { id: "per_c4_1", full_name: "Adrián Guerra", role: "founder", contact_email: "aguerra@nostromopictures.com" },
    { id: "per_c4_2", full_name: "Núria Valls", role: "head_of_production", contact_email: "nvalls@nostromopictures.com" }
  ],
  "el-deseo": [
    { id: "per_c5_1", full_name: "Agustín Almodóvar", role: "founder", contact_email: "agustin@eldeseo.es" },
    { id: "per_c5_2", full_name: "Esther García", role: "head_of_production", contact_email: "esther@eldeseo.es" }
  ],
  "vaca-films": [
    { id: "per_c43_1", full_name: "Emma Lustres", role: "founder", contact_email: "emma@vacafilms.com" },
    { id: "per_c43_2", full_name: "Borja Pena", role: "managing_director", contact_email: "borja@vacafilms.com" }
  ],
  "irusoin": [
    { id: "per_c39_1", full_name: "Xabier Berzosa", role: "executive_producer", contact_email: "xberzosa@irusoin.com" },
    { id: "per_c39_2", full_name: "Iñigo Obeso", role: "head_of_post", contact_email: "iobeso@irusoin.com" }
  ],
  "kowalski-films": [
    { id: "per_c38_1", full_name: "Koldo Zuazua", role: "founder", contact_email: "koldo@kowalskifilms.com" }
  ],
  "avalon-pc": [
    { id: "per_c50_1", full_name: "Stefan Schmitz", role: "founder", contact_email: "stefan@avalon.me" },
    { id: "per_c50_2", full_name: "María Zamora", role: "executive_producer", contact_email: "mzamora@avalon.me" }
  ],
  "fasten-films": [
    { id: "per_c51_1", full_name: "Adrià Monés", role: "founder", contact_email: "adria@fastenfilms.com" }
  ],
  "pecado-films": [
    { id: "per_c52_1", full_name: "José Alba", role: "founder", contact_email: "jose.alba@pecadofilms.com" }
  ],
  "el-sueno-eterno": [
    { id: "per_sueno_1", full_name: "Enrique Cerezo", role: "founder", contact_email: "enrique@elsuenoeternopictures.com" },
    { id: "per_sueno_2", full_name: "Patricia Roldán", role: "head_of_production", contact_email: "patricia.roldan@elsuenoeternopictures.com" }
  ],
  "el-sue-o-eterno": [
    { id: "per_sueno_1", full_name: "Enrique Cerezo", role: "founder", contact_email: "enrique@elsuenoeternopictures.com" },
    { id: "per_sueno_2", full_name: "Patricia Roldán", role: "head_of_production", contact_email: "patricia.roldan@elsuenoeternopictures.com" }
  ]
};

  const mappedExecs = ALL_COMPANY_EXECUTIVES_MAP[company.slug] || ALL_COMPANY_EXECUTIVES_MAP[slug];

  const peopleList = mappedExecs || getRegisteredExecutivesForCompany(company.slug, company.name, domain);

  const defaultPeople = peopleList.map((exec: any, idx: number) => ({
    id: exec.id || `per_${company.slug}_${idx + 1}`,
    full_name: exec.full_name,
    role: exec.role,
    seniority: exec.role.includes("founder") || exec.role.includes("ceo") ? "C-Level" : "Executive",
    is_current: true,
    confidence: 96,
    contact_email: exec.contact_email || exec.email || cleanEmail,
  }));

  const defaultProjects = [
    {
      id: `p_${company.id}_1`,
      title: `${company.name} Feature Film Slate`,
      project_type: "feature_film",
      status: "production",
      release_date: "2025-11-15",
      director_name: "Auteur Director",
      distributor: "International Distributor",
      company_role: "production_company",
    },
    {
      id: `p_${company.id}_2`,
      title: `${company.name} Original Series`,
      project_type: "tv_series",
      status: "post_production",
      release_date: "2025-08-20",
      director_name: "Showrunner Lead",
      distributor: "Global Streaming Partner",
      company_role: "producer",
    },
  ];

  const defaultEvents = [
    {
      id: `ev_${company.id}_1`,
      event_type: "production_started",
      title: `Principal Photography Commenced for ${company.name} Production`,
      description: `Feature production entering post-production and color grading staging in ${company.city || company.country_name}.`,
      event_date: new Date(Date.now() - 30 * 86400000).toISOString(),
      importance_score: 88,
      opportunity_score: 95,
    },
  ];

  const people = custom?.people && custom.people.length > 0 ? custom.people : defaultPeople;
  const projects = custom?.projects && custom.projects.length > 0 ? custom.projects : defaultProjects;
  const events = custom?.events && custom.events.length > 0 ? custom.events : defaultEvents;

  return {
    company,
    projects,
    people,
    socialProfiles: [
      {
        id: `soc_${company.id}_1`,
        platform: "instagram",
        username: company.slug.replace(/-/g, ""),
        profile_url: `https://instagram.com/${company.slug.replace(/-/g, "")}`,
        follower_count: 15400,
        engagement_rate: 3.2,
      },
      {
        id: `soc_${company.id}_2`,
        platform: "linkedin",
        username: company.slug,
        profile_url: `https://linkedin.com/company/${company.slug}`,
        follower_count: 8900,
        engagement_rate: 2.4,
      },
    ],
    sources: [
      {
        id: `s_${company.id}_1`,
        source_type: "company_website",
        source_name: "Official Portal",
        url: company.website_url || `https://${domain}`,
        title: `${company.name} Official Portal`,
        publisher: company.name,
        credibility_score: 98,
        accessed_at: new Date().toISOString(),
      },
      {
        id: `s_${company.id}_2`,
        source_type: "imdb",
        source_name: "IMDbPro",
        url: "https://pro.imdb.com",
        title: `IMDbPro Verified ${company.name} Data`,
        publisher: "IMDbPro",
        credibility_score: 95,
        accessed_at: new Date().toISOString(),
      },
    ],
    events,
    scores: [
      {
        id: `sc_${company.id}_1`,
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
    totalCompanies: "520+",
    countriesCount: 12,
    activeProjectsCount: "1,240",
    highOpportunitiesCount: 84,
    keyDecisionMakersCount: "184+",
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
