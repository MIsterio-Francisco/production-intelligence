export interface ExternalCompanyResult {
  externalId: string;
  name: string;
  countryCode: string | null;
  countryName: string | null;
  officialWebsiteUrl: string | null;
  source: "WIKIDATA" | "TMDB";
  sourceUrl: string;
  evidence: string;
  decisionMakers: Array<{ name: string; role: string; sourceUrl: string }>;
}

async function searchWikidata(query: string, countryCode?: string): Promise<ExternalCompanyResult[]> {
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

async function searchTmdb(query: string, countryCode?: string): Promise<ExternalCompanyResult[]> {
  const token = process.env.TMDB_API_READ_TOKEN;
  if (!token) return [];
  const headers = { Authorization: `Bearer ${token}`, accept: "application/json" };
  let results: any[] = [];
  if (query.trim()) {
    const searchUrl = new URL("https://api.themoviedb.org/3/search/company");
    searchUrl.searchParams.set("query", query.trim());
    const response = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (!response.ok) throw new Error(`TMDb returned HTTP ${response.status}.`);
    results = (await response.json()).results || [];
  } else if (countryCode) {
    const discoveredTitles: Array<{ id: number; media: "movie" | "tv" }> = [];
    for (const media of ["movie", "tv"] as const) {
      const url = new URL(`https://api.themoviedb.org/3/discover/${media}`);
      url.searchParams.set("with_origin_country", countryCode.toUpperCase());
      url.searchParams.set("sort_by", "popularity.desc");
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
      if (response.ok) discoveredTitles.push(...((await response.json()).results || []).slice(0, 8).map((item: any) => ({ id: item.id, media })));
    }
    const details = await Promise.all(discoveredTitles.map(async (title) => {
      const response = await fetch(`https://api.themoviedb.org/3/${title.media}/${title.id}`, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
      return response.ok ? (await response.json()).production_companies || [] : [];
    }));
    results = details.flat();
  }
  const uniqueResults = [...new Map(results.map((company: any) => [company.id, company])).values()].slice(0, 20);

  return Promise.all(uniqueResults.map(async (company: any) => {
    const detailUrl = `https://api.themoviedb.org/3/company/${company.id}`;
    const detailResponse = await fetch(detailUrl, {
      headers,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const detail = detailResponse.ok ? await detailResponse.json() : company;
    return {
      externalId: String(company.id),
      name: detail.name || company.name,
      countryCode: detail.origin_country || company.origin_country || null,
      countryName: detail.headquarters || null,
      officialWebsiteUrl: detail.homepage || null,
      source: "TMDB" as const,
      sourceUrl: `https://www.themoviedb.org/company/${company.id}`,
      evidence: "Empresa incluida en la base audiovisual de TMDb.",
      decisionMakers: [],
    };
  }));
}

export async function researchExternalCompanies(query: string, countryCode?: string) {
  if (!query.trim() && !countryCode?.trim()) throw new Error("Introduce un nombre, concepto o país.");
  const settled = await Promise.allSettled([
    searchWikidata(query, countryCode),
    searchTmdb(query, countryCode),
  ]);
  const results = settled.flatMap((item) => item.status === "fulfilled" ? item.value : []);
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = (item.officialWebsiteUrl || item.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 40);
}
import { discoverOfficialDecisionMakers } from "./official-decision-maker-discovery";
