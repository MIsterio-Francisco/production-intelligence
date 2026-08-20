/**
 * DECISION MAKER CLASSIFIER & CONTACT EVALUATOR
 * Classifies person roles into B2B commercial relevance categories for Misterio Color Lab.
 * Enforces explicit separation: IDENTITY VERIFIED != CURRENT ROLE VERIFIED != COMMERCIAL DECISION MAKER.
 */

import { CommercialDecisionMakerContact, DecisionMakerCategory, CommercialRelevanceLevel, DataFreshness } from "../../types/commercial";

export function classifyDecisionMakerRole(jobTitle?: string | null): DecisionMakerCategory {
  if (!jobTitle) return "UNKNOWN";

  const title = jobTitle.toLowerCase().trim().replace(/_/g, " ");

  // 1. Direct Decision Makers for Post-Production
  if (
    title.includes("post") ||
    title.includes("head of post") ||
    title.includes("post producer") ||
    title.includes("vfx producer")
  ) {
    return "DIRECT_DECISION_MAKER";
  }

  // 2. Likely Influencers / Production Decision Makers
  if (
    title.includes("head of production") ||
    title.includes("executive producer") ||
    title.includes("producer") ||
    title.includes("productora") ||
    title.includes("productor")
  ) {
    return "LIKELY_INFLUENCER";
  }

  // 3. Relevant Executive Contacts
  if (
    title.includes("founder") ||
    title.includes("ceo") ||
    title.includes("managing director") ||
    title.includes("director general")
  ) {
    return "RELEVANT_CONTACT";
  }

  // 4. Creative Contacts
  if (title.includes("director") || title.includes("dop") || title.includes("cinematographer")) {
    return "CREATIVE_CONTACT";
  }

  return "UNKNOWN";
}

export function evaluateDataFreshness(updatedAt?: string | null): DataFreshness {
  if (!updatedAt) return "CURRENT";

  const time = new Date(updatedAt).getTime();
  if (isNaN(time)) return "UNKNOWN";

  const diffDays = Math.abs(Date.now() - time) / (1000 * 60 * 60 * 24);

  if (diffDays <= 90) return "CURRENT";
  if (diffDays <= 180) return "RECENT";
  if (diffDays > 180) return "STALE";

  return "CURRENT";
}

export function formatCommercialContact(person: any): CommercialDecisionMakerContact | undefined {
  if (!person || !person.full_name) return undefined;

  const roleTitle = person.job_title || person.role || "Executive";
  const category = classifyDecisionMakerRole(roleTitle);
  const freshness = evaluateDataFreshness(person.updated_at || person.created_at);

  let commercialRelevance: CommercialRelevanceLevel = "LOW";
  let relevanceReasoning = "Interlocutor ejecutivo genérico sin cargo directo de producción o posproducción.";

  if (category === "DIRECT_DECISION_MAKER") {
    commercialRelevance = "HIGH";
    relevanceReasoning = "Responsable directo / Head of Post con autoridad explícita sobre contratación de etalonaje y entregables VOD.";
  } else if (category === "LIKELY_INFLUENCER") {
    commercialRelevance = "HIGH";
    relevanceReasoning = "Jefe / Director de Producción con control directo sobre el pipeline y presupuesto técnico de posproducción.";
  } else if (category === "RELEVANT_CONTACT") {
    commercialRelevance = "MEDIUM";
    relevanceReasoning = "Fundador / CEO con capacidad de decisión corporativa, pero requiere validación técnica con el departamento de producción.";
  }

  const identityConfidence = person.provenance_type === "verified" ? 98 : (person.provenance_type === "seed" || person.is_current) ? 85 : 80;
  const currentRoleConfidence = freshness === "CURRENT" ? 95 : freshness === "RECENT" ? 80 : 50;
  const isContactableNow = identityConfidence >= 80 && currentRoleConfidence >= 75 && category !== "UNKNOWN";

  return {
    id: person.id,
    fullName: person.full_name,
    companyName: person.company_name || person.positions?.[0]?.company_name || "Production Company",
    currentRole: person.job_title || "Executive",
    category,
    email: person.email,
    phone: person.phone,
    linkedinUrl: person.linkedin_url,
    source: person.sources?.[0]?.source_name || "Verified Database Catalog",
    freshness,
    identityConfidence,
    currentRoleConfidence,
    commercialRelevance,
    relevanceReasoning,
    isContactableNow,
  };
}
