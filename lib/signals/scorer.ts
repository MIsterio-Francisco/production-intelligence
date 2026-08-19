import { SignalSeverity, SignalType } from "./types";
import { SIGNAL_RECENCY_DECAY } from "./constants";
import { clamp } from "../scoring/normalizers";

export function calculateSignalScore(
  signalType: SignalType,
  severity: SignalSeverity,
  signalDateISO: string,
  mclMatchScore: number = 50,
  momentumScore: number = 50,
  confidence: number = 90
): number {
  // 1. Base Severity Score
  let baseScore = 50;
  if (severity === "CRITICAL") baseScore = 95;
  else if (severity === "HIGH") baseScore = 80;
  else if (severity === "MEDIUM") baseScore = 65;
  else if (severity === "LOW") baseScore = 45;

  // 2. Recency Factor
  const ageDays = (new Date().getTime() - new Date(signalDateISO).getTime()) / (1000 * 60 * 60 * 24);
  let recencyMultiplier = SIGNAL_RECENCY_DECAY.DAYS_181_365;

  if (ageDays <= 7) recencyMultiplier = SIGNAL_RECENCY_DECAY.DAYS_0_7;
  else if (ageDays <= 30) recencyMultiplier = SIGNAL_RECENCY_DECAY.DAYS_8_30;
  else if (ageDays <= 90) recencyMultiplier = SIGNAL_RECENCY_DECAY.DAYS_31_90;
  else if (ageDays <= 180) recencyMultiplier = SIGNAL_RECENCY_DECAY.DAYS_91_180;

  // 3. Combined Score Heuristic
  const score =
    baseScore * 0.4 * recencyMultiplier +
    mclMatchScore * 0.3 +
    momentumScore * 0.2 +
    confidence * 0.1;

  return Math.round(clamp(score, 10, 100));
}
