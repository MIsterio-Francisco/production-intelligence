import { CompanyScoringInput, ScoreComponentResult } from "./types";
import { clamp, normalizeLog } from "./normalizers";

export function calculateSocialScore(input: CompanyScoringInput): ScoreComponentResult {
  const profiles = input.socialProfiles || [];

  if (profiles.length === 0) {
    return {
      score: null,
      status: "INSUFFICIENT_DATA",
      confidence: 0,
    };
  }

  let totalFollowers = 0;
  let engagementSum = 0;
  let validEngagements = 0;

  profiles.forEach((p) => {
    if (p.follower_count) totalFollowers += p.follower_count;
    if (p.engagement_rate) {
      engagementSum += p.engagement_rate;
      validEngagements++;
    }
  });

  if (totalFollowers === 0) {
    return {
      score: null,
      status: "INSUFFICIENT_DATA",
      confidence: 20,
    };
  }

  const followerScore = normalizeLog(totalFollowers, 500, 1000000);
  const avgEngagement = validEngagements > 0 ? engagementSum / validEngagements : 2.0;
  const engagementScore = clamp(avgEngagement * 20); // 5% engagement = 100

  const totalScore = clamp(followerScore * 0.7 + engagementScore * 0.3);

  return {
    score: Math.round(totalScore),
    status: "CALCULATED",
    confidence: validEngagements > 0 ? 90 : 60,
  };
}
