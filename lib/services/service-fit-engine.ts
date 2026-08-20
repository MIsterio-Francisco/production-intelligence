/**
 * SERVICE FIT ENGINE FOR MISTERIO COLOR LAB
 * Evaluates real project phase, characteristics, and evidence to map potential MCL services.
 * Distinguishes between VERIFIED_FIT, PROBABLE_FIT, POSSIBLE_FIT, and UNKNOWN.
 * Differentiates CONFIRMED_NEED vs POTENTIAL_FIT.
 */

import { CommercialNeedRecommendation, ServiceFitLevel, ServiceNeedType } from "../../types/commercial";
import { MCL_SERVICE_CATALOG, MCLServiceDefinition } from "../constants/mcl-services";

export function evaluateMCLServiceFit(
  projectStatus?: string | null,
  projectType?: string | null,
  hasExplicitPostRequirement?: boolean
): CommercialNeedRecommendation {
  if (!projectStatus) {
    return {
      serviceId: "mcl_color_grading",
      serviceName: "Misterio Color Lab Post-production Services",
      fitLevel: "UNKNOWN",
      needType: "UNSUPPORTED",
      reasoning: "Sin información suficiente sobre la fase del proyecto para justificar una necesidad comercial.",
      isFact: false,
    };
  }

  const normStatus = projectStatus.toLowerCase().trim();

  // 1. Post-Production / Finishing Phase
  if (normStatus === "post_production" || normStatus === "post-production" || normStatus === "finishing") {
    const service: MCLServiceDefinition = MCL_SERVICE_CATALOG.mcl_color_grading;
    const fitLevel: ServiceFitLevel = hasExplicitPostRequirement ? "VERIFIED_FIT" : "PROBABLE_FIT";
    const needType: ServiceNeedType = hasExplicitPostRequirement ? "CONFIRMED_NEED" : "POTENTIAL_FIT";
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      fitLevel,
      needType,
      reasoning: hasExplicitPostRequirement
        ? "Requerimiento de etalonaje 4K HDR y entregables VOD verificado en fase de posproducción."
        : "Proyecto en posproducción; encaje potencial alto para etalonaje digital 4K HDR y conformado.",
      isFact: Boolean(hasExplicitPostRequirement),
    };
  }

  // 2. Production / Filming Phase
  if (normStatus === "production" || normStatus === "filming" || normStatus === "shooting") {
    const service: MCLServiceDefinition = MCL_SERVICE_CATALOG.mcl_dailies;
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      fitLevel: "PROBABLE_FIT",
      needType: "POTENTIAL_FIT",
      reasoning: "Proyecto en rodaje; encaje potencial para gestión de color en set, Show-LUTs y dailies.",
      isFact: false,
    };
  }

  // 3. Pre-Production Phase
  if (normStatus === "pre_production" || normStatus === "pre-production" || normStatus === "development") {
    const service: MCLServiceDefinition = MCL_SERVICE_CATALOG.mcl_post_supervision;
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      fitLevel: "POSSIBLE_FIT",
      needType: "POTENTIAL_FIT",
      reasoning: "Proyecto en preproducción; encaje potencial para asesoría de pipeline de posproducción.",
      isFact: false,
    };
  }

  // 4. Completed Phase
  if (normStatus === "completed" || normStatus === "released") {
    const service: MCLServiceDefinition = MCL_SERVICE_CATALOG.mcl_mastering;
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      fitLevel: "POSSIBLE_FIT",
      needType: "POTENTIAL_FIT",
      reasoning: "Proyecto completado; encaje potencial para entregables adicionales o másters IMF.",
      isFact: false,
    };
  }

  return {
    serviceId: "mcl_color_grading",
    serviceName: "Misterio Color Lab Post-production Services",
    fitLevel: "UNKNOWN",
    needType: "UNSUPPORTED",
    reasoning: `Fase de producción "${projectStatus}" no ofrece evidencia determinante sobre requerimientos comerciales.`,
    isFact: false,
  };
}
