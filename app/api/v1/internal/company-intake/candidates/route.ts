import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { queueCompanyCandidates } from "@/lib/intake/daily-company-intake";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isAuthenticatedUser())) return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  const { data, error } = await (createAdminClient().from("company_intake_candidates") as any)
    .select("*").order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ data: data || [], error: error?.message || null }, { status: error ? 500 : 200 });
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedUser())) return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json();
    const data = await queueCompanyCandidates(Array.isArray(body.candidates) ? body.candidates : []);
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ data: null, error: error instanceof Error ? error.message : "Invalid candidates." }, { status: 400 });
  }
}
