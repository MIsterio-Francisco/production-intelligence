import { strict as assert } from "node:assert";
import { isContactableEmail } from "../types/contact-email";
import { isValidEmailSyntax, mapApolloEmailStatus, mayContactStatus, normalizeEmail } from "../lib/contacts/email-policy";
import { evaluateApolloEligibility, isApolloDecisionMaker } from "../lib/contacts/apollo-eligibility";

assert.equal(normalizeEmail(" Sales@Example.COM "), "sales@example.com");
assert.equal(isValidEmailSyntax("sales@example.com"), true);
assert.equal(isValidEmailSyntax("not-an-email"), false);
assert.equal(mapApolloEmailStatus("verified"), "VERIFIED");
assert.equal(mapApolloEmailStatus("likely to engage"), "UNVERIFIED");
assert.equal(mayContactStatus("INFERRED"), false);
assert.equal(mayContactStatus("UNVERIFIED"), false);
assert.equal(mayContactStatus("PUBLIC"), true);
assert.equal(isContactableEmail({ status: "INFERRED", lastCheckedAt: new Date().toISOString() }), false);
assert.equal(isContactableEmail({ status: "PUBLIC", lastCheckedAt: new Date().toISOString() }), false);
assert.equal(isContactableEmail({ status: "PUBLIC", sourceUrl: "https://example.com/contact", lastCheckedAt: new Date().toISOString() }), true);

const producer = {
  website_url: "https://producer.example",
  company_type: "production_company",
  data_classification: "VERIFIED_FACT",
  company_categories: [{ category: "film" }],
};
const executiveProducer = { id: "p1", full_name: "Ana Producer", job_title: "Executive Producer", seniority: "Executive" };
assert.equal(isApolloDecisionMaker(executiveProducer), true);
assert.equal(evaluateApolloEligibility(producer, [executiveProducer]).eligible, true);
assert.equal(evaluateApolloEligibility({ ...producer, company_type: "postproduction" }, [executiveProducer]).eligible, false);
assert.equal(evaluateApolloEligibility(producer, [{ id: "p2", full_name: "Editor", job_title: "Colorist" }]).eligible, false);
assert.equal(evaluateApolloEligibility({ ...producer, website_url: null }, [executiveProducer]).eligible, false);

console.log("Contact email and Apollo eligibility policy: 16 passed, 0 failed");
