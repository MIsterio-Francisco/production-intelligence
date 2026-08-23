import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { importLegacyCompanyCatalog } from "@/lib/intake/legacy-catalog-import";

export async function POST() {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await importLegacyCompanyCatalog(), error: null });
  } catch (error) {
    return NextResponse.json({
      data: null,
      error: error instanceof Error ? error.message : "Legacy catalogue import failed.",
    }, { status: 500 });
  }
}
