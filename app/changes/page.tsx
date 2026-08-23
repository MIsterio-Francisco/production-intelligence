"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MarketPulseWidget } from "@/components/scanner/MarketPulseWidget";
import { Activity, ShieldCheck, Zap, AlertTriangle, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatChangedEntry, MarketScanResult } from "@/types/commercial";
import Link from "next/link";

export default function WhatChangedPage() {
  const [changes, setChanges] = useState<WhatChangedEntry[]>([]);
  const [lastResult, setLastResult] = useState<MarketScanResult | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  const fetchScanState = async () => {
    try {
      const res = await fetch("/api/v1/market/scan");
      const json = await res.json();
      if (json.data) {
        setChanges(json.data.changes || []);
        setLastResult(json.data.lastResult || null);
      }
    } catch (err) {
      console.error("Failed to fetch market scan state:", err);
    }
  };

  useEffect(() => {
    // The state update happens after the network request resolves, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchScanState();
  }, []);

  const filteredChanges = changes.filter((c) => {
    if (filterPriority === "ALL") return true;
    return c.priority === filterPriority;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-accent" />
                <h1 className="text-xl font-bold tracking-tight uppercase">WHAT CHANGED — MARKET RADAR</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Feed continuo de novedades de mercado, avances de fase técnica, nombramientos de ejecutivos y recálculos comerciales.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {changes.length} Cambios Registrados
              </Badge>
            </div>
          </div>

          {/* Market Pulse Widget */}
          <MarketPulseWidget
            lastResult={lastResult}
            changes={changes}
            onScanTriggered={fetchScanState}
          />

          {/* Filters Bar */}
          <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-foreground uppercase text-[11px]">Filtrar por Prioridad:</span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] transition ${
                    filterPriority === p ? "bg-accent text-accent-foreground" : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Changes Feed List */}
          <div className="space-y-4">
            {filteredChanges.length > 0 ? (
              filteredChanges.map((change) => (
                <div
                  key={change.id}
                  className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-subtle hover:border-accent/50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          change.priority === "CRITICAL"
                            ? "danger"
                            : change.priority === "HIGH"
                            ? "accent"
                            : "outline"
                        }
                        className="text-[10px] font-mono font-bold uppercase"
                      >
                        {change.priority}
                      </Badge>
                      <span className="font-bold text-sm text-foreground">{change.companyName}</span>
                      <span className="text-xs text-muted-foreground font-mono">({change.entityName})</span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
                      <span>{new Date(change.detectedAt).toLocaleString("es-ES")}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {change.sourceTier}
                      </Badge>
                    </div>
                  </div>

                  {/* Fact vs AI Suggestion */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* FACT SUMMARY */}
                    <div className="bg-background p-3 rounded border border-border space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> EVIDENCE FACT
                      </span>
                      <p className="font-semibold text-foreground">{change.factSummary}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">Fuente: {change.sourceName}</p>
                    </div>

                    {/* COMMERCIAL IMPACT / AI SUGGESTION */}
                    <div className="bg-background p-3 rounded border border-border space-y-1">
                      <span className="text-[10px] font-bold text-accent uppercase flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> AI SUGGESTION (IMPACTO COMERCIAL)
                      </span>
                      <p className="text-foreground">{change.commercialImpact}</p>
                      {change.salesReadinessBefore && change.salesReadinessAfter && (
                        <div className="flex items-center gap-1 pt-1 text-[10px] font-mono">
                          <span className="text-muted-foreground">Sales Readiness:</span>
                          <Badge variant="outline" className="text-[9px]">{change.salesReadinessBefore}</Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="accent" className="text-[9px]">{change.salesReadinessAfter}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <Link
                      href="/opportunities"
                      className="text-xs text-accent font-bold font-mono hover:underline flex items-center gap-1"
                    >
                      <span>Ver Oportunidades</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground space-y-2">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
                <p className="font-bold text-sm">Cero cambios encontrados para este filtro.</p>
                <p className="text-xs">Los escaneos automáticos registrarán aquí todo avance de rodaje, posproducción o nombramiento clave.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
