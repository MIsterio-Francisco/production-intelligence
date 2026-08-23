import { NextResponse } from "next/server";
import { MarketScanner } from "@/lib/scanner/market-scanner";
import { canRunManualOperation } from "@/lib/security/internal-auth";

export async function POST(request: Request) {
  try {
    if (!(await canRunManualOperation(request))) {
      return NextResponse.json(
        { success: false, data: null, error: { code: "UNAUTHORIZED", message: "Invalid authorization secret." } },
        { status: 401 }
      );
    }

    if (MarketScanner.isRunning()) {
      return NextResponse.json(
        { success: false, data: null, error: { code: "SCAN_RUNNING", message: "Market scan is currently running." } },
        { status: 409 }
      );
    }

    const scanResult = await MarketScanner.runMarketScan({ isManual: true, forceRealFetch: true });

    return NextResponse.json({
      success: true,
      scanId: scanResult.scanId,
      dataMode: scanResult.dataMode || "IN_MEMORY_FALLBACK",
      sources: scanResult.sourcesScanned,
      realFetches: scanResult.sourcesRealFetch,
      fallbacks: scanResult.sourcesFallback,
      eventsDetected: scanResult.eventsDetected,
      eventsAccepted: scanResult.eventsAccepted,
      eventsPersisted: scanResult.eventsPersisted,
      whatChangedCreated: scanResult.changesGenerated.length,
      changes: scanResult.changesGenerated,
      data: scanResult,
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: null, error: { code: "INTERNAL_ERROR", message: err.message || "Market scan execution failed." } },
      { status: 500 }
    );
  }
}

export async function GET() {
  const lastResult = MarketScanner.getLastScanResult();
  const isRunning = MarketScanner.isRunning();

  return NextResponse.json({
    success: true,
    data: {
      isRunning,
      lastResult,
      changes: MarketScanner.getGlobalChanges(),
    },
    error: null,
  });
}
