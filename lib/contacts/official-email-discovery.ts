import { isValidEmailSyntax, normalizeEmail } from "./email-policy";

export interface PublishedEmailEvidence {
  email: string;
  sourceUrl: string;
  discoveredAt: string;
}

function sameOriginUrl(base: URL, href: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.origin !== base.origin || !["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractEmails(html: string, sourceUrl: string): PublishedEmailEvidence[] {
  const matches = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return [...new Set(matches.map(normalizeEmail))]
    .filter(isValidEmailSyntax)
    .map((email) => ({ email, sourceUrl, discoveredAt: new Date().toISOString() }));
}

export async function discoverOfficialPublishedEmails(websiteUrl: string): Promise<PublishedEmailEvidence[]> {
  const base = new URL(websiteUrl);
  const pages = new Set<string>([base.toString()]);
  const evidence = new Map<string, PublishedEmailEvidence>();

  const home = await fetch(base, { signal: AbortSignal.timeout(6000), redirect: "follow" });
  if (!home.ok) return [];
  const homeHtml = await home.text();

  for (const item of extractEmails(homeHtml, home.url)) evidence.set(item.email, item);

  for (const match of homeHtml.matchAll(/href=["']([^"']+)["']/gi)) {
    if (!/(contact|contacto|about|team|equipo|legal|impressum)/i.test(match[1])) continue;
    const url = sameOriginUrl(base, match[1]);
    if (url) pages.add(url);
    if (pages.size >= 4) break;
  }

  for (const url of [...pages].slice(1)) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: "follow" });
      if (!response.ok || new URL(response.url).origin !== base.origin) continue;
      for (const item of extractEmails(await response.text(), response.url)) evidence.set(item.email, item);
    } catch {
      // A failed secondary page must not invalidate evidence from the official homepage.
    }
  }

  return [...evidence.values()];
}
