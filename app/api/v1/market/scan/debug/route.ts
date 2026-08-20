import { NextResponse } from "next/server";
import { MarketScanner } from "@/lib/scanner/market-scanner";

export async function GET() {
  const lastScan = MarketScanner.getLastScanResult();
  const trace = lastScan?.trace;

  if (!trace) {
    return NextResponse.json({
      success: false,
      message: "No scan trace recorded yet.",
      trace: null,
    }, { status: 200 });
  }

  const forensicTrace = {
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
    persistenceMode: trace.persistenceMode,
    sourceForensics: trace.sourceDiagnostics.map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      url: s.requestedUrl,
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
