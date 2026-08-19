// Centralized Configuration Weights & Tiers for Scoring Engine v1.0

// Event Recency Decay Weights (days)
export const RECENCY_WEIGHTS = {
  DAYS_30: 1.0,
  DAYS_90: 0.75,
  DAYS_180: 0.50,
  DAYS_365: 0.25,
};

// Event Type Base Weights (PRD Section 13)
export const EVENT_WEIGHTS: Record<string, number> = {
  production_started: 100,
  post_production_started: 95,
  major_project_announced: 95,
  new_project: 90,
  acquisition: 90,
  distribution_deal: 85,
  major_award: 80,
  international_expansion: 75,
  company_launch: 70,
  partnership: 65,
  executive_hire: 60,
  festival_selection: 55,
  project_release: 50,
  executive_departure: 35,
};

// Award Prestige Hierarchy Tiers (PRD Section 10)
export const AWARD_TIER_WEIGHTS = {
  TIER_1: 100, // Academy Awards / Oscars, Cannes Film Festival Palme d'Or, BAFTA
  TIER_2: 80,  // Venice, Berlinale, Sundance, Emmys, Golden Globes
  TIER_3: 60,  // Goyas, Independent Spirit, Cesar, SXSW, Tribeca
  TIER_4: 40,  // Regional / National Industry Selections
};

// Power Score Component Percentages (PRD Section 8)
export const POWER_SCORE_WEIGHTS = {
  PRODUCTION_SCALE: 0.25,
  CREATIVE: 0.20,
  COMMERCIAL: 0.20,
  MOMENTUM: 0.15,
  INTERNATIONAL: 0.10,
  SOCIAL: 0.10,
};

// MCL Match Component Percentages (PRD Section 16)
export const MCL_MATCH_WEIGHTS = {
  PRODUCTION_ACTIVITY: 0.25,
  PRODUCTION_SCALE: 0.20,
  POST_VFX_OPPORTUNITY: 0.20,
  MOMENTUM: 0.15,
  COMMERCIAL_STRENGTH: 0.10,
  RELATIONSHIP_ACCESSIBILITY: 0.10,
};
