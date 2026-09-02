import { discoverOfficialDecisionMakers } from "./official-decision-maker-discovery";
import { searchCaliforniaApprovedProductions } from "./market-adapters/california-film-commission";
import { searchNewMexicoCompletedProductions } from "./market-adapters/new-mexico-film-office";
import type { ProductionSignal } from "./market-adapters/types";

export interface ExternalCompanyResult {
  externalId: string;
  name: string;
  countryCode: string | null;
  countryName: string | null;
  officialWebsiteUrl: string | null;
  source: "TAVILY" | "WIKIDATA" | "CALIFORNIA_FILM_COMMISSION" | "NEW_MEXICO_FILM_OFFICE";
  sourceUrl: string;
  evidence: string;
  decisionMakers: Array<{ name: string; role: string; sourceUrl: string }>;
  productionSignal?: ProductionSignal;
}

const TAVILY_EXCLUDED_DOMAINS = [
  "wikipedia.org", "imdb.com", "linkedin.com", "facebook.com", "instagram.com",
  "youtube.com", "x.com", "twitter.com", "vimeo.com", "crunchbase.com",
  "productionhub.com", "mandy.com", "clutch.co", "sortlist.com",
];

const TAVILY_COUNTRIES: Record<string, string> = {
  AR: "argentina", AU: "australia", BE: "belgium", BR: "brazil", CA: "canada",
  CL: "chile", CO: "colombia", DE: "germany", DK: "denmark", ES: "spain",
  FI: "finland", FR: "france", GB: "united kingdom", IE: "ireland", IT: "italy",
  MX: "mexico", NL: "netherlands", NO: "norway", NZ: "new zealand", PL: "poland",
  PT: "portugal", SE: "sweden", US: "united states",
};

function companyNameFromTitle(title: string, url: URL) {
  const cleanTitle = title.split(/\s+[|–—-]\s+/)[0]?.trim();
  if (cleanTitle && cleanTitle.length >= 2 && cleanTitle.length <= 90) return cleanTitle;
  return url.hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function searchTavilyCompanies(query: string, countryCode?: string): Promise<ExternalCompanyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return [];
  const normalizedCountry = countryCode?.trim().toUpperCase().slice(0, 2);
  const market = normalizedCountry ? TAVILY_COUNTRIES[normalizedCountry] || normalizedCountry : "global";
  const userIntent = query.trim() || "film television TV commercial production companies producers";
  const companyIntent = "film production company OR television production company OR commercial film production OR TVC production house";
  const roleIntent = "Head of Production OR Production Director OR Executive Producer OR Managing Director OR Line Producer OR Jefe de Producción OR Productor Ejecutivo";
  const searchQuery = `${userIntent} ${market} official website (${companyIntent}) team (${roleIntent}) -post-production -equipment -rental -software`;
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: searchQuery,
      topic: "general",
      search_depth: "basic",
      max_results: 15,
      include_answer: false,
      include_raw_content: false,
      exclude_domains: TAVILY_EXCLUDED_DOMAINS,
      ...(TAVILY_COUNTRIES[normalizedCountry || ""] ? { country: TAVILY_COUNTRIES[normalizedCountry || ""] } : {}),
    }),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Tavily returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : "."}`);
  }
  const payload = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string; score?: number }> };
  return (payload.results || []).flatMap((row, index) => {
    if (!row.url) return [];
    let url: URL;
    try { url = new URL(row.url); } catch { return []; }
    if (!/^https?:$/.test(url.protocol)) return [];
    const evidence = `${row.title || ""} ${row.content || ""}`;
    const productionRelevant = /(film|cine|cinema|television|\btv\b|tvc|commercial production|production house|audiovisual|productora|production company|producciones|producers?)/i.test(evidence);
    const providerLed = /(post.?production|color grading|camera rental|equipment rental|software|marketing agency|animation service|vfx studio)/i.test(evidence) &&
      !/(film production company|television production company|commercial production|production house|productora cinematogr|productora audiovisual)/i.test(evidence);
    if (!productionRelevant || providerLed) return [];
    const officialWebsiteUrl = `${url.origin}/`;
    return [{
      externalId: `tavily:${url.hostname}:${index}`,
      name: companyNameFromTitle(row.title || "", url),
      countryCode: normalizedCountry || null,
      countryName: TAVILY_COUNTRIES[normalizedCountry || ""] || null,
      officialWebsiteUrl,
      source: "TAVILY" as const,
      sourceUrl: row.url,
      evidence: (row.content || "Resultado web relacionado con producción de cine o televisión.").slice(0, 300),
      decisionMakers: [],
    }];
  });
}

export async function searchWikidataCompanies(query: string, countryCode?: string): Promise<ExternalCompanyResult[]> {
  if (!query.trim()) return [];
  const safeCountry = countryCode?.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  const searches = await Promise.all(["es", "en"].map(async (language) => {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", query.trim());
    url.searchParams.set("language", language);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "15");
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000), cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()).search || [];
  }));
  const searchRows = searches.flat();
  const ids = [...new Set(searchRows.map((row: any) => row.id))].slice(0, 20);
  if (!ids.length) return [];

  const entityUrl = new URL("https://www.wikidata.org/w/api.php");
  entityUrl.searchParams.set("action", "wbgetentities");
  entityUrl.searchParams.set("ids", ids.join("|"));
  entityUrl.searchParams.set("props", "claims|labels|descriptions");
  entityUrl.searchParams.set("languages", "es|en");
  entityUrl.searchParams.set("format", "json");
  const entityResponse = await fetch(entityUrl, { signal: AbortSignal.timeout(8_000), cache: "no-store" });
  if (!entityResponse.ok) throw new Error(`Wikidata returned HTTP ${entityResponse.status}.`);
  const entities = (await entityResponse.json()).entities || {};
  const leaderIds = [...new Set(Object.values(entities).flatMap((entity: any) =>
    [...(entity.claims?.P169 || []), ...(entity.claims?.P112 || [])]
      .map((claim: any) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean)
  ))];
  let leaderEntities: Record<string, any> = {};
  if (leaderIds.length) {
    const leadersUrl = new URL("https://www.wikidata.org/w/api.php");
    leadersUrl.searchParams.set("action", "wbgetentities");
    leadersUrl.searchParams.set("ids", leaderIds.slice(0, 30).join("|"));
    leadersUrl.searchParams.set("props", "labels");
    leadersUrl.searchParams.set("languages", "es|en");
    leadersUrl.searchParams.set("format", "json");
    const leadersResponse = await fetch(leadersUrl, { signal: AbortSignal.timeout(8_000), cache: "no-store" });
    if (leadersResponse.ok) leaderEntities = (await leadersResponse.json()).entities || {};
  }

  const productionIds = new Set(["Q1762059", "Q10689397", "Q375336"]);
  const baseResults = Object.values(entities).flatMap((entity: any) => {
    const description = entity.descriptions?.es?.value || entity.descriptions?.en?.value || "";
    const instanceIds = (entity.claims?.P31 || []).map((claim: any) => claim.mainsnak?.datavalue?.value?.id);
    const eligible = instanceIds.some((id: string) => productionIds.has(id)) ||
      /(film|television|tv|cinematogr|productora|production company|film studio)/i.test(description);
    if (!eligible) return [];
    const website = entity.claims?.P856?.[0]?.mainsnak?.datavalue?.value || null;
    const decisionMakers = [
      ...(entity.claims?.P169 || []).map((claim: any) => ({ claim, role: "Executive leadership" })),
      ...(entity.claims?.P112 || []).map((claim: any) => ({ claim, role: "Founder / Producer" })),
    ].flatMap(({ claim, role }: any) => {
      const id = claim.mainsnak?.datavalue?.value?.id;
      const person = id ? leaderEntities[id] : null;
      const name = person?.labels?.es?.value || person?.labels?.en?.value;
      return id && name ? [{ name, role, sourceUrl: `https://www.wikidata.org/wiki/${id}` }] : [];
    });
    return [{
      externalId: entity.id,
      name: entity.labels?.es?.value || entity.labels?.en?.value || entity.id,
      countryCode: safeCountry || null,
      countryName: null,
      officialWebsiteUrl: website,
      source: "WIKIDATA" as const,
      sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
      evidence: description || "Entidad audiovisual identificada en Wikidata.",
      decisionMakers,
    }];
  });
  return Promise.all(baseResults.map(async (result) => {
    if (!result.officialWebsiteUrl) return result;
    try {
      const officialPeople = await discoverOfficialDecisionMakers(result.officialWebsiteUrl);
      const seen = new Set(officialPeople.map((person) => person.name.toLowerCase()));
      return { ...result, decisionMakers: [...officialPeople, ...result.decisionMakers.filter((person) => !seen.has(person.name.toLowerCase()))].slice(0, 6) };
    } catch {
      return result;
    }
  }));
}

export async function researchExternalCompanies(query: string, countryCode?: string) {
  if (!query.trim() && !countryCode?.trim()) throw new Error("Introduce un nombre, concepto o país.");
  const marketAlias = query.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const querySelectsUnitedStates = ["us", "usa", "united states", "estados unidos", "eeuu", "ee. uu."].includes(marketAlias);
  const effectiveQuery = querySelectsUnitedStates ? "" : query;
  const normalizedCountry = querySelectsUnitedStates ? "US" : countryCode?.trim().toUpperCase();
  const tasks: Array<Promise<ExternalCompanyResult[]>> = [];
  tasks.push(searchTavilyCompanies(effectiveQuery, normalizedCountry));
  if (effectiveQuery.trim()) tasks.push(searchWikidataCompanies(effectiveQuery, normalizedCountry));
  if (normalizedCountry === "US") {
    tasks.push(searchCaliforniaApprovedProductions(effectiveQuery));
    tasks.push(searchNewMexicoCompletedProductions(effectiveQuery));
  }
  const settled = await Promise.allSettled(tasks);
  const rawResults = settled.flatMap((item) => item.status === "fulfilled" ? item.value : []);
  const canonicalName = (name: string) => name.toLocaleLowerCase()
    .replace(/\b(incorporated|corporation|company|productions?|pictures|studios?|inc|llc|ltd)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  const wikidataResults = rawResults.filter((item) => item.source === "WIKIDATA");
  const matchedWikidata = new Set<string>();
  const results = rawResults.map((item) => {
    if (item.source !== "CALIFORNIA_FILM_COMMISSION") return item;
    const signalName = canonicalName(item.name);
    const identity = wikidataResults.find((candidate) => {
      const candidateName = canonicalName(candidate.name);
      return candidateName === signalName || (signalName.length >= 5 && (candidateName.startsWith(signalName) || signalName.startsWith(candidateName)));
    });
    if (!identity) return item;
    matchedWikidata.add(identity.externalId);
    return {
      ...item,
      officialWebsiteUrl: identity.officialWebsiteUrl,
      decisionMakers: identity.decisionMakers,
    };
  }).filter((item) => item.source !== "WIKIDATA" || !matchedWikidata.has(item.externalId));
  const seen = new Set<string>();
  return results.filter((item) => {
    let domainKey = "";
    if (item.officialWebsiteUrl) {
      try { domainKey = new URL(item.officialWebsiteUrl).hostname.toLowerCase().replace(/^www\./, ""); } catch { /* use name */ }
    }
    const identityKeys = [domainKey && `domain:${domainKey}`, `name:${canonicalName(item.name)}`].filter(Boolean);
    if (identityKeys.some((key) => seen.has(key))) return false;
    identityKeys.forEach((key) => seen.add(key));
    return true;
  }).slice(0, 40);
}
