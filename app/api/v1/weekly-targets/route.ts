import { NextResponse } from "next/server";
import { getSavedCompanies, updateWeeklyTarget } from "@/lib/services/saved-company-service";

export async function GET() {
  return NextResponse.json({ data: await getSavedCompanies(), error: null });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ok = await updateWeeklyTarget({
    companyId: body.companyId,
    status: body.status,
    notes: body.notes,
    channel: body.channel,
    nextActionAt: body.nextActionAt,
  });
  return NextResponse.json(
    { data: { success: ok }, error: ok ? null : "Unable to update weekly target." },
    { status: ok ? 200 : 400 }
  );
}
