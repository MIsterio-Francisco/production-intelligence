import { detectAllSignals } from "../lib/signals/detectors";
import { calculateSignalScore } from "../lib/signals/scorer";
import { generateDedupeKey } from "../lib/signals/dedupe";
import { buildEvidencePacket } from "../lib/ai/packet";
import { createFallbackBrief, generateBriefContent } from "../lib/ai/brief-service";

console.log("==========================================");
console.log("RUNNING PHASE 5 SIGNALS & AI UNIT TESTS");
console.log("==========================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

// TEST 1: Deduplication Key Generation
const dedupe1 = generateDedupeKey("comp1", "PROJECT_ENTERED_POST", "proj1", "2026-08-19");
const dedupe2 = generateDedupeKey("comp1", "PROJECT_ENTERED_POST", "proj1", "2026-08-19");
assert(dedupe1 === dedupe2, "Dedupe key generation is deterministic and equal for identical inputs");

// TEST 2: Signal Scorer Calculation
const scoreHigh = calculateSignalScore("PROJECT_ENTERED_POST", "HIGH", new Date().toISOString(), 90, 85, 95);
const scoreLow = calculateSignalScore("PROJECT_COMPLETED", "LOW", "2025-01-01", 40, 30, 60);
assert(scoreHigh >= 80 && scoreHigh <= 100, "High severity recent signal produces high score");
assert(scoreLow < scoreHigh, "Older low severity signal produces lower score");

// TEST 3: Signal Detection - Post Production
const companyInput = {
  company: { id: "c1", name: "Morena Films", mcl_match_score: 94, momentum_score: 90 },
  projects: [
    { id: "p1", title: "La Infiltrada", status: "post_production", project_type: "feature_film" },
  ],
  people: [
    { id: "per1", full_name: "Pedro Uriol", role: "head_of_production", is_current: true },
  ],
  events: [],
  awards: [],
};

const detectedSignals = detectAllSignals(companyInput);
assert(detectedSignals.length >= 2, "Detects post-production and executive signals");
assert(detectedSignals.some((s) => s.signal_type === "PROJECT_ENTERED_POST"), "Detects PROJECT_ENTERED_POST signal");
assert(detectedSignals.some((s) => s.signal_type === "MCL_OPPORTUNITY"), "Detects MCL_OPPORTUNITY signal for high MCL/momentum");

// TEST 4: Score Change Signal Detection
const companyInputWithScoreChange = {
  ...companyInput,
  previousScores: { mcl_match_score: 80 },
};
const detectedScoreChange = detectAllSignals(companyInputWithScoreChange);
assert(detectedScoreChange.some((s) => s.signal_type === "SCORE_CHANGE"), "Detects SCORE_CHANGE signal when MCL match changes by >= 5 points");

// TEST 5: Evidence Packet Builder
const packet = buildEvidencePacket(
  companyInput.company,
  detectedSignals,
  companyInput.projects,
  companyInput.people,
  [],
  []
);
assert(packet.company.name === "Morena Films", "Evidence packet correctly extracts company name");
assert(packet.projects.length === 1, "Evidence packet embeds project slate");
assert(packet.signals.length > 0, "Evidence packet embeds detected signals");

// TEST 6: Fallback AI Commercial Brief Generator (No LLM required)
const brief = createFallbackBrief(packet);
assert(brief.summary.includes("Morena Films"), "Fallback brief includes company summary");
assert(brief.why_now.length > 0, "Fallback brief includes why_now reasons");
assert(brief.evidence.some((e) => e.fact_type === "FACT"), "Fallback brief includes FACTS");
assert(brief.evidence.some((e) => e.fact_type === "INFERENCE"), "Fallback brief includes INFERENCES");
assert(brief.relevant_people.length > 0, "Fallback brief identifies relevant decision makers");
assert(brief.recommended_action.length > 0, "Fallback brief specifies recommended commercial action");
assert(brief.unknowns.length > 0, "Fallback brief surfaces unknowns");
assert(brief.risk_flags.length > 0, "Fallback brief surfaces risk flags");

// TEST 7: Mock AI Response Execution
async function testMockAiResponse() {
  const asyncBrief = await generateBriefContent(packet);
  assert(asyncBrief.summary.length > 0, "Async brief generator resolves cleanly");
}

testMockAiResponse().then(() => {
  console.log("==========================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
});
