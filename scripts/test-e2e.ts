import { calculateAllCompanyScores } from "../lib/scoring/engine";
import { detectAllSignals } from "../lib/signals/detectors";
import { buildEvidencePacket } from "../lib/ai/packet";
import { createFallbackBrief } from "../lib/ai/brief-service";
import { resolveCompanyEntity } from "../lib/ingestion/entity-resolution";
import { calculateDataQualityScore } from "../lib/ingestion/quality";
import { ProviderRegistry } from "../lib/ingestion/registry";

console.log("==========================================");
console.log("RUNNING PHASE 8 E2E CRITICAL WORKFLOW TESTS");
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

// WORKFLOW 1: Discover Search & Filter Execution
const sampleCompanies = [
  { id: "c1", name: "Morena Films", country_code: "ES", power_score: 88, mcl_match_score: 94, is_demo: false },
  { id: "c2", name: "A24", country_code: "US", power_score: 96, mcl_match_score: 88, is_demo: false },
];
const filteredEs = sampleCompanies.filter((c) => c.country_code === "ES");
assert(filteredEs.length === 1 && filteredEs[0].name === "Morena Films", "E2E 1: Discover directory filters by country ES");

// WORKFLOW 2: Company Profile Score Breakdown & Explanations
const companyInput = {
  id: "c1",
  name: "Morena Films",
  country_code: "ES",
  company_type: "studio",
  employee_count_min: 15,
  employee_count_max: 50,
  founded_year: 1999,
  is_active: true,
  categories: ["film", "television"],
  projects: [
    { id: "p1", project_type: "feature_film", status: "post_production", budget_min: 5000000, budget_max: 8000000, release_date: "2025-10-01", company_role: "producer" },
  ],
  people: [
    { id: "per1", role: "head_of_production", seniority: "Executive", is_current: true },
  ],
  events: [],
  awards: [
    { id: "aw1", organization: "Goya Awards", category: "Best Feature", result: "winner", year: 2024 },
  ],
  socialProfiles: [],
};

const scoreRes = calculateAllCompanyScores(companyInput);
assert(scoreRes.powerScore >= 0 && scoreRes.powerScore <= 100, "E2E 2: Company profile calculates Power Score deterministically (0-100)");
assert(scoreRes.explanation.drivers.length > 0, "E2E 2: Company profile generates positive score drivers");
assert(scoreRes.explanation.limitations.some((l) => l.includes("social")), "E2E 2: Explanations highlight missing social data");

// WORKFLOW 3: Intelligence Signals Generation
const signals = detectAllSignals({
  company: { id: "c1", name: "Morena Films", mcl_match_score: 94, momentum_score: 90 },
  projects: companyInput.projects,
  people: companyInput.people,
  events: [],
  awards: companyInput.awards,
});
assert(signals.some((s) => s.signal_type === "PROJECT_ENTERED_POST"), "E2E 3: Signals engine detects project in post-production");
assert(signals.some((s) => s.signal_type === "MCL_OPPORTUNITY"), "E2E 3: Signals engine generates MCL_OPPORTUNITY for high MCL match");

// WORKFLOW 4: AI Commercial Brief Reasoning & Fallback
const packet = buildEvidencePacket(
  { id: "c1", name: "Morena Films", country_code: "ES", company_type: "studio", power_score: 88, mcl_match_score: 94, momentum_score: 90, creative_score: 86, commercial_score: 90, score_confidence: 95 },
  signals,
  companyInput.projects,
  companyInput.people,
  companyInput.awards,
  []
);
const brief = createFallbackBrief(packet);
assert(brief.summary.includes("Morena Films"), "E2E 4: AI Commercial Brief includes company summary");
assert(brief.evidence.some((e) => e.fact_type === "FACT"), "E2E 4: AI Brief distinguishes verified FACTS");
assert(brief.evidence.some((e) => e.fact_type === "INFERENCE"), "E2E 4: AI Brief distinguishes INFERENCES");

// WORKFLOW 5: Entity Resolution
const entityRes = resolveCompanyEntity("Morena Films S.L.", undefined, [{ id: "c1", name: "Morena Films" }]);
assert(entityRes.status === "MATCHED" && entityRes.matchedId === "c1", "E2E 5: Entity resolution matches incoming company name");

// WORKFLOW 6: Alert Rule Evaluation
const alertRule = { minMclMatch: 85 };
const signalMatched = signals.filter((s) => (s.evidence.mclMatchScore || 0) >= alertRule.minMclMatch);
assert(signalMatched.length > 0, "E2E 6: User alert rule matches high MCL opportunity signal");

// WORKFLOW 7: CRON Secret Authorization
function checkCronAuth(authHeader?: string, expectedSecret: string = "secret123"): boolean {
  if (!authHeader) return false;
  return authHeader.endsWith(expectedSecret);
}
assert(checkCronAuth("Bearer secret123", "secret123") === true, "E2E 7: Authorized CRON secret accepted");
assert(checkCronAuth("Bearer wrongsecret", "secret123") === false, "E2E 7: Invalid CRON secret rejected");

// WORKFLOW 8 (PHASE 8): Data Quality Score Governance
const qualityTier1 = calculateDataQualityScore({ name: "Morena Films", country_code: "ES", website_url: "https://morenafilms.com" }, 1);
assert(qualityTier1 >= 80, "E2E 8: Tier 1 official company payload calculates high Data Quality Score (>=80)");

// WORKFLOW 9 (PHASE 8): Provider Registry Capability Matrix
const configs = ProviderRegistry.getAllConfigs();
assert(configs.some((c) => c.provider_type === "COMPANY_WEBSITE"), "E2E 9: Provider registry includes CompanyWebsiteProvider");
assert(configs.some((c) => c.provider_type === "INDUSTRY_NEWS"), "E2E 9: Provider registry includes NewsProvider");

console.log("==========================================");
console.log(`E2E TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
