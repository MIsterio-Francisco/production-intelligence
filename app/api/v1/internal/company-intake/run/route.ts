import { NextResponse } from "next/server";
import { canRunManualOperation } from "@/lib/security/internal-auth";
import { runDailyCompanyIntake } from "@/lib/intake/daily-company-intake";

export async function POST(request: Request) {
  if (!(await canRunManualOperation(request))) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }
  try {
    return NextResponse.json({ data: await runDailyCompanyIntake(), error: null });
  } catch (error) {
    return NextResponse.json({ data: null, error: error instanceof Error ? error.message : "Daily intake failed." }, { status: 500 });
  }
}
