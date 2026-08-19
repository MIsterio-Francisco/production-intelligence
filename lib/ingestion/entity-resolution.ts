import { EntityResolutionResult } from "./types";
import { ENTITY_MATCH_THRESHOLDS } from "./constants";

export interface ExistingEntityCandidate {
  id: string;
  name: string;
  website_url?: string | null;
  country_code?: string | null;
  aliases?: string[];
}

/**
 * Normalizes entity name for string matching (lowercase, strip legal suffixes)
 */
export function normalizeEntityName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(s\.l\.|s\.a\.|s\.l|s\.a|llc|inc|ltd|sa|sl|corp|gmbh|co|limited|productions|films|pictures|studios)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

/**
 * Executes deterministic entity resolution hierarchy (PRD Section 14 & 15)
 */
export function resolveCompanyEntity(
  incomingName: string,
  incomingWebsite?: string,
  existingCompanies: ExistingEntityCandidate[] = []
): EntityResolutionResult {
  const normIncoming = normalizeEntityName(incomingName);

  if (!normIncoming) {
    return {
      status: "UNMATCHED",
      confidence: 0,
      reason: "Empty incoming company name",
    };
  }

  // 1. Exact website domain match (Highest Confidence - 98%)
  if (incomingWebsite) {
    const normDomain = incomingWebsite.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
    const domainMatch = existingCompanies.find((c) => {
      if (!c.website_url) return false;
      const cDomain = c.website_url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
      return cDomain === normDomain && normDomain.length > 3;
    });

    if (domainMatch) {
      return {
        status: "MATCHED",
        matchedId: domainMatch.id,
        matchedName: domainMatch.name,
        confidence: 98,
        reason: "Exact website domain match",
      };
    }
  }

  // 2. Exact normalized name match (Confidence - 95%)
  const exactNameMatch = existingCompanies.find((c) => normalizeEntityName(c.name) === normIncoming);
  if (exactNameMatch) {
    return {
      status: "MATCHED",
      matchedId: exactNameMatch.id,
      matchedName: exactNameMatch.name,
      confidence: 95,
      reason: "Exact normalized name match",
    };
  }

  // 3. Alias match (Confidence - 90%)
  const aliasMatch = existingCompanies.find((c) =>
    (c.aliases || []).some((a) => normalizeEntityName(a) === normIncoming)
  );
  if (aliasMatch) {
    return {
      status: "MATCHED",
      matchedId: aliasMatch.id,
      matchedName: aliasMatch.name,
      confidence: 90,
      reason: "Matched registered company alias",
    };
  }

  // 4. Strong substring match (Possible Match - 70%)
  const partialMatch = existingCompanies.find((c) => {
    const normC = normalizeEntityName(c.name);
    return normC.length > 4 && (normC.includes(normIncoming) || normIncoming.includes(normC));
  });

  if (partialMatch) {
    return {
      status: "POSSIBLE_MATCH",
      matchedId: partialMatch.id,
      matchedName: partialMatch.name,
      confidence: 70,
      reason: "Strong substring alias match",
    };
  }

  return {
    status: "UNMATCHED",
    confidence: 0,
    reason: "No matching company found in intelligence graph",
  };
}
