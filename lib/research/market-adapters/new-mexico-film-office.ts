import type { ExternalCompanyResult } from "../free-company-research";

const INDEX_URL = "https://nmfilm.com/news/wrapped";
const ORIGIN = "https://nmfilm.com";

function cleanHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

async function readReport(path: string): Promise<ExternalCompanyResult | null> {
  const sourceUrl = new URL(path, ORIGIN).toString();
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
    headers: { "User-Agent": "MisterioColorLab-ProductionIntelligence/1.0" },
  });
  if (!response.ok) return null;
  const html = await response.text();
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const companyMatch = html.match(/<strong>\s*Production Company\s*<\/strong>\s*<br\s*\/?>([\s\S]*?)<\/p>/i);
  const projectTitle = cleanHtml(titleMatch?.[1] || "").replace(/\s+Completed Project Report$/i, "");
  const companyName = cleanHtml(companyMatch?.[1] || "");
  if (!projectTitle || !companyName) return null;

  return {
    externalId: `nmfo-${path.split("/").filter(Boolean).pop()}`,
    name: companyName,
    countryCode: "US",
    countryName: "New Mexico, United States",
    officialWebsiteUrl: null,
    source: "NEW_MEXICO_FILM_OFFICE",
    sourceUrl,
    evidence: `${projectTitle} notificó la finalización de fotografía principal.`,
    decisionMakers: [],
    productionSignal: {
      projectTitle,
      productionType: "Completed principal photography",
      signalDate: null,
      fiscalYear: null,
      qualifiedExpenditure: null,
      creditAllocation: null,
      market: "New Mexico",
    },
  };
}

export async function searchNewMexicoCompletedProductions(query: string): Promise<ExternalCompanyResult[]> {
  const response = await fetch(INDEX_URL, {
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
    headers: { "User-Agent": "MisterioColorLab-ProductionIntelligence/1.0" },
  });
  if (!response.ok) throw new Error(`New Mexico Film Office returned HTTP ${response.status}.`);
  const html = await response.text();
  const paths = [...new Set([...html.matchAll(/href=["'](\/news\/wrapped\/report\/[^"'#?]+)["']/gi)].map((match) => match[1]))]
    .slice(0, 24);
  const reports = (await Promise.all(paths.map(readReport))).filter((item): item is ExternalCompanyResult => Boolean(item));
  const needle = query.trim().toLocaleLowerCase();
  return reports.filter((item) => !needle || `${item.name} ${item.productionSignal?.projectTitle}`.toLocaleLowerCase().includes(needle)).slice(0, 16);
}

