/**
 * AUTOMATIC DEGRADATION & AUDIT LOG ENGINE — PRODUCTION INTELLIGENCE V1.2
 * Misterio Color Lab
 * 
 * Tracks target state transitions and provides explicit degradation reasons.
 */

import { SalesReadiness, AuditLogEntry } from "../../types/commercial";

export function generateAuditLogEntry(
  previousStatus: SalesReadiness,
  newStatus: SalesReadiness,
  reason: string,
  evidenceClaim?: string
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    previousStatus,
    newStatus,
    reason,
    timestamp: new Date().toISOString(),
    evidenceClaim: evidenceClaim || "Automated System Audit Rules",
  };
}

export function calculateVerificationTimestamps(lastVerifiedAtStr?: string | null): {
  lastVerifiedAt: string;
  nextVerificationAt: string;
  isExpired: boolean;
} {
  const now = new Date();
  const lastVerifiedAt = lastVerifiedAtStr || now.toISOString();

  const lastVerifiedDate = new Date(lastVerifiedAt);
  const nextVerificationDate = new Date(lastVerifiedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days interval

  const isExpired = now.getTime() > nextVerificationDate.getTime();

  return {
    lastVerifiedAt,
    nextVerificationAt: nextVerificationDate.toISOString(),
    isExpired,
  };
}
