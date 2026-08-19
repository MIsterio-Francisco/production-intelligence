import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { clamp, normalizeLinear } from "./normalizers";

export function calculateInternationalScore(input: CompanyScoringInput): ScoreComponentResult {
  const projects = input.projects || [];
  const categories = input.categories || [];

  // International co-productions or multi-country project reach
  const isInternationalCategory = categories.includes("international");
  const coproductionProjects = projects.filter(
    (p) => p.company_role === "co_producer" || p.country_code !== input.country_code
  ).length;

  let baseScore = 50;
  if (isInternationalCategory) baseScore += 20;
  baseScore += coproductionProjects * 10;

  return {
    score: Math.round(clamp(baseScore, 0, 100)),
    status: "CALCULATED",
    confidence: projects.length > 0 ? 85 : 60,
  };
}
