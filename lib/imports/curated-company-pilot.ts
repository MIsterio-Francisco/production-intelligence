import { createAdminClient } from "@/lib/supabase/server";

export type PilotSegment = "FILM_TV" | "TVC" | "PRODUCTION_SERVICE";

export interface CuratedCompanyPilotRow {
  key: string;
  name: string;
  countryCode: "ES" | "PT";
  countryName: "Spain" | "Portugal";
  city: string;
  websiteUrl: string;
  publicEmail?: string;
  sourceUrl: string;
  segment: PilotSegment;
  notes: string;
}

// Deliberately small first batch. Every row is a production company or production
// service; suppliers, post houses, VFX vendors, rental houses and resellers are excluded.
export const CURATED_COMPANY_PILOT: CuratedCompanyPilotRow[] = [
  { key: "el-deseo", name: "El Deseo", countryCode: "ES", countryName: "Spain", city: "Madrid", websiteUrl: "https://www.eldeseo.es/", publicEmail: "eldeseo@eldeseo.es", sourceUrl: "https://www.eldeseo.es/condiciones-generales/", segment: "FILM_TV", notes: "Productora de largometrajes, documentales y series." },
  { key: "morena-films", name: "Morena Films", countryCode: "ES", countryName: "Spain", city: "Madrid", websiteUrl: "https://morenafilms.com/", publicEmail: "morenafilms@morenafilms.com", sourceUrl: "https://morenafilms.com/contacta-con-nosotros/", segment: "FILM_TV", notes: "Productora de cine y televisión." },
  { key: "bowfinger", name: "Bowfinger International Pictures", countryCode: "ES", countryName: "Spain", city: "Madrid / Donostia", websiteUrl: "https://www.bowfinger.es/", publicEmail: "info@bowfinger.es", sourceUrl: "https://www.bowfinger.es/es/contacto", segment: "FILM_TV", notes: "Productora de cine y televisión." },
  { key: "inicia-films", name: "Inicia Films", countryCode: "ES", countryName: "Spain", city: "Barcelona", websiteUrl: "https://www.iniciafilms.com/", publicEmail: "info@iniciafilms.com", sourceUrl: "https://www.iniciafilms.com/contacto/", segment: "FILM_TV", notes: "Productora independiente de cine." },
  { key: "bambu-producciones", name: "Bambú Producciones", countryCode: "ES", countryName: "Spain", city: "Madrid", websiteUrl: "https://bambuproducciones.com/", publicEmail: "info@bambuproducciones.com", sourceUrl: "https://bambuproducciones.com/", segment: "FILM_TV", notes: "Productora de series, cine y servicios internacionales." },
  { key: "vaca-films", name: "Vaca Films", countryCode: "ES", countryName: "Spain", city: "A Coruña", websiteUrl: "https://vacafilms.com/", sourceUrl: "https://vacafilms.com/quienes-somos", segment: "FILM_TV", notes: "Productora de películas y series." },
  { key: "fasten-films", name: "Fasten Films", countryCode: "ES", countryName: "Spain", city: "Barcelona / Madrid", websiteUrl: "https://www.fastenfilms.com/", publicEmail: "info@fastenfilms.com", sourceUrl: "https://www.fastenfilms.com/", segment: "FILM_TV", notes: "Productora de cine y televisión." },
  { key: "canada", name: "CANADA", countryCode: "ES", countryName: "Spain", city: "Barcelona", websiteUrl: "https://canadacanada.com/", publicEmail: "info@canadacanada.com", sourceUrl: "https://www.canadacanada.com/", segment: "TVC", notes: "Productora de publicidad, videoclips y contenido." },
  { key: "landia", name: "Landia", countryCode: "ES", countryName: "Spain", city: "Madrid / Barcelona", websiteUrl: "https://landia.com/", publicEmail: "martamartinez@landia.com", sourceUrl: "https://www.landia.com/espana/contact/", segment: "TVC", notes: "Productora internacional de cine publicitario." },
  { key: "lee-films", name: "Lee Films", countryCode: "ES", countryName: "Spain", city: "Madrid / Barcelona", websiteUrl: "https://leefilms.com/", publicEmail: "info@leefilms.com", sourceUrl: "https://leefilms.com/legal-advice/", segment: "PRODUCTION_SERVICE", notes: "Productora y production service de publicidad." },
  { key: "krypton-films", name: "Krypton Films", countryCode: "PT", countryName: "Portugal", city: "Lisbon", websiteUrl: "https://kryptonfilms.com/", publicEmail: "info@kryptonfilms.com", sourceUrl: "https://kryptonfilms.kryptonproduction.com/politica-privacidade", segment: "TVC", notes: "Productora portuguesa de publicidad y TVC." },
  { key: "take-it-easy", name: "Take It Easy", countryCode: "PT", countryName: "Portugal", city: "Lisbon", websiteUrl: "https://www.takeiteasy-film.com/", publicEmail: "takeiteasy@takeiteasy-film.com", sourceUrl: "https://www.takeiteasy-film.com/", segment: "FILM_TV", notes: "Productora independiente de cine, televisión y comerciales." },
];

function normalizedDomain(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

function normalizedName(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function previewCuratedCompanyPilot() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").select("id,name,slug,website_url");
  if (error) throw new Error(`No se pudo comprobar el catálogo: ${error.message}`);

  const existing = (data || []) as Array<{ id: string; name: string; slug: string; website_url: string | null }>;
  const byDomain = new Map(existing.filter((row) => row.website_url).map((row) => {
    try { return [normalizedDomain(row.website_url!), row] as const; } catch { return ["", row] as const; }
  }));
  const byName = new Map(existing.map((row) => [normalizedName(row.name), row]));

  const rows = CURATED_COMPANY_PILOT.map((candidate) => {
    const match = byDomain.get(normalizedDomain(candidate.websiteUrl)) || byName.get(normalizedName(candidate.name));
    return { ...candidate, status: match ? "DUPLICATE" as const : "READY" as const, existingCompanyId: match?.id || null };
  });
  return { rows, ready: rows.filter((row) => row.status === "READY").length, duplicates: rows.filter((row) => row.status === "DUPLICATE").length };
}

export async function importCuratedCompanyPilot(keys: string[]) {
  const allowed = new Set(keys);
  const preview = await previewCuratedCompanyPilot();
  const selected = preview.rows.filter((row) => allowed.has(row.key) && row.status === "READY");
  if (selected.length === 0) return { imported: 0, duplicates: keys.length, emailsAdded: 0 };

  const supabase = createAdminClient();
  let imported = 0;
  let emailsAdded = 0;
  for (const row of selected) {
    const { data: company, error } = await (supabase.from("companies") as any).insert({
      name: row.name,
      slug: row.key,
      description: row.notes,
      company_type: "production_company",
      website_url: row.websiteUrl,
      country_code: row.countryCode,
      country_name: row.countryName,
      city: row.city,
      is_active: true,
      provenance_type: "curated_public_research",
      data_quality_score: row.publicEmail ? 75 : 65,
      is_demo: false,
      score_confidence: 0,
      last_verified_at: new Date().toISOString(),
    }).select("id").single();
    if (error) throw new Error(`No se pudo importar ${row.name}: ${error.message}`);
    imported += 1;

    const { error: categoryError } = await (supabase.from("company_categories") as any).upsert([
      { company_id: company.id, category: row.segment },
      { company_id: company.id, category: "PRODUCTION_COMPANY" },
    ], { onConflict: "company_id,category", ignoreDuplicates: true });
    if (categoryError) throw new Error(`Empresa creada, pero falló su clasificación (${row.name}): ${categoryError.message}`);

    await (supabase.from("sources") as any).insert({
      source_type: "OFFICIAL_WEBSITE",
      source_name: row.name,
      url: row.sourceUrl,
      title: `Fuente pública de ${row.name}`,
      credibility_score: 90,
      metadata: { company_id: company.id, import: "CURATED_PILOT_2026_09", segment: row.segment },
    });

    if (row.publicEmail) {
      const { error: emailError } = await (supabase.from("contact_emails") as any).insert({
        company_id: company.id,
        person_id: null,
        owner_type: "COMPANY",
        email: row.publicEmail,
        status: "PUBLIC",
        source_type: "OFFICIAL_WEBSITE",
        source_url: row.sourceUrl,
        last_checked_at: new Date().toISOString(),
      });
      if (emailError) throw new Error(`Empresa creada, pero falló su email (${row.name}): ${emailError.message}`);
      emailsAdded += 1;
    }
  }
  return { imported, duplicates: keys.length - selected.length, emailsAdded };
}
