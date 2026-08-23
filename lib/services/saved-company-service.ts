import { createClient } from "@/lib/supabase/server";

export interface SavedCompanyItem {
  user_id: string;
  company_id: string;
  notes: string | null;
  status: string;
  created_at: string;
  week_start?: string | null;
  next_action_at?: string | null;
  last_contacted_at?: string | null;
  updated_at?: string | null;
  company?: {
    id: string;
    name: string;
    slug: string;
    country_code: string | null;
    power_score: number | null;
    mcl_match_score: number | null;
  };
}

function currentWeekStart(): string {
  const date = new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export async function saveCompany(
  companyId: string,
  notes?: string,
  status: string = "PLANNED"
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: existing } = await (supabase.from("user_saved_companies") as any)
      .select("company_id").eq("user_id", session.user.id).eq("company_id", companyId).maybeSingle();

    const { error } = await (supabase.from("user_saved_companies") as any).upsert(
      {
        user_id: session.user.id,
        company_id: companyId,
        notes: notes || null,
        status,
        week_start: currentWeekStart(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,company_id" }
    );

    if (!error && !existing) {
      await (supabase.from("sales_contact_log") as any).insert({
        user_id: session.user.id, company_id: companyId, event_type: "ADDED_TO_WEEK",
        new_status: status, notes: notes || null,
      });
    }
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
      .eq("week_start", currentWeekStart())
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      user_id: item.user_id,
      company_id: item.company_id,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at,
      week_start: item.week_start,
      next_action_at: item.next_action_at,
      last_contacted_at: item.last_contacted_at,
      updated_at: item.updated_at,
      company: item.companies,
    }));
  } catch {
    return [];
  }
}

export const WEEKLY_TARGET_STATUSES = [
  "PLANNED", "RESEARCHING", "READY", "CONTACTED", "REPLIED", "MEETING", "WON", "LOST", "PAUSED",
] as const;

export async function updateWeeklyTarget(input: {
  companyId: string;
  status: string;
  notes?: string | null;
  channel?: string | null;
  nextActionAt?: string | null;
}): Promise<boolean> {
  if (!WEEKLY_TARGET_STATUSES.includes(input.status as any)) return false;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: current } = await (supabase.from("user_saved_companies") as any)
    .select("status").eq("user_id", session.user.id).eq("company_id", input.companyId).single();
  if (!current) return false;
  const now = new Date().toISOString();
  const contacted = ["CONTACTED", "REPLIED", "MEETING", "WON"].includes(input.status);
  const { error } = await (supabase.from("user_saved_companies") as any).update({
    status: input.status,
    notes: input.notes ?? undefined,
    next_action_at: input.nextActionAt || null,
    last_contacted_at: contacted ? now : undefined,
    updated_at: now,
  }).eq("user_id", session.user.id).eq("company_id", input.companyId);
  if (error) return false;
  const eventType = input.status === "CONTACTED" ? "EMAIL_SENT"
    : input.status === "REPLIED" ? "REPLY_RECEIVED"
    : input.status === "MEETING" ? "MEETING_BOOKED" : "STATUS_CHANGED";
  await (supabase.from("sales_contact_log") as any).insert({
    user_id: session.user.id,
    company_id: input.companyId,
    event_type: eventType,
    previous_status: current.status,
    new_status: input.status,
    channel: input.channel || null,
    notes: input.notes || null,
    occurred_at: now,
  });
  return true;
}
