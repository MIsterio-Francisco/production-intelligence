import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { enrichCompanyContacts } from "@/lib/contacts/contact-enrichment-service";
import { isContactableEmail } from "@/types/contact-email";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await (supabase.from("contact_emails") as any)
    .select("*")
    .eq("company_id", id)
    .order("last_checked_at", { ascending: false });

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  const contacts = (data || []).map((row: any) => ({
    ...row,
    contactable: isContactableEmail({
      status: row.status,
      sourceUrl: row.source_url,
      lastCheckedAt: row.last_checked_at,
    }),
  }));
  return NextResponse.json({ data: contacts, error: null });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const includeApollo = body.includeApollo === true;
  const supabase = createAdminClient();

  const [{ data: company }, { data: peopleRows }] = await Promise.all([
    supabase.from("companies").select("id, website_url").eq("id", id).single(),
    supabase.from("company_people").select("people(id, full_name)").eq("company_id", id).eq("is_current", true),
  ]);

  if (!company) return NextResponse.json({ data: null, error: "Company not found." }, { status: 404 });
  const people = (peopleRows || []).flatMap((row: any) => row.people ? [row.people] : []);

  try {
    const summary = await enrichCompanyContacts(company, people, { includeApollo });
    return NextResponse.json({ data: summary, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Contact enrichment failed." },
      { status: 502 }
    );
  }
}
