import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { evaluateApolloEligibility, isApolloDecisionMaker } from "@/lib/contacts/apollo-eligibility";
import { enrichPersonWithApollo, searchApolloDecisionMakers } from "@/lib/contacts/apollo-client";
import { isValidEmailSyntax, normalizeEmail } from "@/lib/contacts/email-policy";
import { resolveContactCompany } from "@/lib/contacts/resolve-company-record";

function domainOf(websiteUrl: string) {
  return new URL(websiteUrl).hostname.replace(/^www\./, "");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedUser())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  let company;
  try {
    company = await resolveContactCompany(id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to resolve company record." }, { status: 500 });
  }
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  const eligibility = evaluateApolloEligibility(company as any, []);
  if (!eligibility.eligible) return NextResponse.json({ error: eligibility.reason }, { status: 422 });
  try {
    const data = await searchApolloDecisionMakers(domainOf(company.website_url!));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Apollo search failed." }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedUser())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id: companyReference } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.candidateId !== "string") return NextResponse.json({ error: "Apollo candidate is required." }, { status: 400 });
  let company;
  try {
    company = await resolveContactCompany(companyReference);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to resolve company record." }, { status: 500 });
  }
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  const companyId = company.id as string;
  const eligibility = evaluateApolloEligibility(company as any, []);
  if (!eligibility.eligible) return NextResponse.json({ error: eligibility.reason }, { status: 422 });

  try {
    const domain = domainOf(company.website_url!);
    const candidates = await searchApolloDecisionMakers(domain);
    const candidate = candidates.find((item) => item.id === body.candidateId);
    if (!candidate || !isApolloDecisionMaker({ id: candidate.id, full_name: candidate.name, job_title: candidate.title })) {
      return NextResponse.json({ error: "El candidato ya no coincide con un cargo permitido." }, { status: 422 });
    }

    const supabase = createAdminClient();
    let personQuery = (supabase.from("people") as any).select("id").eq("full_name", candidate.name);
    personQuery = candidate.linkedinUrl ? personQuery.eq("linkedin_url", candidate.linkedinUrl) : personQuery.eq("job_title", candidate.title);
    let { data: person } = await personQuery.maybeSingle();
    if (!person) {
      const inserted = await (supabase.from("people") as any).insert({
        full_name: candidate.name,
        job_title: candidate.title,
        linkedin_url: candidate.linkedinUrl || null,
        provenance_type: "APOLLO_SEARCH",
      } as any).select("id").single();
      if (inserted.error) throw new Error(inserted.error.message);
      person = inserted.data;
    }
    await (supabase.from("company_people") as any).upsert({
      company_id: companyId,
      person_id: person!.id,
      role: candidate.title,
      seniority: null,
      is_current: true,
      confidence: 80,
    } as any, { onConflict: "company_id,person_id,role" });

    const match = await enrichPersonWithApollo({
      name: candidate.name,
      companyDomain: domain,
      companyId,
      personId: person!.id,
      apolloPersonId: candidate.id,
    });
    if (!match?.email || !isValidEmailSyntax(match.email)) {
      return NextResponse.json({ data: { status: "NO_EMAIL", candidate }, error: null });
    }
    const checkedAt = new Date().toISOString();
    const email = normalizeEmail(match.email);
    const { data: existing } = await (supabase.from("contact_emails") as any)
      .select("id").eq("company_id", companyId).eq("person_id", person!.id).eq("normalized_email", email).maybeSingle();
    const record = {
      company_id: companyId, person_id: person!.id, owner_type: "PERSON", email,
      status: match.emailStatus, source_type: "APOLLO", source_url: match.sourceUrl,
      provider_record_id: match.providerRecordId, verification_provider: "APOLLO",
      verification_result: match.emailStatus, last_checked_at: checkedAt, updated_at: checkedAt,
    };
    const operation = existing
      ? (supabase.from("contact_emails") as any).update(record).eq("id", existing.id)
      : (supabase.from("contact_emails") as any).insert(record);
    const { error } = await operation;
    if (error) throw new Error(error.message);
    return NextResponse.json({ data: { status: match.emailStatus, candidate }, error: null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Apollo enrichment failed." }, { status: 502 });
  }
}
