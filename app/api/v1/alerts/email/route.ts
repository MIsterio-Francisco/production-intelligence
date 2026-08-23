import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";

export async function POST() {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Email dispatch is disabled until an alert is backed by a persisted, verified project and recipient configuration.",
    },
    { status: 503 }
  );
}
