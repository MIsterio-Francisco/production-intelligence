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

export function VerifiedContactEmails({ companyId }: { companyId: string }) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    const response = await fetch(`/api/v1/companies/${companyId}/contacts`);
    if (!response.ok) return;
    const payload = await response.json();
    setContacts(payload.data || []);
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
      const payload = await response.json();
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
          <Button size="sm" variant="outline" disabled={loading} onClick={() => enrich(true)} title="Puede consumir créditos de Apollo">
            Buscar con Apollo
          </Button>
        </div>
      </div>

      {message && <p className="text-[11px] text-muted-foreground">{message}</p>}

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
