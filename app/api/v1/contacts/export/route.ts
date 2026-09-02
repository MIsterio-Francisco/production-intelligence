import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";

const CSV_HEADERS = [
  "productora",
  "pais_codigo",
  "pais",
  "ciudad",
  "web",
  "contacto",
  "cargo",
  "email",
  "estado_email",
  "tipo_fuente",
  "fuente",
  "ultima_comprobacion",
];

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet applications from evaluating imported cells as formulas.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: emailRows, error: emailError } = await (supabase.from("contact_emails") as any)
    .select("company_id, person_id, email, status, source_type, source_url, last_checked_at")
    .in("status", ["VERIFIED", "PUBLIC"])
    .order("last_checked_at", { ascending: false });

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }

  const contacts = emailRows || [];
  const companyIds = [...new Set(contacts.map((row: any) => row.company_id).filter(Boolean))];
  const personIds = [...new Set(contacts.map((row: any) => row.person_id).filter(Boolean))];

  const [companiesResult, peopleResult] = await Promise.all([
    companyIds.length
      ? (supabase.from("companies") as any)
          .select("id, name, country_code, country_name, city, website_url")
          .in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
    personIds.length
      ? (supabase.from("people") as any)
          .select("id, full_name, job_title")
          .in("id", personIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (companiesResult.error || peopleResult.error) {
    return NextResponse.json(
      { error: companiesResult.error?.message || peopleResult.error?.message || "Unable to load contact details." },
      { status: 500 }
    );
  }

  const companies = new Map((companiesResult.data || []).map((row: any) => [row.id, row]));
  const people = new Map((peopleResult.data || []).map((row: any) => [row.id, row]));

  const rows = contacts
    .map((contact: any) => {
      const company: any = companies.get(contact.company_id);
      const person: any = contact.person_id ? people.get(contact.person_id) : null;
      return [
        company?.name,
        company?.country_code,
        company?.country_name,
        company?.city,
        company?.website_url,
        person?.full_name,
        person?.job_title,
        contact.email,
        contact.status,
        contact.source_type,
        contact.source_url,
        contact.last_checked_at,
      ];
    })
    .sort((a: unknown[], b: unknown[]) => String(a[0] || "").localeCompare(String(b[0] || "")));

  const csv = `\uFEFF${[CSV_HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mcl-contactos-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
