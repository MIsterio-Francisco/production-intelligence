import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { researchExternalCompanies } from "@/lib/research/free-company-research";

export async function GET(request: Request) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }
  const url = new URL(request.url);
  try {
    const data = await researchExternalCompanies(
      url.searchParams.get("q") || "",
      url.searchParams.get("country") || undefined
    );
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return NextResponse.json({
      data: null,
      error: error instanceof Error ? error.message : "External research failed.",
    }, { status: 502 });
  }
}
