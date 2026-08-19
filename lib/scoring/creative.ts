import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { AWARD_TIER_WEIGHTS } from "./constants";
import { clamp, normalizeLinear } from "./normalizers";

export function calculateCreativeScore(input: CompanyScoringInput): ScoreComponentResult {
  const awards = input.awards || [];
  const projects = input.projects || [];

  if (awards.length === 0 && projects.length === 0) {
    return {
      score: 50,
      status: "CALCULATED",
      confidence: 40,
    };
  }

  // 1. Award Prestige Sub-score (40%)
  let awardPoints = 0;
  awards.forEach((aw) => {
    const org = (aw.organization || "").toLowerCase();
    const resultMultiplier = aw.result === "winner" ? 1.0 : aw.result === "nominee" ? 0.7 : 0.5;

    if (org.includes("academy") || org.includes("oscar") || org.includes("cannes") || org.includes("bafta")) {
      awardPoints += AWARD_TIER_WEIGHTS.TIER_1 * resultMultiplier;
    } else if (org.includes("venice") || org.includes("berlinale") || org.includes("sundance") || org.includes("emmy")) {
      awardPoints += AWARD_TIER_WEIGHTS.TIER_2 * resultMultiplier;
    } else if (org.includes("goya") || org.includes("spirit") || org.includes("cesar") || org.includes("sxsw")) {
      awardPoints += AWARD_TIER_WEIGHTS.TIER_3 * resultMultiplier;
    } else {
      awardPoints += AWARD_TIER_WEIGHTS.TIER_4 * resultMultiplier;
    }
  });

  const awardScore = normalizeLinear(awardPoints, 0, 300);

  // 2. Festival / Selection Prestige Sub-score (25%)
  const selectionsCount = awards.filter((a) => a.result === "selection" || a.result === "nominee").length;
  const selectionScore = normalizeLinear(selectionsCount, 0, 10);

  // 3. Project Portfolio Prestige Sub-score (35%)
  const featureFilms = projects.filter((p) => p.project_type === "feature_film").length;
  const portfolioScore = normalizeLinear(featureFilms + projects.length * 0.5, 0, 15);

  const totalScore = clamp(
    awardScore * 0.40 + selectionScore * 0.25 + portfolioScore * 0.35
  );

  return {
    score: Math.round(totalScore),
    status: "CALCULATED",
    confidence: awards.length > 0 ? 90 : 65,
  };
}
