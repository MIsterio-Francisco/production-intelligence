import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { getApolloBudgetSummary } from "@/lib/contacts/apollo-budget";

export async function GET() {
  if (!(await isAuthenticatedUser())) return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ data: await getApolloBudgetSummary(), error: null });
  } catch (error) {
    return NextResponse.json({ data: null, error: error instanceof Error ? error.message : "Budget unavailable." }, { status: 500 });
  }
}
