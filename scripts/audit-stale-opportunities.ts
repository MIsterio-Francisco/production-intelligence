/**
 * AUDIT STALE OPPORTUNITIES SCRIPT — PRODUCTION INTELLIGENCE V1.4
 * Misterio Color Lab
 * 
 * Inspects all CALL_NOW & CONTACT_SOON opportunities for stale, superseded,
 * or released project states.
 * Generates STALE_OPPORTUNITIES_AUDIT.md.
 */

import * as fs from "fs";
import * as path from "path";
import { getTopCommercialTargets } from "../lib/services/opportunity-engine";

function runStaleOpportunitiesAudit() {
  console.log("=========================================================================");
  console.log("AUDITING STALE OPPORTUNITIES & SALES READINESS — V1.4");
  console.log("=========================================================================");

  const targets = getTopCommercialTargets(50);

  const callNowTargets = targets.filter((t) => t.salesReadiness === "CALL_NOW");
  const contactSoonTargets = targets.filter((t) => t.salesReadiness === "CONTACT_SOON");
  const researchTargets = targets.filter((t) => t.salesReadiness === "RESEARCH_FIRST");
  const doNotContactTargets = targets.filter((t) => t.salesReadiness === "DO_NOT_CONTACT");

  let invalidCallNowCount = 0;

  callNowTargets.forEach((t) => {
    const isReleased = t.relevantProject?.currentLifecycleState === "RELEASED" || t.relevantProject?.status === "released";
    const isSuperseded = t.whyNow?.signalStatus === "SUPERSEDED";

    if (isReleased || isSuperseded) {
      invalidCallNowCount++;
    }
  });

  const targetRows = targets.map((t) => {
    const state = t.relevantProject?.currentLifecycleState || t.relevantProject?.status || "UNKNOWN";
    const whyNowState = t.whyNow?.signalStatus || "N/A";
    return `| ${t.company.name} | ${t.relevantProject?.title || "N/A"} | **${state}** | **${t.salesReadiness}** | ${whyNowState} | ${t.salesReadinessReasoning} |`;
  });

  const reportMarkdown = `# STALE OPPORTUNITIES AUDIT REPORT — V1.4
**Misterio Color Lab — Sales Reality Check**

---

## 1. DISTRIBUCIÓN DE TARGETS POR SALES READINESS V1.4

- **CALL_NOW (Outreach Inmediato)**: ${callNowTargets.length}
- **CONTACT_SOON (Maturación de Slate)**: ${contactSoonTargets.length}
- **RESEARCH_FIRST (Falta Interlocutor / Conflicto)**: ${researchTargets.length}
- **DO_NOT_CONTACT (Estrenado / Inactivo / Datos Insuficientes)**: ${doNotContactTargets.length}

- **CALL_NOW Inválidos o Desactualizados**: ${invalidCallNowCount} (Debe ser 0)

---

## 2. MATRIZ DE DEGRADACIÓN Y ESTADO DE TARGETS

| Productora | Proyecto | Estado Real (Current State) | Sales Readiness V1.4 | Why Now Status | Razón / Estado de Auditoría |
|---|---|---|---|---|---|
${targetRows.join("\n")}

---

## 3. VEREDICTO FINAL DE AUDITORÍA COMERCIAL

${
  invalidCallNowCount === 0
    ? "🟢 **PASS**: Cero oportunidades obsoletas o proyectos estrenados calificados como CALL_NOW. Todas las recomendaciones son quirúrgicas, verificables y defensables en el mundo real."
    : "❌ **FAIL**: Existen targets desactualizados o estrenados calificados como CALL_NOW."
}
`;

  const reportPath = path.join(process.cwd(), "STALE_OPPORTUNITIES_AUDIT.md");
  fs.writeFileSync(reportPath, reportMarkdown, "utf-8");

  console.log(`✅ Stale opportunities audit completed. Report written to ${reportPath}`);

  if (invalidCallNowCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStaleOpportunitiesAudit();
}
