import { CompanyScoringInput, ConfidenceTier } from "./types";
import { clamp } from "./normalizers";

export function calculateOverallConfidence(input: CompanyScoringInput): { confidence: number; tier: ConfidenceTier } {
  let score = 50;

  // Projects input completeness
  if (input.projects && input.projects.length > 0) score += 20;

  // People / decision makers input completeness
  if (input.people && input.people.length > 0) score += 15;

  // Awards input completeness
  if (input.awards && input.awards.length > 0) score += 10;

  // Events input completeness
  if (input.events && input.events.length > 0) score += 10;

  // Social input completeness
  if (input.socialProfiles && input.socialProfiles.length > 0) score += 5;

  const finalConfidence = Math.round(clamp(score, 0, 98));

  let tier: ConfidenceTier = "MEDIUM_CONFIDENCE";
  if (finalConfidence >= 80) tier = "HIGH_CONFIDENCE";
  else if (finalConfidence >= 50) tier = "MEDIUM_CONFIDENCE";
  else if (finalConfidence >= 30) tier = "LOW_CONFIDENCE";
  else tier = "INSUFFICIENT_DATA";

  return { confidence: finalConfidence, tier };
}
