import { mapApolloEmailStatus } from "./email-policy";
import { finalizeApolloUsage, reserveApolloCredit } from "./apollo-budget";

export interface ApolloPersonMatch {
  providerRecordId?: string;
  email?: string;
  emailStatus: ReturnType<typeof mapApolloEmailStatus>;
  sourceUrl: string;
}

export async function enrichPersonWithApollo(input: {
  name: string;
  companyDomain: string;
  companyId: string;
  personId: string;
}): Promise<ApolloPersonMatch | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error("APOLLO_API_KEY is not configured");

  const usageId = await reserveApolloCredit(input.companyId, input.personId);
  let response: Response;
  try {
    response = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ name: input.name, domain: input.companyDomain }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    await finalizeApolloUsage(usageId, "FAILED", undefined, "NETWORK_ERROR");
    throw error;
  }

  if (!response.ok) {
    await finalizeApolloUsage(usageId, "FAILED", undefined, `HTTP_${response.status}`);
    throw new Error(`Apollo enrichment failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  const person = payload.person;
  if (!person) {
    await finalizeApolloUsage(usageId, "NO_MATCH");
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
