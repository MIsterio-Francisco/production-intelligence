import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardOverview } from "@/lib/services/company-service";
import { getPeople } from "@/lib/services/person-service";
import { getTopCommercialTargets } from "@/lib/services/opportunity-engine";
import { TopTargetsView } from "@/components/opportunities/TopTargetsView";
import { Building2, Clapperboard, Flame, ArrowUpRight, TrendingUp, Users, Target } from "lucide-react";
import Link from "next/link";

import { MarketPulseWidget } from "@/components/scanner/MarketPulseWidget";

export default async function DashboardPage() {
  const [data, peopleRes, topTargets] = await Promise.all([
    getDashboardOverview(),
    getPeople({ limit: 5 }),
    Promise.resolve(getTopCommercialTargets(3)),
  ]);
  const isLive = data.dataMode === "LIVE";

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
              Misterio Color Lab — B2B Sales Intelligence &amp; Target Machine
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${isLive ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
              <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isLive ? "LIVE DATA" : "DEMO DATA — NO LIVE CONNECTION"}
            </span>
          </div>
        </div>

        {/* V1.5 Market Pulse Radar Widget */}
        <MarketPulseWidget lastResult={null} changes={[]} />

        {/* Section 24 PRD KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/companies" className="block">
            <Card className="hover:border-accent hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-accent transition-colors">
                    Total Companies
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                    {data.totalCompanies}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> {isLive ? "Live database records" : "Seed catalogue"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center text-foreground transition-colors">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/projects" className="block">
            <Card className="hover:border-accent hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-accent transition-colors">
                    Active Projects
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                    {data.activeProjectsCount}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> View Active Slates →
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center text-foreground transition-colors">
                  <Clapperboard className="h-5 w-5 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/people" className="block">
            <Card className="hover:border-accent hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-accent transition-colors">
                    Key Decision Makers
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                    {data.keyDecisionMakersCount}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> {isLive ? "Database records" : "Not measured in demo"} →
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center text-foreground transition-colors">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/opportunities" className="block">
            <Card className="hover:border-accent hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-accent transition-colors">
                    Top Target Machine
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                    {topTargets.length} Targets
                  </p>
                  <p className="text-[10px] text-accent font-bold flex items-center mt-0.5">
                    <Target className="h-3 w-3 mr-0.5" /> Direct B2B Opportunities →
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-white flex items-center justify-center text-accent transition-colors">
                  <Flame className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* TOP COMMERCIAL TARGET WIDGET FOR MISTERIO COLOR LAB */}
        <div className="bg-card border border-border p-5 rounded-lg shadow-sm">
          <TopTargetsView targets={topTargets} />
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
              <Link href="/rankings?tab=GLOBAL" className="text-xs font-semibold text-accent hover:underline flex items-center">
                View All <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {data.topGlobalCompanies.map((co: any, idx: number) => (
                  <div key={co.id} className="flex items-center justify-between p-3.5 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-muted-foreground w-4 text-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <Link href={`/companies/${co.slug}`} className="font-bold text-foreground hover:text-accent hover:underline">
                          {co.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{co.country_name || co.country_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-foreground text-sm">{co.power_score || 0}</span>
                        <span className="text-[10px] text-muted-foreground block font-mono">PWR</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {co.mcl_match_score || 0}% MCL
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Decision Makers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Key Decision Makers</span>
              </CardTitle>
              <Link href="/people" className="text-xs font-semibold text-accent hover:underline flex items-center">
                Directory <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {peopleRes.data.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/40">
                    <div>
                      <Link href={`/people/${p.id}`} className="font-bold text-foreground hover:text-accent hover:underline">
                        {p.full_name}
                      </Link>
                      <p className="text-[11px] text-accent font-medium">{p.job_title || "Executive"}</p>
                    </div>
                    <Link href={`/people/${p.id}`}>
                      <Badge variant="outline">Inspect Profile →</Badge>
                    </Link>
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
