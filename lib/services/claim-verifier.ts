/**
 * CLAIM-LEVEL VERIFIER SERVICE — PRODUCTION INTELLIGENCE V1.3
 * Misterio Color Lab
 * 
 * Atomically verifies individual claims across identity, project status, role, service fit, and why now triggers.
 */

export type ClaimVerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "UNVERIFIED"
  | "CONTRADICTED"
  | "UNKNOWN";

export interface ClaimVerificationResult {
  claimType: string;
  status: ClaimVerificationStatus;
  confidenceScore: number; // 0-100
  reasoning: string;
  sourceTier?: "TIER_1_OFFICIAL" | "TIER_2_TRADE_PRESS" | "TIER_3_SECONDARY" | "UNKNOWN";
  verifiedAt: string;
}

export function verifyCompanyIdentityClaim(company?: any): ClaimVerificationResult {
  if (!company || !company.id) {
    return {
      claimType: "COMPANY_IDENTITY",
      status: "UNVERIFIED",
      confidenceScore: 0,
      reasoning: "Compañía inexistente o id no provisto.",
      sourceTier: "UNKNOWN",
      verifiedAt: new Date().toISOString(),
    };
  }

  const isOfficial = company.provenance_type === "verified";
  return {
    claimType: "COMPANY_IDENTITY",
    status: isOfficial ? "VERIFIED" : "PARTIALLY_VERIFIED",
    confidenceScore: isOfficial ? 98 : 70,
    reasoning: isOfficial
      ? `Registro verificado de empresa: ${company.name}`
      : `Datos base de semilla para ${company.name}`,
    sourceTier: isOfficial ? "TIER_1_OFFICIAL" : "TIER_2_TRADE_PRESS",
    verifiedAt: company.updated_at || new Date().toISOString(),
  };
}

export function verifyCurrentRoleClaim(contact?: any): ClaimVerificationResult {
  if (!contact || !contact.id) {
    return {
      claimType: "CURRENT_ROLE",
      status: "UNVERIFIED",
      confidenceScore: 0,
      reasoning: "Sin interlocutor asignado a la empresa.",
      sourceTier: "UNKNOWN",
      verifiedAt: new Date().toISOString(),
    };
  }

  const hasConfidence = contact.currentRoleConfidence >= 75;
  const isDirect = contact.category === "DIRECT_DECISION_MAKER" || contact.category === "LIKELY_INFLUENCER";

  if (hasConfidence && isDirect) {
    return {
      claimType: "CURRENT_ROLE",
      status: "VERIFIED",
      confidenceScore: contact.currentRoleConfidence || 95,
      reasoning: `Cargo actual verificado: ${contact.currentRole} en ${contact.companyName}`,
      sourceTier: "TIER_1_OFFICIAL",
      verifiedAt: new Date().toISOString(),
    };
  } else if (hasConfidence) {
    return {
      claimType: "CURRENT_ROLE",
      status: "PARTIALLY_VERIFIED",
      confidenceScore: contact.currentRoleConfidence || 80,
      reasoning: `Cargo corporativo verificado (${contact.currentRole}), pero relevancia de posproducción indirecta.`,
      sourceTier: "TIER_2_TRADE_PRESS",
      verifiedAt: new Date().toISOString(),
    };
  } else {
    return {
      claimType: "CURRENT_ROLE",
      status: "UNVERIFIED",
      confidenceScore: 40,
      reasoning: `Cargo histórico desactualizado o confidencia insuficiente para ${contact.fullName}.`,
      sourceTier: "TIER_3_SECONDARY",
      verifiedAt: new Date().toISOString(),
    };
  }
}

export function verifyProjectStatusClaim(project?: any): ClaimVerificationResult {
  if (!project || !project.id) {
    return {
      claimType: "PROJECT_STATUS",
      status: "UNVERIFIED",
      confidenceScore: 0,
      reasoning: "Sin proyecto activo asociado a la productora.",
      sourceTier: "UNKNOWN",
      verifiedAt: new Date().toISOString(),
    };
  }

  const rawStatus = (project.status || "").toLowerCase();

  if (rawStatus === "completed" || rawStatus === "released") {
    return {
      claimType: "PROJECT_STATUS",
      status: "CONTRADICTED",
      confidenceScore: 90,
      reasoning: `Proyecto "${project.title}" finalizado/estrenado. Oportunidad caducada.`,
      sourceTier: "TIER_1_OFFICIAL",
      verifiedAt: project.updated_at || new Date().toISOString(),
    };
  }

  if (rawStatus === "post_production" || rawStatus === "production") {
    return {
      claimType: "PROJECT_STATUS",
      status: "VERIFIED",
      confidenceScore: 95,
      reasoning: `Proyecto "${project.title}" verificado en fase ${rawStatus}.`,
      sourceTier: "TIER_2_TRADE_PRESS",
      verifiedAt: project.updated_at || new Date().toISOString(),
    };
  }

  return {
    claimType: "PROJECT_STATUS",
    status: "PARTIALLY_VERIFIED",
    confidenceScore: 60,
    reasoning: `Proyecto "${project.title}" en fase de desarrollo o preproducción.`,
    sourceTier: "TIER_2_TRADE_PRESS",
    verifiedAt: project.updated_at || new Date().toISOString(),
  };
}
