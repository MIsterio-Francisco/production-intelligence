import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    version: "1.5.0",
    service: "Production Intelligence Platform API",
    timestamp: new Date().toISOString(),
  });
}
