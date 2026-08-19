import { NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "internal_cron_secret_v1";

    if (!authHeader || !authHeader.endsWith(cronSecret)) {
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
