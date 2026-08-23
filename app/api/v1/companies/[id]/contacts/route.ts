import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { enrichCompanyContacts } from "@/lib/contacts/contact-enrichment-service";
import { isContactableEmail } from "@/types/contact-email";
import { evaluateApolloEligibility } from "@/lib/contacts/apollo-eligibility";

async function loadApolloCandidates(supabase: ReturnType<typeof createAdminClient>, companyId: string) {
  const [{ data: company }, { data: peopleRows }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, website_url, company_type, data_classification, provenance_type, company_categories(category)")
      .eq("id", companyId)
      .single(),
    supabase
      .from("company_people")
      .select("role, seniority, people(id, full_name, job_title)")
      .eq("company_id", companyId)
      .eq("is_current", true),
  ]);
  const people = (peopleRows || []).flatMap((row: any) => row.people ? [{
    ...row.people,
    role: row.role,
    seniority: row.seniority,
  }] : []);
  return { company, people };
}

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
  const candidates = await loadApolloCandidates(supabase, id);
  const eligibility = candidates.company
    ? evaluateApolloEligibility(candidates.company as any, candidates.people)
    : { eligible: false, reason: "Company not found.", people: [] };
  return NextResponse.json({
    data: contacts,
    apolloEligibility: { eligible: eligibility.eligible, reason: eligibility.reason },
    error: null,
  });
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

  const { company, people } = await loadApolloCandidates(supabase, id);
  if (!company) return NextResponse.json({ data: null, error: "Company not found." }, { status: 404 });

  try {
    let selectedPeople = people;
    if (includeApollo) {
      const eligibility = evaluateApolloEligibility(company as any, people);
      if (!eligibility.eligible) {
        return NextResponse.json({ data: null, error: eligibility.reason }, { status: 422 });
      }
      selectedPeople = eligibility.people;
    }
    const summary = await enrichCompanyContacts(company, selectedPeople, { includeApollo });
    return NextResponse.json({ data: summary, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Contact enrichment failed." },
      { status: 502 }
    );
  }
}
