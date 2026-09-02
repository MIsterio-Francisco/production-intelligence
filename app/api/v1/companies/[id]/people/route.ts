import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { resolveContactCompany } from "@/lib/contacts/resolve-company-record";
import { isValidEmailSyntax, normalizeEmail } from "@/lib/contacts/email-policy";

function validWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const company = await resolveContactCompany(id);
  if (!company) return NextResponse.json({ data: null, error: "Company not found." }, { status: 404 });

  const { data, error } = await (createAdminClient().from("company_people") as any)
    .select("role, is_current, people(id, full_name, linkedin_url, provenance_type, research_source_url, research_last_checked_at)")
    .eq("company_id", company.id)
    .eq("is_current", true);

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data || []).flatMap((row: any) => row.people ? [{ ...row.people, role: row.role }] : []),
    error: null,
  });
}

async function createManualPerson(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const company = await resolveContactCompany(id);
  if (!company) return NextResponse.json({ data: null, error: "Company not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const linkedinUrl = typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const evidenceType = body.evidenceType === "APOLLO_VERIFIED"
    ? "APOLLO_VERIFIED"
    : body.evidenceType === "UNVERIFIED"
      ? "UNVERIFIED"
      : "PUBLIC_WEB";

  if (!fullName || !jobTitle || !validWebUrl(sourceUrl)) {
    return NextResponse.json(
      { data: null, error: "Nombre, cargo y un enlace de procedencia válido son obligatorios." },
      { status: 400 }
    );
  }
  if (linkedinUrl && (!validWebUrl(linkedinUrl) || !new URL(linkedinUrl).hostname.endsWith("linkedin.com"))) {
    return NextResponse.json({ data: null, error: "El enlace de LinkedIn no es válido." }, { status: 400 });
  }
  if (rawEmail && !isValidEmailSyntax(rawEmail)) {
    return NextResponse.json({ data: null, error: "El email no tiene un formato válido." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const checkedAt = new Date().toISOString();
  const { data: affiliations, error: affiliationsError } = await (supabase.from("company_people") as any)
    .select("person_id, role, people(id, full_name, linkedin_url)")
    .eq("company_id", company.id);
  if (affiliationsError) throw new Error(affiliationsError.message);

  const normalizedName = fullName.toLocaleLowerCase();
  const existing = (affiliations || []).find((row: any) => {
    const person = row.people;
    if (!person || person.full_name?.trim().toLocaleLowerCase() !== normalizedName) return false;
    return linkedinUrl
      ? person.linkedin_url === linkedinUrl
      : row.role?.trim().toLocaleLowerCase() === jobTitle.toLocaleLowerCase();
  })?.people;

  let personId = existing?.id as string | undefined;
  if (personId) {
    const { error } = await (supabase.from("people") as any).update({
      linkedin_url: linkedinUrl || existing.linkedin_url || null,
      linkedin_status: linkedinUrl ? "PUBLIC" : "UNVERIFIED",
      linkedin_source_url: linkedinUrl ? sourceUrl : null,
      linkedin_last_checked_at: linkedinUrl ? checkedAt : null,
      provenance_type: "MANUAL_RESEARCH",
      research_source_url: sourceUrl,
      research_last_checked_at: checkedAt,
      updated_at: checkedAt,
    }).eq("id", personId);
    if (error) throw new Error(error.message);
  } else {
    const { data: inserted, error } = await (supabase.from("people") as any).insert({
      full_name: fullName,
      linkedin_url: linkedinUrl || null,
      linkedin_status: linkedinUrl ? "PUBLIC" : "UNVERIFIED",
      linkedin_source_url: linkedinUrl ? sourceUrl : null,
      linkedin_last_checked_at: linkedinUrl ? checkedAt : null,
      provenance_type: "MANUAL_RESEARCH",
      research_source_url: sourceUrl,
      research_last_checked_at: checkedAt,
    }).select("id").single();
    if (error) throw new Error(error.message);
    personId = inserted.id;
  }

  const { error: relationshipError } = await (supabase.from("company_people") as any).upsert({
    company_id: company.id,
    person_id: personId,
    role: jobTitle,
    is_current: true,
  }, { onConflict: "company_id,person_id,role" });
  if (relationshipError) throw new Error(relationshipError.message);

  if (rawEmail) {
    const email = normalizeEmail(rawEmail);
    const { data: emailRow } = await (supabase.from("contact_emails") as any)
      .select("id")
      .eq("company_id", company.id)
      .eq("person_id", personId)
      .eq("normalized_email", email)
      .maybeSingle();
    const emailRecord = {
      company_id: company.id,
      person_id: personId,
      owner_type: "PERSON",
      email,
      status: evidenceType === "APOLLO_VERIFIED" ? "VERIFIED" : evidenceType === "PUBLIC_WEB" ? "PUBLIC" : "UNVERIFIED",
      source_type: evidenceType === "APOLLO_VERIFIED" ? "APOLLO" : "MANUAL",
      source_url: sourceUrl,
      verification_provider: evidenceType === "APOLLO_VERIFIED" ? "APOLLO" : "MANUAL_RESEARCH",
      verification_result: evidenceType,
      last_checked_at: checkedAt,
      updated_at: checkedAt,
    };
    const operation = emailRow
      ? (supabase.from("contact_emails") as any).update(emailRecord).eq("id", emailRow.id)
      : (supabase.from("contact_emails") as any).insert(emailRecord);
    const { error } = await operation;
    if (error) throw new Error(error.message);
  }

  return NextResponse.json({ data: { personId, emailSaved: Boolean(rawEmail) }, error: null });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await createManualPerson(request, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la persona investigada.";
    console.error("[ManualPeople] Unable to save researched person:", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
