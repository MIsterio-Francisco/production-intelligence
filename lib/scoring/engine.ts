import { CompanyScoringInput, ComprehensiveScoreResult, SCORING_ENGINE_VERSION } from "./types";
import { calculateCreativeScore } from "./creative";
import { calculateCommercialScore } from "./commercial";
import { calculateMomentumScore } from "./momentum";
import { calculateInternationalScore } from "./international";
import { calculateSocialScore } from "./social";
import { calculatePowerScore } from "./power";
import { calculateMclMatchScore } from "./mcl";
import { calculateOverallConfidence } from "./confidence";
import { generateScoreExplanation } from "./explanations";
import { normalizeLinear } from "./normalizers";

export function calculateAllCompanyScores(input: CompanyScoringInput): ComprehensiveScoreResult {
  const projects = input.projects || [];
  const activeProjs = projects.filter((p) => p.status === "production" || p.status === "post_production").length;
  const productionScale = Math.round(normalizeLinear(activeProjs * 3 + projects.length * 2, 0, 15));

  const creativeRes = calculateCreativeScore(input);
  const commercialRes = calculateCommercialScore(input);
  const momentumRes = calculateMomentumScore(input);
  const internationalRes = calculateInternationalScore(input);
  const socialRes = calculateSocialScore(input);

  const creative = creativeRes.score || 50;
  const commercial = commercialRes.score || 50;
  const momentum = momentumRes.score || 50;
  const international = internationalRes.score || 50;

  const powerRes = calculatePowerScore(input, {
    productionScale,
    creative,
    commercial,
    momentum,
    international,
    social: socialRes.score,
  });

  const { result: mclRes, postVfxOpportunity, relationshipAccessibility } = calculateMclMatchScore(input, {
    productionScale,
    commercial,
    momentum,
  });

  const { confidence, tier } = calculateOverallConfidence(input);

  const breakdown = {
    productionScale,
    creative,
    commercial,
    momentum,
    international,
    social: socialRes.score,
    postVfxOpportunity,
    relationshipAccessibility,
  };

  const explanation = generateScoreExplanation(input, breakdown, powerRes.score!, mclRes.score!);

  return {
    companyId: input.id,
    engineVersion: SCORING_ENGINE_VERSION,
    calculatedAt: new Date().toISOString(),
    powerScore: powerRes.score!,
    creativeScore: creative,
    commercialScore: commercial,
    momentumScore: momentum,
    internationalScore: international,
    socialScore: socialRes.score,
    mclMatchScore: mclRes.score!,
    confidence,
    confidenceTier: tier,
    breakdown,
    explanation,
  };
}
