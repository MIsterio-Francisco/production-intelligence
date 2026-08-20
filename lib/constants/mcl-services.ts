/**
 * CANONICAL MISTERIO COLOR LAB SERVICE CATALOG
 * Source: Official Website https://misteriocolorlab.com/services/
 * Verified on-site capabilities & technical specifications.
 */

import { MCLServiceDefinition } from "../../types/commercial";
export type { MCLServiceDefinition };

export const MCL_SERVICE_CATALOG: Record<string, MCLServiceDefinition> = {
  mcl_color_grading: {
    serviceId: "mcl_color_grading",
    serviceName: "Dolby Vision 4K HDR Color Grading & Etalonaje Digital",
    category: "COLOR_GRADING",
    description: "Salas 4K HDR certificadas Dolby Vision, sala cinematográfica proyector 4K DCI, flujos color-managed ACES/T-CAM y desarrollo de Show-LUTs a medida con DoPs.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#color-grading",
    isActive: true,
    idealProductionPhases: ["production", "post_production", "filming", "editing"],
    idealProjectTypes: ["feature_film", "tv_series", "documentary", "commercial"],
  },
  mcl_mastering: {
    serviceId: "mcl_mastering",
    serviceName: "Cinematic DCP Mastering & VOD Deliveries (Netflix / Max / Prime)",
    category: "MASTERING",
    description: "Conformado 4K, creación de DCP cinematográfico y entregables IMF / ProRes con control de calidad (QC) estricto para plataformas VOD globales.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#mastering",
    isActive: true,
    idealProductionPhases: ["post_production", "completed", "finishing"],
    idealProjectTypes: ["feature_film", "tv_series", "documentary"],
  },
  mcl_dailies: {
    serviceId: "mcl_dailies",
    serviceName: "Dailies, On-Set Color & Editing Proxies",
    category: "DAILIES",
    description: "Gestión de color en rodaje, generación de dailies de alta velocidad y proxies de edición para el departamento de montaje.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#dailies",
    isActive: true,
    idealProductionPhases: ["pre_production", "production", "filming"],
    idealProjectTypes: ["feature_film", "tv_series"],
  },
  mcl_post_supervision: {
    serviceId: "mcl_post_supervision",
    serviceName: "Post-production Workflow Supervision & Pipeline Strategy",
    category: "POST_SUPERVISION",
    description: "Asesoría de workflow y coordinación entre rodaje, montaje, color y VFX para evitar atascos técnicos y sobrecostes de presupuesto.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#supervision",
    isActive: true,
    idealProductionPhases: ["pre_production", "production", "post_production"],
    idealProjectTypes: ["feature_film", "tv_series", "co_production"],
  },
  mcl_vfx_compositing: {
    serviceId: "mcl_vfx_compositing",
    serviceName: "High-End VFX, Previz & Digital Compositing",
    category: "VFX",
    description: "Supervisión de VFX on-set, composición digital fotorealista, previz y retoques de clean-up cinematográfico.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#vfx",
    isActive: true,
    idealProductionPhases: ["pre_production", "production", "post_production"],
    idealProjectTypes: ["feature_film", "tv_series"],
  },
  mcl_sound_mix: {
    serviceId: "mcl_sound_mix",
    serviceName: "Sound Design, ADR & Dolby Atmos 5.1 Mix",
    category: "SOUND",
    description: "Diseño de sonido inmersivo, edición de diálogos (ADR) y mezcla de audio en 5.1 y Dolby Atmos para ficción y cine.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#sound",
    isActive: true,
    idealProductionPhases: ["post_production", "sound_editing"],
    idealProjectTypes: ["feature_film", "tv_series", "documentary"],
  },
  mcl_archiving: {
    serviceId: "mcl_archiving",
    serviceName: "Secure Media Archiving (RAID 5 & LTO-7/8 MD5 Checks)",
    category: "ARCHIVING",
    description: "Respaldo y almacenamiento seguro de másters en unidades RAID 5 y cintas LTO-7/8 con verificación estricta de suma de comprobación MD5/xxHash.",
    officialSourceUrl: "https://misteriocolorlab.com/services/#archiving",
    isActive: true,
    idealProductionPhases: ["completed", "post_production"],
    idealProjectTypes: ["feature_film", "tv_series", "documentary"],
  },
};

export function getMCLServiceById(serviceId: string): MCLServiceDefinition | null {
  return MCL_SERVICE_CATALOG[serviceId] || null;
}
