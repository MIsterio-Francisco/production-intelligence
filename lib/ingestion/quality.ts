import { clamp } from "../scoring/normalizers";

/**
 * Calculates deterministic Data Quality Score (0-100) (PRD Section 13)
 */
export function calculateDataQualityScore(
  data: Record<string, any>,
  sourceTier: number = 2,
  publishedAtISO?: string
): number {
  let score = 40;

  // 1. Source Tier Weight
  if (sourceTier === 1) score += 30;
  else if (sourceTier === 2) score += 20;
  else if (sourceTier === 3) score += 10;
  else if (sourceTier === 4) score -= 10;

  // 2. Field Completeness
  if (data.name && data.name.length > 2) score += 10;
  if (data.country_code && data.country_code.length === 2) score += 10;
  if (data.website_url) score += 10;
  if (data.description && data.description.length > 20) score += 10;

  // 3. Recency Factor
  if (publishedAtISO) {
    const ageDays = (new Date().getTime() - new Date(publishedAtISO).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 30) score += 10;
    else if (ageDays > 365) score -= 15;
  }

  return Math.round(clamp(score, 10, 100));
}
