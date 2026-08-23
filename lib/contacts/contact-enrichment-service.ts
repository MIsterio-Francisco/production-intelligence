import { createAdminClient } from "@/lib/supabase/server";
import { discoverOfficialPublishedEmails } from "./official-email-discovery";
import { enrichPersonWithApollo } from "./apollo-client";
import { isValidEmailSyntax, normalizeEmail } from "./email-policy";

interface CompanyInput {
  id: string;
  website_url: string | null;
}

interface PersonInput {
  id: string;
  full_name: string;
  job_title?: string | null;
  role?: string | null;
  seniority?: string | null;
}

function companyDomain(websiteUrl: string): string {
  return new URL(websiteUrl).hostname.replace(/^www\./, "");
}

async function persistContactEmail(record: Record<string, unknown>) {
  const supabase = createAdminClient();
  let existingQuery = (supabase.from("contact_emails") as any)
    .select("id")
    .eq("company_id", record.company_id)
    .eq("normalized_email", normalizeEmail(String(record.email)));
  existingQuery = record.person_id == null
    ? existingQuery.is("person_id", null)
    : existingQuery.eq("person_id", record.person_id);
  const { data: existing } = await existingQuery.maybeSingle();
  const operation = existing
    ? (supabase.from("contact_emails") as any).update(record).eq("id", existing.id)
    : (supabase.from("contact_emails") as any).insert(record);
  const { error } = await operation;
  if (error) throw new Error(`Unable to persist contact evidence: ${error.message}`);
}

export async function enrichCompanyContacts(
  company: CompanyInput,
  people: PersonInput[],
  options: { includeApollo: boolean }
) {
  const summary = { officialPublished: 0, apolloVerified: 0, apolloUnverified: 0, skipped: 0 };
  const checkedAt = new Date().toISOString();

  if (!company.website_url) return { ...summary, skipped: people.length + 1 };

  const published = await discoverOfficialPublishedEmails(company.website_url);
  for (const evidence of published) {
    await persistContactEmail({
      company_id: company.id,
      person_id: null,
      owner_type: "COMPANY",
      email: evidence.email,
      status: "PUBLIC",
      source_type: "OFFICIAL_WEBSITE",
      source_url: evidence.sourceUrl,
      verification_provider: "OFFICIAL_WEBSITE_DISCOVERY",
      verification_result: "PUBLISHED_ON_OFFICIAL_DOMAIN",
      last_checked_at: checkedAt,
      updated_at: checkedAt,
    });
    summary.officialPublished += 1;
  }

  if (!options.includeApollo) return summary;

  const domain = companyDomain(company.website_url);
  for (const person of people.slice(0, 3)) {
    const match = await enrichPersonWithApollo({
      name: person.full_name,
      companyDomain: domain,
      companyId: company.id,
      personId: person.id,
    });
    if (!match?.email || !isValidEmailSyntax(match.email)) {
      summary.skipped += 1;
      continue;
    }

    await persistContactEmail({
      company_id: company.id,
      person_id: person.id,
      owner_type: "PERSON",
      email: normalizeEmail(match.email),
      status: match.emailStatus,
      source_type: "APOLLO",
      source_url: match.sourceUrl,
      provider_record_id: match.providerRecordId,
      verification_provider: "APOLLO",
      verification_result: match.emailStatus,
      last_checked_at: checkedAt,
      updated_at: checkedAt,
    });

    if (match.emailStatus === "VERIFIED") summary.apolloVerified += 1;
    else summary.apolloUnverified += 1;
  }

  return summary;
}
