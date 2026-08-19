import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { clamp, normalizeLinear, normalizeLog } from "./normalizers";

export function calculateCommercialScore(input: CompanyScoringInput): ScoreComponentResult {
  const projects = input.projects || [];
  const employees = input.employee_count_max || input.employee_count_min || 10;

  if (projects.length === 0 && !input.employee_count_max) {
    return {
      score: 55,
      status: "CALCULATED",
      confidence: 45,
    };
  }

  // 1. Active & Released Output Volume (35%)
  const activeProjs = projects.filter((p) => p.status === "production" || p.status === "post_production").length;
  const releasedProjs = projects.filter((p) => p.status === "released" || p.status === "completed").length;
  const outputScore = normalizeLinear(activeProjs * 2 + releasedProjs, 0, 10);

  // 2. Budget & Scale Evidence (35%)
  let maxBudget = 0;
  projects.forEach((p) => {
    if (p.budget_max && p.budget_max > maxBudget) {
      maxBudget = p.budget_max;
    }
  });

  const budgetScore = maxBudget > 0 ? normalizeLog(maxBudget, 500000, 50000000) : normalizeLinear(employees, 5, 200);

  // 3. Platform Distribution Presence (30%)
  const majorDist = projects.filter((p) => p.company_role === "production_company" || p.company_role === "producer").length;
  const distScore = normalizeLinear(majorDist, 0, 8);

  const totalScore = clamp(
    outputScore * 0.35 + budgetScore * 0.35 + distScore * 0.30
  );

  return {
    score: Math.round(totalScore),
    status: "CALCULATED",
    confidence: maxBudget > 0 ? 90 : 70,
  };
}
