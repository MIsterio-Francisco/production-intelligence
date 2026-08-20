"use client";

import React from "react";
import { ShieldCheck, Activity, AlertTriangle, Database, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarketScanResult } from "@/types/commercial";

export function ScanDashboardModal({
  lastResult,
  isOpen,
  onClose,
}: {
  lastResult: MarketScanResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-base text-foreground uppercase tracking-tight">MARKET SCANNER AUDIT DASHBOARD</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm font-bold">
            ✕
          </button>
        </div>

        {lastResult ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-background p-3 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Scan ID</span>
                <span className="font-bold text-foreground truncate block">{lastResult.scanId}</span>
              </div>
              <div className="bg-background p-3 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Modo de Datos</span>
                <Badge variant="outline" className="text-[9px] uppercase mt-0.5">
                  {lastResult.mode}
                </Badge>
              </div>
              <div className="bg-background p-3 rounded border border-border">
                <span className="text-[10px] text-muted-foreground uppercase block">Fecha / Hora</span>
                <span className="font-bold text-foreground">{new Date(lastResult.completedAt).toLocaleTimeString("es-ES")}</span>
              </div>
            </div>

            <div className="bg-background p-3 rounded border border-border space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Métricas de Ingesta e Inspección</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>Documentos: <span className="font-bold text-foreground">{lastResult.documentsFound}</span></div>
                <div>Nuevos Signals: <span className="font-bold text-emerald-600">{lastResult.newSignals}</span></div>
                <div>Duplicados: <span className="font-bold text-muted-foreground">{lastResult.duplicateSignals}</span></div>
                <div>Claims Verificados: <span className="font-bold text-accent">{lastResult.claimsVerified}</span></div>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <div className="bg-rose-50 text-rose-900 border border-rose-300 p-3 rounded space-y-1">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-600" /> Errores de Conexión de Fuentes ({lastResult.errors.length})
                </span>
                {lastResult.errors.map((e, idx) => (
                  <p key={idx} className="text-[11px] font-mono">
                    [{e.sourceId}]: {e.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin escaneos de mercado registrados todavía.</p>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="bg-accent text-accent-foreground px-4 py-1.5 rounded font-mono font-bold text-xs"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
}
