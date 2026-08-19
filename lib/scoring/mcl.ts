import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { MCL_MATCH_WEIGHTS } from "./constants";
import { clamp, normalizeLinear, normalizeLog } from "./normalizers";

export function calculateMclMatchScore(
  input: CompanyScoringInput,
  subScores: {
    productionScale: number;
    commercial: number;
    momentum: number;
  }
): { result: ScoreComponentResult; postVfxOpportunity: number; relationshipAccessibility: number } {
  const projects = input.projects || [];
  const people = input.people || [];

  // 1. Production Activity (25%)
  const activeProjs = projects.filter((p) => p.status === "production" || p.status === "post_production").length;
  const postProjs = projects.filter((p) => p.status === "post_production").length;
  const activityScore = normalizeLinear(activeProjs * 3 + postProjs * 4 + projects.length, 0, 12);

  // 2. Post / VFX Opportunity Heuristic (20%) (PRD Section 18)
  const featureFilms = projects.filter((p) => p.project_type === "feature_film").length;
  const highEndTV = projects.filter((p) => p.project_type === "tv_series").length;
  const postVfxOpportunity = clamp(
    normalizeLinear(featureFilms * 4 + highEndTV * 3 + postProjs * 5, 0, 15)
  );

  // 3. Relationship Accessibility (10%) (PRD Section 19)
  const keyRoles = ["head_of_post", "post_producer", "head_of_production", "vfx_producer", "head_of_vfx"];
  const matchingPeople = people.filter((p) => p.is_current && p.role && keyRoles.includes(p.role)).length;
  const relationshipAccessibility = clamp(normalizeLinear(matchingPeople + people.length * 0.5, 0, 5));

  // Combine independent MCL Opportunity weighted components (PRD Section 20)
  const weightedSum =
    activityScore * MCL_MATCH_WEIGHTS.PRODUCTION_ACTIVITY +
    subScores.productionScale * MCL_MATCH_WEIGHTS.PRODUCTION_SCALE +
    postVfxOpportunity * MCL_MATCH_WEIGHTS.POST_VFX_OPPORTUNITY +
    subScores.momentum * MCL_MATCH_WEIGHTS.MOMENTUM +
    subScores.commercial * MCL_MATCH_WEIGHTS.COMMERCIAL_STRENGTH +
    relationshipAccessibility * MCL_MATCH_WEIGHTS.RELATIONSHIP_ACCESSIBILITY;

  const finalScore = clamp(weightedSum);

  return {
    result: {
      score: Math.round(finalScore),
      status: "CALCULATED",
      confidence: matchingPeople > 0 || activeProjs > 0 ? 92 : 75,
    },
    postVfxOpportunity: Math.round(postVfxOpportunity),
    relationshipAccessibility: Math.round(relationshipAccessibility),
  };
}
