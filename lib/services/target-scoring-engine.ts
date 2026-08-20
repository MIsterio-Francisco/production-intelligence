/**
 * EXPLAINABLE TARGET SCORING & INDEPENDENT CONFIDENCE ENGINE
 * Misterio Color Lab — Production Intelligence V1.1
 * 
 * Rules:
 * 1. Target Score evaluates commercial attractiveness (0-100) with full score component breakdown.
 * 2. Confidence evaluates evidence solidity independently (HIGH, MEDIUM, LOW).
 * 3. Never uses random numbers, hashes, or LLM-generated scores.
 */

import { TargetScoreBreakdown, ScoreComponent, DataFreshness } from "../../types/commercial";

export interface TargetScoringInput {
  hasActiveProjects: boolean;
  projectStatus?: string | null;
  hasPostProductionProject: boolean;
  hasVerifiedDecisionMaker: boolean;
  decisionMakerCategory?: string;
  hasRecentSignal: boolean;
  dataFreshness: DataFreshness;
  isVerifiedCompany: boolean;
}

export function calculateExplicableTargetScore(input: TargetScoringInput): TargetScoreBreakdown {
  const components: ScoreComponent[] = [];

  // Base score for active audiovisual producer
  let score = 20;
  components.push({
    label: "Active Industry Producer",
    points: 20,
    maxPoints: 20,
    reason: "Productora audiovisual en activo dentro del mercado ibérico/internacional.",
  });

  // Project Phase Points
  if (input.hasPostProductionProject) {
    score += 35;
    components.push({
      label: "Project in Post-Production",
      points: 35,
      maxPoints: 35,
      reason: "Tiene largometraje/serie verificado en fase de posproducción (ventana inmediata para etalonaje y DCP).",
    });
  } else if (input.projectStatus === "production" || input.projectStatus === "filming") {
    score += 25;
    components.push({
      label: "Project in Filming / Production",
      points: 25,
      maxPoints: 35,
      reason: "Tiene proyecto en rodaje activo; ventana clave para Show-LUTs y gestión de dailies.",
    });
  } else if (input.hasActiveProjects) {
    score += 15;
    components.push({
      label: "Active Production Slate",
      points: 15,
      maxPoints: 35,
      reason: "Tiene proyectos activos en catálogo.",
    });
  }

  // Decision Maker Points
  if (input.hasVerifiedDecisionMaker) {
    if (input.decisionMakerCategory === "DIRECT_DECISION_MAKER") {
      score += 20;
      components.push({
        label: "Direct Post-Production Contact Verified",
        points: 20,
        maxPoints: 20,
        reason: "Cuenta con Head of Post o Post Producer verificado.",
      });
    } else {
      score += 15;
      components.push({
        label: "Key Producer / Executive Verified",
        points: 15,
        maxPoints: 20,
        reason: "Cuenta con Head of Production o Productor Ejecutivo verificado.",
      });
    }
  }

  // Signal Recency Points
  if (input.hasRecentSignal) {
    score += 15;
    components.push({
      label: "Recent Commercial Signal",
      points: 15,
      maxPoints: 15,
      reason: "Señales o eventos detectados en los últimos 60 días.",
    });
  }

  // Freshness Bonus
  if (input.dataFreshness === "CURRENT") {
    score += 10;
    components.push({
      label: "Fresh Verified Data",
      points: 10,
      maxPoints: 10,
      reason: "Información verificada en los últimos 90 días.",
    });
  } else if (input.dataFreshness === "RECENT") {
    score += 5;
    components.push({
      label: "Recently Verified Data",
      points: 5,
      maxPoints: 10,
      reason: "Información verificada en los últimos 180 días.",
    });
  }

  const totalScore = Math.min(100, Math.max(0, score));

  const explanation = `Score Comercial ${totalScore}/100 derivado de: ${components.map(c => `+${c.points} (${c.label})`).join(", ")}.`;

  return {
    totalScore,
    components,
    explanation,
  };
}

export function calculateIndependentConfidence(
  evidenceCount: number,
  isVerifiedCompany: boolean,
  hasVerifiedPerson: boolean,
  freshness: DataFreshness
): { level: "HIGH" | "MEDIUM" | "LOW"; score: number; reasoning: string } {
  let confScore = 40;

  if (isVerifiedCompany) confScore += 25;
  if (hasVerifiedPerson) confScore += 20;
  if (evidenceCount >= 2) confScore += 15;

  if (freshness === "STALE" || freshness === "UNKNOWN") {
    confScore -= 20;
  }

  const score = Math.min(100, Math.max(0, confScore));

  let level: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (score >= 80) level = "HIGH";
  else if (score >= 55) level = "MEDIUM";

  let reasoning = `Nivel de confianza ${level} (${score}%). Evidencias verificadas: ${evidenceCount}. Empresa verificada: ${isVerifiedCompany ? "Sí" : "No"}.`;
  if (freshness === "STALE" || freshness === "UNKNOWN") {
    reasoning += " Advertencia: Los datos de verificación no son recientes.";
  }

  return { level, score, reasoning };
}
