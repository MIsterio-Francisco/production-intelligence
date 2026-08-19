import { Database } from "./database.types";

export type PersonRow = Database["public"]["Tables"]["people"]["Row"];
export type PersonInsert = Database["public"]["Tables"]["people"]["Insert"];
export type PersonUpdate = Database["public"]["Tables"]["people"]["Update"];

export type DecisionMakerRole =
  | "founder"
  | "ceo"
  | "managing_director"
  | "producer"
  | "executive_producer"
  | "head_of_production"
  | "post_producer"
  | "head_of_post"
  | "vfx_producer"
  | "head_of_vfx"
  | "head_of_content"
  | "development_executive";

export interface PersonWithCompany extends PersonRow {
  company_name?: string;
  company_slug?: string;
  company_id?: string;
  role?: string;
  seniority?: string;
}
