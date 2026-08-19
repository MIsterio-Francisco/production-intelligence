import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Users, ArrowUpRight, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";

export default function OpportunitiesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              Commercial Opportunity Signals ("Who to Contact Now")
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time actionable business development feed ranked by MCL Commercial Match and activity recency.
            </p>
          </div>
        </div>

        {/* Opportunity Cards List (Section 11.5 PRD) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              company: "Morena Films",
              slug: "morena-films",
              country: "Spain (ES)",
              oppScore: 95,
              mclMatch: 94,
              tier: "CRITICAL",
              signal: "Three new feature film productions announced during the last 60 days.",
              reason: "High post-production volume and color grading demand for upcoming European feature films.",
              contact: "Head of Production",
              timeSensitivity: "HIGH",
            },
            {
              company: "See-Saw Films",
              slug: "see-saw-films",
              country: "United Kingdom (UK)",
              oppScore: 92,
              mclMatch: 92,
              tier: "HIGH",
              signal: "New drama series entering post-production stage in London.",
              reason: "Requires high-end HDR color finishing and sound post facilities.",
              contact: "Head of Post Production",
              timeSensitivity: "HIGH",
            },
            {
              company: "Wildside",
              slug: "wildside",
              country: "Italy (IT)",
              oppScore: 88,
              mclMatch: 89,
              tier: "HIGH",
              signal: "Secured major co-financing deal for international streaming project.",
              reason: "Expanding external vendor allocation for VFX and picture finishing.",
              contact: "Executive Producer",
              timeSensitivity: "MEDIUM",
            },
            {
              company: "Kino ELEPHANT",
              slug: "kino-elephant",
              country: "France (FR)",
              oppScore: 86,
              mclMatch: 87,
              tier: "HIGH",
              signal: "Newly appointed VP of Physical Production and post operations.",
              reason: "Fresh leadership re-evaluating long-term post-production vendor framework.",
              contact: "Post Producer",
              timeSensitivity: "MEDIUM",
            },
            {
              company: "BTF Media",
              slug: "btf-media",
              country: "Mexico (MX)",
              oppScore: 83,
              mclMatch: 85,
              tier: "HIGH",
              signal: "Greenlit 2 original series for LatAm streaming platform.",
              reason: "Demands fast-turnaround finishing and color workflow.",
              contact: "Head of Content",
              timeSensitivity: "MEDIUM",
            },
            {
              company: "Bavaria Fiction",
              slug: "bavaria-fiction",
              country: "Germany (DE)",
              oppScore: 78,
              mclMatch: 82,
              tier: "MEDIUM",
              signal: "Announced sequel series in pre-production for Q4.",
              reason: "Standard seasonal vendor renewal window.",
              contact: "Producer",
              timeSensitivity: "LOW",
            },
          ].map((opp) => (
            <Card key={opp.slug} className="border-border hover:border-accent/40 transition-colors flex flex-col justify-between">
              <CardHeader className="py-3.5 px-4 border-b border-border/50 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Badge variant={opp.tier === "CRITICAL" ? "danger" : "accent"} className="font-mono text-[10px]">
                    {opp.tier} OPPORTUNITY
                  </Badge>
                  <span className="font-mono text-xs font-black text-accent">{opp.mclMatch} MCL Match</span>
                </div>
                <CardTitle className="text-base font-extrabold mt-2">
                  <Link href={`/companies/${opp.slug}`} className="hover:text-accent hover:underline">
                    {opp.company}
                  </Link>
                </CardTitle>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-accent" /> {opp.country}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-background border border-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Signal</span>
                    <p className="font-semibold text-foreground">{opp.signal}</p>
                  </div>

                  <div className="space-y-1 text-muted-foreground">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Commercial Reason</span>
                    <p className="text-[11px]">{opp.reason}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3 text-accent" /> Recommended Contact:
                    </span>
                    <span className="font-bold text-foreground underline">{opp.contact}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-accent" /> Time Sensitivity:
                    </span>
                    <span className={`font-mono font-bold ${opp.timeSensitivity === "HIGH" ? "text-rose-600" : "text-amber-600"}`}>
                      {opp.timeSensitivity}
                    </span>
                  </div>

                  <Link href={`/companies/${opp.slug}`} className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                      Open Company Profile &amp; AI Brief <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
