import { mapApolloEmailStatus } from "./email-policy";
import { finalizeApolloUsage, reserveApolloCredit } from "./apollo-budget";

export interface ApolloPersonMatch {
  providerRecordId?: string;
  email?: string;
  emailStatus: ReturnType<typeof mapApolloEmailStatus>;
  sourceUrl: string;
}

export interface ApolloDecisionMakerCandidate {
  id: string;
  name: string;
  title: string;
  linkedinUrl?: string;
  organizationName?: string;
}

const TARGET_TITLES = [
  "head of production", "director of production", "executive producer",
  "post production producer", "post production supervisor", "managing director",
  "founder producer",
];

function apolloHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "x-api-key": apiKey,
  };
}

export async function searchApolloDecisionMakers(companyDomain: string): Promise<ApolloDecisionMakerCandidate[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error("APOLLO_API_KEY is not configured");
  const url = new URL("https://api.apollo.io/api/v1/mixed_people/api_search");
  TARGET_TITLES.forEach((title) => url.searchParams.append("person_titles[]", title));
  ["owner", "founder", "c_suite", "vp", "head", "director", "manager"].forEach((seniority) =>
    url.searchParams.append("person_seniorities[]", seniority));
  url.searchParams.append("q_organization_domains_list[]", companyDomain);
  url.searchParams.set("include_similar_titles", "true");
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "10");
  const response = await fetch(url, {
    method: "POST",
    headers: apolloHeaders(apiKey),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Apollo people search failed with HTTP ${response.status}`);
  const payload = await response.json();
  return (payload.people || []).flatMap((person: any) => {
    if (!person?.id || !person?.name || !person?.title) return [];
    return [{
      id: String(person.id),
      name: String(person.name),
      title: String(person.title),
      linkedinUrl: person.linkedin_url || undefined,
      organizationName: person.organization?.name || person.organization_name || undefined,
    }];
  }).slice(0, 5);
}

export async function enrichPersonWithApollo(input: {
  name: string;
  companyDomain: string;
  companyId: string;
  personId: string;
  apolloPersonId?: string;
}): Promise<ApolloPersonMatch | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error("APOLLO_API_KEY is not configured");

  const usageId = await reserveApolloCredit(input.companyId, input.personId);
  let response: Response;
  try {
    response = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: apolloHeaders(apiKey),
      body: JSON.stringify(input.apolloPersonId
        ? { id: input.apolloPersonId, reveal_personal_emails: false, reveal_phone_number: false }
        : { name: input.name, domain: input.companyDomain, reveal_personal_emails: false, reveal_phone_number: false }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    await finalizeApolloUsage(usageId, "FAILED", undefined, "NETWORK_ERROR", 0);
    throw error;
  }

  if (!response.ok) {
    await finalizeApolloUsage(usageId, "FAILED", undefined, `HTTP_${response.status}`, 0);
    throw new Error(`Apollo enrichment failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  const person = payload.person;
  if (!person) {
    await finalizeApolloUsage(usageId, "NO_MATCH", undefined, undefined, 0);
    return null;
  }
  await finalizeApolloUsage(usageId, "MATCHED", person.id);

  return {
    providerRecordId: person.id,
    email: person.email || undefined,
    emailStatus: mapApolloEmailStatus(person.email_status),
    sourceUrl: person.linkedin_url || "https://app.apollo.io",
  };
}
