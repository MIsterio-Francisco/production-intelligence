import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";

export default function RankingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Global Production Rankings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked indexes based on Production Power, Creative Prestige, Commercial Impact, Momentum, and Commercial Match.
            </p>
          </div>
        </div>

        {/* Section 11.3 PRD Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {["GLOBAL", "CREATIVE", "COMMERCIAL", "MOMENTUM", "MCL OPPORTUNITY"].map((tab, idx) => (
            <button
              key={tab}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                idx === 4
                  ? "bg-accent text-accent-foreground shadow-subtle"
                  : "bg-secondary text-secondary-foreground hover:bg-neutral-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rankings Table */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>MCL Commercial Opportunity Ranking Index (v1)</span>
            </CardTitle>
            <span className="text-[11px] font-mono text-muted-foreground">Updated: 24h ago</span>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                  <th className="p-3 font-semibold">Rank</th>
                  <th className="p-3 font-semibold">Company</th>
                  <th className="p-3 font-semibold">Country</th>
                  <th className="p-3 font-semibold text-right">Score</th>
                  <th className="p-3 font-semibold text-right">Change (30d)</th>
                  <th className="p-3 font-semibold text-right">Momentum</th>
                  <th className="p-3 font-semibold text-right">MCL Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {[
                  { rank: 1, name: "Morena Films", slug: "morena-films", country: "ES", score: 94.2, change: "+3.4", momentum: 92, mcl: 94 },
                  { rank: 2, name: "See-Saw Films", slug: "see-saw-films", country: "UK", score: 92.5, change: "+1.8", momentum: 88, mcl: 92 },
                  { rank: 3, name: "Fremantle", slug: "fremantle", country: "UK", score: 91.0, change: "0.0", momentum: 85, mcl: 91 },
                  { rank: 4, name: "Wildside", slug: "wildside", country: "IT", score: 89.4, change: "+2.1", momentum: 84, mcl: 89 },
                  { rank: 5, name: "A24", slug: "a24", country: "US", score: 88.0, change: "-0.5", momentum: 89, mcl: 88 },
                  { rank: 6, name: "Kino ELEPHANT", slug: "kino-elephant", country: "FR", score: 87.1, change: "+4.2", momentum: 81, mcl: 87 },
                  { rank: 7, name: "BTF Media", slug: "btf-media", country: "MX", score: 85.3, change: "+1.2", momentum: 79, mcl: 85 },
                  { rank: 8, name: "Gaumont", slug: "gaumont", country: "FR", score: 85.0, change: "0.0", momentum: 78, mcl: 85 },
                ].map((row) => (
                  <tr key={row.slug} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-3 font-mono text-muted-foreground">{row.rank}</td>
                    <td className="p-3 font-bold text-foreground">
                      <Link href={`/companies/${row.slug}`} className="hover:text-accent hover:underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className="p-3 font-mono">{row.country}</td>
                    <td className="p-3 text-right font-mono font-bold text-base">{row.score}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold">{row.change}</td>
                    <td className="p-3 text-right font-mono">{row.momentum}</td>
                    <td className="p-3 text-right">
                      <Badge variant="accent" className="font-mono">{row.mcl} Match</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
