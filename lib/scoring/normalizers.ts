// Reusable Pure Normalization Utilities for Scoring Engine v1.0

/**
 * Clamp a number between min and max bounds
 */
export function clamp(val: number, min: number = 0, max: number = 100): number {
  if (isNaN(val) || !isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

/**
 * Linear normalization of raw value between min and max target
 */
export function normalizeLinear(value: number, minRaw: number, maxRaw: number): number {
  if (maxRaw <= minRaw) return 0;
  const ratio = (value - minRaw) / (maxRaw - minRaw);
  return clamp(ratio * 100);
}

/**
 * Logarithmic normalization for scale variables (e.g. social followers, box office)
 */
export function normalizeLog(value: number, minRaw: number = 100, maxRaw: number = 1000000): number {
  if (value <= 0) return 0;
  const safeVal = Math.max(1, value);
  const logVal = Math.log10(safeVal);
  const logMin = Math.log10(Math.max(1, minRaw));
  const logMax = Math.log10(maxRaw);

  if (logMax <= logMin) return 0;
  const ratio = (logVal - logMin) / (logMax - logMin);
  return clamp(ratio * 100);
}

/**
 * Normalizes event recency into 0 - 1 factor based on age in days
 */
export function calculateRecencyFactor(eventDateISO: string, referenceDate: Date = new Date()): number {
  const eventTime = new Date(eventDateISO).getTime();
  if (isNaN(eventTime)) return 0.1;

  const ageDays = (referenceDate.getTime() - eventTime) / (1000 * 60 * 60 * 24);

  if (ageDays <= 30) return 1.0;
  if (ageDays <= 90) return 0.75;
  if (ageDays <= 180) return 0.50;
  if (ageDays <= 365) return 0.25;
  return 0.1;
}
