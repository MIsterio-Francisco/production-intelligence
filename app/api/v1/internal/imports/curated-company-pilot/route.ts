import { NextResponse } from "next/server";
import { z } from "zod";
import { canRunManualOperation } from "@/lib/security/internal-auth";
import { importCuratedCompanyPilot, previewCuratedCompanyPilot } from "@/lib/imports/curated-company-pilot";

const requestSchema = z.object({ keys: z.array(z.string().min(1)).min(1).max(12) });

export async function GET(request: Request) {
  if (!(await canRunManualOperation(request))) return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ data: await previewCuratedCompanyPilot(), error: null });
  } catch (error) {
    return NextResponse.json({ data: null, error: error instanceof Error ? error.message : "Preview failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await canRunManualOperation(request))) return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ data: null, error: "Selección inválida." }, { status: 400 });
  try {
    return NextResponse.json({ data: await importCuratedCompanyPilot(parsed.data.keys), error: null });
  } catch (error) {
    return NextResponse.json({ data: null, error: error instanceof Error ? error.message : "Import failed." }, { status: 500 });
  }
}
