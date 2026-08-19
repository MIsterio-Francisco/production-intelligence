import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRankingsData } from "@/lib/services/company-service";
import { Trophy, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";

interface RankingsPageProps {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const { tab = "MCL", page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

  const rankings = await getRankingsData(tab, currentPage, 25);

  const activeTab = tab.toUpperCase();

  const getScoreValue = (co: any) => {
    switch (activeTab) {
      case "GLOBAL":
        return { primary: co.power_score, label: "Power Score" };
      case "CREATIVE":
        return { primary: co.creative_score, label: "Creative Score" };
      case "COMMERCIAL":
        return { primary: co.commercial_score, label: "Commercial Score" };
      case "MOMENTUM":
        return { primary: co.momentum_score, label: "Momentum Score" };
      case "MCL":
      case "MCL OPPORTUNITY":
      default:
        return { primary: co.mcl_match_score, label: "MCL Match" };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              GLOBAL PRODUCTION RANKINGS
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked indexes based on Production Power, Creative Prestige, Commercial Impact, Momentum, and Commercial Match.
            </p>
          </div>
        </div>

        {/* Section 18 PRD Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-xs font-bold">
          {[
            { id: "MCL", label: "MCL OPPORTUNITY" },
            { id: "GLOBAL", label: "GLOBAL POWER" },
            { id: "CREATIVE", label: "CREATIVE" },
            { id: "COMMERCIAL", label: "COMMERCIAL" },
            { id: "MOMENTUM", label: "MOMENTUM" },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/rankings?tab=${t.id}`}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeTab === t.id
                  ? "bg-accent text-accent-foreground shadow-subtle"
                  : "bg-secondary text-secondary-foreground hover:bg-neutral-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Rankings Table */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>{activeTab} Index Rankings ({rankings.total} Verified Companies)</span>
            </CardTitle>
            <span className="text-[10px] font-mono text-muted-foreground">Updated Live</span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                  <th className="p-3 font-semibold">Rank</th>
                  <th className="p-3 font-semibold">Company</th>
                  <th className="p-3 font-semibold">Country</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold text-right">Target Score ({activeTab})</th>
                  <th className="p-3 font-semibold text-right">Power Score</th>
                  <th className="p-3 font-semibold text-right">MCL Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {rankings.data.map((co, idx) => {
                  const scoreInfo = getScoreValue(co);
                  const rank = (currentPage - 1) * 25 + idx + 1;

                  return (
                    <tr key={co.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground font-bold">{rank}</td>
                      <td className="p-3 font-bold text-foreground">
                        <Link href={`/companies/${co.slug}`} className="hover:text-accent hover:underline">
                          {co.name}
                        </Link>
                      </td>
                      <td className="p-3 font-mono">
                        {co.country_code} <span className="text-muted-foreground font-normal">({co.country_name || co.city})</span>
                      </td>
                      <td className="p-3 text-muted-foreground capitalize">
                        {co.categories?.[0] || co.company_type?.replace("_", " ") || "Film / TV"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-base text-accent">
                        {scoreInfo.primary || "N/A"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {co.power_score || "N/A"}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant="accent" className="font-mono">
                          {co.mcl_match_score || "N/A"} Match
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
