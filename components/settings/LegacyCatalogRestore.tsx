"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LegacyCatalogRestore() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const restore = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/internal/company-intake/legacy-catalog", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Import failed.");
      setMessage(
        `${payload.data.imported} recuperadas; ${payload.data.alreadyPresent} ya existían; ` +
        `${payload.data.queuedForOfficialReview} en cola de revisión oficial.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
      <p className="text-xs text-amber-900">
        Recupera el catálogo anterior como SOURCE_CLAIM. No importa emails ni marca registros como verificados;
        sus webs quedan en cola para revisión oficial.
      </p>
      <Button type="button" variant="outline" onClick={restore} disabled={loading}>
        {loading ? "Recuperando…" : "Recuperar catálogo anterior"}
      </Button>
      {message && <p className="text-xs font-medium text-amber-900">{message}</p>}
    </div>
  );
}
