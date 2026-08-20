# SOURCE RUNTIME AUDIT REPORT — V1.5.3
**Misterio Color Lab — Production Intelligence V1.5.3**

---

## 1. ESTADO RUNTIME DE LAS FUENTES REGISTRADAS

| sourceId | Source Name | Tier | URL Registrada | Expected Domain | Status | Authenticity | Fetch Mode | Rejection Reason |
|---|---|---|---|---|---|---|---|---|
| `src_official_morena` | Morena Films Official Portal | TIER_1_OFFICIAL | `https://morenafilms.com/news` | `morenafilms.com` | CONNECTED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `EVENT_ACCEPTED` |
| `src_official_luckychap` | LuckyChap Entertainment Official Portal | TIER_1_OFFICIAL | `https://luckychapentertainment.com` | `luckychapentertainment.com` | PARKED_DOMAIN | `DOMAIN_FOR_SALE` | `REAL_HTTP` / `FALLBACK` | `PARKED_DOMAIN_REJECTED` |
| `src_trade_variety` | Variety International Film & TV News | TIER_2_TRADE_PRESS | `https://variety.com/v/film/news` | `variety.com` | CONNECTED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `ENTITY_UNRESOLVED` (Fallback Title) |
| `src_trade_hollywoodreporter` | The Hollywood Reporter Film Production Feed | TIER_2_TRADE_PRESS | `https://hollywoodreporter.com/c/movies` | `hollywoodreporter.com` | CONNECTED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `FETCHED_BUT_NOT_EVIDENCE` |
| `src_trade_cineuropa` | Cineuropa European Production Monitor | TIER_2_TRADE_PRESS | `https://cineuropa.org/en/news` | `cineuropa.org` | DEGRADED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `FETCHED_BUT_NOT_EVIDENCE` |
| `src_official_nostromo` | Nostromo Pictures Official Portal | TIER_1_OFFICIAL | `https://nostromopictures.com` | `nostromopictures.com` | CONNECTED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `EVENT_ACCEPTED` |
| `src_official_zeta` | Zeta Studios Official Portal | TIER_1_OFFICIAL | `https://zetastudios.com` | `zetastudios.com` | CONNECTED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `EVENT_ACCEPTED` |
| `src_official_icaa` | ICAA Official Spanish Film Grants & Registries | TIER_1_OFFICIAL | `https://www.cultura.gob.es/cultura/areas/cine/ayudas.html` | `cultura.gob.es` | DEGRADED | `AUTHENTIC_CORPORATE` | `REAL_HTTP` / `FALLBACK` | `FETCHED_BUT_NOT_EVIDENCE` |

---

## 2. REGLAS DE RECUPERACIÓN DE FUENTES (SOURCE RECOVERY)

1. Si una fuente oficial (`TIER_1_OFFICIAL`) entra en estado `PARKED_DOMAIN` o `UNAVAILABLE` (ejemplo: LuckyChap Entertainment), el sistema bloquea cualquier evidencia proveniente de dicho dominio.
2. La ingesta intenta recuperar evidencias desde fuentes de prensa especializada registradas (`TIER_2_TRADE_PRESS`). Si no existen evidencias secundarias verificadas, la oportunidad se degrada a `DO_NOT_CONTACT` manteniendo `officialSourceAvailable = false`.
