import { normalizeRawPayload, calculateContentHash } from "../lib/ingestion/normalizer";
import { resolveCompanyEntity, normalizeEntityName } from "../lib/ingestion/entity-resolution";
import { calculateDataQualityScore } from "../lib/ingestion/quality";
import { buildProvenanceMetadata } from "../lib/ingestion/provenance";
import { calculateFreshnessState } from "../lib/ingestion/constants";
import { ProviderRegistry } from "../lib/ingestion/registry";
import { NewsProvider } from "../lib/ingestion/providers/news-provider";
import { SocialProvider } from "../lib/ingestion/providers/social-provider";
import { RawRecordPayload } from "../lib/ingestion/types";

console.log("==========================================");
console.log("RUNNING PHASE 6 PIPELINE & INGESTION UNIT TESTS");
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

// 1-5: Content Hashing & Normalization
const payload1 = { name: "Morena Films", country: "es", type: "studio" };
const payload2 = { name: "Morena Films", country: "es", type: "studio" };
const payload3 = { name: "Morena Films LLC", country: "es", type: "studio" };

const hash1 = calculateContentHash(payload1);
const hash2 = calculateContentHash(payload2);
const hash3 = calculateContentHash(payload3);

assert(hash1 === hash2, "Content hash is identical for equal payload objects");
assert(hash1 !== hash3, "Content hash differs when payload changes");

const rawRecord: RawRecordPayload = {
  external_id: "ext_100",
  entity_type: "company",
  raw_data: { company_name: "  A24 Films LLC  ", country_code: "us" },
  source_url: "https://a24films.com",
};

const normalized = normalizeRawPayload(rawRecord, 2);
assert(normalized.data.name === "A24 Films LLC", "Normalizes name whitespace");
assert(normalized.data.country_code === "US", "Normalizes country code to uppercase");
assert(normalized.content_hash.length === 64, "Generates 64-char SHA-256 content hash");

// 6-12: Entity Resolution Hierarchy
assert(normalizeEntityName("A24 Films LLC") === "a24", "Strips legal suffixes and special chars");
assert(normalizeEntityName("Morena Films S.L.") === "morena", "Strips S.L. legal suffix");

const existingCompanies = [
  { id: "c1", name: "Morena Films", website_url: "https://morenafilms.com", country_code: "ES", aliases: ["Morena Cine"] },
  { id: "c2", name: "A24", website_url: "https://a24films.com", country_code: "US" },
];

const matchWebsite = resolveCompanyEntity("A24 Studios", "https://a24films.com/about", existingCompanies);
assert(matchWebsite.status === "MATCHED" && matchWebsite.matchedId === "c2", "Resolves company by website domain match (98% confidence)");
assert(matchWebsite.confidence === 98, "Website domain match confidence is 98%");

const matchExactName = resolveCompanyEntity("Morena Films S.L.", undefined, existingCompanies);
assert(matchExactName.status === "MATCHED" && matchExactName.matchedId === "c1", "Resolves company by normalized name match");

const matchAlias = resolveCompanyEntity("Morena Cine", undefined, existingCompanies);
assert(matchAlias.status === "MATCHED" && matchAlias.matchedId === "c1", "Resolves company by registered alias");

const matchUnmatched = resolveCompanyEntity("Unknown Micro Studio XYZ", "https://xyz-micro.com", existingCompanies);
assert(matchUnmatched.status === "UNMATCHED", "Returns UNMATCHED for non-existent company");

// 13-18: Data Quality Scoring
const qualityTier1 = calculateDataQualityScore({ name: "A24", country_code: "US", website_url: "https://a24films.com", description: "Prominent American studio" }, 1, new Date().toISOString());
const qualityTier4 = calculateDataQualityScore({ name: "Unknown" }, 4);

assert(qualityTier1 > qualityTier4, "Tier 1 complete record receives higher quality score than Tier 4");
assert(qualityTier1 >= 80, "Tier 1 official data receives high quality score (>= 80)");
assert(qualityTier4 <= 50, "Incomplete low tier data receives low quality score");

// 19-24: Provenance & Data Classification
const provTier1 = buildProvenanceMetadata("news_provider", 1, "https://variety.com/article", "ext_1");
assert(provTier1.data_classification === "VERIFIED_FACT", "Tier 1 data classified as VERIFIED_FACT");
assert(provTier1.confidence === 98, "Tier 1 provenance confidence is 98%");

const provTier4 = buildProvenanceMetadata("unverified_provider", 4);
assert(provTier4.data_classification === "UNKNOWN", "Tier 4 data classified as UNKNOWN");

// 25-28: Freshness Model
assert(calculateFreshnessState(new Date().toISOString(), "company") === "FRESH", "Recent verification is FRESH");
assert(calculateFreshnessState(new Date(Date.now() - 40 * 86400000).toISOString(), "company") === "AGING", "40-day old data is AGING");
assert(calculateFreshnessState(new Date(Date.now() - 120 * 86400000).toISOString(), "company") === "STALE", "120-day old data is STALE");
assert(calculateFreshnessState(null, "company") === "UNKNOWN", "Null date returns UNKNOWN freshness");

// 29-32: Provider Registry & Provider Adapters
const newsProv = new NewsProvider();
const socialProv = new SocialProvider();

ProviderRegistry.register(newsProv);
ProviderRegistry.register(socialProv);

assert(ProviderRegistry.get("industry_news_provider") !== undefined, "Registry fetches registered NewsProvider");
assert(newsProv.isEnabled() === true, "NewsProvider is enabled by default");
assert(socialProv.isEnabled() === false, "SocialProvider is disabled by default for platform compliance");

// Additional 5 Pipeline Tests (Total 32 Tests)
assert(newsProv.config.source_tier === 2, "NewsProvider configured as Tier 2 source");
assert(socialProv.config.rate_limit_per_min === 30, "SocialProvider configures rate limit protection");
assert(buildProvenanceMetadata("prov_test", 3).data_classification === "ESTIMATE", "Tier 3 data classified as ESTIMATE");
assert(normalizeEntityName("Gaumont S.A.") === "gaumont", "Strips S.A. legal suffix");
assert(resolveCompanyEntity("", undefined, existingCompanies).status === "UNMATCHED", "Empty entity name handles gracefully");

async function testProviderFetch() {
  const records = await newsProv.fetchRawRecords(5);
  assert(records.length > 0, "NewsProvider fetches raw news payloads");
  assert(records[0].entity_type === "news", "Raw news record has entity_type news");
}

testProviderFetch().then(() => {
  console.log("==========================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
});
