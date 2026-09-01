"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, ShieldCheck } from "lucide-react";

interface ContactRow {
  id: string;
  email: string;
  status: "VERIFIED" | "PUBLIC" | "INFERRED" | "UNVERIFIED";
  source_url?: string | null;
  last_checked_at?: string | null;
  contactable: boolean;
}

interface ApolloBudgetSummary {
  phase: "PROMO" | "STANDARD";
  promoExpiresAt: string;
  todayUsed: number;
  dailyLimit: number;
  estimatedRemaining: number;
}

interface ApolloCandidate {
  id: string;
  name: string;
  title: string;
  linkedinUrl?: string;
  organizationName?: string;
}

async function readApiPayload(response: Response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`El servidor no devolvió detalles (HTTP ${response.status}). Revisa los logs de la función en Netlify.`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);
  }
}

export function VerifiedContactEmails({ companyId }: { companyId: string }) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [apolloEligibility, setApolloEligibility] = useState<{ eligible: boolean; reason: string } | null>(null);
  const [apolloBudget, setApolloBudget] = useState<ApolloBudgetSummary | null>(null);
  const [apolloCandidates, setApolloCandidates] = useState<ApolloCandidate[]>([]);

  const loadContacts = useCallback(async () => {
    const response = await fetch(`/api/v1/companies/${companyId}/contacts`);
    if (!response.ok) return;
    const payload = await readApiPayload(response);
    setContacts(payload.data || []);
    setApolloEligibility(payload.apolloEligibility || null);
    const budgetResponse = await fetch("/api/v1/apollo/budget", { cache: "no-store" });
    if (budgetResponse.ok) setApolloBudget((await readApiPayload(budgetResponse)).data || null);
  }, [companyId]);

  useEffect(() => {
    // State changes only after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContacts();
  }, [loadContacts]);

  const enrich = async (includeApollo: boolean) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/companies/${companyId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeApollo }),
      });
      const payload = await readApiPayload(response);
      if (!response.ok) throw new Error(payload.error || "Contact enrichment failed");
      setMessage(includeApollo
        ? `Apollo: ${payload.data.apolloVerified} verificados; ${payload.data.apolloUnverified} no contactables.`
        : `Web oficial: ${payload.data.officialPublished} direcciones publicadas.`);
      await loadContacts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Contact enrichment failed");
    } finally {
      setLoading(false);
    }
  };

  const searchApollo = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/companies/${companyId}/apollo-candidates`, { cache: "no-store" });
      const payload = await readApiPayload(response);
      if (!response.ok) throw new Error(payload.error || "No se pudo buscar en Apollo.");
      setApolloCandidates(payload.data || []);
      setMessage(payload.data?.length
        ? `${payload.data.length} decisor(es) encontrados. La búsqueda no consume créditos.`
        : "Apollo aceptó la consulta, pero no encontró cargos de producción para el dominio oficial. No se consumieron créditos; puede que Apollo tenga la empresa registrada con otro dominio.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo buscar en Apollo.");
    } finally {
      setLoading(false);
    }
  };

  const revealApolloEmail = async (candidate: ApolloCandidate) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/companies/${companyId}/apollo-candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const payload = await readApiPayload(response);
      if (!response.ok) throw new Error(payload.error || "No se pudo enriquecer el contacto.");
      setMessage(payload.data.status === "NO_EMAIL"
        ? `Apollo no devolvió un email para ${candidate.name}.`
        : `Email de ${candidate.name}: ${payload.data.status}.`);
      await loadContacts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enriquecer el contacto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Contactos con procedencia</p>
          <p className="text-[10px] text-muted-foreground">Solo VERIFIED y PUBLIC pueden marcarse como contactables.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={loading} onClick={() => enrich(false)}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Web oficial
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || apolloEligibility?.eligible === false}
            onClick={searchApollo}
            title={apolloEligibility?.reason || "La búsqueda de candidatos no consume créditos"}
          >
            Buscar decisores con Apollo
          </Button>
        </div>
      </div>

      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}
      {apolloEligibility && (
        <p className={`text-[11px] ${apolloEligibility.eligible ? "text-muted-foreground" : "text-amber-600"}`}>
          Apollo: {apolloEligibility.reason}
        </p>
      )}
      {apolloBudget && (
        <p className="text-[11px] text-muted-foreground">
          Presupuesto Apollo estimado: {apolloBudget.todayUsed}/{apolloBudget.dailyLimit} hoy · {apolloBudget.estimatedRemaining} restantes en fase {apolloBudget.phase}.
        </p>
      )}

      {apolloCandidates.length > 0 && (
        <div className="space-y-2 rounded-md border border-border p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Candidatos Apollo · búsqueda gratuita</p>
          {apolloCandidates.map((candidate) => (
            <div key={candidate.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
              <div>
                <p className="font-semibold">{candidate.name}</p>
                <p className="text-[11px] text-muted-foreground">{candidate.title}{candidate.organizationName ? ` · ${candidate.organizationName}` : ""}</p>
                {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="text-[10px] underline text-muted-foreground">LinkedIn</a>}
              </div>
              <Button size="sm" variant="outline" disabled={loading} onClick={() => revealApolloEmail(candidate)}>
                Revelar email
              </Button>
            </div>
          ))}
          <p className="text-[10px] text-amber-700">“Revelar email” puede consumir créditos. No se solicitan teléfonos.</p>
        </div>
      )}

      {contacts.length > 0 ? (
        <div className="space-y-1.5">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-border pt-1.5">
              <span className="flex items-center gap-1.5 font-mono"><Mail className="h-3.5 w-3.5" />{contact.email}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant={contact.contactable ? "success" : "outline"}>{contact.status}</Badge>
                {contact.source_url && <a href={contact.source_url} target="_blank" rel="noreferrer" className="underline text-muted-foreground">Fuente</a>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Todavía no hay emails con evidencia guardada.</p>
      )}
    </div>
  );
}
