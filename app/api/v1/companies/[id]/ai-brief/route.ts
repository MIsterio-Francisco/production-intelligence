import { NextResponse } from "next/server";
import { getOrGenerateAiBrief } from "@/lib/ai/brief-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required to view AI Commercial Briefs." } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const brief = await getOrGenerateAiBrief(companyId, forceRefresh);

    if (!brief) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Company or brief unavailable." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: brief,
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch AI Brief." } },
      { status: 500 }
    );
  }
}
