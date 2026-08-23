import { NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";
import { hasValidCronSecret } from "@/lib/security/internal-auth";

export async function POST(request: Request) {
  try {
    if (!hasValidCronSecret(request)) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Invalid cron secret authorization." } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const providerId = body.providerId || "industry_news_provider";

    const runResult = await runIngestionPipeline(providerId, 10);

    return NextResponse.json({
      data: runResult,
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: err.message || "Pipeline job execution failed." } },
      { status: 500 }
    );
  }
}
