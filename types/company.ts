import { Database } from "./database.types";

export type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export type CompanyType =
  | "production_company"
  | "studio"
  | "independent"
  | "broadcaster"
  | "streaming"
  | "agency"
  | "animation"
  | "documentary"
  | "commercial"
  | "other";

export type CompanyCategory =
  | "film"
  | "television"
  | "documentary"
  | "animation"
  | "commercial"
  | "branded_content"
  | "music_video"
  | "vfx"
  | "postproduction"
  | "international"
  | "independent"
  | "studio"
  | "streaming";

export interface CompanyWithDetails extends CompanyRow {
  categories?: string[];
  saved_status?: string;
  user_notes?: string;
  is_demo?: boolean;
  data_quality_score?: number;
}

export interface CompanyFilterOptions {
  search?: string;
  country?: string;
  category?: string;
  companyType?: string;
  minPower?: number;
  maxPower?: number;
  minMclMatch?: number;
  minMomentum?: number;
  minCreative?: number;
  minCommercial?: number;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
