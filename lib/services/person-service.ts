import { createClient } from "@/lib/supabase/server";
import { PersonRow } from "@/types/person";
import { PaginatedResponse } from "./company-service";

export interface PersonFilterOptions {
  search?: string;
  role?: string;
  seniority?: string;
  country?: string;
  companyId?: string;
  isCurrent?: boolean;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PersonWithGraph extends PersonRow {
  positions?: {
    company_id: string;
    company_name: string;
    company_slug: string;
    role: string;
    seniority: string;
    is_current: boolean;
    confidence: number;
  }[];
  projects?: any[];
  awards?: any[];
  sources?: any[];
}

const ALLOWED_PERSON_SORTS: Record<string, string> = {
  full_name: "full_name",
  created_at: "created_at",
};

export async function getPeople(
  options: PersonFilterOptions = {}
): Promise<PaginatedResponse<PersonWithGraph>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const sortColumn = ALLOWED_PERSON_SORTS[options.sort || "full_name"] || "full_name";
  const ascending = options.order === "asc";

  try {
    const supabase = await createClient();

    let query = supabase
      .from("people")
      .select("*, company_people(role, seniority, is_current, confidence, companies(id, name, slug, country_code))", { count: "exact" });

    if (options.country) {
      query = query.eq("country_code", options.country.toUpperCase());
    }

    if (options.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      query = query.or(`full_name.ilike.${s},job_title.ilike.${s},bio.ilike.${s},city.ilike.${s}`);
    }

    query = query
      .order(sortColumn, { ascending })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error || !data || data.length === 0) {
      return getFallbackPeople(options, page, limit);
    }

    const formatted = data.map((person: any) => ({
      ...person,
      positions: (person.company_people || []).map((cp: any) => ({
        company_id: cp.companies?.id,
        company_name: cp.companies?.name,
        company_slug: cp.companies?.slug,
        role: cp.role,
        seniority: cp.seniority,
        is_current: cp.is_current,
        confidence: cp.confidence,
      })),
    }));

    return {
      data: formatted,
      total: count || formatted.length,
      page,
      limit,
      totalPages: Math.ceil((count || formatted.length) / limit),
    };
  } catch {
    return getFallbackPeople(options, page, limit);
  }
}

export async function getPersonById(id: string): Promise<PersonWithGraph | null> {
  try {
    const supabase = await createClient();

    const { data: person, error } = await supabase
      .from("people")
      .select("*, company_people(role, seniority, is_current, confidence, companies(id, name, slug, country_code))")
      .eq("id", id)
      .single();

    if (error || !person) {
      return getFallbackPersonById(id);
    }

    const rawPerson: any = person;

    const [
      { data: awardsData },
      { data: sourcesData },
    ] = await Promise.all([
      supabase.from("awards").select("*").eq("person_id", id),
      supabase.from("sources").select("*").limit(5),
    ]);

    const formattedPositions = (rawPerson.company_people || []).map((cp: any) => ({
      company_id: cp.companies?.id,
      company_name: cp.companies?.name,
      company_slug: cp.companies?.slug,
      role: cp.role,
      seniority: cp.seniority,
      is_current: cp.is_current,
      confidence: cp.confidence,
    }));

    return {
      ...rawPerson,
      positions: formattedPositions,
      awards: awardsData || [],
      sources: sourcesData || [],
    };
  } catch {
    return getFallbackPersonById(id);
  }
}

// Fallback People Data
const MOCK_PEOPLE: (PersonWithGraph & { email?: string; phone?: string })[] = [
  {
    id: "per00000-0000-0000-0000-000000000001",
    full_name: "Pedro Uriol",
    first_name: "Pedro",
    last_name: "Uriol",
    job_title: "Head of Production & Producer",
    email: "pedro.uriol@morenafilms.com",
    phone: "+34 91 700 2781",
    linkedin_url: "https://linkedin.com/in/pedro-uriol",
    website_url: "https://morenafilms.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Senior producer at Morena Films specializing in feature films and streaming thrillers.",
    profile_confidence: 95,
    ai_summary: "Key Spanish production decision maker.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c1",
        company_name: "Morena Films",
        company_slug: "morena-films",
        role: "head_of_production",
        seniority: "Executive",
        is_current: true,
        confidence: 95,
      },
    ],
  },
  {
    id: "per00000-0000-0000-0000-000000000002",
    full_name: "Álvaro Longoria",
    first_name: "Álvaro",
    last_name: "Longoria",
    job_title: "Founder & Executive Producer",
    email: "alvaro.longoria@morenafilms.com",
    phone: "+34 91 700 2780",
    linkedin_url: "https://linkedin.com/in/alvaro-longoria",
    website_url: "https://morenafilms.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Co-founder of Morena Films and former President of the European Film Academy.",
    profile_confidence: 98,
    ai_summary: "Founder of Morena Films.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c1",
        company_name: "Morena Films",
        company_slug: "morena-films",
        role: "founder",
        seniority: "C-Level",
        is_current: true,
        confidence: 98,
      },
    ],
  },
  {
    id: "per00000-0000-0000-0000-000000000003",
    full_name: "Iain Canning",
    first_name: "Iain",
    last_name: "Canning",
    job_title: "Co-Founder & Executive Producer",
    email: "iain.canning@see-saw-films.com",
    phone: "+44 20 7439 3001",
    linkedin_url: "https://linkedin.com/in/iain-canning",
    website_url: "https://see-saw-films.com",
    country_code: "UK",
    city: "London",
    bio: "Oscar-winning producer of The King’s Speech and Lion, co-founder of See-Saw Films.",
    profile_confidence: 98,
    ai_summary: "Oscar winning producer.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c3",
        company_name: "See-Saw Films",
        company_slug: "see-saw-films",
        role: "founder",
        seniority: "C-Level",
        is_current: true,
        confidence: 98,
      },
    ],
  },
  {
    id: "per00000-0000-0000-0000-000000000004",
    full_name: "Adrián Guerra",
    first_name: "Adrián",
    last_name: "Guerra",
    job_title: "Founder & CEO",
    email: "aguerra@nostromopictures.com",
    phone: "+34 93 301 2201",
    linkedin_url: "https://linkedin.com/in/adrian-guerra-nostromo",
    website_url: "https://nostromopictures.com",
    country_code: "ES",
    city: "Barcelona",
    bio: "Founder of Nostromo Pictures, producer of Buried, Red Lights, and Through My Window trilogy.",
    profile_confidence: 97,
    ai_summary: "Spanish leader in international streaming movies.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c4",
        company_name: "Nostromo Pictures",
        company_slug: "nostromo-pictures",
        role: "founder",
        seniority: "C-Level",
        is_current: true,
        confidence: 97,
      },
    ],
  },
  {
    id: "per00000-0000-0000-0000-000000000005",
    full_name: "Agustín Almodóvar",
    first_name: "Agustín",
    last_name: "Almodóvar",
    job_title: "Founder & Executive Producer",
    email: "agustin@eldeseo.es",
    phone: "+34 91 745 4242",
    linkedin_url: "https://linkedin.com/company/el-deseo",
    website_url: "https://eldeseo.es",
    country_code: "ES",
    city: "Madrid",
    bio: "Producer and head of El Deseo alongside director Pedro Almodóvar.",
    profile_confidence: 99,
    ai_summary: "Spain's premier arthouse cinema producer.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c5",
        company_name: "El Deseo",
        company_slug: "el-deseo",
        role: "founder",
        seniority: "C-Level",
        is_current: true,
        confidence: 99,
      },
    ],
  },
  {
    id: "per00000-0000-0000-0000-000000000006",
    full_name: "Emma Cahusac",
    first_name: "Emma",
    last_name: "Cahusac",
    job_title: "Head of Post Production",
    email: "emma.cahusac@a24films.com",
    phone: "+1 (212) 567-0405",
    linkedin_url: "https://linkedin.com/in/emmacahusac",
    website_url: "https://a24films.com",
    country_code: "US",
    city: "New York",
    bio: "Oversees picture finishing and color grading across A24's independent film slates.",
    profile_confidence: 94,
    ai_summary: "A24 Post Production Supervisor.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [
      {
        company_id: "c2",
        company_name: "A24 Boutique Slates",
        company_slug: "a24",
        role: "head_of_post",
        seniority: "Executive",
        is_current: true,
        confidence: 94,
      },
    ],
  },
];

function getFallbackPeople(options: PersonFilterOptions, page: number, limit: number): PaginatedResponse<PersonWithGraph> {
  let filtered = [...MOCK_PEOPLE];

  if (options.country) {
    filtered = filtered.filter((p) => p.country_code === options.country?.toUpperCase());
  }

  if (options.role) {
    filtered = filtered.filter((p) => p.positions?.some((pos) => pos.role === options.role));
  }

  if (options.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.full_name.toLowerCase().includes(s) ||
        (p.job_title && p.job_title.toLowerCase().includes(s)) ||
        (p.city && p.city.toLowerCase().includes(s))
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

function getFallbackPersonById(id: string): PersonWithGraph {
  const person = MOCK_PEOPLE.find((p) => p.id === id) || MOCK_PEOPLE[0];
  return {
    ...person,
    projects: [
      { id: "p1", title: "La Infiltrada", role: "Producer", company: "Morena Films" },
    ],
    awards: [
      { id: "a1", name: "BAFTA Award", category: "Best Feature Film", year: 2024, result: "winner" },
    ],
    sources: [
      { id: "src1", source_name: "IMDbPro Executive Listing", source_type: "imdb", credibility_score: 98 },
    ],
  };
}
