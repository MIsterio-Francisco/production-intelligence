export interface OfficialDecisionMaker {
  name: string;
  role: string;
  sourceUrl: string;
}

const TARGET_ROLE = /(head of production|director of production|production director|jef[ea] de producci[oó]n|director[ae]? de producci[oó]n|executive producer|productor[ae]? ejecutiv[oa])/i;

function collectJsonPeople(value: unknown, sourceUrl: string, output: OfficialDecisionMaker[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonPeople(item, sourceUrl, output));
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const type = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const role = typeof record.jobTitle === "string" ? record.jobTitle.trim() : "";
  if (type.includes("Person") && name && TARGET_ROLE.test(role)) output.push({ name, role, sourceUrl });
  Object.values(record).forEach((item) => collectJsonPeople(item, sourceUrl, output));
}

function extractFromHtml(html: string, sourceUrl: string): OfficialDecisionMaker[] {
  const output: OfficialDecisionMaker[] = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      collectJsonPeople(JSON.parse(match[1]), sourceUrl, output);
    } catch {
      // Invalid structured data is ignored; visible text may still provide evidence.
    }
  }

  const lines = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;|&amp;/gi, " ")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && line.length <= 100);
  for (let index = 0; index < lines.length; index += 1) {
    if (!TARGET_ROLE.test(lines[index])) continue;
    const role = lines[index].match(TARGET_ROLE)?.[0] || lines[index];
    const neighbours = [lines[index - 1], lines[index + 1]].filter(Boolean);
    const name = neighbours.find((item) =>
      /^(?:[A-ZÁÉÍÓÚÑÀÈÌÒÙÂÊÎÔÛÄËÏÖÜ][\p{L}'’-]+\s+){1,4}[A-ZÁÉÍÓÚÑÀÈÌÒÙÂÊÎÔÛÄËÏÖÜ][\p{L}'’-]+$/u.test(item)
    );
    if (name) output.push({ name, role, sourceUrl });
  }
  return output;
}

export async function discoverOfficialDecisionMakers(websiteUrl: string): Promise<OfficialDecisionMaker[]> {
  const base = new URL(websiteUrl);
  const response = await fetch(base, { redirect: "follow", signal: AbortSignal.timeout(6_000), cache: "no-store" });
  if (!response.ok) return [];
  const html = await response.text();
  const pages = new Set<string>([response.url]);
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    if (!/(team|equipo|about|nosotros|company|people)/i.test(match[1])) continue;
    try {
      const url = new URL(match[1], response.url);
      if (url.origin === new URL(response.url).origin) pages.add(url.toString());
    } catch {
      // Invalid links are ignored.
    }
    if (pages.size >= 3) break;
  }

  const found: OfficialDecisionMaker[] = extractFromHtml(html, response.url);
  for (const url of [...pages].slice(1)) {
    try {
      const page = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(6_000), cache: "no-store" });
      if (page.ok && new URL(page.url).origin === new URL(response.url).origin) {
        found.push(...extractFromHtml(await page.text(), page.url));
      }
    } catch {
      // A secondary page must not invalidate evidence already found.
    }
  }
  const unique = new Map(found.map((person) => [`${person.name.toLowerCase()}:${person.role.toLowerCase()}`, person]));
  return [...unique.values()].slice(0, 5);
}
