"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface OpportunitiesClientProps {
  initialSignals: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function OpportunitiesClient({
  initialSignals,
  total,
  page,
  limit,
  totalPages,
}: OpportunitiesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [severity, setSeverity] = useState(searchParams.get("severity") || "");
  const [selectedBrief, setSelectedBrief] = useState<any | null>(null);
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleFetchAiBrief = async (companyId: string) => {
    try {
      setLoadingBriefId(companyId);
      const res = await fetch(`/api/v1/companies/${companyId}/ai-brief`);
      if (res.ok) {
        const json = await res.json();
        setSelectedBrief(json.data);
      }
    } catch (e) {
      console.error("Error fetching brief:", e);
    } finally {
      setLoadingBriefId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            COMMERCIAL INTELLIGENCE OPPORTUNITY FEED
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked commercial signals and post-production opportunities driven by deterministic graph intelligence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPPORTUNITY CARDS FEED (PRD Section 19 & 20) */}
        <div className="lg:col-span-2 space-y-4">
          {initialSignals.length === 0 ? (
            <Card className="p-12 text-center text-xs text-muted-foreground">
              No active commercial opportunities detected.
            </Card>
          ) : (
            initialSignals.map((sig) => {
              const company = sig.companies || {};
              const evidence = sig.evidence || {};

              return (
                <Card key={sig.id} className="hover:border-accent/40 transition-colors">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border bg-secondary/30">
                    <div className="flex items-center space-x-2">
                      <Badge variant={sig.severity === "CRITICAL" ? "accent" : "secondary"} className="uppercase font-mono text-[10px]">
                        {sig.severity} OPPORTUNITY
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Signal Score: <strong className="text-foreground">{sig.signal_score}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground">
                      Detected {new Date(sig.signal_date).toLocaleDateString()}
                    </span>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <Link href={`/companies/${company.slug}`} className="text-base font-black text-foreground hover:text-accent hover:underline">
                          {company.name} <span className="text-muted-foreground text-xs font-mono font-normal">({company.country_code})</span>
                        </Link>
                        <p className="text-xs font-bold text-accent mt-0.5">{sig.signal_title}</p>
                      </div>

                      <div className="flex items-center space-x-3 font-mono text-xs text-right">
                        <div className="p-2 rounded bg-background border border-border">
                          <span className="text-[9px] text-muted-foreground uppercase block">MCL Match</span>
                          <span className="font-extrabold text-foreground">{company.mcl_match_score || 85}</span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border">
                          <span className="text-[9px] text-muted-foreground uppercase block">Momentum</span>
                          <span className="font-extrabold text-foreground">{company.momentum_score || 80}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sig.signal_description}
                    </p>

                    {/* Key Evidence Items */}
                    {evidence.facts && evidence.facts.length > 0 && (
                      <div className="p-2.5 rounded bg-secondary/40 border border-border space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Structured Key Evidence
                        </span>
                        <ul className="text-[11px] space-y-0.5 text-foreground font-medium">
                          {evidence.facts.map((fact: string, idx: number) => (
                            <li key={idx}>• {fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchAiBrief(company.id)}
                        disabled={loadingBriefId === company.id}
                        className="text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        {loadingBriefId === company.id ? "Analyzing..." : "Generate AI Brief"}
                      </Button>

                      <Link href={`/companies/${company.slug}`}>
                        <Button variant="accent" size="sm" className="text-xs font-bold">
                          Inspect Company Profile →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* AI COMMERCIAL BRIEF SIDEBAR (PRD Section 21 & 22) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>AI Commercial Brief (Structured Reasoning)</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 text-xs space-y-4">
              {selectedBrief ? (
                <div className="space-y-4 leading-relaxed">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <Badge variant="accent" className="font-mono text-[10px]">
                      {selectedBrief.model} ({selectedBrief.promptVersion})
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedBrief.isCached ? "Cached Brief" : "Generated Live"}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-foreground block uppercase tracking-wider text-[10px] text-muted-foreground">
                      Executive Summary
                    </span>
                    <p className="text-xs text-foreground font-medium mt-1">
                      {selectedBrief.content.summary}
                    </p>
                  </div>

                  {/* Why Now */}
                  <div>
                    <span className="font-bold text-foreground block uppercase tracking-wider text-[10px] text-muted-foreground">
                      Why Right Now?
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-accent font-semibold mt-1">
                      {selectedBrief.content.why_now?.map((wn: string, idx: number) => (
                        <li key={idx}>{wn}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence Distinction (Fact vs Inference vs Unknown) */}
                  <div>
                    <span className="font-bold text-foreground block uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                      Evidence Distinction
                    </span>
                    <div className="space-y-1.5">
                      {selectedBrief.content.evidence?.map((ev: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-background border border-border text-[11px]">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-foreground">{ev.claim}</span>
                            <Badge variant={ev.fact_type === "FACT" ? "success" : "secondary"} className="text-[9px] font-mono">
                              {ev.fact_type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relevant Decision Makers */}
                  {selectedBrief.content.relevant_people?.length > 0 && (
                    <div>
                      <span className="font-bold text-foreground block uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                        Relevant Decision Makers to Contact
                      </span>
                      <div className="space-y-1">
                        {selectedBrief.content.relevant_people.map((p: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-secondary/40 text-[11px]">
                            <span className="font-bold text-foreground">{p.name}</span> — <span className="text-accent">{p.role}</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{p.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Action */}
                  <div className="p-3 rounded bg-accent/10 border border-accent/30 text-accent">
                    <span className="font-bold block text-[10px] uppercase">Recommended Action</span>
                    <p className="text-xs font-semibold mt-0.5">{selectedBrief.content.recommended_action}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Sparkles className="h-8 w-8 text-accent/50 mx-auto" />
                  <p className="font-bold text-foreground text-xs">Select any company on the left to generate a structured AI Commercial Brief.</p>
                  <p className="text-[11px]">The AI reasons strictly over verified structured graph facts and score evidence.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
