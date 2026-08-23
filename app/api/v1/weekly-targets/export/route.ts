import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response("Authentication required.", { status: 401 });
  const [{ data: targets }, { data: events }] = await Promise.all([
    (supabase.from("user_saved_companies") as any)
      .select("*, companies(name, slug, country_code, website_url, company_type, mcl_match_score)")
      .eq("user_id", session.user.id).order("week_start", { ascending: false }),
    (supabase.from("sales_contact_log") as any)
      .select("*, companies(name, country_code)")
      .eq("user_id", session.user.id).order("occurred_at", { ascending: false }),
  ]);
  const headers = ["record_type", "company", "country", "website", "week_start", "status", "event", "channel", "occurred_at", "next_action_at", "notes", "mcl_match"];
  const rows = [headers.map(csvCell).join(",")];
  for (const item of targets || []) rows.push([
    "TARGET", item.companies?.name, item.companies?.country_code, item.companies?.website_url,
    item.week_start, item.status, "", "", item.updated_at, item.next_action_at, item.notes, item.companies?.mcl_match_score,
  ].map(csvCell).join(","));
  for (const event of events || []) rows.push([
    "ACTIVITY", event.companies?.name, event.companies?.country_code, "", "", event.new_status,
    event.event_type, event.channel, event.occurred_at, "", event.notes, "",
  ].map(csvCell).join(","));
  return new Response(`\uFEFF${rows.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="weekly-sales-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
