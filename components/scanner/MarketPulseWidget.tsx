"use client";

import React, { useState } from "react";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
    setScanStatus("Escaneando fuentes de mercado...");

    try {
      const res = await fetch("/api/v1/market/scan", { method: "POST" });
      const json = await res.json();
      if (json.data) {
        setScanStatus(`Escaneo completado: ${json.data.eventsDetected} eventos detectados.`);
        if (onScanTriggered) onScanTriggered();
      } else {
        setScanStatus("Scan finalizado.");
      }
    } catch (err) {
      setScanStatus("Error al ejecutar escaneo.");
    } finally {
      setIsScanning(false);
    }
  };

  const mode = lastResult?.mode || "IN_MEMORY_FALLBACK";

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-accent animate-pulse" />
          <h3 className="font-bold text-sm tracking-tight text-foreground uppercase">MARKET PULSE RADAR</h3>
          <Badge
            variant={
              mode === "LIVE_DATA"
                ? "success"
                : mode === "RECENTLY_SCANNED"
                ? "accent"
                : "outline"
            }
            className="text-[10px] font-mono uppercase"
          >
            {mode === "LIVE_DATA" ? "🟢 LIVE DATA" : mode === "RECENTLY_SCANNED" ? "🟡 RECENTLY SCANNED" : "⚪ IN-MEMORY FALLBACK"}
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

      {/* METRICS SUMMARY */}
      {lastResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-background/80 p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">Fuentes Scanned</span>
            <span className="font-bold text-foreground">{lastResult.sourcesScanned}</span>
          </div>
          <div className="bg-background/80 p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">Nuevas Señales</span>
            <span className="font-bold text-emerald-600">{lastResult.newSignals}</span>
          </div>
          <div className="bg-background/80 p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">Eventos Verificados</span>
            <span className="font-bold text-accent">{lastResult.eventsDetected}</span>
          </div>
          <div className="bg-background/80 p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">Cambios Venta</span>
            <span className="font-bold text-amber-600">{lastResult.opportunitiesChanged}</span>
          </div>
        </div>
      )}

      {/* RECENT WHAT CHANGED PULSE */}
      {changes && changes.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Últimos Cambios de Mercado ({changes.length})
          </span>
          {changes.slice(0, 3).map((c) => (
            <div key={c.id} className="bg-background/60 p-2 rounded border border-border/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-accent shrink-0" />
                  {c.companyName} — {c.entityName}
                </span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono">
                  {c.priority}
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] font-medium">{c.factSummary}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
                <span>Fuente: {c.sourceName} ({c.sourceTier})</span>
                <span className="font-mono text-emerald-600">✓ EVIDENCE FACT</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Cero cambios críticos detectados en el último escaneo.</p>
      )}
    </div>
  );
}
