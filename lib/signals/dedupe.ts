import { SignalType } from "./types";

export function generateDedupeKey(
  companyId: string,
  signalType: SignalType,
  entityId?: string | null,
  dateISO?: string
): string {
  const datePart = dateISO ? new Date(dateISO).toISOString().slice(0, 10) : "nodate";
  const entityPart = entityId || "noentity";
  return `${companyId}_${signalType}_${entityPart}_${datePart}`;
}
