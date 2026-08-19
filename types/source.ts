import { Database } from "./database.types";

export type SourceRow = Database["public"]["Tables"]["sources"]["Row"];

export type SourceType =
  | "company_website"
  | "linkedin"
  | "instagram"
  | "imdb"
  | "industry_press"
  | "festival"
  | "database"
  | "api"
  | "ai_inference";

export interface DataConfidenceValue<T> {
  value: T | null;
  confidence: number; // 0 - 100
  classification: "VERIFIED_FACT" | "ESTIMATE" | "AI_INFERENCE" | "UNKNOWN";
  reason?: string;
  source_id?: string;
}
