import { MarketScanner } from "../../lib/scanner/market-scanner";

export const handler = async (event: any, context: any) => {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const functionName = "market-scanner-cron";

  console.log(`[NETLIFY SCHEDULED SCANNER] Iniciando ejecución programada @hourly: ${functionName} (${startedAt})`);

  try {
    const scanResult = await MarketScanner.runMarketScan({
      isManual: false,
      forceRealFetch: true,
    });

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;

    const logPayload = {
      level: "INFO",
      functionName,
      scanId: scanResult.scanId,
      startedAt,
      finishedAt,
      durationMs,
      mode: scanResult.mode,
      sourcesScanned: scanResult.sourcesScanned,
      documentsFound: scanResult.documentsFound,
      newSignals: scanResult.newSignals,
      claimsExtracted: scanResult.claimsExtracted,
      claimsVerified: scanResult.claimsVerified,
      eventsDetected: scanResult.eventsDetected,
      opportunitiesChanged: scanResult.opportunitiesChanged,
      trace: scanResult.trace
        ? {
            sourcesAttempted: scanResult.trace.sourcesAttempted,
            sourcesHttpSuccess: scanResult.trace.sourcesHttpSuccess,
            sourcesContentValid: scanResult.trace.sourcesContentValid,
            sourcesEvidenceEligible: scanResult.trace.sourcesEvidenceEligible,
            sourcesBlocked: scanResult.trace.sourcesBlocked,
            sourcesUnavailable: scanResult.trace.sourcesUnavailable,
            sourcesParked: scanResult.trace.sourcesParked,
            documentsFetched: scanResult.trace.documentsFetched,
            documentsValid: scanResult.trace.documentsValid,
            documentsRejected: scanResult.trace.documentsRejected,
            claimsExtracted: scanResult.trace.claimsExtracted,
            claimsVerified: scanResult.trace.claimsVerified,
            claimsRejected: scanResult.trace.claimsRejected,
            eventsDetected: scanResult.trace.eventsDetected,
            eventsAccepted: scanResult.trace.eventsAccepted,
            eventsRejected: scanResult.trace.eventsRejected,
            eventsPersisted: scanResult.trace.eventsPersisted,
            whatChangedCreated: scanResult.trace.whatChangedCreated,
            persistenceMode: scanResult.trace.persistenceMode,
          }
        : undefined,
      errorsCount: scanResult.errors.length,
    };

    console.log(JSON.stringify(logPayload));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SUCCESS",
        message: "Netlify Scheduled Market Scan completed successfully.",
        data: scanResult,
      }),
    };
  } catch (err: any) {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;

    const errorPayload = {
      level: "ERROR",
      functionName,
      startedAt,
      finishedAt,
      durationMs,
      error: err.message || "Scheduled scan execution failed",
      stack: err.stack,
    };

    console.error(JSON.stringify(errorPayload));

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ERROR",
        message: err.message || "Scheduled market scan failed.",
      }),
    };
  }
};

export const config = {
  schedule: "@hourly",
};
