import type { ExternalCompanyResult } from "../free-company-research";

const SOURCE_URL = "https://cdn.film.ca.gov/film-and-television-tax-credit-program-approved-projects-list/";

function cleanCell(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchCaliforniaApprovedProductions(query: string): Promise<ExternalCompanyResult[]> {
  const response = await fetch(SOURCE_URL, {
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
    headers: { "User-Agent": "MisterioColorLab-ProductionIntelligence/1.0" },
  });
  if (!response.ok) throw new Error(`California Film Commission returned HTTP ${response.status}.`);
  const html = await response.text();
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return rows.flatMap((row, index) => {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cleanCell(cell[1]));
    if (cells.length < 12) return [];
    const [fiscalYear, projectTitle, companyName, productionType, independence, , , , , qualifiedExpenditure, creditAllocation, signalDate] = cells;
    if (!companyName || !projectTitle) return [];
    const searchable = `${companyName} ${projectTitle} ${productionType}`.toLocaleLowerCase();
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return [];

    return [{
      externalId: `cfc-${index}-${companyName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: companyName,
      countryCode: "US",
      countryName: "California, United States",
      officialWebsiteUrl: null,
      source: "CALIFORNIA_FILM_COMMISSION" as const,
      sourceUrl: SOURCE_URL,
      evidence: `${projectTitle} · ${productionType}${independence ? ` · ${independence}` : ""}`,
      decisionMakers: [],
      productionSignal: {
        projectTitle,
        productionType: productionType || null,
        signalDate: signalDate || null,
        fiscalYear: fiscalYear || null,
        qualifiedExpenditure: qualifiedExpenditure || null,
        creditAllocation: creditAllocation || null,
        market: "California",
      },
    }];
  }).filter((result) => {
    if (normalizedQuery) return true;
    return /2025-2026|2026-2027/.test(result.productionSignal.fiscalYear || "");
  }).slice(0, 24);
}
