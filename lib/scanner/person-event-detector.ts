/**
 * PERSON EVENT DETECTOR — PRODUCTION INTELLIGENCE V1.5
 * Misterio Color Lab
 * 
 * Detects decision-maker personnel moves, appointments, and role changes.
 */

import { RawSignal, PersonEvent } from "../../types/commercial";

export class PersonEventDetector {
  public static detectPersonEvent(signal: RawSignal): PersonEvent | null {
    const text = `${signal.title} ${signal.contentSummary || ""}`.toLowerCase();

    let eventType: PersonEvent["eventType"] | null = null;
    let newRole: string | undefined = signal.roleTitle;

    if (text.includes("joins as head of production") || text.includes("nombra director de producción")) {
      eventType = "PERSON_JOINED";
      newRole = "Head of Production";
    } else if (text.includes("head of post") || text.includes("jefe de posproducción")) {
      eventType = "ROLE_CHANGED";
      newRole = "Head of Post Production";
    } else if (text.includes("departs") || text.includes("leaves") || text.includes("deja la productora")) {
      eventType = "PERSON_LEFT";
    }

    if (!eventType) return null;

    return {
      id: `per_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      personName: signal.personName || "Executive Contact",
      companyName: signal.entityName || "Production Company",
      eventType,
      newRole,
      eventDate: signal.publishedAt,
      source: signal.sourceId,
      sourceTier: signal.sourceTier,
      confidence: signal.sourceTier === "TIER_1_OFFICIAL" ? "HIGH" : "MEDIUM",
      isEvidenceBased: true,
      status: signal.sourceTier === "TIER_1_OFFICIAL" ? "VERIFIED" : "UNVERIFIED",
    };
  }
}
