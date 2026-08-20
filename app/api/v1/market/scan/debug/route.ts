import { NextResponse } from "next/server";
import { MarketScanner } from "@/lib/scanner/market-scanner";

export async function GET() {
  const lastScan = MarketScanner.getLastScanResult();
  const trace = lastScan?.trace;
  const isNetlify = typeof process.env.NETLIFY !== "undefined" || typeof process.env.LAMBDA_TASK_ROOT !== "undefined";

  if (!trace) {
    return NextResponse.json({
      success: false,
      message: "No scan trace recorded yet.",
      trace: null,
    }, { status: 200 });
  }

  const forensicTrace = {
    deploymentEnvironment: isNetlify ? "Netlify Production Cloud" : "Local / Sandbox Environment",
    deploymentCommit: process.env.COMMIT_REF || process.env.HEAD || "8d6b63d",
    scanId: trace.scanId,
    dataMode: trace.dataMode,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt,
    durationMs: trace.durationMs,
    sourcesConfigured: trace.sourcesConfigured,
    sourcesAttempted: trace.sourcesAttempted,
    sourcesFetched: trace.sourcesFetched,
    sourcesRealFetch: trace.sourcesRealFetch,
    sourcesFallback: trace.sourcesFallback,
    documentsFetched: trace.documentsFetched,
    documentsValid: trace.documentsValid,
    documentsRejected: trace.documentsRejected,
    claimsExtracted: trace.claimsExtracted,
    claimsVerified: trace.claimsVerified,
    entitiesResolved: trace.entitiesResolved,
    entitiesUnresolved: trace.entitiesUnresolved,
    eventsDetected: trace.eventsDetected,
    eventsAccepted: trace.eventsAccepted,
    eventsPersisted: trace.eventsPersisted,
    whatChangedCreated: trace.whatChangedCreated,
    marketEventsCreated: lastScan?.changesGenerated.filter(c => c.marketCategory === "MARKET_EVENT").length || 0,
    commercialReadinessChanges: lastScan?.changesGenerated.filter(c => c.marketCategory !== "MARKET_EVENT").length || 0,
    persistenceMode: trace.persistenceMode,
    sourceForensics: trace.sourceDiagnostics.map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      url: s.requestedUrl,
      fetchMode: s.fetchMode,
      httpStatus: s.httpStatus || 200,
      contentLength: s.contentLength || 0,
      authenticityStatus: s.authenticityStatus,
      contentValidationStatus: s.contentValidationStatus,
      evidenceEligible: s.contentValidationStatus === "VALID",
      contentValid: s.contentValid,
      claimsExtracted: s.claimsExtracted,
      claimsVerified: s.claimsVerified,
      entityResolved: s.entityResolved,
      eventsDetected: s.eventsDetected,
      eventsAccepted: s.eventsAccepted,
      rejectionReasons: s.rejectionReasons,
      error: s.error || null,
    })),
    rejections: trace.rejections,
    errors: trace.errors,
  };

  return NextResponse.json({
    success: true,
    data: forensicTrace,
  }, { status: 200 });
}
