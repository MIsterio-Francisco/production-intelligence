import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { EVENT_WEIGHTS } from "./constants";
import { clamp, calculateRecencyFactor, normalizeLinear } from "./normalizers";

export function calculateMomentumScore(input: CompanyScoringInput): ScoreComponentResult {
  const events = input.events || [];
  const projects = input.projects || [];

  if (events.length === 0 && projects.length === 0) {
    return {
      score: 50,
      status: "CALCULATED",
      confidence: 50,
    };
  }

  const now = new Date();
  let weightedPoints = 0;

  // 1. Recency-weighted events
  events.forEach((ev) => {
    const baseWeight = EVENT_WEIGHTS[ev.event_type] || 60;
    const recencyFactor = calculateRecencyFactor(ev.event_date, now);
    weightedPoints += baseWeight * recencyFactor;
  });

  // 2. Recency-weighted project announcements
  projects.forEach((proj) => {
    if (proj.release_date) {
      const recencyFactor = calculateRecencyFactor(proj.release_date, now);
      if (proj.status === "production" || proj.status === "post_production") {
        weightedPoints += 90 * recencyFactor;
      }
    }
  });

  const finalScore = normalizeLinear(weightedPoints, 0, 250);

  return {
    score: Math.round(clamp(finalScore)),
    status: "CALCULATED",
    confidence: events.length > 0 ? 88 : 60,
  };
}
