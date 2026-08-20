# V1_3_PRE_IMPLEMENTATION_AUDIT.md — AUDITORÍA PREVIA Y PLAN V1.3
**Production Intelligence V1.3 — Real-World Data, Evidence & Sales Execution**

---

## 1. ESTADO REAL DEL REPOSITORIO V1.2

- **Arquitectura V1.2 Verificada**:
  - `freshness-engine.ts`, `sales-readiness-engine.ts`, `degradation-engine.ts` plenamente funcionales.
  - Audit Logs y timestamps `lastVerifiedAt` & `nextVerificationAt` integrados.
  - `31/31` negative scenarios passed, `399/399` canonical identity checks passed, `29/29` decision makers verificados.
  - 0 errores de compilación `npm run build` y `npm run typecheck`.

---

## 2. ARQUITECTURA EXISTENTE

- `types/commercial.ts`: Modelo B2B con `SalesReadiness`, `CommercialTargetCategory`, `CommercialEvidence`, `AuditLogEntry`.
- `lib/services/freshness-engine.ts`: Evaluador de actividad y frescura (`PROJECT_ACTIVE`, `PROJECT_RECENT`, `PROJECT_STALE`, `PROJECT_UNKNOWN`, `PROJECT_COMPLETED`).
- `lib/services/sales-readiness-engine.ts`: Asignación determinista de `CALL_NOW`, `CONTACT_SOON`, `RESEARCH_FIRST`, `DO_NOT_CONTACT`.
- `lib/services/degradation-engine.ts`: Genera degradaciones automáticas transparentes y calcula las fechas de expiración de re-verificación (`lastVerifiedAt` & `nextVerificationAt`).
- `components/opportunities/TopTargetsView.tsx`: Vista UI con 4 pestañas de Sales Readiness, guiones B2B `CALL OPENING` & `VALIDATION QUESTION` y pestaña **Research Queue**.

---

## 3. CLASIFICACIÓN DE DATOS (MOCK / FIXTURE / SEEDED / VERIFIED / EXTERNAL / INFERRED)

- **MOCK / FIXTURE**: `MOCK_PEOPLE` (29 decision makers) y `SEED_COMPANIES_FALLBACK` (52 productoras) como catálogo in-memory respaldado.
- **SEEDED**: Enrique Cerezo y Patricia Roldán (`provenance_type: "seed"`).
- **VERIFIED**: 27 ejecutivos y directores de producción (`provenance_type: "verified"`).
- **EXTERNAL**: Noticias y referencias de slates de trade press (Variety, Deadline, Cineuropa, BOE/ICAA).
- **INFERRED**: Encajes de servicio no explícitos marcados como `POTENTIAL_FIT` (ej. asumir Dolby Vision o IMF sin pliego técnico confirmado).

---

## 4. CLAIMS SIN EVIDENCIA TEMPORAL

- El estado de entrada efectiva a posproducción (`PROJECT_ENTERED_POST`) si no dispone de un timestamp `publishedAt` / `extractedAt` reciente (< 180 días), lo cual exige una verificación atómica por claim.

---

## 5. CURRENT ROLES REALMENTE VERIFICABLES

- 27 ejecutivos y directores de producción clave (Pedro Uriol en Morena Films, Núria Valls en Nostromo, Paloma Molina en Zeta Studios, Emma Lustres en Vaca Films, María Zamora en Avalon, José Alba en Pecado, Adrià Monés en Fasten, Agustín Almodóvar en El Deseo).

---

## 6. PROYECTOS CON EVIDENCIA ACTUAL

- Proyectos activos en rodaje o posproducción: *"La Infiltrada"*, *"Apocalipsis Z"*, *"Costiera"*, *"Élite S8"*, *"Claves de Sofía"*, *"La Habitación de Al Lado"*, *"Civil War"*, etc.

---

## 7. FUENTES DISPONIBLES

- `TIER_1_OFFICIAL`: Registros de empresas, webs oficiales de productoras y comunicados corporativos.
- `TIER_2_TRADE_PRESS`: Slates de la industria cinematográfica (Variety, Deadline, Cineuropa, BOE/ICAA).

---

## 8. DATOS TODAVÍA ESTÁTICOS

- Timestamps de slates in-memory que se extenderán con metadatos de expiración (`expiresAt`) y niveles de fuente (`sourceTier`).

---

## 9. RIESGOS DE DATA TRUTH

- Asumir que una producción sigue en posproducción cuando ya ha sido estrenada o proyectada en festivales si no se detecta la fecha de premiere.

---

## 10. RIESGOS DE SALES TRUTH

- Intentar contactar a un CEO corporativo en lugar del *Head of Post* o *Head of Production*.

---

## 11. ARCHIVOS A MODIFICAR

- `types/commercial.ts`, `lib/services/freshness-engine.ts`, `lib/services/sales-readiness-engine.ts`, `lib/services/opportunity-engine.ts`, `components/opportunities/TopTargetsView.tsx`, `package.json`, `scripts/test-commercial-targeting.ts`.

---

## 12. ARCHIVOS A CREAR

- `lib/services/claim-verifier.ts` (Verificación atómica claim por claim).
- `lib/services/data-conflict-engine.ts` (Detección de contradicciones entre fuentes).
- `V1_3_PRE_IMPLEMENTATION_AUDIT.md` (Informe de auditoría previa V1.3).
- `V1_3_IMPLEMENTATION_REPORT.md` (Informe final V1.3).

---

## 13. PLAN V1.3 POR FASES

- **Fase A**: Extensión de modelos y tipos en `types/commercial.ts`.
- **Fase B**: Creación de `claim-verifier.ts` y `data-conflict-engine.ts`.
- **Fase C**: Integración en `opportunity-engine.ts`, `freshness-engine.ts` y `sales-readiness-engine.ts`.
- **Fase D**: Actualización de la UI en `TopTargetsView.tsx` con badges de fuentes por Tier y razones explicables de degradación.
- **Fase E**: Suite de 40 tests negativos en `scripts/test-commercial-targeting.ts` y auditorías.

---

## 14. TESTS QUE SE AÑADIRÁN

- Batería extendida de 40 escenarios negativos e independientes de V1.3 (Claim Verification, Source Tiers, Data Conflict Detection, Expired Evidence, Event Timeline).

---

## 15. CRITERIOS DE ACEPTACIÓN V1.3

- `0 TypeScript errors & 0 build errors`.
- `0 identity mismatches & 0 ID collisions`.
- `0 CALL_NOW targets con DATA_CONFLICT sin resolver`.
- `40/40 negative tests passed`.
- `V1_3_IMPLEMENTATION_REPORT.md` generado.
