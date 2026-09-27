const regions = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

export function normalizeMarket(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const code = value.trim().toUpperCase() === "UK" ? "GB" : value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || !regions.of(code) || ["ZZ", "EU", "UN", "EZ", "XA", "XB"].includes(code)) {
    throw new Error("Introduce un código de país válido de dos letras (ES, GB, JP…).");
  }
  return code;
}

export function marketName(value?: string): string {
  const code = normalizeMarket(value);
  return code ? regions.of(code)! : "global";
}

export function productionIntent(query: string): string {
  return query.trim()
    .replace(/productoras? de cine|productores? de cine|productoras? cinematogr[aá]ficas?/gi, "film production companies")
    .replace(/productoras? de (publicidad|tvc)|productoras? publicitarias?/gi, "commercial production companies")
    .replace(/productoras?|productores?/gi, "film television production companies") || "film production companies";
}
