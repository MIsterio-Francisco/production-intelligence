import { CompanyScoringInput, ScoreBreakdown, ScoreExplanation } from "./types";

export function generateScoreExplanation(
  input: CompanyScoringInput,
  breakdown: ScoreBreakdown,
  powerScore: number,
  mclMatchScore: number
): ScoreExplanation {
  const drivers: string[] = [];
  const limitations: string[] = [];

  // Drivers based on high component scores
  if (breakdown.productionScale >= 75) {
    drivers.push("High active project volume and production scale");
  }

  if (breakdown.creative >= 75) {
    drivers.push("Strong award history and film festival prestige");
  }

  if (breakdown.commercial >= 75) {
    drivers.push("Significant theatrical box office or streaming distribution reach");
  }

  if (breakdown.momentum >= 75) {
    drivers.push("High recent production activity in the last 90 days");
  }

  if (breakdown.international >= 75) {
    drivers.push("Extensive international co-production footprint");
  }

  if (breakdown.relationshipAccessibility >= 70) {
    drivers.push("Identified key decision makers for post-production and finishing");
  }

  // Limitations based on missing inputs or low sub-scores
  if (!input.socialProfiles || input.socialProfiles.length === 0) {
    limitations.push("Limited verified social media engagement data");
  }

  if (!input.projects || input.projects.length === 0) {
    limitations.push("Insufficient recent project budget disclosures");
  }

  if (!input.people || input.people.length === 0) {
    limitations.push("Key post-production executive roles unverified");
  }

  if (breakdown.momentum < 50) {
    limitations.push("Lower recent production announcement frequency");
  }

  if (drivers.length === 0) {
    drivers.push("Baseline independent production company presence");
  }

  return {
    drivers,
    limitations,
  };
}
