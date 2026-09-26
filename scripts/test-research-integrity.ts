import { strict as assert } from "node:assert";
import { mapTavilySearchResults } from "../lib/research/free-company-research";

const marketHintResult = mapTavilySearchResults([{
  title: "Productoras Asociadas de Televisión de España",
  url: "https://example.es/about",
  content: "Spanish audiovisual association",
}], "GB")[0];

assert.equal(marketHintResult.countryCode, null, "The requested market must not become a company country fact.");
assert.equal(marketHintResult.countryVerification, "UNVERIFIED");
assert.equal(marketHintResult.marketHintCode, "GB");
assert.equal(marketHintResult.websiteVerification, "SEARCH_CANDIDATE");
assert.equal(marketHintResult.officialWebsiteUrl, "https://example.es/");

console.log("Research discovery integrity: 5 passed, 0 failed");
