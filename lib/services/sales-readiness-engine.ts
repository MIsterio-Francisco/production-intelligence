/**
 * SALES READINESS ENGINE — PRODUCTION INTELLIGENCE V1.4
 * Misterio Color Lab
 * 
 * Evaluates real sales readiness for commercial outreach:
 * CALL_NOW | CONTACT_SOON | RESEARCH_FIRST | DO_NOT_CONTACT.
 * Enforces strict Claim-Level Verification, Data Conflict blocking, and Historical Signal Invalidation.
 */

import {
  SalesReadiness,
  CommercialDecisionMakerContact,
  DataFreshness,
  CommercialWhyNowTrigger,
  DataConflictEntry,
  ProjectLifecycleState,
  SignalStatus,
} from "../../types/commercial";
import { ProjectActivityStatus } from "./freshness-engine";

export interface SalesReadinessEvaluation {
  readiness: SalesReadiness;
  reasoning: string;
  callOpening?: {
    openingText: string;
    whyThisCompany: string;
    whyNow: string;
    whoToAskFor: string;
    mclOffer: string;
    validationQuestion: string;
  };
}

export function evaluateSalesReadiness(params: {
  projectActivity: ProjectActivityStatus;
  currentProjectState?: ProjectLifecycleState;
  projectFreshness: DataFreshness;
  contact?: CommercialDecisionMakerContact;
  serviceFitLevel: string;
  whyNow?: CommercialWhyNowTrigger;
  whyNowStatus?: SignalStatus;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  companyName: string;
  projectTitle?: string;
  dataConflict?: DataConflictEntry | null;
}): SalesReadinessEvaluation {
  const {
    projectActivity,
    currentProjectState,
    projectFreshness,
    contact,
    serviceFitLevel,
    whyNow,
    whyNowStatus,
    confidenceLevel,
    companyName,
    projectTitle,
    dataConflict,
  } = params;

  // 1. HARD BLOCK: Released / Completed / Cancelled / Shelved projects
  if (
    currentProjectState === "RELEASED" ||
    currentProjectState === "COMPLETED" ||
    currentProjectState === "CANCELLED" ||
    currentProjectState === "SHELVED" ||
    projectActivity === "PROJECT_COMPLETED"
  ) {
    const isReleased = currentProjectState === "RELEASED";
    return {
      readiness: "DO_NOT_CONTACT",
      reasoning: isReleased
        ? "DEGRADED BECAUSE: Historical pre-production signal superseded by theatrical/streaming release evidence."
        : "DEGRADED BECAUSE: Proyecto completado, inactivo o sin necesidad técnica de servicios MCL demostrable.",
    };
  }

  // 2. SUPERSEDED OR HISTORICAL SIGNAL BLOCKER: Obsolete pre-production or past signals cannot drive CALL_NOW
  const statusStr = (whyNowStatus || whyNow?.signalStatus) as string | undefined;
  if (statusStr === "SUPERSEDED" || statusStr === "HISTORICAL" || statusStr === "STALE" || statusStr === "INVALID") {
    return {
      readiness: "DO_NOT_CONTACT",
      reasoning: "DEGRADED BECAUSE: Historical pre-production signal superseded by theatrical release evidence.",
    };
  }

  // 3. DATA_CONFLICT BLOCKER: Open data conflict prevents CALL_NOW immediately
  if (dataConflict && dataConflict.resolutionStatus === "OPEN") {
    return {
      readiness: "RESEARCH_FIRST",
      reasoning: `DEGRADED BECAUSE: ${dataConflict.reason}`,
    };
  }

  // 4. DO_NOT_CONTACT: Zero activity or unknown service fit
  if (projectActivity === "PROJECT_UNKNOWN" || serviceFitLevel === "UNKNOWN") {
    return {
      readiness: "DO_NOT_CONTACT",
      reasoning: "DEGRADED BECAUSE: Proyecto inactivo o sin necesidad técnica de servicios MCL demostrable.",
    };
  }

  // 5. RESEARCH_FIRST: Missing contact, unverified role, or STALE project date
  if (
    !contact ||
    !contact.isContactableNow ||
    projectFreshness === "STALE" ||
    projectActivity === "PROJECT_STALE"
  ) {
    return {
      readiness: "RESEARCH_FIRST",
      reasoning: "DEGRADED BECAUSE: Falta interlocutor de posproducción verificado o los datos del proyecto están desactualizados (>180 días).",
    };
  }

  // 6. CALL_NOW Requirements Check
  const isPostOrFilming = projectActivity === "PROJECT_ACTIVE" && (currentProjectState === "POST_PRODUCTION" || currentProjectState === "IN_PRODUCTION" || currentProjectState === undefined);
  const currentSignalStatus = (whyNowStatus || whyNow?.signalStatus) as string | undefined;
  const hasFreshWhyNow = Boolean(whyNow && whyNow.hasTemporalEvidence && whyNow.freshness !== "STALE" && currentSignalStatus !== "SUPERSEDED");
  const isHighRelevanceRole = contact.category === "DIRECT_DECISION_MAKER" || contact.category === "LIKELY_INFLUENCER";

  if (isPostOrFilming && hasFreshWhyNow && isHighRelevanceRole && confidenceLevel === "HIGH") {
    return {
      readiness: "CALL_NOW",
      reasoning: "Oportunidad de alta intención: proyecto activo en posproducción/rodaje, decisión maker de producción verificado y evidencia 'Why Now' reciente.",
      callOpening: {
        openingText: `Hola ${contact.fullName.split(" ")[0]}, os contacto de Misterio Color Lab en Madrid respecto al proyecto "${projectTitle || "en curso"}"...`,
        whyThisCompany: `${companyName} es una productora líder en proyectos de ficción/thriller con distribución en plataformas y cines.`,
        whyNow: whyNow?.title || "Entrada verificada en fase técnica de rodaje/posproducción.",
        whoToAskFor: `${contact.fullName} (${contact.currentRole})`,
        mclOffer: "Salas de Etalonaje 4K HDR Dolby Vision, Show-LUTs pre-posproducción y Deliveries VOD IMF.",
        validationQuestion: `¿Estáis gestionando internamente el finishing y etalonaje de "${projectTitle || "este proyecto"}", o estáis abiertos a evaluar nuestras salas 4K HDR en Madrid?`,
      },
    };
  }

  // 7. CONTACT_SOON: Active/recent project + verified contact, but earlier stage or medium confidence
  return {
    readiness: "CONTACT_SOON",
    reasoning: "Oportunidad relevante en fase de maduración: proyecto activo con interlocutor verificado. Contactar para prospección o envío de reel.",
    callOpening: {
      openingText: `Hola ${contact.fullName.split(" ")[0]}, te contacto desde Misterio Color Lab para presentaros nuestros servicios de posproducción...`,
      whyThisCompany: `${companyName} produce slates cinematográficos de calidad.`,
      whyNow: whyNow?.title || "Proyecto activo en preproducción o rodaje.",
      whoToAskFor: `${contact.fullName} (${contact.currentRole})`,
      mclOffer: "Asesoría de pipeline de color, Show-LUTs y servicios de sala de revisión en Madrid.",
      validationQuestion: `¿Tenéis ya cerrado el estudio de posproducción para vuestros próximos títulos o queréis que os enviemos nuestra demostración de salas 4K HDR?`,
    },
  };
}
