"use client";

import { useState } from "react";
import { Globe2, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ExternalCompanyResult } from "@/lib/research/free-company-research";

export function ExternalCompanyResearch() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [results, setResults] = useState<ExternalCompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  async function research(countryOverride?: string) {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ q: query });
      const selectedCountry = countryOverride || country;
      if (selectedCountry.trim()) params.set("country", selectedCountry.trim().toUpperCase());
      const response = await fetch(`/api/v1/research/companies?${params}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo investigar.");
      setResults(payload.data || []);
      if (!payload.data?.length) setMessage("No se encontraron candidatas en las fuentes gratuitas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo investigar.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCandidate(result: ExternalCompanyResult) {
    if (!result.officialWebsiteUrl) return;
    setMessage(null);
    const response = await fetch("/api/v1/internal/company-intake/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: [{
        name: result.name,
        officialWebsiteUrl: result.officialWebsiteUrl,
        discoverySourceUrl: result.sourceUrl,
        discoverySourceType: result.source,
        countryCode: result.countryCode,
      }] }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "No se pudo guardar la candidata.");
      return;
    }
    setSaved((current) => new Set(current).add(`${result.source}:${result.externalId}`));
    setMessage(payload.data.length ? "Candidata guardada para verificar su web oficial." : "La empresa ya estaba en la cola.");
  }

  return (
    <section className="rounded-lg border border-accent/25 bg-card p-4 space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase flex items-center gap-2"><Globe2 className="h-4 w-4 text-accent" /> Research libre</h2>
        <p className="text-xs text-muted-foreground mt-1">Busca fuera de Supabase con fuentes gratuitas. USA consulta además producciones aprobadas oficialmente en California. Sin emails generales ni consumo automático de Apollo.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && research()} placeholder="Productora, proyecto o mercado (US)" />
        <Input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={2} className="uppercase" placeholder="País: AR" />
        <Button onClick={() => void research()} disabled={loading}><Search className="h-4 w-4 mr-1" />{loading ? "Buscando…" : "Buscar fuera"}</Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Mercados activos:</span>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => { setCountry("US"); void research("US"); }}>USA · producciones aprobadas</Button>
        <span className="text-[11px] text-muted-foreground">UK y Europa: próximos adaptadores oficiales</span>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      {results.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((result) => {
            const key = `${result.source}:${result.externalId}`;
            return (
              <article key={key} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex justify-between gap-2"><strong className="text-sm">{result.name}</strong><Badge variant="outline">{result.source}</Badge></div>
                <p className="text-[11px] text-muted-foreground">{result.countryName || result.countryCode || "País no indicado"} · {result.evidence}</p>
                {result.productionSignal && (
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-900">
                    <strong>Producción activa:</strong> {result.productionSignal.projectTitle}
                    <div>{result.productionSignal.market} · {result.productionSignal.fiscalYear || "Fecha fiscal no indicada"}{result.productionSignal.signalDate ? ` · ${result.productionSignal.signalDate}` : ""}</div>
                    {(result.productionSignal.qualifiedExpenditure || result.productionSignal.creditAllocation) && <div>Gasto cualificado: {result.productionSignal.qualifiedExpenditure || "—"} · Incentivo: {result.productionSignal.creditAllocation || "—"}</div>}
                  </div>
                )}
                {result.officialWebsiteUrl ? (
                  <a className="text-xs font-semibold text-accent underline break-all" href={result.officialWebsiteUrl} target="_blank" rel="noreferrer">Web oficial</a>
                ) : <p className="text-xs text-amber-700">Señal oficial encontrada; falta resolver la web oficial antes de guardarla.</p>}
                {result.decisionMakers.map((person) => (
                  <a key={`${person.sourceUrl}:${person.role}`} href={person.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-foreground hover:text-accent">
                    <UserRound className="h-3 w-3" /> {person.name} — {person.role}
                  </a>
                ))}
                <a className="block text-[11px] text-muted-foreground underline" href={result.sourceUrl} target="_blank" rel="noreferrer">Ver fuente y evidencia</a>
                <Button size="sm" variant="outline" disabled={!result.officialWebsiteUrl || saved.has(key)} onClick={() => saveCandidate(result)}>
                  {saved.has(key) ? "Guardada" : "Guardar candidata"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
