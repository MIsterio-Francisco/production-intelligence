"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CalendarDays } from "lucide-react";

const STATUSES = ["PLANNED", "RESEARCHING", "READY", "CONTACTED", "REPLIED", "MEETING", "WON", "LOST", "PAUSED"];

export function WeeklyTargetTracker({ initialTargets }: { initialTargets: any[] }) {
  const [targets, setTargets] = useState(initialTargets);
  const [message, setMessage] = useState<string | null>(null);

  async function changeStatus(companyId: string, status: string) {
    const response = await fetch("/api/v1/weekly-targets", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, status, channel: status === "CONTACTED" ? "EMAIL" : null }),
    });
    if (!response.ok) return setMessage("No se pudo actualizar el estado.");
    setTargets((current) => current.map((item) => item.company_id === companyId ? { ...item, status } : item));
    setMessage("Estado guardado en el historial comercial.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><CalendarDays className="h-5 w-5 text-accent" /> Targets de esta semana</h2>
          <p className="text-xs text-muted-foreground">Empresas elegidas para trabajar; no recomendaciones automáticas.</p>
        </div>
        <a href="/api/v1/weekly-targets/export"><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Descargar log CSV</Button></a>
      </div>
      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}
      {targets.length === 0 ? (
        <div className="rounded border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Guarda productoras desde Discover para construir el plan semanal.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead><tr className="bg-secondary text-left"><th className="p-3">Empresa</th><th className="p-3">País</th><th className="p-3">Semana</th><th className="p-3">Estado</th></tr></thead>
            <tbody className="divide-y divide-border">{targets.map((item) => (
              <tr key={item.company_id}>
                <td className="p-3"><Link className="font-bold hover:underline" href={`/companies/${item.company?.slug}`}>{item.company?.name}</Link></td>
                <td className="p-3 font-mono">{item.company?.country_code || "—"}</td>
                <td className="p-3 font-mono">{item.week_start || "Esta semana"}</td>
                <td className="p-3"><select value={item.status || "PLANNED"} onChange={(event) => changeStatus(item.company_id, event.target.value)} className="h-8 rounded border border-input bg-card px-2">{STATUSES.map((status) => <option key={status}>{status}</option>)}</select> <Badge variant="outline" className="ml-2">{item.status || "PLANNED"}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
