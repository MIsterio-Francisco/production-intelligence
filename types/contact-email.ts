export type ContactEmailStatus = "VERIFIED" | "PUBLIC" | "INFERRED" | "UNVERIFIED";

export type ContactEmailOwnerType = "COMPANY" | "PERSON";

export interface ContactEmailRecord {
  id: string;
  companyId: string;
  personId?: string;
  ownerType: ContactEmailOwnerType;
  email: string;
  status: ContactEmailStatus;
  sourceType: "OFFICIAL_WEBSITE" | "APOLLO" | "MANUAL" | "PATTERN_INFERENCE";
  sourceUrl?: string;
  providerRecordId?: string;
  verificationProvider?: string;
  verificationResult?: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function isContactableEmail(record: Pick<ContactEmailRecord, "status" | "sourceUrl" | "lastCheckedAt">): boolean {
  if (record.status === "INFERRED" || record.status === "UNVERIFIED") return false;
  if (!record.lastCheckedAt) return false;
  if (record.status === "PUBLIC" && !record.sourceUrl) return false;
  return true;
}
