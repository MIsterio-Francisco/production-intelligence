import { NextResponse } from "next/server";
import { saveCompany, removeSavedCompany } from "@/lib/services/saved-company-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required to save companies." } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "save";
    const notes = body.notes;

    if (action === "remove") {
      const ok = await removeSavedCompany(companyId);
      return NextResponse.json({ data: { success: ok }, error: null });
    }

    const ok = await saveCompany(companyId, notes);
    return NextResponse.json({ data: { success: ok }, error: null });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to update saved company." } },
      { status: 500 }
    );
  }
}
