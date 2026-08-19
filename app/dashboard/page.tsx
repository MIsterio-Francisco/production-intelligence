import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardOverview } from "@/lib/services/company-service";
import { getPeople } from "@/lib/services/person-service";
import { Building2, Globe2, Clapperboard, Flame, ArrowUpRight, TrendingUp, Activity, Users, Award } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [data, peopleRes] = await Promise.all([
    getDashboardOverview(),
    getPeople({ limit: 5 }),
  ]);

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
              Film, Television &amp; Audiovisual Production Market Overview &amp; Intelligence Graph
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Graph Active
            </span>
          </div>
        </div>

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
                    <TrendingUp className="h-3 w-3 mr-0.5" /> Phase 3 Verified Graph
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
                    184+
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> Heads of Post &amp; Execs →
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary group-hover:bg-accent/10 flex items-center justify-center text-foreground transition-colors">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/alerts" className="block">
            <Card className="hover:border-accent hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-accent transition-colors">
                    High Opportunities
                  </p>
                  <p className="text-2xl font-black tracking-tight mt-1 text-foreground">
                    {data.highOpportunitiesCount}
                  </p>
                  <p className="text-[10px] text-accent font-bold flex items-center mt-0.5">
                    <Flame className="h-3 w-3 mr-0.5" /> MCL Match Score &gt; 80
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 group-hover:bg-accent group-hover:text-white flex items-center justify-center text-accent transition-colors">
                  <Flame className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
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
                      <span className="font-mono font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                      <div>
                        <Link href={`/companies/${co.slug}`} className="font-bold text-foreground hover:text-accent hover:underline">
                          {co.name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">{co.country_code} • {co.company_type?.replace("_", " ")}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase">Power</div>
                        <div className="font-extrabold text-foreground">{co.power_score || "N/A"}</div>
                      </div>
                      <Badge variant="accent">{co.mcl_match_score || "N/A"} MCL</Badge>
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
                {(data.topCommercialOpportunities || []).map((opp: any) => (
                  <div key={opp.id} className="p-3.5 hover:bg-secondary/50 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/companies/${opp.slug}`} className="font-bold text-foreground hover:text-accent hover:underline">
                        {opp.name} <span className="text-muted-foreground font-normal">({opp.country_code})</span>
                      </Link>
                      <Badge variant="success">{opp.mcl_match_score || "N/A"} Match</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Power Score: {opp.power_score || "N/A"} • High demand for color grading and finishing.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Decision Makers & Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Latest Industry Signals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <span>Latest Industry Signals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {data.latestSignals.length > 0 ? (
                  data.latestSignals.map((sig: any) => (
                    <div key={sig.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/40">
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground">{sig.title}</span>
                        <p className="text-[11px] text-muted-foreground">
                          Company: {sig.companies?.name || "Verified Studio"} ({sig.companies?.country_code})
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {new Date(sig.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No signals recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
