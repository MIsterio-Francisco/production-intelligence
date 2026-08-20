/**
 * DATA CONFLICT ENGINE — PRODUCTION INTELLIGENCE V1.3
 * Misterio Color Lab
 * 
 * Detects conflicts across project status, role changes, and outdated trade claims.
 * OPEN conflicts block CALL_NOW readiness.
 */

export interface DataConflictEntry {
  id: string;
  targetId: string;
  claimType: string;
  previousValue: string;
  newValue: string;
  previousSource: string;
  newSource: string;
  detectedAt: string;
  reason: string;
  resolutionStatus: "OPEN" | "RESOLVED" | "IGNORED_WITH_REASON";
}

export function detectDataConflict(params: {
  targetId: string;
  projectStatus?: string;
  releaseDate?: string;
  updatedAt?: string;
  roleTitle?: string;
  roleProvenance?: string;
}): DataConflictEntry | null {
  const { targetId, projectStatus, releaseDate, updatedAt, roleTitle } = params;

  // Conflict Scenario 1: Project marked as post_production but release_date is in the past (>90 days ago)
  if (projectStatus === "post_production" && releaseDate) {
    const releaseTime = new Date(releaseDate).getTime();
    if (!isNaN(releaseTime) && releaseTime < Date.now() - 90 * 24 * 60 * 60 * 1000) {
      return {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetId,
        claimType: "PROJECT_STATUS_VS_RELEASE_DATE",
        previousValue: "post_production",
        newValue: `released_on_${releaseDate}`,
        previousSource: "Trade Press Slate Monitor",
        newSource: "Official Release Catalog",
        detectedAt: new Date().toISOString(),
        reason: `Contradicción: El proyecto figura en posproducción pero su fecha de estreno fue el ${releaseDate}. Posible película ya finalizada.`,
        resolutionStatus: "OPEN",
      };
    }
  }

  // Conflict Scenario 2: Person listed as Head of Production but role updated date is over 365 days old without recent re-verification
  if (roleTitle && updatedAt) {
    const updatedTime = new Date(updatedAt).getTime();
    if (!isNaN(updatedTime) && Date.now() - updatedTime > 365 * 24 * 60 * 60 * 1000) {
      return {
        id: `conflict_role_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetId,
        claimType: "ROLE_FRESHNESS_EXPIRED",
        previousValue: roleTitle,
        newValue: "UNVERIFIED_CURRENT_ROLE",
        previousSource: "Executive Roster Registry",
        newSource: "Automated Expiration Check",
        detectedAt: new Date().toISOString(),
        reason: `Contradicción: El cargo de ${roleTitle} no ha sido revalidado en los últimos 365 días. Requiere verificación de vigencia.`,
        resolutionStatus: "OPEN",
      };
    }
  }

  return null;
}
