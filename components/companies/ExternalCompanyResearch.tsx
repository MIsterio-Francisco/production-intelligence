"use client";

import { useState } from "react";
import { BookmarkPlus, Globe2, Search, UserRound } from "lucide-react";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const sourceLabels: Record<ExternalCompanyResult["source"], string> = {
    TAVILY: "Tavily · web candidata",
    WIKIDATA: "Wikidata",
    CALIFORNIA_FILM_COMMISSION: "California Film Commission",
    NEW_MEXICO_FILM_OFFICE: "New Mexico Film Office",
  };

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
      setSelected(new Set());
      if (payload.diagnostics?.tavilyStatus === "ERROR") {
        setMessage(`Tavily no completó la búsqueda: ${payload.diagnostics.tavilyError}`);
      } else if (!payload.data?.length) {
        setMessage(`Tavily respondió pero devolvió ${payload.diagnostics?.tavilyReturned ?? 0} resultados utilizables. No gastes más créditos con esta consulta hasta revisar el diagnóstico.`);
      } else {
        setMessage(payload.diagnostics?.cacheHit
          ? `Resultado recuperado de Supabase sin consumir otro crédito: ${payload.data.length} candidata/s.`
          : `Tavily devolvió ${payload.diagnostics?.tavilyReturned ?? 0} resultado/s; se guardaron en Supabase durante 30 días y ${payload.diagnostics?.tavilyAccepted ?? 0} aparecen como candidatas Tavily.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo investigar.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCandidates(candidates: ExternalCompanyResult[]) {
    const eligible = candidates.filter((result) => result.officialWebsiteUrl && !saved.has(`${result.source}:${result.externalId}`));
    if (!eligible.length) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/internal/company-intake/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: eligible.map((result) => ({
          name: result.name,
          officialWebsiteUrl: result.officialWebsiteUrl,
          discoverySourceUrl: result.sourceUrl,
          discoverySourceType: result.source,
          countryCode: result.countryCode,
        })) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudieron guardar las candidatas.");
      const keys = eligible.map((result) => `${result.source}:${result.externalId}`);
      setSaved((current) => new Set([...current, ...keys]));
      setSelected((current) => new Set([...current].filter((key) => !keys.includes(key))));
      setMessage(payload.data.length
        ? `${payload.data.length} candidata/s guardada/s para verificar su web oficial.`
        : "Las empresas seleccionadas ya estaban guardadas o existen en el catálogo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar las candidatas.");
    } finally {
      setSaving(false);
    }
  }

  async function resolveCandidateWebsite(result: ExternalCompanyResult) {
    const key = `${result.source}:${result.externalId}`;
    setResolving((current) => new Set(current).add(key));
    setMessage(null);
    try {
      const params = new URLSearchParams({ q: result.name });
      if (result.countryCode) params.set("country", result.countryCode);
      const response = await fetch(`/api/v1/research/companies?${params}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Tavily no pudo resolver la web.");
      const tavilyMatch = (payload.data || []).find((candidate: ExternalCompanyResult) =>
        candidate.source === "TAVILY" && candidate.officialWebsiteUrl
      ) as ExternalCompanyResult | undefined;
      if (!tavilyMatch?.officialWebsiteUrl) throw new Error(`Tavily no encontró una web candidata para ${result.name}.`);
      setResults((current) => current.map((candidate) =>
        `${candidate.source}:${candidate.externalId}` === key
          ? { ...candidate, officialWebsiteUrl: tavilyMatch.officialWebsiteUrl, sourceUrl: tavilyMatch.sourceUrl }
          : candidate
      ));
      setMessage(`Web candidata resuelta para ${result.name}. Revísala antes de seleccionar y guardar.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tavily no pudo resolver la web.");
    } finally {
      setResolving((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  const selectableResults = results.filter((result) => result.officialWebsiteUrl && !saved.has(`${result.source}:${result.externalId}`));
  const selectedResults = selectableResults.filter((result) => selected.has(`${result.source}:${result.externalId}`));

  return (
    <section className="rounded-lg border border-accent/25 bg-card p-4 space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase flex items-center gap-2"><Globe2 className="h-4 w-4 text-accent" /> Research libre</h2>
        <p className="text-xs text-muted-foreground mt-1">Busca globalmente productoras de cine, TV y publicidad/TVC. Tavily prioriza empresas con señales de Head of Production, Production Director, Executive Producer, Managing Director o cargos equivalentes. Los resultados son candidatos hasta verificar su web; Apollo nunca se ejecuta automáticamente.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && research()} placeholder="Ej.: productoras de TVC, ficción, Producers, Head of Production…" />
        <Input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={2} className="uppercase" placeholder="País: AR" />
        <Button onClick={() => void research()} disabled={loading}><Search className="h-4 w-4 mr-1" />{loading ? "Buscando…" : "Buscar fuera"}</Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Búsqueda global activa:</span>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => { setCountry("US"); void research("US"); }}>USA · actividad oficial</Button>
        <span className="text-[11px] text-muted-foreground">Usa ES, PT, GB, US, MX u otro código de país para priorizar el mercado.</span>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
            <Button type="button" size="sm" variant="outline" disabled={!selectableResults.length || saving} onClick={() => {
              const allSelected = selectableResults.every((result) => selected.has(`${result.source}:${result.externalId}`));
              setSelected(allSelected ? new Set() : new Set(selectableResults.map((result) => `${result.source}:${result.externalId}`)));
            }}>
              {selectableResults.length > 0 && selectableResults.every((result) => selected.has(`${result.source}:${result.externalId}`)) ? "Deseleccionar todas" : "Seleccionar todas"}
            </Button>
            <Button type="button" size="sm" disabled={!selectedResults.length || saving} onClick={() => void saveCandidates(selectedResults)}>
              <BookmarkPlus className="mr-1 h-4 w-4" /> {saving ? "Guardando…" : `Guardar candidata/s (${selectedResults.length})`}
            </Button>
            <span className="text-[11px] text-muted-foreground">Se omiten automáticamente empresas duplicadas por dominio o nombre.</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
          {results.map((result) => {
            const key = `${result.source}:${result.externalId}`;
            return (
              <article key={key} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-current" checked={selected.has(key)} disabled={!result.officialWebsiteUrl || saved.has(key) || saving} onChange={(event) => setSelected((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(key); else next.delete(key);
                      return next;
                    })} />
                    <strong className="text-sm">{result.name}</strong>
                  </label>
                  <Badge variant="outline">{sourceLabels[result.source]}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{result.countryName || result.countryCode || "País no indicado"} · {result.evidence}</p>
                {result.productionSignal && (
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-900">
                    <strong>Producción activa:</strong> {result.productionSignal.projectTitle}
                    <div>{result.productionSignal.market} · {result.productionSignal.fiscalYear || "Fecha fiscal no indicada"}{result.productionSignal.signalDate ? ` · ${result.productionSignal.signalDate}` : ""}</div>
                    {(result.productionSignal.qualifiedExpenditure || result.productionSignal.creditAllocation) && <div>Gasto cualificado: {result.productionSignal.qualifiedExpenditure || "—"} · Incentivo: {result.productionSignal.creditAllocation || "—"}</div>}
                  </div>
                )}
                {result.officialWebsiteUrl ? (
                  <a className="text-xs font-semibold text-accent underline break-all" href={result.officialWebsiteUrl} target="_blank" rel="noreferrer">{result.source === "TAVILY" ? "Abrir web candidata" : "Web oficial"}</a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700">Señal oficial encontrada; falta resolver la web antes de seleccionarla.</p>
                    <Button type="button" size="sm" variant="outline" disabled={resolving.has(key)} onClick={() => void resolveCandidateWebsite(result)}>
                      <Search className="mr-1 h-3.5 w-3.5" /> {resolving.has(key) ? "Buscando web…" : "Buscar web con Tavily"}
                    </Button>
                  </div>
                )}
                {result.decisionMakers.map((person) => (
                  <a key={`${person.sourceUrl}:${person.role}`} href={person.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-foreground hover:text-accent">
                    <UserRound className="h-3 w-3" /> {person.name} — {person.role}
                  </a>
                ))}
                <a className="block text-[11px] text-muted-foreground underline" href={result.sourceUrl} target="_blank" rel="noreferrer">Ver fuente y evidencia</a>
                <Button size="sm" variant="outline" disabled={!result.officialWebsiteUrl || saved.has(key) || saving} onClick={() => void saveCandidates([result])}>
                  {saved.has(key) ? "Guardada" : "Guardar candidata"}
                </Button>
              </article>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}
