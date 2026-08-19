import { NextResponse } from "next/server";
import { getSignals } from "@/lib/services/signal-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // RLS Enforcement Check
    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required to access intelligence signals." } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;
    const severity = (searchParams.get("severity") as any) || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const result = await getSignals({ companyId, severity, status });

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch signals." } },
      { status: 500 }
    );
  }
}
