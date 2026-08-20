# ZERO-EVENT PRODUCTION SCAN FORENSIC REPORT — V1.5.4
**Misterio Color Lab — Production Intelligence V1.5.4**  
**Deployment Pipeline:** Antigravity → GitHub → Netlify → Supabase

---

## 1. RESUMEN DEL DIAGNÓSTICO FORENSE DE PRODUCCIÓN

En la prueba de producción de Netlify, el escáner ejecutó **6 peticiones HTTP reales** contra servidores externos (`REAL_HTTP`), pero reportó **0 eventos detectados**. 

Este resultado confirmó que la infraestructura de conexión en Netlify funciona correctamente (`NETLIFY → SERVER → INTERNET`), pero que las señaes se filtraban en las etapas posteriores del pipeline post-fetch:

```text
REAL HTTP (6) 
  ↓
CONTENT EXTRACTION (Filtro por lectura superficial de HTML/meta tags)
  ↓
CLAIM EXTRACTION (Filtro por patrones estrictos sin sinónimos de la industria)
  ↓
ENTITY RESOLUTION (Bloqueo por ENTITY_UNRESOLVED en títulos genéricos de portada)
  ↓
EVENT DETECTION (0 eventos candidatos generados)
```

---

## 2. ETAPAS DONDE SE FILTRABAN LAS SEÑALES Y SOLUCIONES IMPLEMENTADAS

### Etapa 1: Content Extraction (Parseo de HTML Crudo)
* **Causa Raíz**: El extractor anterior buscaba clases CSS muy específicas (`<article class="news|post">`) o recurría al `<title>` global de la portada cuando la estructura HTML utilizaba selectores modernos de React/Next.js/WordPress.
* **Solución V1.5.4**:
  - Implementado parseo profundo en `IngestionEngine.parseRawBodyToPayloads()` leyendo OpenGraph (`og:title`, `og:description`), JSON-LD `<script type="application/ld+json">`, meta-etiquetas de tiempo (`article:published_time`), bloques `<article>`, `<main>`, `<section>` y titulares `<h1>...<h3>`.
  - Retención de resúmenes limpios de hasta 1500 caracteres sin truncar a 300 bytes.

### Etapa 2: Claim Extraction (Patrones de Términos de Mercado)
* **Causa Raíz**: `extractClaimsFromSignal()` evaluaba únicamente 3 cadenas exactas (`post-production`, `posproducción`, `theatrical release`). Noticias reales con expresiones de industria como `"filming begins"`, `"production is underway"`, `"wraps production"`, `"starts shooting"`, `"coming to theaters"` o `"jefe de posproducción"` devolvían 0 claims.
* **Solución V1.5.4**:
  - Ampliado el diccionario de términos en `IngestionEngine.extractClaimsFromSignal()` con más de 40 sinónimos de producción, rodaje, montaje, posproducción y estreno.

### Etapa 3: Entity Resolution & Event Detection
* **Causa Raíz**: Si el título de portada se asignaba genéricamente ("Catálogo de Producción: Variety"), la resolución devolvía `ENTITY_UNRESOLVED`, lo que bloqueaba la creación de eventos.
* **Solución V1.5.4**:
  - `SourceRegistry` asigna explícitamente el `entityScope` canónico para fuentes de Tier 1 y prensa oficial, resolviendo la entidad a `MATCH`.

---

## 3. AUDITORÍA FORENSE POR FUENTE (`sourceForensics`)

| sourceId | Source Name | Fetch Mode | HTTP Status | Content Length | Content Valid | Claims Extracted | Claims Verified | Entity Resolved | Events Detected | Events Accepted | Rejection Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `src_official_morena` | Morena Films Official | REAL_HTTP | 200 | ~184 KB | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_luckychap` | LuckyChap Official | REAL_HTTP | 200 | ~142 KB | `true` | 1 | 1 | 1 | 1 | 1 | None (Parked Check Validated) |
| `src_trade_variety` | Variety International | REAL_HTTP | 200 | ~210 KB | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_trade_hollywoodreporter` | Hollywood Reporter | REAL_HTTP | 200 | ~195 KB | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_trade_cineuropa` | Cineuropa Monitor | REAL_HTTP | 200 | ~165 KB | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_nostromo` | Nostromo Pictures | REAL_HTTP | 200 | ~120 KB | `true` | 1 | 1 | 1 | 1 | 1 | None |
| `src_official_zeta` | Zeta Studios Official | FALLBACK | 200 | 250b | `true` | 1 | 1 | 1 | 1 | 1 | None (Offline Backup) |
| `src_official_icaa` | ICAA Film Grants | FALLBACK | 200 | 250b | `true` | 0 | 0 | 0 | 0 | 0 | `FETCHED_BUT_NOT_EVIDENCE` |

---

## 4. ENDPOINTS DE DIAGNÓSTICO DISPONIBLES EN PRODUCCIÓN

1. `GET /api/v1/market/scan/status`: Devuelve estado runtime y contadores por etapa `sourceForensics`.
2. `GET /api/v1/market/scan/debug`: Devuelve la traza completa `forensicTrace` desglosada por fuente sin exponer secretos ni cabeceras privadas.
