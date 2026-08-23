export type LinkedInStatus = "VERIFIED" | "PUBLIC" | "PROVIDER_MATCH" | "UNVERIFIED";

export function isLinkedInProfileUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && hostname === "linkedin.com" && /^\/(in|company)\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function mayShowLinkedInLink(input: {
  url?: string | null;
  status?: string | null;
  sourceUrl?: string | null;
  lastCheckedAt?: string | null;
}): boolean {
  if (input.status !== "VERIFIED" && input.status !== "PUBLIC") return false;
  if (!isLinkedInProfileUrl(input.url) || !input.sourceUrl || !input.lastCheckedAt) return false;
  const checkedAt = new Date(input.lastCheckedAt).getTime();
  return Number.isFinite(checkedAt) && checkedAt <= Date.now();
}
