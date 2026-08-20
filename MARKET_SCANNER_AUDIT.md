# MARKET SCANNER & CONTINUOUS INGESTION AUDIT — V1.5
**Misterio Color Lab — Production Market Radar**

---

## 1. RESUMEN DE AUDITORÍA DE INGESTIÓN Y FUENTES

- **Fuentes de Mercado Declaradas**: 7
- **Fuentes Conectadas y Habilitadas**: 7
- **Prueba de Deduplicación por Fingerprint SHA-256**: 🟢 PASSED (100% Sin Ingesta Duplicada)
- **Detección de Eventos de Proyecto**: 🟢 PASSED (POST_PRODUCTION_STARTED Detectado)
- **Detección de Eventos de Personas**: 🟢 PASSED (PERSON_JOINED Detectado)
- **Ejecución de Scan Completo**: 🟢 PASSED

---

## 2. DETALLE DE FUENTES CONFIGURADAS Y TIERS

| Source ID | Nombre de Fuente | URL Base | Source Tier | Frecuencia | Rate Limit | Estado |
|---|---|---|---|---|---|---|
| src_official_morena | Morena Films Official Press & Slate Catalog | [Link](https://morenafilms.com/news) | **TIER_1_OFFICIAL** | HIGH_PRIORITY | 30/min | CONNECTED |
| src_official_nostromo | Nostromo Pictures Slate Monitor | [Link](https://nostromopictures.com/projects) | **TIER_1_OFFICIAL** | HIGH_PRIORITY | 30/min | CONNECTED |
| src_official_zeta | Zeta Studios Official Announcements | [Link](https://zetastudios.com/press) | **TIER_1_OFFICIAL** | HIGH_PRIORITY | 30/min | CONNECTED |
| src_trade_variety | Variety International Film & TV Production News | [Link](https://variety.com/v/film/news) | **TIER_2_TRADE_PRESS** | STANDARD | 60/min | CONNECTED |
| src_trade_cineuropa | Cineuropa European Production Monitor | [Link](https://cineuropa.org/en/news) | **TIER_2_TRADE_PRESS** | STANDARD | 60/min | CONNECTED |
| src_official_icaa | ICAA / BOE Official Spanish Film Grants & Registries | [Link](https://www.cultura.gob.es/cultura/areas/cine/ayudas.html) | **TIER_1_OFFICIAL** | DAILY | 20/min | CONNECTED |
| src_trade_hollywoodreporter | The Hollywood Reporter Film Production Feed | [Link](https://hollywoodreporter.com/c/movies) | **TIER_2_TRADE_PRESS** | STANDARD | 60/min | CONNECTED |

---

## 3. VEREDICTO DE AUDITORÍA DE SCANNER V1.5

- **Inviolabilidad de Veracidad**: 🟢 PASS — Toda señal bruta pasa por verificación de claims y detección de eventos antes de afectar Sales Readiness.
- **Deduplicación Estricta**: 🟢 PASS — Mismo contenido con misma fecha no genera señales duplicadas.
- **Separación FACT vs AI SUGGESTION**: 🟢 PASS — Los hechos de mercado (`EVIDENCE FACT`) y el impacto comercial (`AI SUGGESTION`) se mantienen explícitamente separados.
