import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Filter, Search, ArrowUpDown, Building2 } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Compass className="h-5 w-5 text-accent" />
              Company Discovery & Intelligence Search
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter global film, TV, and audiovisual production companies by power, momentum, and commercial match.
            </p>
          </div>
        </div>

        {/* Layout: Sidebar Filters + Main Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Filters (Section 11.2 PRD requirement) */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-accent" />
                <span>Filters</span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground">
                Reset
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Search */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Company Name</label>
                <Input placeholder="Filter by name..." className="h-8 text-xs" />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Country</label>
                <select className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="">All Countries</option>
                  <option value="US">United States (150)</option>
                  <option value="UK">United Kingdom (60)</option>
                  <option value="FR">France (50)</option>
                  <option value="ES">Spain (50)</option>
                  <option value="DE">Germany (40)</option>
                  <option value="IT">Italy (30)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Category</label>
                <select className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="">All Categories</option>
                  <option value="film">Film</option>
                  <option value="television">Television</option>
                  <option value="documentary">Documentary</option>
                  <option value="animation">Animation</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              {/* Min Power Score */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground flex justify-between">
                  <span>Min Power Score</span>
                  <span className="font-mono text-accent font-bold">75+</span>
                </label>
                <input type="range" min="0" max="100" defaultValue="75" className="w-full accent-accent" />
              </div>

              {/* Min MCL Match */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground flex justify-between">
                  <span>Min MCL Match</span>
                  <span className="font-mono text-accent font-bold">80+</span>
                </label>
                <input type="range" min="0" max="100" defaultValue="80" className="w-full accent-accent" />
              </div>

              {/* Min Momentum */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground flex justify-between">
                  <span>Min Momentum</span>
                  <span className="font-mono text-accent font-bold">60+</span>
                </label>
                <input type="range" min="0" max="100" defaultValue="60" className="w-full accent-accent" />
              </div>
            </CardContent>
          </Card>

          {/* Results Table View */}
          <Card className="lg:col-span-3">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent" />
                <span>Discovered Companies (500)</span>
              </CardTitle>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Sort:</span>
                <select className="h-7 rounded border border-input bg-card px-2 text-xs font-medium">
                  <option value="mcl_match_score">MCL Match (High to Low)</option>
                  <option value="power_score">Power Score (High to Low)</option>
                  <option value="momentum_score">Momentum (High to Low)</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Company</th>
                    <th className="p-3 font-semibold">Country</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-right">Power</th>
                    <th className="p-3 font-semibold text-right">Momentum</th>
                    <th className="p-3 font-semibold text-right">MCL Match</th>
                    <th className="p-3 font-semibold">Latest Project Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {[
                    { rank: 1, name: "A24", slug: "a24", country: "US", category: "Film / Series", power: 96, momentum: 89, mcl: 88, project: "Civil War (Released)" },
                    { rank: 2, name: "Fremantle", slug: "fremantle", country: "UK", category: "Television", power: 94, momentum: 85, mcl: 91, project: "Costiera (Post-Production)" },
                    { rank: 3, name: "Gaumont", slug: "gaumont", country: "FR", category: "Film / Series", power: 92, momentum: 78, mcl: 85, project: "Lupin S4 (Pre-Production)" },
                    { rank: 4, name: "Morena Films", slug: "morena-films", country: "ES", category: "Feature Film", power: 88, momentum: 92, mcl: 94, project: "La Infiltrada (Production)" },
                    { rank: 5, name: "Bavaria Fiction", slug: "bavaria-fiction", country: "DE", category: "TV Series", power: 86, momentum: 80, mcl: 82, project: "Das Boot S4 (Released)" },
                    { rank: 6, name: "Wildside", slug: "wildside", country: "IT", category: "Drama Series", power: 85, momentum: 84, mcl: 89, project: "My Brilliant Friend (Post)" },
                    { rank: 7, name: "See-Saw Films", slug: "see-saw-films", country: "UK", category: "Film / TV", power: 84, momentum: 88, mcl: 92, project: "Slow Horses (Production)" },
                    { rank: 8, name: "Kino ELEPHANT", slug: "kino-elephant", country: "FR", category: "Feature Film", power: 82, momentum: 81, mcl: 87, project: "Night Call (Announced)" },
                  ].map((row) => (
                    <tr key={row.slug} className="hover:bg-secondary/40 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">{row.rank}</td>
                      <td className="p-3 font-bold text-foreground">
                        <Link href={`/companies/${row.slug}`} className="hover:text-accent hover:underline">
                          {row.name}
                        </Link>
                      </td>
                      <td className="p-3 font-mono">{row.country}</td>
                      <td className="p-3 text-muted-foreground">{row.category}</td>
                      <td className="p-3 text-right font-mono font-bold">{row.power}</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">{row.momentum}</td>
                      <td className="p-3 text-right">
                        <Badge variant="accent" className="font-mono">{row.mcl} Match</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px] truncate max-w-[180px]">{row.project}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
