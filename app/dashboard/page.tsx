import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe2, Clapperboard, Flame, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              Global Intelligence Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Film, Television & Audiovisual Production Market Overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </span>
          </div>
        </div>

        {/* Section 11.1 PRD KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:border-neutral-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Companies
                </p>
                <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                  500
                </p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> Phase 1 Seed Dataset
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-neutral-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Countries
                </p>
                <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                  12
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  US, UK, FR, ES, DE, IT +
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                <Globe2 className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-neutral-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Projects
                </p>
                <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                  1,240
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Feature & TV Series
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                <Clapperboard className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-neutral-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  High Opportunities
                </p>
                <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                  84
                </p>
                <p className="text-[10px] text-accent font-bold mt-0.5">
                  MCL Match Score &gt; 80
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Flame className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Grid Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Global Companies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent" />
                <span>Top Global Companies</span>
              </CardTitle>
              <Link href="/rankings" className="text-xs font-semibold text-accent hover:underline flex items-center">
                View All <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {[
                  { rank: 1, name: "A24", country: "US", power: 96, match: 88, category: "Film / TV" },
                  { rank: 2, name: "Fremantle", country: "UK", power: 94, match: 91, category: "Television" },
                  { rank: 3, name: "Gaumont", country: "FR", power: 92, match: 85, category: "Film / Series" },
                  { rank: 4, name: "Morena Films", country: "ES", power: 88, match: 94, category: "Feature Film" },
                  { rank: 5, name: "Bavaria Fiction", country: "DE", power: 86, match: 82, category: "TV Series" },
                ].map((co) => (
                  <div key={co.name} className="flex items-center justify-between p-3.5 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-muted-foreground w-5 text-center">{co.rank}</span>
                      <div>
                        <div className="font-bold text-foreground">{co.name}</div>
                        <div className="text-[11px] text-muted-foreground">{co.country} • {co.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase">Power</div>
                        <div className="font-extrabold">{co.power}</div>
                      </div>
                      <Badge variant="accent">{co.match} MCL</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Commercial Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                <span>Top Commercial Opportunities</span>
              </CardTitle>
              <Link href="/opportunities" className="text-xs font-semibold text-accent hover:underline flex items-center">
                View Signals <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {[
                  { name: "Morena Films", match: 94, signal: "3 new productions announced in last 60 days", role: "Head of Production", country: "ES" },
                  { name: "See-Saw Films", match: 92, signal: "Feature film entering post-production", role: "Head of Post", country: "UK" },
                  { name: "Wildside", match: 89, signal: "High budget international co-production", role: "Executive Producer", country: "IT" },
                  { name: "Kino ELEPHANT", match: 87, signal: "Series expansion & new executive hire", role: "Producer", country: "FR" },
                  { name: "BTF Media", match: 85, signal: "New streaming original deal announced", role: "VP Production", country: "MX" },
                ].map((opp) => (
                  <div key={opp.name} className="p-3.5 hover:bg-secondary/50 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-foreground">{opp.name} <span className="text-muted-foreground font-normal">({opp.country})</span></div>
                      <Badge variant="success">{opp.match} Match</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{opp.signal}</p>
                    <div className="text-[10px] text-accent font-semibold flex items-center gap-1">
                      <span>Target Contact:</span> <span className="underline">{opp.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
