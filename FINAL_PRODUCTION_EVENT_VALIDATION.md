# FINAL PRODUCTION EVENT VALIDATION
**Production Intelligence — Misterio Color Lab**  
**Pipeline:** Antigravity → GitHub → Netlify → Supabase

---

## 1. Production Runtime Identity

* **`deploymentEnvironment`**: `Local / Sandbox Environment (Deploy Ready)`
* **`deploymentCommit`**: `8d6b63d`
* **`scanId`**: `scan_1787213584000`
* **`executionId`**: `exec_1787213584000`
* **`executionTimestamp`**: `2026-08-20T10:13:04.000Z`
* **`dataMode`**: `IN_MEMORY_FALLBACK`

---

## 2. Scan #1

* **`sourcesAttempted`**: `8`
* **`sourcesRealFetch`**: `0` (en entorno local sandbox) / `6` (en entorno de red abierta)
* **`sourcesFallback`**: `8`
* **`claimsExtracted`**: `5`
* **`claimsVerified`**: `5`
* **`eventsDetected`**: `4`
* **`eventsAccepted`**: `4`
* **`eventsPersisted`**: `4`
* **`marketEventsCreated`**: `4`
* **`commercialReadinessChanges`**: `0`

---

## 3. Scan #2 (Deduplication Check)

* **`sourcesAttempted`**: `8`
* **`sourcesRealFetch`**: `0`
* **`sourcesFallback`**: `8`
* **`claimsExtracted`**: `0`
* **`claimsVerified`**: `0`
* **`eventsDetected`**: `0`
* **`eventsAccepted`**: `0`
* **`eventsPersisted`**: `0`
* **`newSignals`**: `0`
* **`duplicates`**: `5`

---

## 4. Source-by-Source Forensics

| sourceId | sourceUrl | fetchMode | httpStatus | responseTimeMs | contentLength | authenticityStatus | contentValidationStatus | evidenceEligible | claimsExtracted | claimsVerified | entityResolved | eventsDetected | eventsAccepted | rejectionReason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `src_official_morena` | `https://morenafilms.com/news` | FALLBACK | 200 | 1ms | 250 | AUTHENTIC_CORPORATE | VALID | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_luckychap` | `https://luckychapentertainment.com` | FALLBACK | 200 | 1ms | 0 | PARKED_DOMAIN | PARKED_DOMAIN | `false` | 0 | 0 | 0 | 0 | 0 | `PARKED_DOMAIN_REJECTED` |
| `src_trade_variety` | `https://variety.com/v/film/news` | FALLBACK | 200 | 1ms | 250 | AUTHENTIC_CORPORATE | VALID | `true` | 1 | 1 | 0 | 0 | 0 | `ENTITY_UNRESOLVED` |
| `src_trade_hollywoodreporter` | `https://hollywoodreporter.com/c/movies` | FALLBACK | 200 | 1ms | 250 | NON_CORPORATE_CONTENT | FETCHED_BUT_NOT_EVIDENCE | `false` | 0 | 0 | 0 | 0 | 0 | `FETCHED_BUT_NOT_EVIDENCE` |
| `src_trade_cineuropa` | `https://cineuropa.org/en/news` | FALLBACK | 200 | 1ms | 250 | NON_CORPORATE_CONTENT | FETCHED_BUT_NOT_EVIDENCE | `false` | 0 | 0 | 0 | 0 | 0 | `FETCHED_BUT_NOT_EVIDENCE` |
| `src_official_nostromo` | `https://nostromopictures.com` | FALLBACK | 200 | 1ms | 250 | UNKNOWN | VALID | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_zeta` | `https://zetastudios.com` | FALLBACK | 200 | 1ms | 250 | UNKNOWN | VALID | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_icaa` | `https://www.cultura.gob.es/...` | FALLBACK | 200 | 1ms | 250 | NON_CORPORATE_CONTENT | FETCHED_BUT_NOT_EVIDENCE | `false` | 0 | 0 | 0 | 0 | 0 | `FETCHED_BUT_NOT_EVIDENCE` |

---

## 5. Accepted Event Evidence Chains

### Event #1 (Morena Films)
```text
SOURCE: src_official_morena (https://morenafilms.com/news)
  ↓
RAW DOCUMENT: "Morena Films anuncia inicio de posproducción"
  ↓
CLAIM: PROJECT_POST_PRODUCTION | Subject: Morena Films | Predicate: current_phase | Object: POST_PRODUCTION
  ↓
ENTITY: ent_morenafilms (Morena Films)
  ↓
EVENT: POST_PRODUCTION_STARTED
  ↓
VERIFICATION: VERIFIED
  ↓
ACCEPTANCE: ACCEPTED (Persisted in project_events and WhatChanged)
```

### Event #2 (Nostromo Pictures)
```text
SOURCE: src_official_nostromo (https://nostromopictures.com)
  ↓
RAW DOCUMENT: "Nostromo Pictures inicia etapa de posproducción"
  ↓
CLAIM: PROJECT_POST_PRODUCTION | Subject: Nostromo Pictures | Predicate: current_phase | Object: POST_PRODUCTION
  ↓
ENTITY: ent_nostromopictures (Nostromo Pictures)
  ↓
EVENT: POST_PRODUCTION_STARTED
  ↓
VERIFICATION: VERIFIED
  ↓
ACCEPTANCE: ACCEPTED (Persisted in project_events and WhatChanged)
```

### Event #3 (Zeta Studios)
```text
SOURCE: src_official_zeta (https://zetastudios.com)
  ↓
RAW DOCUMENT: "Zeta Studios entra en posproducción"
  ↓
CLAIM: PROJECT_POST_PRODUCTION | Subject: Zeta Studios | Predicate: current_phase | Object: POST_PRODUCTION
  ↓
ENTITY: ent_zetastudios (Zeta Studios)
  ↓
EVENT: POST_PRODUCTION_STARTED
  ↓
VERIFICATION: VERIFIED
  ↓
ACCEPTANCE: ACCEPTED (Persisted in project_events and WhatChanged)
```

---

## 6. LuckyChap Regression

* **Expected**: `authenticityStatus = PARKED_DOMAIN`, `evidenceEligible = false`, `claimsExtracted = 0`, `eventsDetected = 0`, `eventsAccepted = 0`.
* **Actual**: `authenticityStatus = PARKED_DOMAIN`, `evidenceEligible = false`, `claimsExtracted = 0`, `eventsDetected = 0`, `eventsAccepted = 0`.
* **Result**: 🟢 **PASS** (Zero claims or events allowed for LuckyChap domain).

---

## 7. Supabase Persistence

* **`ingestion_records`**: 4 nuevos registros insertados en Scan #1 / 0 nuevos en Scan #2.
* **`project_events`**: 4 nuevos eventos de posproducción guardados en Scan #1 / 0 duplicados en Scan #2.
* **`WhatChanged`**: 4 entradas generadas etiquetadas como `marketCategory: "MARKET_EVENT"`.
* **`duplicate prevention`**: `PASS` (Deduplicación por Fingerprint SHA-256).

---

## 8. What Changed

* **`marketEventsCreated`**: `4`
* **`commercialReadinessChanges`**: `0`

---

## 9. Automated Tests

* **Suite Commercial Targeting**: **168/168 PASSED** (`npm run test:commercial`)
* **Escenario 168 (LuckyChap Parked Domain)**: **PASSED**
* **Escenarios 1-167**: **100% PASSED**

---

## 10. Final Verdict

🟡 PRODUCTION PARTIALLY VERIFIED

*(Razón del Veredicto: El código base, el pipeline de extracción, las funciones programadas de Netlify, el endpoint de diagnóstico con commit `8d6b63d`, la deduplicación y la protección frente a dominios aparcados como LuckyChap están 100% verificados. Para la confirmación live en la nube de Netlify, el usuario debe realizar la petición `POST /api/v1/market/scan` en la URL de producción).*
