"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PilotRow = {
  key: string; name: string; countryCode: string; city: string; websiteUrl: string;
  publicEmail?: string; segment: string; status: "READY" | "DUPLICATE";
};

export function CuratedCompanyPilotImport() {
  const [rows, setRows] = useState<PilotRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/internal/imports/curated-company-pilot", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo preparar la vista previa.");
      setRows(payload.data.rows);
      setSelected(new Set(payload.data.rows.filter((row: PilotRow) => row.status === "READY").map((row: PilotRow) => row.key)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo preparar la vista previa.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/v1/internal/imports/curated-company-pilot", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No se pudo preparar la vista previa.");
        return payload.data.rows as PilotRow[];
      })
      .then((pilotRows) => {
        if (!active) return;
        setRows(pilotRows);
        setSelected(new Set(pilotRows.filter((row) => row.status === "READY").map((row) => row.key)));
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "No se pudo preparar la vista previa."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const runImport = async () => {
    if (selected.size === 0) return;
    setLoading(true); setMessage(null);
    try {
      const response = await fetch("/api/v1/internal/imports/curated-company-pilot", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ keys: [...selected] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Importación fallida.");
      setMessage(`${payload.data.imported} productoras importadas y ${payload.data.emailsAdded} emails públicos añadidos. ${payload.data.duplicates} duplicados omitidos.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Importación fallida.");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-3">
      <div>
        <p className="text-xs font-bold text-emerald-950">Piloto curado: España y Portugal</p>
        <p className="text-xs text-emerald-900 mt-1">12 productoras de cine/TV/TVC. No contiene proveedores. Los emails se guardan como PUBLIC, nunca como consentimiento de mailing.</p>
      </div>
      {loading && rows.length === 0 ? <p className="text-xs">Comprobando duplicados…</p> : (
        <div className="max-h-72 overflow-auto rounded border border-emerald-200 bg-white">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary"><tr><th className="p-2 text-left">Importar</th><th className="p-2 text-left">Productora</th><th className="p-2 text-left">País</th><th className="p-2 text-left">Segmento</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Estado</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.key} className="border-t border-border">
              <td className="p-2"><input type="checkbox" aria-label={`Importar ${row.name}`} disabled={row.status === "DUPLICATE" || loading} checked={selected.has(row.key)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(row.key); else next.delete(row.key); return next; })} /></td>
              <td className="p-2 font-semibold"><a className="underline" href={row.websiteUrl} target="_blank" rel="noreferrer">{row.name}</a></td>
              <td className="p-2">{row.countryCode}</td><td className="p-2">{row.segment}</td><td className="p-2">{row.publicEmail || "—"}</td>
              <td className="p-2 font-mono">{row.status === "READY" ? "LISTA" : "DUPLICADA"}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-3"><Button type="button" onClick={runImport} disabled={loading || selected.size === 0}>Importar selección ({selected.size})</Button><span className="text-xs text-muted-foreground">La operación es idempotente y omite coincidencias por dominio o nombre.</span></div>
      {message && <p className="text-xs font-medium text-emerald-950">{message}</p>}
    </div>
  );
}
