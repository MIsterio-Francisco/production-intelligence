import { strict as assert } from "node:assert";
import { isContactableEmail } from "../types/contact-email";
import { isValidEmailSyntax, mapApolloEmailStatus, mayContactStatus, normalizeEmail } from "../lib/contacts/email-policy";

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

console.log("Contact email policy: 11 passed, 0 failed");
