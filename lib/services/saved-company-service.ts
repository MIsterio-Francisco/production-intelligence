import { createClient } from "@/lib/supabase/server";

export interface SavedCompanyItem {
  user_id: string;
  company_id: string;
  notes: string | null;
  status: string;
  created_at: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    country_code: string | null;
    power_score: number | null;
    mcl_match_score: number | null;
  };
}

export async function saveCompany(
  companyId: string,
  notes?: string,
  status: string = "target"
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await (supabase.from("user_saved_companies") as any).upsert(
      {
        user_id: session.user.id,
        company_id: companyId,
        notes: notes || null,
        status,
      },
      { onConflict: "user_id,company_id" }
    );

    return !error;
  } catch {
    return false;
  }
}

export async function removeSavedCompany(companyId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from("user_saved_companies")
      .delete()
      .eq("user_id", session.user.id)
      .eq("company_id", companyId);

    return !error;
  } catch {
    return false;
  }
}

export async function getSavedCompanies(): Promise<SavedCompanyItem[]> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from("user_saved_companies")
      .select("*, companies(id, name, slug, country_code, power_score, mcl_match_score)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      user_id: item.user_id,
      company_id: item.company_id,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      company: item.companies,
    }));
  } catch {
    return [];
  }
}
