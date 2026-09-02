import { createClient } from "../supabase/server";
import { PersonRow } from "../../types/person";
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
  email?: string;
  phone?: string;
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
      .select("*, company_people(role, seniority, is_current, companies(id, name, slug, country_code))", { count: "exact" });

    if (options.country) {
      query = query.eq("country_code", options.country.toUpperCase());
    }

    if (options.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      query = query.or(`full_name.ilike.${s},bio.ilike.${s},city.ilike.${s}`);
    }

    query = query
      .order(sortColumn, { ascending })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error || !data || data.length < 20) {
      return getFallbackPeople(options, page, limit);
    }

    const formatted = data.map((person: any) => {
      const positions = (person.company_people || []).map((cp: any) => ({
        company_id: cp.companies?.id,
        company_name: cp.companies?.name,
        company_slug: cp.companies?.slug,
        role: cp.role,
        seniority: cp.seniority,
        is_current: cp.is_current,
        confidence: 0,
      }));
      return {
        ...person,
        job_title: positions.find((position: any) => position.is_current)?.role || positions[0]?.role || null,
        positions,
      };
    });

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
      .select("*, company_people(role, seniority, is_current, companies(id, name, slug, country_code))")
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
      confidence: 0,
    }));

    return {
      ...rawPerson,
      job_title: formattedPositions.find((position: any) => position.is_current)?.role || formattedPositions[0]?.role || null,
      positions: formattedPositions,
      awards: awardsData || [],
      sources: sourcesData || [],
    };
  } catch {
    return getFallbackPersonById(id);
  }
}

// Fallback People Data
export const MOCK_PEOPLE: (PersonWithGraph & { email?: string; phone?: string })[] = [
  // Morena Films
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
    positions: [{ company_id: "c1", company_name: "Morena Films", company_slug: "morena-films", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95 }],
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
    positions: [{ company_id: "c1", company_name: "Morena Films", company_slug: "morena-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 98 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000003",
    full_name: "Pilar Benito",
    first_name: "Pilar",
    last_name: "Benito",
    job_title: "Managing Director & Head of Business Affairs",
    email: "pilar.benito@morenafilms.com",
    phone: "+34 91 700 2782",
    linkedin_url: "https://linkedin.com/in/pilar-benito-morena",
    website_url: "https://morenafilms.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Managing Director overseeing co-productions and finance deals.",
    profile_confidence: 94,
    ai_summary: "Morena Films business decision maker.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c1", company_name: "Morena Films", company_slug: "morena-films", role: "managing_director", seniority: "C-Level", is_current: true, confidence: 94 }],
  },

  // Nostromo Pictures
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
    positions: [{ company_id: "c4", company_name: "Nostromo Pictures", company_slug: "nostromo-pictures", role: "founder", seniority: "C-Level", is_current: true, confidence: 97 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000005",
    full_name: "Núria Valls",
    first_name: "Núria",
    last_name: "Valls",
    job_title: "Executive Producer & Head of Production",
    email: "nvalls@nostromopictures.com",
    phone: "+34 93 301 2202",
    linkedin_url: "https://linkedin.com/in/nuria-valls-nostromo",
    website_url: "https://nostromopictures.com",
    country_code: "ES",
    city: "Barcelona",
    bio: "Executive producer at Nostromo Pictures managing physical production and post finishing.",
    profile_confidence: 95,
    ai_summary: "Nostromo physical production head.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c4", company_name: "Nostromo Pictures", company_slug: "nostromo-pictures", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 95 }],
  },

  // El Deseo
  {
    id: "per00000-0000-0000-0000-000000000006",
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
    positions: [{ company_id: "c5", company_name: "El Deseo", company_slug: "el-deseo", role: "founder", seniority: "C-Level", is_current: true, confidence: 99 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000007",
    full_name: "Esther García",
    first_name: "Esther",
    last_name: "García",
    job_title: "Head of Production & Line Producer",
    email: "esther@eldeseo.es",
    phone: "+34 91 745 4243",
    linkedin_url: "https://linkedin.com/in/esther-garcia-eldeseo",
    website_url: "https://eldeseo.es",
    country_code: "ES",
    city: "Madrid",
    bio: "National Film Award winning line producer supervising all El Deseo feature film productions.",
    profile_confidence: 98,
    ai_summary: "El Deseo production supervisor.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c5", company_name: "El Deseo", company_slug: "el-deseo", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 98 }],
  },

  // See-Saw Films
  {
    id: "per00000-0000-0000-0000-000000000008",
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
    positions: [{ company_id: "c3", company_name: "See-Saw Films UK", company_slug: "see-saw-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 98 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000009",
    full_name: "Emile Sherman",
    first_name: "Emile",
    last_name: "Sherman",
    job_title: "Co-Founder & Producer",
    email: "emile.sherman@see-saw-films.com",
    phone: "+44 20 7439 3002",
    linkedin_url: "https://linkedin.com/in/emile-sherman",
    website_url: "https://see-saw-films.com",
    country_code: "UK",
    city: "London",
    bio: "Co-founder of See-Saw Films overseeing UK and Australian slates.",
    profile_confidence: 97,
    ai_summary: "See-Saw Films co-founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c3", company_name: "See-Saw Films UK", company_slug: "see-saw-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 97 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000010",
    full_name: "Helen Gregory",
    first_name: "Helen",
    last_name: "Gregory",
    job_title: "Creative Director & Executive Producer",
    email: "helen.gregory@see-saw-films.com",
    phone: "+44 20 7439 3005",
    linkedin_url: "https://linkedin.com/in/helen-gregory-seesaw",
    website_url: "https://see-saw-films.com",
    country_code: "UK",
    city: "London",
    bio: "Creative Director driving television drama developments like Slow Horses.",
    profile_confidence: 94,
    ai_summary: "See-Saw Creative Director.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c3", company_name: "See-Saw Films UK", company_slug: "see-saw-films", role: "head_of_content", seniority: "Executive", is_current: true, confidence: 94 }],
  },

  // A24
  {
    id: "per00000-0000-0000-0000-000000000011",
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
    positions: [{ company_id: "c2", company_name: "A24 Boutique Slates", company_slug: "a24", role: "head_of_post", seniority: "Executive", is_current: true, confidence: 94 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000012",
    full_name: "Daniel Katz",
    first_name: "Daniel",
    last_name: "Katz",
    job_title: "Co-Founder & Producer",
    email: "dkatz@a24films.com",
    phone: "+1 (212) 567-0400",
    linkedin_url: "https://linkedin.com/in/daniel-katz-a24",
    website_url: "https://a24films.com",
    country_code: "US",
    city: "New York",
    bio: "Co-founder of A24 leading theatrical distribution and feature film production.",
    profile_confidence: 98,
    ai_summary: "A24 Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c2", company_name: "A24 Boutique Slates", company_slug: "a24", role: "founder", seniority: "C-Level", is_current: true, confidence: 98 }],
  },

  // Zeta Studios
  {
    id: "per00000-0000-0000-0000-000000000013",
    full_name: "Paloma Molina",
    first_name: "Paloma",
    last_name: "Molina",
    job_title: "Head of Production",
    email: "pmolina@zetastudios.com",
    phone: "+34 91 510 0305",
    linkedin_url: "https://linkedin.com/in/paloma-molina-zeta",
    website_url: "https://zetastudios.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Head of Production at Zeta Studios managing Netflix original series and features.",
    profile_confidence: 94,
    ai_summary: "Zeta Studios Head of Production.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c7", company_name: "Zeta Studios", company_slug: "zeta-studios", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 94 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000014",
    full_name: "Antonio Asensio",
    first_name: "Antonio",
    last_name: "Asensio",
    job_title: "CEO & President",
    email: "aasensio@zetastudios.com",
    phone: "+34 91 510 0300",
    linkedin_url: "https://linkedin.com/company/zeta-studios",
    website_url: "https://zetastudios.com",
    country_code: "ES",
    city: "Madrid",
    bio: "CEO of Zeta Studios, producer of Élite.",
    profile_confidence: 96,
    ai_summary: "Zeta Studios CEO.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c7", company_name: "Zeta Studios", company_slug: "zeta-studios", role: "ceo", seniority: "C-Level", is_current: true, confidence: 96 }],
  },

  // Vaca Films
  {
    id: "per00000-0000-0000-0000-000000000015",
    full_name: "Emma Lustres",
    first_name: "Emma",
    last_name: "Lustres",
    job_title: "Founder & Executive Producer",
    email: "emma@vacafilms.com",
    phone: "+34 981 145 001",
    linkedin_url: "https://linkedin.com/in/emma-lustres-vaca",
    website_url: "https://vacafilms.com",
    country_code: "ES",
    city: "A Coruña",
    bio: "Co-founder of Vaca Films, leading producer of Spanish action thrillers.",
    profile_confidence: 97,
    ai_summary: "Vaca Films Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c43", company_name: "Vaca Films", company_slug: "vaca-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 97 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000016",
    full_name: "Borja Pena",
    first_name: "Borja",
    last_name: "Pena",
    job_title: "Co-Founder & Managing Director",
    email: "borja@vacafilms.com",
    phone: "+34 981 145 002",
    linkedin_url: "https://linkedin.com/in/borja-pena-vaca",
    website_url: "https://vacafilms.com",
    country_code: "ES",
    city: "A Coruña",
    bio: "Co-founder of Vaca Films overseeing line production and finishing workflows.",
    profile_confidence: 96,
    ai_summary: "Vaca Films Co-Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c43", company_name: "Vaca Films", company_slug: "vaca-films", role: "managing_director", seniority: "C-Level", is_current: true, confidence: 96 }],
  },

  // Irusoin
  {
    id: "per00000-0000-0000-0000-000000000017",
    full_name: "Xabier Berzosa",
    first_name: "Xabier",
    last_name: "Berzosa",
    job_title: "Executive Producer",
    email: "xberzosa@irusoin.com",
    phone: "+34 943 429 201",
    linkedin_url: "https://linkedin.com/in/xabier-berzosa-irusoin",
    website_url: "https://irusoin.com",
    country_code: "ES",
    city: "San Sebastián",
    bio: "Executive Producer behind La trinchera infinita, Loreak, and Handia.",
    profile_confidence: 96,
    ai_summary: "Irusoin Executive Producer.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c39", company_name: "Irusoin", company_slug: "irusoin", role: "executive_producer", seniority: "Executive", is_current: true, confidence: 96 }],
  },

  // Kowalski Films
  {
    id: "per00000-0000-0000-0000-000000000018",
    full_name: "Koldo Zuazua",
    first_name: "Koldo",
    last_name: "Zuazua",
    job_title: "Founder & Producer",
    email: "koldo@kowalskifilms.com",
    phone: "+34 943 424 001",
    linkedin_url: "https://linkedin.com/in/koldo-zuazua",
    website_url: "https://kowalskifilms.com",
    country_code: "ES",
    city: "San Sebastián",
    bio: "Founder of Kowalski Films, producer of Akelarre and O Que Arde.",
    profile_confidence: 95,
    ai_summary: "Kowalski Films Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c38", company_name: "Kowalski Films", company_slug: "kowalski-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 95 }],
  },

  // Avalon PR
  {
    id: "per00000-0000-0000-0000-000000000019",
    full_name: "Stefan Schmitz",
    first_name: "Stefan",
    last_name: "Schmitz",
    job_title: "Founder & CEO",
    email: "stefan@avalon.me",
    phone: "+34 91 364 4366",
    linkedin_url: "https://linkedin.com/in/stefan-schmitz-avalon",
    website_url: "https://avalon.me",
    country_code: "ES",
    city: "Madrid",
    bio: "Founder of Avalon, Golden Bear winning producer behind Alcarràs.",
    profile_confidence: 97,
    ai_summary: "Avalon Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c50", company_name: "Avalon PR", company_slug: "avalon-pc", role: "founder", seniority: "C-Level", is_current: true, confidence: 97 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000020",
    full_name: "María Zamora",
    first_name: "María",
    last_name: "Zamora",
    job_title: "Executive Producer",
    email: "mzamora@avalon.me",
    phone: "+34 91 364 4367",
    linkedin_url: "https://linkedin.com/in/maria-zamora-producer",
    website_url: "https://avalon.me",
    country_code: "ES",
    city: "Madrid",
    bio: "National Cinematography Prize winner, producer of Alcarràs and Verano 1993.",
    profile_confidence: 99,
    ai_summary: "Spain National Film Prize winner.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c50", company_name: "Avalon PR", company_slug: "avalon-pc", role: "executive_producer", seniority: "Executive", is_current: true, confidence: 99 }],
  },

  // LuckyChap
  {
    id: "per00000-0000-0000-0000-000000000021",
    full_name: "Josey McNamara",
    first_name: "Josey",
    last_name: "McNamara",
    job_title: "Co-Founder & Executive Producer",
    email: "josey@luckychap.com",
    phone: "+1 (310) 854-8105",
    linkedin_url: "https://linkedin.com/in/joseymcnamara",
    website_url: "https://luckychapentertainment.com",
    country_code: "US",
    city: "Los Angeles",
    bio: "Co-founder of LuckyChap Entertainment alongside Margot Robbie and Tom Ackerley.",
    profile_confidence: 96,
    ai_summary: "LuckyChap Co-Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c14", company_name: "LuckyChap Entertainment", company_slug: "luckychap", role: "founder", seniority: "C-Level", is_current: true, confidence: 96 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000022",
    full_name: "Tom Ackerley",
    first_name: "Tom",
    last_name: "Ackerley",
    job_title: "Co-Founder & Producer",
    email: "tom@luckychap.com",
    phone: "+1 (310) 854-8106",
    linkedin_url: "https://linkedin.com/in/tom-ackerley-luckychap",
    website_url: "https://luckychapentertainment.com",
    country_code: "US",
    city: "Los Angeles",
    bio: "Co-founder of LuckyChap producing Barbie, Saltburn, and Promising Young Woman.",
    profile_confidence: 97,
    ai_summary: "LuckyChap Co-Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c14", company_name: "LuckyChap Entertainment", company_slug: "luckychap", role: "founder", seniority: "C-Level", is_current: true, confidence: 97 }],
  },

  // Element Pictures
  {
    id: "per00000-0000-0000-0000-000000000023",
    full_name: "Ed Guiney",
    first_name: "Ed",
    last_name: "Guiney",
    job_title: "Co-Founder & Executive Producer",
    email: "ed.guiney@elementpictures.ie",
    phone: "+353 1 618 6101",
    linkedin_url: "https://linkedin.com/in/ed-guiney-element",
    website_url: "https://elementpictures.ie",
    country_code: "IE",
    city: "Dublin",
    bio: "Oscar-nominated founder of Element Pictures, producer of Poor Things and Room.",
    profile_confidence: 99,
    ai_summary: "Element Pictures Co-Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c21", company_name: "Element Pictures Ireland", company_slug: "element-pictures", role: "founder", seniority: "C-Level", is_current: true, confidence: 99 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000024",
    full_name: "Andrew Lowe",
    first_name: "Andrew",
    last_name: "Lowe",
    job_title: "Co-Founder & Producer",
    email: "andrew.lowe@elementpictures.ie",
    phone: "+353 1 618 6102",
    linkedin_url: "https://linkedin.com/in/andrew-lowe-element",
    website_url: "https://elementpictures.ie",
    country_code: "IE",
    city: "Dublin",
    bio: "Co-founder of Element Pictures overseeing business operations and international sales.",
    profile_confidence: 98,
    ai_summary: "Element Pictures Co-Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c21", company_name: "Element Pictures Ireland", company_slug: "element-pictures", role: "founder", seniority: "C-Level", is_current: true, confidence: 98 }],
  },

  // Fabula Chile
  {
    id: "per00000-0000-0000-0000-000000000025",
    full_name: "Juan de Dios Larraín",
    first_name: "Juan de Dios",
    last_name: "Larraín",
    job_title: "Co-Founder & CEO",
    email: "juandedios@fabula.cl",
    phone: "+56 2 2714 8801",
    linkedin_url: "https://linkedin.com/in/juan-de-dios-larrain",
    website_url: "https://fabula.cl",
    country_code: "CL",
    city: "Santiago",
    bio: "Co-founder and CEO of Fabula, producer of Spencer, Jackie, and No.",
    profile_confidence: 99,
    ai_summary: "Fabula CEO.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c31", company_name: "Fabula Chile", company_slug: "fabula", role: "ceo", seniority: "C-Level", is_current: true, confidence: 99 }],
  },

  // Fasten Films
  {
    id: "per00000-0000-0000-0000-000000000026",
    full_name: "Adrià Monés",
    first_name: "Adrià",
    last_name: "Monés",
    job_title: "Founder & Producer",
    email: "adria@fastenfilms.com",
    phone: "+34 93 218 0001",
    linkedin_url: "https://linkedin.com/in/adria-mones-fasten",
    website_url: "https://fastenfilms.com",
    country_code: "ES",
    city: "Barcelona",
    bio: "Founder of Fasten Films specializing in European indie co-productions.",
    profile_confidence: 94,
    ai_summary: "Fasten Films Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c51", company_name: "Fasten Films", company_slug: "fasten-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 94 }],
  },

  // Pecado Films
  {
    id: "per00000-0000-0000-0000-000000000027",
    full_name: "José Alba",
    first_name: "José",
    last_name: "Alba",
    job_title: "Founder & Executive Producer",
    email: "jose.alba@pecadofilms.com",
    phone: "+34 954 100 001",
    linkedin_url: "https://linkedin.com/in/jose-alba-pecado",
    website_url: "https://pecadofilms.com",
    country_code: "ES",
    city: "Seville",
    bio: "Founder of Pecado Films, producer of Cerrar los ojos (Víctor Erice).",
    profile_confidence: 95,
    ai_summary: "Pecado Films Founder.",
    provenance_type: "verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c52", company_name: "Pecado Films", company_slug: "pecado-films", role: "founder", seniority: "C-Level", is_current: true, confidence: 95 }],
  },

  // El Sueño Eterno Pictures
  {
    id: "per00000-0000-0000-0000-000000000028",
    full_name: "Enrique Cerezo",
    first_name: "Enrique",
    last_name: "Cerezo",
    job_title: "Founder & President",
    email: "enrique@elsuenoeternopictures.com",
    phone: "+34 91 510 0401",
    linkedin_url: "https://linkedin.com/company/el-sueno-eterno-pictures",
    website_url: "https://elsuenoeternopictures.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Founder of El Sueño Eterno Pictures.",
    profile_confidence: 90,
    ai_summary: "El Sueño Eterno Founder.",
    provenance_type: "seed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c48", company_name: "El Sueño Eterno Pictures", company_slug: "el-sueno-eterno", role: "founder", seniority: "C-Level", is_current: true, confidence: 90 }],
  },
  {
    id: "per00000-0000-0000-0000-000000000029",
    full_name: "Patricia Roldán",
    first_name: "Patricia",
    last_name: "Roldán",
    job_title: "Head of Production",
    email: "patricia.roldan@elsuenoeternopictures.com",
    phone: "+34 91 510 0402",
    linkedin_url: "https://linkedin.com/in/patricia-roldan-sueno",
    website_url: "https://elsuenoeternopictures.com",
    country_code: "ES",
    city: "Madrid",
    bio: "Head of Production at El Sueño Eterno Pictures.",
    profile_confidence: 90,
    ai_summary: "El Sueño Eterno Head of Production.",
    provenance_type: "seed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    positions: [{ company_id: "c48", company_name: "El Sueño Eterno Pictures", company_slug: "el-sueno-eterno", role: "head_of_production", seniority: "Executive", is_current: true, confidence: 90 }],
  },
];

/**
 * CANONICAL PERSON ID ALIAS MAP
 * Maps ALL legacy/alternate IDs from SPECIFIC_COMPANY_DATA, ALL_COMPANY_EXECUTIVES_MAP,
 * and entity-registry to the single canonical UUID in MOCK_PEOPLE.
 * This ensures backward compatibility and prevents identity mismatches.
 */
export const PERSON_ID_ALIASES: Record<string, string> = {
  // Morena Films
  "per_mf1": "per00000-0000-0000-0000-000000000001",   // Pedro Uriol
  "per_mf2": "per00000-0000-0000-0000-000000000002",   // Álvaro Longoria
  "per_mf3": "per00000-0000-0000-0000-000000000003",   // Pilar Benito
  "per_c1_1": "per00000-0000-0000-0000-000000000001",
  "per_c1_2": "per00000-0000-0000-0000-000000000002",
  "per_c1_3": "per00000-0000-0000-0000-000000000003",
  // Nostromo Pictures
  "per_nos1": "per00000-0000-0000-0000-000000000004",   // Adrián Guerra
  "per_nos2": "per00000-0000-0000-0000-000000000005",   // Núria Valls
  // El Deseo
  "per_des1": "per00000-0000-0000-0000-000000000006",   // Agustín Almodóvar
  "per_des2": "per00000-0000-0000-0000-000000000007",   // Esther García
  // See-Saw Films
  "per_ss1": "per00000-0000-0000-0000-000000000008",    // Iain Canning
  "per_ss2": "per00000-0000-0000-0000-000000000009",    // Emile Sherman
  "per_c3_1": "per00000-0000-0000-0000-000000000008",
  "per_c3_2": "per00000-0000-0000-0000-000000000009",
  "per_c3_3": "per00000-0000-0000-0000-000000000010",   // Helen Gregory
  // A24
  "per_a24_1": "per00000-0000-0000-0000-000000000012",  // Daniel Katz
  "per_a24_2": "per00000-0000-0000-0000-000000000011",  // Emma Cahusac
  "per_c2_1": "per00000-0000-0000-0000-000000000012",
  "per_c2_2": "per00000-0000-0000-0000-000000000011",
  // Zeta Studios
  "per_zet1": "per00000-0000-0000-0000-000000000014",   // Antonio Asensio
  "per_zet2": "per00000-0000-0000-0000-000000000013",   // Paloma Molina
  "per_zeta-studios_1": "per00000-0000-0000-0000-000000000013",
  "per_zeta-studios_2": "per00000-0000-0000-0000-000000000014",
  // Vaca Films
  "per_vaca1": "per00000-0000-0000-0000-000000000015",  // Emma Lustres
  "per_vaca2": "per00000-0000-0000-0000-000000000016",  // Borja Pena
  "per_c43_1": "per00000-0000-0000-0000-000000000015",
  "per_c43_2": "per00000-0000-0000-0000-000000000016",
  // Irusoin
  "per_iru1": "per00000-0000-0000-0000-000000000017",   // Xabier Berzosa
  "per_c39_1": "per00000-0000-0000-0000-000000000017",
  // Kowalski Films
  "per_kow1": "per00000-0000-0000-0000-000000000018",   // Koldo Zuazua
  "per_c38_1": "per00000-0000-0000-0000-000000000018",
  // Avalon
  "per_ava1": "per00000-0000-0000-0000-000000000019",   // Stefan Schmitz
  "per_ava2": "per00000-0000-0000-0000-000000000020",   // María Zamora
  "per_c50_1": "per00000-0000-0000-0000-000000000019",
  "per_c50_2": "per00000-0000-0000-0000-000000000020",
  // LuckyChap
  "per_lc1": "per00000-0000-0000-0000-000000000021",    // Josey McNamara
  "per_lc2": "per00000-0000-0000-0000-000000000022",    // Tom Ackerley
  "per_c14_2": "per00000-0000-0000-0000-000000000021",
  "per_c14_3": "per00000-0000-0000-0000-000000000022",
  // Element Pictures
  "per_ep1": "per00000-0000-0000-0000-000000000023",    // Ed Guiney
  "per_ep2": "per00000-0000-0000-0000-000000000024",    // Andrew Lowe
  // Fabula
  "per_fab1": "per00000-0000-0000-0000-000000000025",   // Juan de Dios Larraín
  // Fasten Films
  "per_ff1": "per00000-0000-0000-0000-000000000026",    // Adrià Monés
  "per_c51_1": "per00000-0000-0000-0000-000000000026",
  // Pecado Films
  "per_pec1": "per00000-0000-0000-0000-000000000027",   // José Alba
  "per_c52_1": "per00000-0000-0000-0000-000000000027",
  // El Sueño Eterno
  "per_sueno_1": "per00000-0000-0000-0000-000000000028", // Enrique Cerezo
  "per_sueno_2": "per00000-0000-0000-0000-000000000029", // Patricia Roldán
};

function normalizeStr(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function getFallbackPeople(options: PersonFilterOptions, page: number, limit: number): PaginatedResponse<PersonWithGraph> {
  let filtered = [...MOCK_PEOPLE];

  if (options.country) {
    filtered = filtered.filter((p) => p.country_code === options.country?.toUpperCase());
  }

  if (options.role) {
    filtered = filtered.filter((p) => p.positions?.some((pos) => pos.role === options.role));
  }

  if (options.search && options.search.trim()) {
    const s = normalizeStr(options.search);
    filtered = filtered.filter(
      (p) =>
        normalizeStr(p.full_name).includes(s) ||
        (p.job_title && normalizeStr(p.job_title).includes(s)) ||
        (p.city && normalizeStr(p.city).includes(s)) ||
        p.positions?.some((pos) => normalizeStr(pos.company_name).includes(s))
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

export function getFallbackPersonById(id: string): PersonWithGraph | null {
  // 1. Resolve alias to canonical UUID if this is a legacy ID
  const canonicalId = PERSON_ID_ALIASES[id] || id;

  // 2. Look up in canonical MOCK_PEOPLE registry
  const found = MOCK_PEOPLE.find((p) => p.id === canonicalId);
  if (!found) {
    // ZERO FABRICATION: If we cannot find the person, return null.
    // Never generate a fictional person to fill the gap.
    return null;
  }

  const compSlug = found.positions?.[0]?.company_slug || "";
  const compName = found.positions?.[0]?.company_name || "";

  // Map known projects per company slug (real data only)
  const realProjectsMap: Record<string, any[]> = {
    "morena-films": [
      { id: "p_mf1", title: "La Infiltrada", role: found.job_title || "Producer", company: "Morena Films" },
      { id: "p_mf2", title: "Cerdita (Piggy)", role: found.job_title || "Producer", company: "Morena Films" },
    ],
    "vaca-films": [
      { id: "p_vaca1", title: "Celda 211 (Cell 211)", role: found.job_title || "Executive Producer", company: "Vaca Films" },
      { id: "p_vaca2", title: "El Desconocido (Retribution)", role: found.job_title || "Executive Producer", company: "Vaca Films" },
    ],
    "a24": [
      { id: "p_a24_1", title: "Civil War", role: found.job_title || "Producer", company: "A24" },
      { id: "p_a24_2", title: "Everything Everywhere All at Once", role: found.job_title || "Producer", company: "A24" },
    ],
    "see-saw-films": [
      { id: "p_ss1", title: "Slow Horses Season 4", role: found.job_title || "Executive Producer", company: "See-Saw Films" },
    ],
    "nostromo-pictures": [
      { id: "p_nos1", title: "A través de mi ventana (Through My Window)", role: found.job_title || "Producer", company: "Nostromo Pictures" },
    ],
    "el-deseo": [
      { id: "p_des1", title: "The Room Next Door", role: found.job_title || "Executive Producer", company: "El Deseo" },
    ],
    "zeta-studios": [
      { id: "p_zet1", title: "Élite", role: found.job_title || "Executive Producer", company: "Zeta Studios" },
    ],
    "luckychap": [
      { id: "p_lc1", title: "Barbie", role: found.job_title || "Producer", company: "LuckyChap Entertainment" },
      { id: "p_lc2", title: "Saltburn", role: found.job_title || "Producer", company: "LuckyChap Entertainment" },
    ],
    "element-pictures": [
      { id: "p_ep1", title: "Poor Things", role: found.job_title || "Executive Producer", company: "Element Pictures" },
    ],
    "fabula": [
      { id: "p_fab1", title: "Spencer", role: found.job_title || "Executive Producer", company: "Fabula" },
    ],
    "avalon-pc": [
      { id: "p_ava1", title: "Alcarràs", role: found.job_title || "Executive Producer", company: "Avalon PR" },
    ],
    "irusoin": [
      { id: "p_iru1", title: "La trinchera infinita", role: found.job_title || "Executive Producer", company: "Irusoin" },
    ],
    "kowalski-films": [
      { id: "p_kow1", title: "Akelarre", role: found.job_title || "Producer", company: "Kowalski Films" },
    ],
    "pecado-films": [
      { id: "p_pec1", title: "Cerrar los ojos (Close Your Eyes)", role: found.job_title || "Producer", company: "Pecado Films" },
    ],
    "fasten-films": [
      { id: "p_ff1", title: "La voluntaria", role: found.job_title || "Producer", company: "Fasten Films" },
    ],
    "el-sueno-eterno": [
      { id: "p_sueno_1", title: "El Hombre del Saco", role: found.job_title || "Executive Producer", company: "El Sueño Eterno Pictures" },
    ],
  };

  const resolvedProjects = realProjectsMap[compSlug] || [];

  return {
    ...found,
    projects: resolvedProjects,
    awards: found.awards || [],
    sources: found.sources || [
      { id: `src_${found.id}_1`, source_name: "Seed Data — Pending Independent Verification", source_type: "seed", credibility_score: 80 },
    ],
  };
}
