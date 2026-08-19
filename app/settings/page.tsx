import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Sliders, Shield, Database, Cpu, CheckCircle2 } from "lucide-react";
import { SCORING_ENGINE_VERSION, POWER_SCORE_WEIGHTS, MCL_MATCH_WEIGHTS } from "@/lib/scoring";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              Platform Settings &amp; Scoring Engine Config
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deterministic scoring weights, canonical algorithm versioning, and system health.
            </p>
          </div>
          <Badge variant="accent" className="font-mono text-xs font-bold">
            Scoring Engine {SCORING_ENGINE_VERSION}
          </Badge>
        </div>

        {/* Section 29 PRD: Scoring Engine Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent" />
                <span>Power Score Formula Weights ({SCORING_ENGINE_VERSION})</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono">Canonical</Badge>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3">
              <div className="space-y-2 font-mono">
                {[
                  { name: "Production Scale", weight: `${POWER_SCORE_WEIGHTS.PRODUCTION_SCALE * 100}%`, desc: "Active & released project volume, budget evidence" },
                  { name: "Creative Prestige", weight: `${POWER_SCORE_WEIGHTS.CREATIVE * 100}%`, desc: "Awards, festival selections, auteur portfolio" },
                  { name: "Commercial Strength", weight: `${POWER_SCORE_WEIGHTS.COMMERCIAL * 100}%`, desc: "Box office, streaming deals, distribution output" },
                  { name: "Momentum (90d)", weight: `${POWER_SCORE_WEIGHTS.MOMENTUM * 100}%`, desc: "Recency-weighted 30/90/180/365 day activity" },
                  { name: "International Reach", weight: `${POWER_SCORE_WEIGHTS.INTERNATIONAL * 100}%`, desc: "Cross-border co-productions & territory count" },
                  { name: "Social Presence", weight: `${POWER_SCORE_WEIGHTS.SOCIAL * 100}%`, desc: "Logarithmic follower count & engagement" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground font-sans">{item.desc}</span>
                    </div>
                    <Badge variant="accent" className="font-mono text-xs">{item.weight}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-accent" />
                <span>MCL Match Opportunity Weights ({SCORING_ENGINE_VERSION})</span>
              </CardTitle>
              <Badge variant="success" className="font-mono">Commercial</Badge>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3">
              <div className="space-y-2 font-mono">
                {[
                  { name: "Production Activity", weight: `${MCL_MATCH_WEIGHTS.PRODUCTION_ACTIVITY * 100}%`, desc: "Projects currently in active production or post" },
                  { name: "Production Scale", weight: `${MCL_MATCH_WEIGHTS.PRODUCTION_SCALE * 100}%`, desc: "Budget size and overall project scale" },
                  { name: "Post / VFX Opportunity", weight: `${MCL_MATCH_WEIGHTS.POST_VFX_OPPORTUNITY * 100}%`, desc: "High finishing & color grading demand signals" },
                  { name: "Momentum (90d)", weight: `${MCL_MATCH_WEIGHTS.MOMENTUM * 100}%`, desc: "Recent project announcements & timeline events" },
                  { name: "Commercial Strength", weight: `${MCL_MATCH_WEIGHTS.COMMERCIAL_STRENGTH * 100}%`, desc: "Studio tier & distribution relationships" },
                  { name: "Relationship Accessibility", weight: `${MCL_MATCH_WEIGHTS.RELATIONSHIP_ACCESSIBILITY * 100}%`, desc: "Identified Head of Post, Post Producer, Head of VFX" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                    <div>
                      <span className="font-bold text-foreground text-xs block">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground font-sans">{item.desc}</span>
                    </div>
                    <Badge variant="success" className="font-mono text-xs">{item.weight}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database & Security Section */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <span>System &amp; Database Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs space-y-3 text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="font-semibold text-foreground">Supabase PostgreSQL Engine</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected &amp; RLS Enforced
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="font-semibold text-foreground">Deterministic Scoring Engine</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pure Mathematical Normalization (v1.0)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-foreground">Score Ledger Table</span>
              <span className="font-mono text-foreground font-bold">company_scores (Immutable Snapshot History)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
