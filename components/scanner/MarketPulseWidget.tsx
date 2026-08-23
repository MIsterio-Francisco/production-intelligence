"use client";

import React, { useState } from "react";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Zap, Globe, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarketScanResult, WhatChangedEntry } from "@/types/commercial";

export function MarketPulseWidget({
  lastResult,
  changes,
  onScanTriggered,
}: {
  lastResult: MarketScanResult | null;
  changes: WhatChangedEntry[];
  onScanTriggered?: () => void;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleManualScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus("Ejecutando escaneo real de mercado server-side en Netlify...");

    try {
      const res = await fetch("/api/v1/market/scan", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setScanStatus(
          `Escaneo completado: ${json.realFetches || 0} Real HTTP / ${json.fallbacks || 0} Fallback — ${json.eventsDetected || 0} Eventos (${json.whatChangedCreated || 0} Cambios).`
        );
        if (onScanTriggered) onScanTriggered();
      } else {
        setScanStatus("Scan finalizado.");
      }
    } catch (err) {
      setScanStatus("Error al ejecutar escaneo server-side.");
    } finally {
      setIsScanning(false);
    }
  };

  const dataMode = lastResult?.dataMode || "NO_SCAN_DATA";
  const realFetches = lastResult?.sourcesRealFetch ?? 0;
  const fallbacks = lastResult?.sourcesFallback ?? 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-accent animate-pulse" />
          <h3 className="font-bold text-sm tracking-tight text-foreground uppercase">LIVE MARKET RADAR</h3>
          <Badge
            variant={
              dataMode === "LIVE_EXTERNAL_DATA"
                ? "success"
                : dataMode === "PARTIAL_LIVE_DATA" || dataMode === "MIXED"
                ? "accent"
                : "outline"
            }
            className="text-[10px] font-mono uppercase"
          >
            {dataMode === "LIVE_EXTERNAL_DATA"
              ? "🟢 LIVE EXTERNAL DATA"
              : dataMode === "PARTIAL_LIVE_DATA" || dataMode === "MIXED"
              ? "🟡 MIXED / PARTIAL LIVE"
              : dataMode === "NO_SCAN_DATA"
              ? "⚪ NO RECENT SCAN DATA"
              : "⚪ DEMO / IN-MEMORY"}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono uppercase border-emerald-500/30 text-emerald-600 bg-emerald-50/50">
            🛡️ SOURCE AUTHENTICITY ENFORCED
          </Badge>
        </div>

        <button
          onClick={handleManualScan}
          disabled={isScanning}
          className="flex items-center space-x-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs px-3 py-1.5 rounded font-mono font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "SCANNING..." : "SCAN NOW"}</span>
        </button>
      </div>

      {scanStatus && (
        <div className="text-[11px] font-mono text-accent bg-accent/10 p-2 rounded border border-accent/20">
          {scanStatus}
        </div>
      )}

      {!lastResult && (
        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          No hay un resultado de escaneo persistido disponible para esta sesión. El indicador no presupone que el radar esté activo.
        </p>
      )}

      {/* METRICS & TRACE DIAGNOSTICS */}
      {lastResult && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="bg-background/80 p-2 rounded border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Fuentes Scanned</span>
              <span className="font-bold text-foreground">{lastResult.sourcesScanned}</span>
            </div>
            <div className="bg-background/80 p-2 rounded border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Real HTTP</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {realFetches}
              </span>
            </div>
            <div className="bg-background/80 p-2 rounded border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Fallback</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {fallbacks}
              </span>
            </div>
            <div className="bg-background/80 p-2 rounded border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Eventos</span>
              <span className="font-bold text-accent">{lastResult.eventsDetected}</span>
            </div>
            <div className="bg-background/80 p-2 rounded border border-border">
              <span className="text-[10px] text-muted-foreground uppercase block">Cambios Mercado</span>
              <span className="font-bold text-emerald-600">{changes ? changes.length : lastResult.opportunitiesChanged}</span>
            </div>
          </div>

          {lastResult.trace && (
            <div className="bg-background/90 p-3 rounded border border-border text-[11px] font-mono space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="font-bold text-foreground uppercase tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  SCAN TRACE DIAGNOSTICS ({lastResult.trace.durationMs}ms)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Data Mode: <strong className="text-foreground">{lastResult.trace.dataMode}</strong> | Persistence: <strong className="text-foreground">{lastResult.trace.persistenceMode}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-[10px]">
                <div>Sources Attempted/Fetched: <strong className="text-foreground">{lastResult.trace.sourcesAttempted} / {lastResult.trace.sourcesFetched}</strong></div>
                <div>Real HTTP / Fallback: <strong className="text-emerald-600">{lastResult.trace.sourcesRealFetch}</strong> / <strong className="text-amber-600">{lastResult.trace.sourcesFallback}</strong></div>
                <div>Claims Extracted/Verified: <strong className="text-foreground">{lastResult.trace.claimsExtracted} / {lastResult.trace.claimsVerified}</strong></div>
                <div>Events Detected/Accepted: <strong className="text-foreground">{lastResult.trace.eventsDetected} / {lastResult.trace.eventsAccepted}</strong></div>
              </div>

              {lastResult.trace.rejections && lastResult.trace.rejections.length > 0 && (
                <div className="pt-1.5 border-t border-border/40 space-y-1">
                  <span className="text-[10px] text-amber-600 font-bold block uppercase">
                    Motivos de Descarte Registrados ({lastResult.trace.rejections.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {lastResult.trace.rejections.slice(0, 4).map((rej, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded text-[10px]">
                        <span className="text-foreground font-semibold truncate max-w-[200px]">{rej.itemTitle || rej.sourceId}</span>
                        <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-600 uppercase">
                          [{rej.stage}] {rej.reason}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RECENT WHAT CHANGED PULSE */}
      {changes && changes.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            WHAT CHANGED — Eventos de Mercado Registrados ({changes.length})
          </span>
          {changes.slice(0, 4).map((c) => (
            <div key={c.id} className="bg-background/60 p-2 rounded border border-border/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-accent shrink-0" />
                  {c.companyName} — {c.entityName}
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] uppercase font-mono">
                    {c.marketCategory || "MARKET_EVENT"}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono border-emerald-500/40 text-emerald-600">
                    {c.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-[11px] font-medium">[FACT] {c.factSummary}</p>
              {c.commercialImpact && (
                <p className="text-amber-600 text-[10px] font-mono">[AI SUGGESTION] {c.commercialImpact}</p>
              )}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                <span>Fuente: {c.sourceName} ({c.sourceTier})</span>
                <span className="font-mono text-emerald-600">✓ EVIDENCE FACT</span>
              </div>
            </div>
          ))}
        </div>
      ) : lastResult && lastResult.eventsDetected > 0 ? (
        <div className="text-xs text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-500/30 font-mono">
          {lastResult.eventsDetected} eventos detectados — 0 cambios en Sales Readiness (Registrados como Eventos de Mercado).
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Cero cambios críticos detectados en el último escaneo.</p>
      )}
    </div>
  );
}
