import { IntelligenceSignal, SignalType } from "./types";
import { generateDedupeKey } from "./dedupe";
import { SIGNAL_BASE_SEVERITY, SIGNAL_EXPIRATION_DAYS } from "./constants";
import { calculateSignalScore } from "./scorer";

export interface CompanySignalInput {
  company: {
    id: string;
    name: string;
    mcl_match_score?: number | null;
    momentum_score?: number | null;
    power_score?: number | null;
  };
  projects: any[];
  people: any[];
  events: any[];
  awards: any[];
  previousScores?: {
    power_score?: number;
    mcl_match_score?: number;
    momentum_score?: number;
  } | null;
}

export function detectAllSignals(input: CompanySignalInput): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];

  const mclMatch = input.company.mcl_match_score || 50;
  const momentum = input.company.momentum_score || 50;
  const companyId = input.company.id;
  const companyName = input.company.name;
  const now = new Date();

  // 1. Detect Projects Entering Post Production (PRD Section 13)
  input.projects.forEach((p) => {
    if (p.status === "post_production") {
      const dateISO = p.release_date || p.created_at || now.toISOString();
      const expirationDays = SIGNAL_EXPIRATION_DAYS["PROJECT_ENTERED_POST"];
      const expiresAt = new Date(now.getTime() + expirationDays * 86400000).toISOString();
      const dedupeKey = generateDedupeKey(companyId, "PROJECT_ENTERED_POST", p.id, dateISO);

      signals.push({
        company_id: companyId,
        project_id: p.id,
        signal_type: "PROJECT_ENTERED_POST",
        severity: SIGNAL_BASE_SEVERITY["PROJECT_ENTERED_POST"],
        signal_score: calculateSignalScore("PROJECT_ENTERED_POST", "HIGH", dateISO, mclMatch, momentum, 95),
        confidence: 95,
        status: "ACTIVE",
        signal_title: `Project Entered Post-Production: ${p.title}`,
        signal_description: `${companyName} has feature/series project "${p.title}" currently in post-production.`,
        signal_date: dateISO,
        expires_at: expiresAt,
        dedupe_key: dedupeKey,
        evidence: {
          claim: "Project actively in post-production phase",
          facts: [`Project type: ${p.project_type || "Film"}`, `Director: ${p.director_name || "N/A"}`],
          mclMatchScore: mclMatch,
          momentumScore: momentum,
        },
      });
    } else if (p.status === "production") {
      const dateISO = p.release_date || p.created_at || now.toISOString();
      const expiresAt = new Date(now.getTime() + 45 * 86400000).toISOString();
      const dedupeKey = generateDedupeKey(companyId, "PROJECT_ENTERED_PRODUCTION", p.id, dateISO);

      signals.push({
        company_id: companyId,
        project_id: p.id,
        signal_type: "PROJECT_ENTERED_PRODUCTION",
        severity: "HIGH",
        signal_score: calculateSignalScore("PROJECT_ENTERED_PRODUCTION", "HIGH", dateISO, mclMatch, momentum, 90),
        confidence: 90,
        status: "ACTIVE",
        signal_title: `Production Started: ${p.title}`,
        signal_description: `${companyName} has principal photography underway for "${p.title}".`,
        signal_date: dateISO,
        expires_at: expiresAt,
        dedupe_key: dedupeKey,
        evidence: {
          claim: "Principal photography in progress",
          facts: [`Director: ${p.director_name || "N/A"}`],
          mclMatchScore: mclMatch,
          momentumScore: momentum,
        },
      });
    }
  });

  // 2. Detect New Key Executive Appointments (PRD Section 13)
  input.people.forEach((person) => {
    if (person.is_current && person.role) {
      const dateISO = person.created_at || now.toISOString();
      const expiresAt = new Date(now.getTime() + 60 * 86400000).toISOString();
      const dedupeKey = generateDedupeKey(companyId, "NEW_EXECUTIVE", person.id, dateISO);

      signals.push({
        company_id: companyId,
        person_id: person.id,
        signal_type: "NEW_EXECUTIVE",
        severity: "MEDIUM",
        signal_score: calculateSignalScore("NEW_EXECUTIVE", "MEDIUM", dateISO, mclMatch, momentum, 90),
        confidence: 90,
        status: "ACTIVE",
        signal_title: `Executive Appointed: ${person.full_name}`,
        signal_description: `${person.full_name} appointed as ${person.role?.replace("_", " ")} at ${companyName}.`,
        signal_date: dateISO,
        expires_at: expiresAt,
        dedupe_key: dedupeKey,
        evidence: {
          claim: "Key executive identified in structured graph",
          facts: [`Role: ${person.role}`, `Seniority: ${person.seniority || "Executive"}`],
          mclMatchScore: mclMatch,
        },
      });
    }
  });

  // 3. Detect MCL Commercial Opportunity Signals (PRD Section 16)
  if (mclMatch >= 80 && momentum >= 65) {
    const dateISO = now.toISOString();
    const expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
    const dedupeKey = generateDedupeKey(companyId, "MCL_OPPORTUNITY", null, dateISO.slice(0, 7));

    signals.push({
      company_id: companyId,
      signal_type: "MCL_OPPORTUNITY",
      severity: "CRITICAL",
      signal_score: calculateSignalScore("MCL_OPPORTUNITY", "CRITICAL", dateISO, mclMatch, momentum, 95),
      confidence: 95,
      status: "ACTIVE",
      signal_title: `High Commercial Opportunity (MCL Match ${mclMatch})`,
      signal_description: `${companyName} exhibits strong commercial opportunity signals with high momentum (${momentum}) and active slate.`,
      signal_date: dateISO,
      expires_at: expiresAt,
      dedupe_key: dedupeKey,
      evidence: {
        claim: "Potential commercial post-production opportunity",
        facts: [
          `MCL Match Score: ${mclMatch}`,
          `Momentum Score: ${momentum}`,
          `Active Projects Count: ${input.projects.length}`,
        ],
        mclMatchScore: mclMatch,
        momentumScore: momentum,
      },
    });
  }

  // 4. Detect Score Change Signals (PRD Section 14)
  if (input.previousScores) {
    const prevMcl = input.previousScores.mcl_match_score || 50;
    const diffMcl = mclMatch - prevMcl;

    if (Math.abs(diffMcl) >= 5) {
      const dateISO = now.toISOString();
      const expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
      const dedupeKey = generateDedupeKey(companyId, "SCORE_CHANGE", null, dateISO.slice(0, 10));

      signals.push({
        company_id: companyId,
        signal_type: "SCORE_CHANGE",
        severity: "MEDIUM",
        signal_score: calculateSignalScore("SCORE_CHANGE", "MEDIUM", dateISO, mclMatch, momentum, 90),
        confidence: 90,
        status: "ACTIVE",
        signal_title: `MCL Match Score Changed: ${prevMcl} → ${mclMatch}`,
        signal_description: `MCL Match score shifted by ${diffMcl > 0 ? "+" : ""}${diffMcl} points based on updated project activity.`,
        signal_date: dateISO,
        expires_at: expiresAt,
        dedupe_key: dedupeKey,
        evidence: {
          claim: "Deterministic score threshold change",
          previousScore: prevMcl,
          currentScore: mclMatch,
        },
      });
    }
  }

  return signals;
}
