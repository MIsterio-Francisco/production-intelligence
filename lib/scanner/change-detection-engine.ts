/**
 * CHANGE DETECTION ENGINE — PRODUCTION INTELLIGENCE V1.5
 * Misterio Color Lab
 * 
 * Compares target states before and after a market scan, generating transparent
 * WhatChanged audit logs that explicitly separate EVIDENCE FACT from AI SUGGESTION.
 */

import { TopCommercialTarget, WhatChangedEntry, ChangeType, SalesReadiness } from "../../types/commercial";

export class ChangeDetectionEngine {
  /**
   * Evaluates state diffs between previous targets state and updated target state.
   */
  public static detectTargetChanges(
    beforeTarget: TopCommercialTarget | undefined,
    afterTarget: TopCommercialTarget,
    sourceName: string
  ): WhatChangedEntry[] {
    const changes: WhatChangedEntry[] = [];
    const now = new Date().toISOString();

    if (!beforeTarget) {
      // Brand New Target Discovered
      changes.push({
        id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        changeType: "NEW_PROJECT_ANNOUNCED",
        entityId: afterTarget.id,
        entityType: "company",
        entityName: afterTarget.company.name,
        companyName: afterTarget.company.name,
        detectedAt: now,
        sourceName,
        sourceTier: "TIER_2_TRADE_PRESS",
        factSummary: `NUEVA PRODUCTORA / SLATE: ${afterTarget.company.name} detectada con proyecto "${afterTarget.relevantProject?.title || "En Desarrollo"}".`,
        commercialImpact: `Sugerencia IA: Evaluar necesidad de posproducción y verificar interlocutor clave.`,
        salesReadinessBefore: "DO_NOT_CONTACT",
        salesReadinessAfter: afterTarget.salesReadiness,
        isEvidenceBased: true,
        priority: "MEDIUM",
      });
      return changes;
    }

    // 1. Sales Readiness Change
    if (beforeTarget.salesReadiness !== afterTarget.salesReadiness) {
      const isDegradation = afterTarget.salesReadiness === "DO_NOT_CONTACT" || afterTarget.salesReadiness === "RESEARCH_FIRST";
      const changeType: ChangeType = isDegradation ? "SIGNAL_SUPERSEDED" : "SALES_READINESS_CHANGED";

      changes.push({
        id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        changeType,
        entityId: afterTarget.id,
        entityType: "opportunity",
        entityName: afterTarget.company.name,
        companyName: afterTarget.company.name,
        detectedAt: now,
        sourceName,
        sourceTier: "TIER_1_OFFICIAL",
        previousValue: beforeTarget.salesReadiness,
        newValue: afterTarget.salesReadiness,
        factSummary: `ESTADO DE VENTA CAMBIADO: ${afterTarget.company.name} pasó de ${beforeTarget.salesReadiness} a ${afterTarget.salesReadiness}.`,
        commercialImpact: `Razón Factual: ${afterTarget.salesReadinessReasoning}`,
        salesReadinessBefore: beforeTarget.salesReadiness,
        salesReadinessAfter: afterTarget.salesReadiness,
        isEvidenceBased: true,
        priority: isDegradation ? "CRITICAL" : "HIGH",
      });
    }

    // 2. Project Lifecycle State Change
    const beforeState = beforeTarget.relevantProject?.currentLifecycleState;
    const afterState = afterTarget.relevantProject?.currentLifecycleState;

    if (beforeState !== afterState && afterState) {
      let changeType: ChangeType = "PROJECT_ENTERED_PRODUCTION";
      if (afterState === "POST_PRODUCTION") changeType = "PROJECT_ENTERED_POST";
      else if (afterState === "RELEASED") changeType = "PROJECT_RELEASED";
      else if (afterState === "CANCELLED") changeType = "PROJECT_CANCELLED";

      changes.push({
        id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        changeType,
        entityId: afterTarget.relevantProject?.id || afterTarget.id,
        entityType: "project",
        entityName: afterTarget.relevantProject?.title || "Proyecto",
        companyName: afterTarget.company.name,
        detectedAt: now,
        sourceName,
        sourceTier: "TIER_2_TRADE_PRESS",
        previousValue: beforeState,
        newValue: afterState,
        factSummary: `CAMBIO DE FASE FÍSICA: "${afterTarget.relevantProject?.title}" avanzó a ${afterState}.`,
        commercialImpact: afterState === "POST_PRODUCTION"
          ? "Sugerencia IA: Oportunidad prioritaria para presentar oferta de finishing, etalonaje 4K HDR y deliveries IMF."
          : afterState === "RELEASED"
          ? "Sugerencia IA: Proyecto estrenado. Oportunidad de posproducción finalizada para este título."
          : "Sugerencia IA: Seguimiento de evolución de rodaje y pipeline de color.",
        salesReadinessBefore: beforeTarget.salesReadiness,
        salesReadinessAfter: afterTarget.salesReadiness,
        isEvidenceBased: true,
        priority: afterState === "POST_PRODUCTION" ? "CRITICAL" : "HIGH",
      });
    }

    // 3. Data Conflict Detected
    if (!beforeTarget.dataConflict && afterTarget.dataConflict) {
      changes.push({
        id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        changeType: "DATA_CONFLICT_DETECTED",
        entityId: afterTarget.id,
        entityType: "company",
        entityName: afterTarget.company.name,
        companyName: afterTarget.company.name,
        detectedAt: now,
        sourceName,
        sourceTier: "TIER_1_OFFICIAL",
        factSummary: `CONFLICTO DE DATOS DETECTADO: ${afterTarget.dataConflict.reason}`,
        commercialImpact: `Sugerencia IA: Oportunidad degradada automáticamente a RESEARCH_FIRST hasta resolver el conflicto.`,
        salesReadinessBefore: beforeTarget.salesReadiness,
        salesReadinessAfter: afterTarget.salesReadiness,
        isEvidenceBased: true,
        priority: "CRITICAL",
      });
    }

    return changes;
  }
}
