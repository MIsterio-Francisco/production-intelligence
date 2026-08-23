"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompanyIntakeQueueForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/internal/company-intake/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: [{
          name: form.get("name"),
          officialWebsiteUrl: form.get("officialWebsiteUrl"),
          discoverySourceUrl: form.get("discoverySourceUrl"),
          countryCode: form.get("countryCode"),
        }] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo añadir la candidata.");
      setMessage(payload.data.length > 0 ? "Candidata añadida a la cola diaria." : "El dominio ya estaba en la cola.");
      if (payload.data.length > 0) event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir la candidata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <Input name="name" required placeholder="Nombre de la productora" />
      <Input name="countryCode" maxLength={2} placeholder="País (ES, GB, US...)" className="uppercase" />
      <Input name="officialWebsiteUrl" type="url" required placeholder="https://web-oficial.com" />
      <Input name="discoverySourceUrl" type="url" required placeholder="Enlace donde se descubrió" />
      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Añadiendo…" : "Añadir a cola verificada"}</Button>
        {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
}
