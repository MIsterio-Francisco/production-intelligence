import { calculateAllCompanyScores } from "../lib/scoring/engine";
import { normalizeLinear, normalizeLog, clamp } from "../lib/scoring/normalizers";
import { CompanyScoringInput, SCORING_ENGINE_VERSION } from "../lib/scoring/types";

console.log("==========================================");
console.log("RUNNING SCORING ENGINE UNIT TESTS & AUDIT");
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

// TEST 1: Normalizer bounds & clamp
assert(clamp(150, 0, 100) === 100, "Clamp upper bound to 100");
assert(clamp(-50, 0, 100) === 0, "Clamp lower bound to 0");
assert(normalizeLinear(50, 0, 100) === 50, "Linear normalizer mid-point");
assert(normalizeLog(1000, 100, 1000000) > 0, "Log normalizer logarithmic output");

// TEST 2: Company input with full rich data
const richInput: CompanyScoringInput = {
  id: "test-company-1",
  name: "Test Studio",
  country_code: "US",
  company_type: "studio",
  employee_count_min: 50,
  employee_count_max: 200,
  founded_year: 2010,
  is_active: true,
  categories: ["film", "television", "international"],
  projects: [
    { id: "p1", project_type: "feature_film", status: "production", budget_min: 10000000, budget_max: 20000000, release_date: "2025-10-01", company_role: "production_company" },
    { id: "p2", project_type: "tv_series", status: "post_production", budget_min: 15000000, budget_max: 30000000, release_date: "2025-12-01", company_role: "producer" },
  ],
  people: [
    { id: "per1", role: "head_of_post", seniority: "Executive", is_current: true },
    { id: "per2", role: "founder", seniority: "C-Level", is_current: true },
  ],
  events: [
    { id: "e1", event_type: "production_started", event_date: new Date().toISOString(), importance_score: 95 },
  ],
  awards: [
    { id: "a1", organization: "Academy Awards", category: "Best Feature Film", result: "winner", year: 2024 },
  ],
  socialProfiles: [
    { platform: "instagram", follower_count: 150000, engagement_rate: 4.2 },
  ],
};

const richResult = calculateAllCompanyScores(richInput);

assert(richResult.powerScore >= 0 && richResult.powerScore <= 100, "Power Score bounded 0-100");
assert(richResult.mclMatchScore >= 0 && richResult.mclMatchScore <= 100, "MCL Match Score bounded 0-100");
assert(richResult.creativeScore >= 0 && richResult.creativeScore <= 100, "Creative Score bounded 0-100");
assert(richResult.commercialScore >= 0 && richResult.commercialScore <= 100, "Commercial Score bounded 0-100");
assert(richResult.momentumScore >= 0 && richResult.momentumScore <= 100, "Momentum Score bounded 0-100");
assert(richResult.confidence >= 80, "High confidence for rich input dataset");
assert(richResult.engineVersion === SCORING_ENGINE_VERSION, "Scoring version is v1.0");
assert(richResult.explanation.drivers.length > 0, "Deterministic drivers generated");

// TEST 3: Company input with missing social data (INSUFFICIENT_DATA handling)
const missingSocialInput: CompanyScoringInput = {
  ...richInput,
  id: "test-company-2",
  socialProfiles: [],
};

const missingSocialResult = calculateAllCompanyScores(missingSocialInput);
assert(missingSocialResult.socialScore === null, "Social Score returns null when social data is missing");
assert(missingSocialResult.powerScore >= 0 && missingSocialResult.powerScore <= 100, "Power Score works without social data");
assert(missingSocialResult.explanation.limitations.some((l) => l.includes("social")), "Generates social limitation warning");

console.log("==========================================");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
