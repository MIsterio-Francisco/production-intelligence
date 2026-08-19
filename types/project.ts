import { Database } from "./database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectType =
  | "feature_film"
  | "tv_series"
  | "documentary"
  | "short"
  | "commercial"
  | "animation"
  | "other";

export type ProjectStatus =
  | "announced"
  | "development"
  | "pre_production"
  | "production"
  | "post_production"
  | "completed"
  | "released"
  | "unknown";

export interface ProjectWithCompanies extends ProjectRow {
  companies?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  }[];
}
