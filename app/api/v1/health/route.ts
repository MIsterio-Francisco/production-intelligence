import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        status: "degraded", version: "1.5.6", service: "MCL Match Engine",
        reason: "Database configuration unavailable.", timestamp,
      });
    }
    const { error } = await createAdminClient().from("companies").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ status: "operational", version: "1.5.6", service: "MCL Match Engine", timestamp });
  } catch {
    return NextResponse.json({
      status: "degraded", version: "1.5.6", service: "MCL Match Engine",
      reason: "Database health check failed.", timestamp,
    });
  }
}
