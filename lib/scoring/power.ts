import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { POWER_SCORE_WEIGHTS } from "./constants";
import { clamp } from "./normalizers";

export function calculatePowerScore(
  input: CompanyScoringInput,
  subScores: {
    productionScale: number;
    creative: number;
    commercial: number;
    momentum: number;
    international: number;
    social: number | null;
  }
): ScoreComponentResult {
  const { productionScale, creative, commercial, momentum, international, social } = subScores;

  let weightedSum = 0;
  let weightUsed = 0;

  weightedSum += productionScale * POWER_SCORE_WEIGHTS.PRODUCTION_SCALE;
  weightUsed += POWER_SCORE_WEIGHTS.PRODUCTION_SCALE;

  weightedSum += creative * POWER_SCORE_WEIGHTS.CREATIVE;
  weightUsed += POWER_SCORE_WEIGHTS.CREATIVE;

  weightedSum += commercial * POWER_SCORE_WEIGHTS.COMMERCIAL;
  weightUsed += POWER_SCORE_WEIGHTS.COMMERCIAL;

  weightedSum += momentum * POWER_SCORE_WEIGHTS.MOMENTUM;
  weightUsed += POWER_SCORE_WEIGHTS.MOMENTUM;

  weightedSum += international * POWER_SCORE_WEIGHTS.INTERNATIONAL;
  weightUsed += POWER_SCORE_WEIGHTS.INTERNATIONAL;

  if (social !== null) {
    weightedSum += social * POWER_SCORE_WEIGHTS.SOCIAL;
    weightUsed += POWER_SCORE_WEIGHTS.SOCIAL;
  }

  const finalScore = clamp(weightedSum / weightUsed);

  return {
    score: Math.round(finalScore),
    status: "CALCULATED",
    confidence: social !== null ? 95 : 85,
  };
}
