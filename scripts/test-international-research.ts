import { strict as assert } from "node:assert";
import { normalizeMarket, marketName, productionIntent } from "../lib/research/international-market";
import { publicAddress } from "../lib/research/public-web";
import { publishedEmails } from "../lib/research/website-contact-research";
import { extractFromHtml } from "../lib/research/official-decision-maker-discovery";

assert.equal(normalizeMarket(" uk "), "GB");
for (const country of ["JP", "KR", "ZA", "NG", "IN", "AE", "ES", "MX", "AR"]) {
  assert.notEqual(marketName(country), country);
}
assert.throws(() => normalizeMarket("ZZ"));
assert.throws(() => normalizeMarket("SPAIN"));
assert.equal(productionIntent("Productoras de cine"), "film production companies");
for (const ip of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "172.16.1.1", "192.168.0.1", "::1", "100.64.0.1", "0.0.0.0"]) assert.equal(publicAddress(ip), false);
assert.equal(publicAddress("8.8.8.8"), true);
assert.deepEqual(publishedEmails('<script>"fake@test.com"</script><a href="mailto:hello@films.es">hello&#64;films.es</a><img src="logo@2x.png">'), ["hello@films.es"]);
const structured = '<script type="application/ld+json">{"@type":"Person","name":"山田 太郎","jobTitle":"プロデューサー"}</script>';
assert.equal(extractFromHtml(structured, "https://films.jp")[0].name, "山田 太郎");
assert.equal(extractFromHtml('<p>We are looking for a producer in London</p><p>Some Company</p>', "https://films.co.uk").length, 0);
assert.equal(extractFromHtml('<h3>Amaia Remírez</h3><p>Productora</p>', "https://films.es")[0].name, "Amaia Remírez");
console.log("International research checks passed");
