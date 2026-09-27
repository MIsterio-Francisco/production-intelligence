import { readPublicHtml } from "./public-web";
import { extractFromHtml } from "./official-decision-maker-discovery";
import { isValidEmailSyntax, normalizeEmail } from "../contacts/email-policy";

export interface WebsiteResearch {
  status: "REVIEW_REQUIRED" | "FAILED";
  checkedAt: string;
  pages: string[];
  emails: Array<{ email: string; sourceUrl: string }>;
  people: Array<{ name: string; role: string; sourceUrl: string }>;
  warning: string;
}

export function publishedEmails(html: string): string[] {
  const visible = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/&#64;|&#x40;|&commat;/gi, "@").replace(/&#46;|&#x2e;/gi, ".");
  return [...new Set((visible.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(normalizeEmail))]
    .filter(isValidEmailSyntax).filter((email) => !/\.(png|jpg|jpeg|svg|webp)$/i.test(email));
}

export async function researchWebsite(url: string): Promise<WebsiteResearch> {
  const result: WebsiteResearch = { status: "FAILED", checkedAt: new Date().toISOString(), pages: [], emails: [], people: [], warning: "No se pudo leer la web. No significa que carezca de contactos." };
  const signal = AbortSignal.timeout(7000);
  try {
    const home = await readPublicHtml(url, signal);
    const links = new Set<string>();
    for (const match of home.html.matchAll(/href=["']([^"']+)["']/gi)) {
      if (!/(contact|team|about|equipo|nosotros|equipe|contat|kontakt|uber-uns|impressum|会社|联系|聯繫)/i.test(match[1])) continue;
      try {
        const link = new URL(match[1], home.url);
        link.hash = "";
        if (link.origin === new URL(home.url).origin && link.href !== home.url) links.add(link.href);
      } catch { /* malformed link */ }
    }
    const pages = [home];
    const secondary = await Promise.allSettled([...links].slice(0, 2).map((link) => readPublicHtml(link, signal)));
    for (const page of secondary) if (page.status === "fulfilled" && new URL(page.value.url).origin === new URL(home.url).origin) pages.push(page.value);
    for (const page of pages) {
      result.pages.push(page.url);
      for (const email of publishedEmails(page.html)) if (!result.emails.some((item) => item.email === email)) result.emails.push({ email, sourceUrl: page.url });
      for (const person of extractFromHtml(page.html, page.url)) if (!result.people.some((item) => item.name === person.name && item.role === person.role)) result.people.push(person);
    }
    result.status = "REVIEW_REQUIRED";
    result.warning = "Datos publicados en web candidata; confirmar empresa, país y relación laboral. Emails sin prueba de entrega; no se asocian automáticamente a personas.";
  } catch { /* keep explicit failed state */ }
  return result;
}
