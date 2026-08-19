import { createClient } from "@/lib/supabase/server";
import { ProjectRow } from "@/types/project";
import { PaginatedResponse } from "./company-service";

export interface ProjectFilterOptions {
  search?: string;
  projectType?: string;
  status?: string;
  country?: string;
  companyId?: string;
  releaseYear?: number;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProjectWithGraph extends ProjectRow {
  companies?: {
    id: string;
    name: string;
    slug: string;
    country_code: string | null;
    role: string;
  }[];
  people?: {
    id: string;
    full_name: string;
    role: string;
  }[];
  awards?: any[];
  sources?: any[];
}

const ALLOWED_PROJECT_SORTS: Record<string, string> = {
  release_date: "release_date",
  title: "title",
  created_at: "created_at",
  status: "status",
};

export async function getProjects(
  options: ProjectFilterOptions = {}
): Promise<PaginatedResponse<ProjectWithGraph>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const sortColumn = ALLOWED_PROJECT_SORTS[options.sort || "release_date"] || "release_date";
  const ascending = options.order === "asc";

  try {
    const supabase = await createClient();

    let query = supabase
      .from("projects")
      .select("*, company_projects(role, companies(id, name, slug, country_code))", { count: "exact" });

    if (options.projectType) {
      query = query.eq("project_type", options.projectType);
    }

    if (options.status) {
      query = query.eq("status", options.status);
    }

    if (options.country) {
      query = query.eq("country_code", options.country.toUpperCase());
    }

    if (options.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      query = query.or(`title.ilike.${s},original_title.ilike.${s},director_name.ilike.${s},description.ilike.${s}`);
    }

    query = query
      .order(sortColumn, { ascending, nullsFirst: false })
      .order("title", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error || !data || data.length === 0) {
      return getFallbackProjects(options, page, limit);
    }

    const formatted = data.map((p: any) => ({
      ...p,
      companies: (p.company_projects || []).map((cp: any) => ({
        id: cp.companies?.id,
        name: cp.companies?.name,
        slug: cp.companies?.slug,
        country_code: cp.companies?.country_code,
        role: cp.role,
      })),
    }));

    return {
      data: formatted,
      total: count || formatted.length,
      page,
      limit,
      totalPages: Math.ceil((count || formatted.length) / limit),
    };
  } catch (err) {
    return getFallbackProjects(options, page, limit);
  }
}

export async function getProjectById(id: string): Promise<ProjectWithGraph | null> {
  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*, company_projects(role, companies(id, name, slug, country_code, power_score, mcl_match_score))")
      .eq("id", id)
      .single();

    if (error || !project) {
      return getFallbackProjectById(id);
    }

    const rawProject: any = project;

    const [
      { data: awardsData },
      { data: sourcesData },
    ] = await Promise.all([
      supabase.from("awards").select("*").eq("project_id", id),
      supabase.from("sources").select("*").limit(5),
    ]);

    const formattedCompanies = (rawProject.company_projects || []).map((cp: any) => ({
      id: cp.companies?.id,
      name: cp.companies?.name,
      slug: cp.companies?.slug,
      country_code: cp.companies?.country_code,
      power_score: cp.companies?.power_score,
      mcl_match_score: cp.companies?.mcl_match_score,
      role: cp.role,
    }));

    return {
      ...rawProject,
      companies: formattedCompanies,
      awards: awardsData || [],
      sources: sourcesData || [],
    };
  } catch {
    return getFallbackProjectById(id);
  }
}

// Fallbacks for Projects
const MOCK_PROJECTS: ProjectWithGraph[] = [
  {
    id: "p0000000-0000-0000-0000-000000000001",
    title: "La Infiltrada",
    slug: "la-infiltrada",
    original_title: "La Infiltrada",
    project_type: "feature_film",
    status: "production",
    release_date: "2025-10-15",
    country_code: "ES",
    genre: ["Thriller", "Drama"],
    writers: ["Arantxa Echevarría", "Amèlia Mora"],
    language: "Spanish",
    director_name: "Arantxa Echevarría",
    distributor: "Warner Bros. Spain",
    streaming_platform: "Prime Video",
    budget_min: 4500000,
    budget_max: 6000000,
    budget_currency: "EUR",
    description: "High-stakes undercover police thriller based on real events in Spain during the 1990s.",
    source_id: "s1",
    announced_at: new Date().toISOString(),
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    companies: [
      { id: "c1", name: "Morena Films", slug: "morena-films", country_code: "ES", role: "production_company" },
    ],
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    title: "Civil War",
    slug: "civil-war",
    original_title: "Civil War",
    project_type: "feature_film",
    status: "released",
    release_date: "2024-04-12",
    country_code: "US",
    genre: ["Action", "Sci-Fi", "Drama"],
    writers: ["Alex Garland"],
    language: "English",
    director_name: "Alex Garland",
    distributor: "A24",
    streaming_platform: "Max",
    budget_min: 50000000,
    budget_max: 50000000,
    budget_currency: "USD",
    description: "A team of military-embedded journalists races across the US before rebel factions storm DC.",
    source_id: "s2",
    announced_at: new Date().toISOString(),
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    companies: [
      { id: "c2", name: "A24", slug: "a24", country_code: "US", role: "production_company" },
    ],
  },
  {
    id: "p0000000-0000-0000-0000-000000000003",
    title: "Slow Horses Season 4",
    slug: "slow-horses-s4",
    original_title: "Slow Horses S4",
    project_type: "tv_series",
    status: "post_production",
    release_date: "2025-09-01",
    country_code: "UK",
    genre: ["Espionage", "Thriller"],
    writers: ["Will Smith"],
    language: "English",
    director_name: "Saul Metzstein",
    distributor: "Apple TV+",
    streaming_platform: "Apple TV+",
    budget_min: 25000000,
    budget_max: 35000000,
    budget_currency: "GBP",
    description: "A dysfunctional team of MI5 agents navigate the espionage graveyard of Slough House.",
    source_id: "s3",
    announced_at: new Date().toISOString(),
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    companies: [
      { id: "c3", name: "See-Saw Films", slug: "see-saw-films", country_code: "UK", role: "producer" },
    ],
  },
  {
    id: "p0000000-0000-0000-0000-000000000004",
    title: "Costiera",
    slug: "costiera",
    original_title: "Costiera",
    project_type: "tv_series",
    status: "post_production",
    release_date: "2025-11-20",
    country_code: "IT",
    genre: ["Action", "Drama"],
    writers: ["Elena Bucaccio"],
    language: "Italian",
    director_name: "Adam Bernstein",
    distributor: "Fremantle",
    streaming_platform: "Amazon Prime",
    budget_min: 20000000,
    budget_max: 30000000,
    budget_currency: "EUR",
    description: "High-octane action drama series set on the Amalfi Coast of Italy.",
    source_id: "s4",
    announced_at: new Date().toISOString(),
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    companies: [
      { id: "c4", name: "Fremantle", slug: "fremantle", country_code: "UK", role: "producer" },
      { id: "c6", name: "Wildside", slug: "wildside", country_code: "IT", role: "co_producer" },
    ],
  },
];

function getFallbackProjects(options: ProjectFilterOptions, page: number, limit: number): PaginatedResponse<ProjectWithGraph> {
  let filtered = [...MOCK_PROJECTS];

  if (options.projectType) {
    filtered = filtered.filter((p) => p.project_type === options.projectType);
  }

  if (options.status) {
    filtered = filtered.filter((p) => p.status === options.status);
  }

  if (options.country) {
    filtered = filtered.filter((p) => p.country_code === options.country?.toUpperCase());
  }

  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        (p.director_name && p.director_name.toLowerCase().includes(s))
    );
  }

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return {
    data: paged,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function getFallbackProjectById(id: string): ProjectWithGraph {
  const p = MOCK_PROJECTS.find((proj) => proj.id === id) || MOCK_PROJECTS[0];
  return {
    ...p,
    awards: [
      { id: "aw1", name: "Cannes Film Festival", category: "Official Selection", year: 2025, result: "winner" },
    ],
    sources: [
      { id: "src1", source_name: "Variety Press Release", source_type: "industry_press", credibility_score: 95 },
    ],
  };
}
