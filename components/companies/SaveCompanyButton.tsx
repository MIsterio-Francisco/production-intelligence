"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus } from "lucide-react";

interface SaveCompanyButtonProps {
  companyId: string;
  initialSaved?: boolean;
  initialNotes?: string;
}

export function SaveCompanyButton({
  companyId,
  initialSaved = false,
  initialNotes = "",
}: SaveCompanyButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const handleToggleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/companies/${companyId}/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSaved ? "remove" : "save", notes }),
      });
      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (e) {
      console.error("Failed to save company:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/companies/${companyId}/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", notes }),
      });
      if (res.ok) {
        setIsSaved(true);
        setShowNotesModal(false);
      }
    } catch (e) {
      console.error("Failed to save note:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center space-x-2">
      <Button
        variant={isSaved ? "accent" : "outline"}
        size="sm"
        disabled={loading}
        onClick={handleToggleSave}
        className="h-8 text-xs font-bold flex items-center gap-1.5"
      >
        <Bookmark className="h-3.5 w-3.5" />
        {isSaved ? "En targets de esta semana" : "Añadir a targets semanales"}
      </Button>

      {isSaved && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotesModal(!showNotesModal)}
          className="h-8 text-[11px] text-muted-foreground hover:text-foreground underline"
        >
          {notes ? "Editar nota" : "+ Añadir nota"}
        </Button>
      )}

      {showNotesModal && (
        <div className="absolute right-0 top-10 z-50 w-72 p-3 bg-card border border-border rounded-lg shadow-elevation space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Notas del target semanal
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Próximo paso, contacto previsto, contexto..."
            className="w-full h-20 p-2 text-xs rounded border border-input bg-background focus:outline-none"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNotesModal(false)} className="h-6 text-[10px]">
              Cancel
            </Button>
            <Button variant="accent" size="sm" onClick={handleSaveNotes} disabled={loading} className="h-6 text-[10px] font-bold">
              Save Note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
