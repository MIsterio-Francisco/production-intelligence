import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { enrichCompanyContacts } from "@/lib/contacts/contact-enrichment-service";
import { isContactableEmail } from "@/types/contact-email";
import { evaluateApolloEligibility } from "@/lib/contacts/apollo-eligibility";
import { resolveContactCompany } from "@/lib/contacts/resolve-company-record";

async function loadApolloCandidates(supabase: ReturnType<typeof createAdminClient>, companyId: string) {
  const company = await resolveContactCompany(companyId);
  if (!company) return { company: null, people: [] };
  const { data: peopleRows } = await (supabase
    .from("company_people") as any)
    .select("role, seniority, people(id, full_name, job_title)")
    .eq("company_id", company.id)
    .eq("is_current", true);
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
  const company = await resolveContactCompany(id);
  const resolvedId = company?.id || id;
  const { data, error } = await (supabase.from("contact_emails") as any)
    .select("*")
    .eq("company_id", resolvedId)
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
  const candidates = company
    ? await loadApolloCandidates(supabase, resolvedId)
    : { company: null, people: [] };
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
