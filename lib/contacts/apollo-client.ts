import { mapApolloEmailStatus } from "./email-policy";

export interface ApolloPersonMatch {
  providerRecordId?: string;
  email?: string;
  emailStatus: ReturnType<typeof mapApolloEmailStatus>;
  sourceUrl: string;
}

export async function enrichPersonWithApollo(input: {
  name: string;
  companyDomain: string;
}): Promise<ApolloPersonMatch | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error("APOLLO_API_KEY is not configured");

  const response = await fetch("https://api.apollo.io/api/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ name: input.name, domain: input.companyDomain }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`Apollo enrichment failed with HTTP ${response.status}`);
  const payload = await response.json();
  const person = payload.person;
  if (!person) return null;

  return {
    providerRecordId: person.id,
    email: person.email || undefined,
    emailStatus: mapApolloEmailStatus(person.email_status),
    sourceUrl: person.linkedin_url || "https://app.apollo.io",
  };
}
