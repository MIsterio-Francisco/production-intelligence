# V1_5_5 PRODUCTION SCAN REPORT
**Production Intelligence V1.5.5 — Misterio Color Lab**  
**Netlify Production URL:** `https://classy-piroshki-89490a.netlify.app`

---

## 1. RUNTIME METRICS IN NETLIFY PRODUCTION CLOUD

* **`deploymentEnvironment`**: `Netlify Production Cloud`
* **`deploymentCommit`**: `8d6b63d`
* **`dataMode`**: `PARTIAL_LIVE_DATA`
* **`supabaseConnected`**: `true`
* **`lastScanId`**: `scan_1787214412287`
* **`scanExecutionId`**: `scan_1787214412287`
* **`lastScanDurationMs`**: `6735ms`
* **`sourcesScanned`**: `8`
* **`sourcesRealFetch`**: `6`
* **`sourcesFallback`**: `2`
* **`claimsExtracted`**: `0`
* **`claimsVerified`**: `0`
* **`eventsDetected`**: `0`
* **`eventsAccepted`**: `0`
* **`eventsPersisted`**: `0`
* **`marketEventsCreated`**: `0`
* **`commercialReadinessChanges`**: `0`

---

## 2. SOURCE MATRIX AUDIT (V1.5.5 CLASSIFICATION)

```json
[
  {
    "sourceId": "src_official_morena",
    "sourceName": "Morena Films Official Press & Slate Catalog",
    "url": "https://morenafilms.com/news",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 42248,
    "authenticityStatus": "AUTHENTIC_CORPORATE",
    "contentValidationStatus": "VALID",
    "evidenceEligible": true,
    "contentValid": true,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 1,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "NO_CLAIM_CANDIDATE: Morena Films Official Press & Slate Catalog"
    ],
    "error": null
  },
  {
    "sourceId": "src_official_luckychap",
    "sourceName": "LuckyChap Entertainment Official Portal",
    "url": "https://luckychapentertainment.com",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 114,
    "authenticityStatus": "EMPTY_CONTENT",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 0,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "FETCHED_BUT_NOT_EVIDENCE: LuckyChap Entertainment Official Portal"
    ],
    "error": null
  },
  {
    "sourceId": "src_trade_variety",
    "sourceName": "Variety International Film & TV Production News",
    "url": "https://variety.com/v/film/news",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 527479,
    "authenticityStatus": "EMPTY_CONTENT",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 0,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "FETCHED_BUT_NOT_EVIDENCE: Latest News",
      "FETCHED_BUT_NOT_EVIDENCE: Most Popular",
      "FETCHED_BUT_NOT_EVIDENCE: Sign Up for Variety Newsletters",
      "FETCHED_BUT_NOT_EVIDENCE: More From Our Brands",
      "FETCHED_BUT_NOT_EVIDENCE: Alerts and Newsletters"
    ],
    "error": null
  },
  {
    "sourceId": "src_trade_hollywoodreporter",
    "sourceName": "The Hollywood Reporter Film Production Feed",
    "url": "https://hollywoodreporter.com/c/movies",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 560186,
    "authenticityStatus": "EMPTY_CONTENT",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 0,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "FETCHED_BUT_NOT_EVIDENCE: Movies | Hollywood Reporter",
      "FETCHED_BUT_NOT_EVIDENCE: site categories",
      "DUPLICATE_FINGERPRINT: site categories",
      "FETCHED_BUT_NOT_EVIDENCE: Latest Movies",
      "FETCHED_BUT_NOT_EVIDENCE: You may also like",
      "ENTITY_UNRESOLVED: Subscriber Support",
      "NO_CLAIM_CANDIDATE: Subscriber Support",
      "FETCHED_BUT_NOT_EVIDENCE: Newsletter Sign Up",
      "FETCHED_BUT_NOT_EVIDENCE: Alerts &amp; Newsletters"
    ],
    "error": null
  },
  {
    "sourceId": "src_trade_cineuropa",
    "sourceName": "Cineuropa European Production Monitor",
    "url": "https://cineuropa.org/en/news",
    "fetchMode": "FALLBACK",
    "httpStatus": 403,
    "contentLength": 0,
    "authenticityStatus": "CONTENT_INVALID",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 0,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "FETCHED_BUT_NOT_EVIDENCE: Catálogo de Producción: Cineuropa European Production Monitor"
    ],
    "error": "HTTP 403 Forbidden"
  },
  {
    "sourceId": "src_official_nostromo",
    "sourceName": "Nostromo Pictures Official Portal",
    "url": "https://nostromopictures.com",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 26091,
    "authenticityStatus": "UNKNOWN",
    "contentValidationStatus": "VALID",
    "evidenceEligible": true,
    "contentValid": true,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 1,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "NO_CLAIM_CANDIDATE: Nostromo Pictures"
    ],
    "error": null
  },
  {
    "sourceId": "src_official_zeta",
    "sourceName": "Zeta Studios Official Portal",
    "url": "https://zetastudios.com",
    "fetchMode": "REAL_HTTP",
    "httpStatus": 200,
    "contentLength": 11663,
    "authenticityStatus": "EMPTY_CONTENT",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 1,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "NO_CLAIM_CANDIDATE: inicio",
      "FETCHED_BUT_NOT_EVIDENCE: Lorem impsum"
    ],
    "error": null
  },
  {
    "sourceId": "src_official_icaa",
    "sourceName": "ICAA Official Spanish Film Grants & Registries",
    "url": "https://www.cultura.gob.es/cultura/areas/cine/ayudas.html",
    "fetchMode": "FALLBACK",
    "httpStatus": 200,
    "contentLength": 0,
    "authenticityStatus": "NON_CORPORATE_CONTENT",
    "contentValidationStatus": "FETCHED_BUT_NOT_EVIDENCE",
    "evidenceEligible": false,
    "contentValid": false,
    "claimsExtracted": 0,
    "claimsVerified": 0,
    "entityResolved": 0,
    "eventsDetected": 0,
    "eventsAccepted": 0,
    "rejectionReasons": [
      "FETCHED_BUT_NOT_EVIDENCE: Catálogo de Producción: ICAA Official Spanish Film Grants & Registries"
    ],
    "error": "fetch failed"
  }
]
```

---

## 3. FINAL VERDICT

```text
🟡 PRODUCTION PARTIALLY VERIFIED
```
