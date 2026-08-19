export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          legal_name: string | null;
          description: string | null;
          company_type: string | null;
          founded_year: number | null;
          website_url: string | null;
          country_code: string | null;
          country_name: string | null;
          city: string | null;
          region: string | null;
          employee_count_min: number | null;
          employee_count_max: number | null;
          is_active: boolean;
          power_score: number | null;
          creative_score: number | null;
          commercial_score: number | null;
          momentum_score: number | null;
          international_score: number | null;
          social_score: number | null;
          mcl_match_score: number | null;
          score_confidence: number | null;
          ai_summary: string | null;
          ai_opportunity_summary: string | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      company_categories: {
        Row: {
          id: string;
          company_id: string;
          category: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["company_categories"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_categories"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          project_type: string | null;
          status: string | null;
          release_date: string | null;
          country_code: string | null;
          genre: string[] | null;
          budget_min: number | null;
          budget_max: number | null;
          budget_currency: string | null;
          director_name: string | null;
          distributor: string | null;
          streaming_platform: string | null;
          description: string | null;
          source_id: string | null;
          announced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      people: {
        Row: {
          id: string;
          full_name: string;
          first_name: string | null;
          last_name: string | null;
          job_title: string | null;
          linkedin_url: string | null;
          website_url: string | null;
          country_code: string | null;
          city: string | null;
          bio: string | null;
          profile_confidence: number | null;
          ai_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["people"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
      };
      sources: {
        Row: {
          id: string;
          source_type: string;
          source_name: string | null;
          url: string | null;
          title: string | null;
          publisher: string | null;
          published_at: string | null;
          accessed_at: string;
          credibility_score: number | null;
          raw_content: string | null;
          metadata: Json | null;
        };
        Insert: Omit<Database["public"]["Tables"]["sources"]["Row"], "id" | "accessed_at"> & {
          id?: string;
          accessed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
      };
      user_saved_companies: {
        Row: {
          user_id: string;
          company_id: string;
          notes: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_saved_companies"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_saved_companies"]["Insert"]>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
    };
  };
}
