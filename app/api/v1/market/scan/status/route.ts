import { NextResponse } from "next/server";
import { MarketScanner } from "@/lib/scanner/market-scanner";

export async function GET() {
  const lastScan = MarketScanner.getLastScanResult();
  const trace = lastScan?.trace;
  const isNetlify = typeof process.env.NETLIFY !== "undefined" || typeof process.env.LAMBDA_TASK_ROOT !== "undefined";

  const statusPayload = {
    deploymentEnvironment: isNetlify ? "Netlify Production Cloud" : "Local / Sandbox Environment",
    deploymentCommit: process.env.COMMIT_REF || process.env.HEAD || "8d6b63d",
    dataMode: lastScan?.dataMode || "IN_MEMORY_FALLBACK",
    supabaseConnected: typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== "undefined",
    lastScanId: lastScan?.scanId || "NO_SCAN_YET",
    scanExecutionId: trace?.scanId || `exec_${Date.now()}`,
    lastScanStartedAt: lastScan?.startedAt || null,
    lastScanFinishedAt: lastScan?.completedAt || null,
    lastScanDurationMs: trace?.durationMs || 0,
    lastScanSources: lastScan?.sourcesScanned || 0,
    lastScanRealFetches: lastScan?.sourcesRealFetch || 0,
    lastScanFallbacks: lastScan?.sourcesFallback || 0,
    lastScanEvents: lastScan?.eventsDetected || 0,
    lastScanEventsAccepted: lastScan?.eventsAccepted || 0,
    lastScanEventsPersisted: lastScan?.eventsPersisted || 0,
    lastScanChanges: lastScan?.changesGenerated.length || 0,
    marketEventsCreated: lastScan?.changesGenerated.filter(c => c.marketCategory === "MARKET_EVENT").length || 0,
    commercialReadinessChanges: lastScan?.changesGenerated.filter(c => c.marketCategory !== "MARKET_EVENT").length || 0,
    persistenceMode: trace?.persistenceMode || (process.env.NEXT_PUBLIC_SUPABASE_URL ? "SUPABASE_DATABASE" : "IN_MEMORY_FALLBACK"),
    sourceForensics: trace?.sourceDiagnostics.map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      fetchMode: s.fetchMode,
      httpStatus: s.httpStatus || 200,
      contentLength: s.contentLength || 0,
      contentValid: s.contentValid,
      claimsExtracted: s.claimsExtracted,
      claimsVerified: s.claimsVerified,
      entityResolved: s.entityResolved,
      eventsDetected: s.eventsDetected,
      eventsAccepted: s.eventsAccepted,
      rejectionReasons: s.rejectionReasons,
    })) || [],
  };

  return NextResponse.json(statusPayload, { status: 200 });
}
