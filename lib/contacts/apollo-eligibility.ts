export interface ApolloCompanyCandidate {
  website_url: string | null;
  description?: string | null;
  company_type?: string | null;
  data_classification?: string | null;
  provenance_type?: string | null;
  company_categories?: Array<{ category?: string | null }> | null;
}

export interface ApolloPersonCandidate {
  id: string;
  full_name: string;
  job_title?: string | null;
  role?: string | null;
  seniority?: string | null;
}

const EXCLUDED_COMPANY_TERMS = [
  "postproduction", "post production", "post-production", "vfx", "visual effects",
  "color grading", "sound studio", "advertising agency", "equipment rental", "software",
];

const PRODUCTION_COMPANY_TERMS = [
  "production company", "film production", "motion picture", "television production",
  "tv production", "film", "television", "cinema", "documentary", "scripted", "unscripted",
];

const DECISION_MAKER_TERMS = [
  "head of production", "executive producer", "post production producer",
  "post-production producer", "post production supervisor", "post-production supervisor",
  "production manager", "line producer", "director of production", "head of content",
  "production executive", "head producer", "producer", "managing director",
  "founder producer", "founder & producer", "founder / producer",
];

const SENIORITY_TERMS = ["owner", "founder", "c-suite", "executive", "director", "head", "vp"];

function normalize(value: unknown): string {
  return String(value || "").toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function hasUsableOfficialWebsite(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

export function isApolloDecisionMaker(person: ApolloPersonCandidate): boolean {
  const position = normalize(`${person.role || ""} ${person.job_title || ""}`);
  return containsAny(position, DECISION_MAKER_TERMS);
}

export function rankApolloDecisionMakers(people: ApolloPersonCandidate[]): ApolloPersonCandidate[] {
  return people
    .filter(isApolloDecisionMaker)
    .sort((a, b) => {
      const aSenior = containsAny(normalize(a.seniority), SENIORITY_TERMS) ? 1 : 0;
      const bSenior = containsAny(normalize(b.seniority), SENIORITY_TERMS) ? 1 : 0;
      return bSenior - aSenior;
    });
}

export function evaluateApolloEligibility(
  company: ApolloCompanyCandidate,
  people: ApolloPersonCandidate[]
): { eligible: boolean; reason: string; people: ApolloPersonCandidate[] } {
  if (!hasUsableOfficialWebsite(company.website_url)) {
    return { eligible: false, reason: "Falta una web oficial válida para confirmar el dominio.", people: [] };
  }

  const classification = normalize(`${company.data_classification || ""} ${company.provenance_type || ""}`);
  if (containsAny(classification, ["unverified", "inferred", "generated", "demo"])) {
    return { eligible: false, reason: "La empresa todavía no está verificada como entidad real.", people: [] };
  }

  const companyType = normalize(company.company_type);
  const categories = normalize((company.company_categories || []).map((item) => item.category).join(" "));
  const companyIdentity = normalize(`${companyType} ${categories} ${company.description || ""}`);
  // A production company can also offer post-production. Only block it when the
  // primary company type is a supplier, or when no production identity exists.
  if (containsAny(companyType, EXCLUDED_COMPANY_TERMS)) {
    return { eligible: false, reason: "Apollo está bloqueado para estudios de postproducción y otros proveedores.", people: [] };
  }
  if (!containsAny(companyIdentity, PRODUCTION_COMPANY_TERMS)) {
    if (containsAny(companyIdentity, EXCLUDED_COMPANY_TERMS)) {
      return { eligible: false, reason: "Apollo está bloqueado para estudios de postproducción y otros proveedores.", people: [] };
    }
    return { eligible: false, reason: "La empresa no está clasificada como productora de cine o televisión.", people: [] };
  }

  const decisionMakers = rankApolloDecisionMakers(people).slice(0, 3);

  return {
    eligible: true,
    reason: decisionMakers.length
      ? `${decisionMakers.length} decisor(es) conocidos; Apollo puede buscar más por dominio.`
      : "Dominio y clasificación válidos; Apollo puede buscar decisores sin consumir créditos.",
    people: decisionMakers,
  };
}
