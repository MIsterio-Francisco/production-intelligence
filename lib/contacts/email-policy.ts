import { ContactEmailStatus } from "../../types/contact-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailSyntax(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function mapApolloEmailStatus(status?: string | null): ContactEmailStatus {
  switch (status?.trim().toLowerCase()) {
    case "verified":
      return "VERIFIED";
    case "unverified":
    case "likely to engage":
      return "UNVERIFIED";
    default:
      return "UNVERIFIED";
  }
}

export function mayContactStatus(status: ContactEmailStatus): boolean {
  return status === "VERIFIED" || status === "PUBLIC";
}
