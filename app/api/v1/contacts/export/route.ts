import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";

const CSV_HEADERS = [
  "empresa", "pagina_web", "pais_codigo", "pais", "ciudad", "persona", "job_title",
  "email_persona", "estado_email_persona", "emails_genericos", "tipo_fuente_persona",
  "fuente_persona", "fuentes_emails_genericos", "ultima_comprobacion",
];

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function isExportablePerson(person: any) {
  const provenance = String(person?.provenance_type || "VERIFIED").trim().toUpperCase();
  return ["VERIFIED", "MANUAL_RESEARCH", "APOLLO_SEARCH", "APOLLO"].includes(provenance);
}

function newestDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) || "";
}

export async function GET() {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const [affiliationsResult, emailsResult] = await Promise.all([
    (supabase.from("company_people") as any)
      .select("company_id, person_id, role, is_current, people(id, full_name, provenance_type, research_source_url, linkedin_source_url, research_last_checked_at, linkedin_last_checked_at)")
      .eq("is_current", true),
    (supabase.from("contact_emails") as any)
      .select("company_id, person_id, owner_type, email, status, source_type, source_url, last_checked_at")
      .in("status", ["VERIFIED", "PUBLIC"])
      .order("last_checked_at", { ascending: false }),
  ]);

  if (affiliationsResult.error || emailsResult.error) {
    return NextResponse.json(
      { error: affiliationsResult.error?.message || emailsResult.error?.message || "Unable to load contacts." },
      { status: 500 }
    );
  }

  const affiliations = (affiliationsResult.data || []).filter((row: any) => row.people && isExportablePerson(row.people));
  const emails = emailsResult.data || [];
  const companyIds = [...new Set([
    ...affiliations.map((row: any) => row.company_id),
    ...emails.map((row: any) => row.company_id),
  ].filter(Boolean))];
  const companiesResult = companyIds.length
    ? await (supabase.from("companies") as any)
        .select("id, name, country_code, country_name, city, website_url")
        .in("id", companyIds)
    : { data: [], error: null };
  if (companiesResult.error) return NextResponse.json({ error: companiesResult.error.message }, { status: 500 });

  const companies = new Map((companiesResult.data || []).map((row: any) => [row.id, row]));
  const genericEmails = new Map<string, any[]>();
  const personEmails = new Map<string, any[]>();
  for (const email of emails) {
    if (email.owner_type === "COMPANY" || !email.person_id) {
      genericEmails.set(email.company_id, [...(genericEmails.get(email.company_id) || []), email]);
    } else {
      const key = `${email.company_id}:${email.person_id}`;
      personEmails.set(key, [...(personEmails.get(key) || []), email]);
    }
  }

  const rows: unknown[][] = affiliations.map((affiliation: any) => {
    const company: any = companies.get(affiliation.company_id);
    const person = affiliation.people;
    const direct = personEmails.get(`${affiliation.company_id}:${affiliation.person_id}`) || [];
    const generic = genericEmails.get(affiliation.company_id) || [];
    return [
      company?.name, company?.website_url, company?.country_code, company?.country_name, company?.city,
      person.full_name, affiliation.role,
      direct.map((row: any) => row.email).join("; "),
      [...new Set(direct.map((row: any) => row.status))].join("; "),
      generic.map((row: any) => row.email).join("; "),
      [...new Set(direct.map((row: any) => row.source_type))].join("; "),
      [...new Set([person.research_source_url, person.linkedin_source_url, ...direct.map((row: any) => row.source_url)].filter(Boolean))].join("; "),
      [...new Set(generic.map((row: any) => row.source_url).filter(Boolean))].join("; "),
      newestDate([person.research_last_checked_at, person.linkedin_last_checked_at,
        ...direct.map((row: any) => row.last_checked_at), ...generic.map((row: any) => row.last_checked_at)]),
    ];
  });

  const companiesWithPeople = new Set(affiliations.map((row: any) => row.company_id));
  for (const [companyId, generic] of genericEmails) {
    if (companiesWithPeople.has(companyId)) continue;
    const company: any = companies.get(companyId);
    rows.push([
      company?.name, company?.website_url, company?.country_code, company?.country_name, company?.city,
      "", "", "", "", generic.map((row: any) => row.email).join("; "), "", "",
      [...new Set(generic.map((row: any) => row.source_url).filter(Boolean))].join("; "),
      newestDate(generic.map((row: any) => row.last_checked_at)),
    ]);
  }

  rows.sort((a, b) => String(a[0] || "").localeCompare(String(b[0] || "")) || String(a[5] || "").localeCompare(String(b[5] || "")));
  const csv = `\uFEFF${[CSV_HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mcl-contactos-empresas-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
