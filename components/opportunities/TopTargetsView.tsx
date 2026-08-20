"use client";

import React, { useState } from "react";
import { TopCommercialTarget, SalesReadiness } from "@/types/commercial";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Building2,
  Clapperboard,
  UserCheck,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HelpCircle,
  AlertOctagon,
  Search,
  CheckCircle2,
  PhoneCall,
  Clock,
  History,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface TopTargetsViewProps {
  targets: TopCommercialTarget[];
}

export function TopTargetsView({ targets }: TopTargetsViewProps) {
  const [activeTab, setActiveTab] = useState<SalesReadiness | "ALL">("CALL_NOW");
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTargetId(expandedTargetId === id ? null : id);
  };

  const callNowTargets = targets.filter((t) => t.salesReadiness === "CALL_NOW");
  const contactSoonTargets = targets.filter((t) => t.salesReadiness === "CONTACT_SOON");
  const researchFirstTargets = targets.filter((t) => t.salesReadiness === "RESEARCH_FIRST");
  const doNotContactTargets = targets.filter((t) => t.salesReadiness === "DO_NOT_CONTACT");

  const displayedTargets =
    activeTab === "CALL_NOW"
      ? callNowTargets
      : activeTab === "CONTACT_SOON"
      ? contactSoonTargets
      : activeTab === "RESEARCH_FIRST"
      ? researchFirstTargets
      : activeTab === "DO_NOT_CONTACT"
      ? doNotContactTargets
      : targets;

  return (
    <div className="space-y-6">
      {/* HEADER ROW WITH 4 SALES READINESS TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <span>COMMERCIAL SALES EXECUTION ENGINE — V1.3</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Regla Absoluta de Negocio: <strong>NO SE CONTACTAN PERSONAS SIN EVIDENCIA SUFICIENTE</strong></span>
          </p>
        </div>

        {/* 4 SALES READINESS TABS SELECTOR */}
        <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-lg border border-border flex-wrap">
          <button
            onClick={() => setActiveTab("CALL_NOW")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "CALL_NOW"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>🟢 Call Now ({callNowTargets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("CONTACT_SOON")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "CONTACT_SOON"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>🟡 Contact Soon ({contactSoonTargets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("RESEARCH_FIRST")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "RESEARCH_FIRST"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>🔵 Research Queue ({researchFirstTargets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("DO_NOT_CONTACT")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "DO_NOT_CONTACT"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>🔴 Do Not Contact ({doNotContactTargets.length})</span>
          </button>
        </div>
      </div>

      {/* BANNER DISCLAIMER FOR ACTIVE TAB */}
      {activeTab === "CALL_NOW" && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3 rounded-md text-xs flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Call Now Readiness:</strong> Producción activa, interlocutor de producción verificado y evidencia 'Why Now' fresca. Sin conflictos de datos abiertos.</span>
          </span>
          <Badge variant="success" className="font-mono text-[10px]">
            {callNowTargets.length} Targets Accionables
          </Badge>
        </div>
      )}

      {activeTab === "CONTACT_SOON" && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-md text-xs flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <span><strong>Pipeline Maturation:</strong> Proyecto activo con interlocutor verificado. Contactar para prospección o envío de Show-LUTs.</span>
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {contactSoonTargets.length} Prospección
          </Badge>
        </div>
      )}

      {activeTab === "RESEARCH_FIRST" && (
        <div className="bg-blue-50 text-blue-900 border border-blue-200 p-3 rounded-md text-xs flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600 shrink-0" />
            <span><strong>Research Queue V2 (Insufficient Data / Conflict):</strong> Oportunidades que requieren verificar el interlocutor de posproducción o resolver conflictos de fuentes.</span>
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {researchFirstTargets.length} Requieren Investigación
          </Badge>
        </div>
      )}

      {activeTab === "DO_NOT_CONTACT" && (
        <div className="bg-rose-50 text-rose-900 border border-rose-200 p-3 rounded-md text-xs flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0" />
            <span><strong>Do Not Contact:</strong> Producciones completadas o datos de empresa sin evidencia suficiente. No contactar.</span>
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {doNotContactTargets.length} Aisladas
          </Badge>
        </div>
      )}

      {/* TARGETS CARDS LIST */}
      <div className="space-y-4">
        {displayedTargets.map((target, index) => {
          const isExpanded = expandedTargetId === target.id;
          const score = target.targetScore.totalScore;
          const confLevel = target.confidence.level;

          return (
            <Card
              key={target.id}
              className={`transition-all duration-200 border ${
                target.salesReadiness === "CALL_NOW"
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-md"
                  : target.salesReadiness === "CONTACT_SOON"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : target.salesReadiness === "RESEARCH_FIRST"
                  ? "border-blue-500/30 bg-blue-500/5"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* HEADER ROW */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`font-black text-sm h-8 w-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                      target.salesReadiness === "CALL_NOW" ? "bg-emerald-600 text-white" : "bg-accent text-accent-foreground"
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/companies/${target.company.slug}`}
                          className="text-lg font-bold text-foreground hover:text-accent hover:underline flex items-center gap-1"
                        >
                          {target.company.name}
                        </Link>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {target.company.countryCode}
                        </Badge>
                        <Badge
                          variant={
                            target.salesReadiness === "CALL_NOW"
                              ? "success"
                              : target.salesReadiness === "CONTACT_SOON"
                              ? "accent"
                              : "outline"
                          }
                          className="text-[10px] font-bold font-mono"
                        >
                          {target.salesReadiness.replace(/_/g, " ")}
                        </Badge>

                        {/* DATA CONFLICT BADGE */}
                        {target.dataConflict && (
                          <Badge variant="danger" className="text-[10px] flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> OPEN DATA CONFLICT
                          </Badge>
                        )}
                      </div>

                      {target.whyNow && (
                        <p className="text-xs text-accent font-medium mt-0.5 flex items-center gap-1">
                          <Zap className="h-3 w-3 shrink-0" />
                          <span>{target.whyNow.title}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* VERIFICATION DATE */}
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Re-Verificación</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(target.lastVerifiedAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>

                    {/* CONFIDENCE BADGE */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Confidencia</span>
                      <Badge
                        variant={confLevel === "HIGH" ? "success" : confLevel === "MEDIUM" ? "accent" : "outline"}
                        className="text-xs font-bold"
                      >
                        {confLevel} ({target.confidence.score}%)
                      </Badge>
                    </div>

                    {/* TARGET SCORE BADGE */}
                    <div className="text-right bg-secondary/80 px-3 py-1 rounded border border-border">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Target Score</span>
                      <span className="text-lg font-black font-mono text-foreground">{score}/100</span>
                    </div>
                  </div>
                </div>

                {/* DATA CONFLICT BANNER */}
                {target.dataConflict && (
                  <div className="bg-rose-50 text-rose-900 border border-rose-300 p-3 rounded text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">DATA CONFLICT DETECTADO: </span>
                      <span>{target.dataConflict.reason}</span>
                    </div>
                  </div>
                )}

                {/* ESSENTIAL B2B CHAIN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* RECOMMENDED SERVICE */}
                  <div className="bg-background/80 p-3 rounded border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Zap className="h-3 w-3 text-accent" /> Servicio MCL Recomendado
                    </span>
                    <p className="font-bold text-foreground">
                      {target.potentialService?.serviceName || "Etalonaje 4K HDR & Deliveries"}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={target.potentialService?.fitLevel === "VERIFIED_FIT" ? "success" : "outline"}
                        className="text-[10px]"
                      >
                        {target.potentialService?.fitLevel?.replace("_", " ") || "PROBABLE FIT"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {target.potentialService?.needType || "POTENTIAL FIT"}
                      </Badge>
                    </div>
                  </div>

                  {/* RELEVANT PROJECT */}
                  <div className="bg-background/80 p-3 rounded border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Clapperboard className="h-3 w-3 text-accent" /> Proyecto Justificador
                    </span>
                    {target.relevantProject ? (
                      <div>
                        <Link
                          href={`/projects/${target.relevantProject.id}`}
                          className="font-bold text-foreground hover:underline"
                        >
                          {target.relevantProject.title}
                        </Link>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          Fase: <span className="font-semibold text-foreground">{target.relevantProject.status.replace("_", " ")}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">Sin proyecto activo específico</p>
                    )}
                  </div>

                  {/* RECOMMENDED CONTACT WITH RELEVANCE REASON */}
                  <div className="bg-background/80 p-3 rounded border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-accent" /> Decision Maker Clave
                    </span>
                    {target.recommendedContact && target.recommendedContact.isContactableNow ? (
                      <div>
                        <Link
                          href={`/people/${target.recommendedContact.id}`}
                          className="font-bold text-foreground hover:underline"
                        >
                          {target.recommendedContact.fullName}
                        </Link>
                        <p className="text-[11px] text-accent font-medium">{target.recommendedContact.currentRole}</p>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                          ✓ Identity &amp; Current Role Verified
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-amber-800 font-bold text-[11px]">No Contact Verified</p>
                        <span className="text-[10px] text-muted-foreground block">
                          INSUFFICIENT DATA: Requiere investigación de interlocutor
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CALL OPENING & VALIDATION QUESTION (FOR CALL_NOW TARGETS) */}
                {target.callOpening && (
                  <div className="bg-emerald-950/10 border border-emerald-500/30 p-3.5 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Guion Comercial de Apertura B2B
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        AI SUGGESTION
                      </Badge>
                    </div>

                    <p className="italic text-foreground bg-background/70 p-2 rounded border border-border">
                      "{target.callOpening.openingText}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="font-bold text-muted-foreground uppercase text-[9px] block">Qué Validar en la Llamada</span>
                        <p className="text-foreground font-medium">{target.callOpening.validationQuestion}</p>
                      </div>

                      <div>
                        <span className="font-bold text-muted-foreground uppercase text-[9px] block">Servicio a Abrir</span>
                        <p className="text-accent font-semibold">{target.callOpening.mclOffer}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RECOMMENDED ACTION BANNER */}
                <div className="bg-accent/10 border border-accent/30 p-3 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <span className="font-bold text-foreground">Acción Comercial Sugerida: </span>
                      <span className="text-muted-foreground">{target.recommendedAction.actionText}</span>
                    </div>
                  </div>
                  <Badge
                    variant={target.recommendedAction.label === "EVIDENCE FACT" ? "success" : "outline"}
                    className="text-[10px] shrink-0 font-mono"
                  >
                    {target.recommendedAction.label}
                  </Badge>
                </div>

                {/* WHY EXPANDER TOGGLE */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleExpand(target.id)}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{isExpanded ? "Ocultar Desglose & Audit Log" : "¿Por qué este Target? (Ver Evidencia & Source Tiers)"}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  <Link href={`/companies/${target.company.slug}`}>
                    <Badge variant="outline" className="hover:bg-secondary cursor-pointer">
                      Ver Ficha de Productora →
                    </Badge>
                  </Link>
                </div>

                {/* EXPANDABLE EVIDENCE & AUDIT LOG PANEL */}
                {isExpanded && (
                  <div className="bg-secondary/40 border border-border p-4 rounded-lg text-xs space-y-4 animate-in fade-in-50 duration-200">
                    <div>
                      <h4 className="font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-accent" /> Desglose del Target Score ({score}/100)
                      </h4>
                      <div className="space-y-1.5">
                        {target.targetScore.components.map((comp, i) => (
                          <div key={i} className="flex items-center justify-between bg-background/60 p-2 rounded border border-border/50">
                            <div>
                              <span className="font-bold text-foreground">{comp.label}</span>
                              <p className="text-[11px] text-muted-foreground">{comp.reason}</p>
                            </div>
                            <span className="font-mono font-bold text-accent text-sm">+{comp.points}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Evidencia Verificada ({target.evidences.length})
                      </h4>
                      <div className="space-y-1.5">
                        {target.evidences.map((ev, i) => (
                          <div key={i} className="flex items-center justify-between bg-background/60 p-2 rounded border border-border/50">
                            <div>
                              <span className="font-semibold text-foreground">{ev.sourceName}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">({ev.sourceTier} | {ev.evidenceType})</span>
                              {ev.url && (
                                <a href={ev.url} target="_blank" className="block text-[10px] text-accent hover:underline">
                                  {ev.url}
                                </a>
                              )}
                            </div>
                            <Badge variant={ev.classification === "VERIFIED_FACT" ? "success" : "outline"} className="text-[10px]">
                              {ev.classification}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AUDIT LOG TRAIL */}
                    <div>
                      <h4 className="font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-accent" /> Audit Log &amp; Histórico de Estado
                      </h4>
                      <div className="space-y-1 bg-background/60 p-2.5 rounded border border-border/50 font-mono text-[11px]">
                        {target.auditLog.map((log, i) => (
                          <div key={i} className="flex items-center justify-between text-muted-foreground">
                            <span>
                              [{new Date(log.timestamp).toLocaleTimeString("es-ES")}] {log.previousStatus} → <strong>{log.newStatus}</strong>: {log.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
