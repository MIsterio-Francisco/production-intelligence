import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Filter, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-accent" />
              Production Projects Intelligence
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor active feature films, TV series, documentaries, and commercials across global studios.
            </p>
          </div>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Monitored Projects (1,240)</span>
            </CardTitle>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">Status Filter:</span>
              <select className="h-7 rounded border border-input bg-card px-2 text-xs font-medium">
                <option value="">All Statuses</option>
                <option value="announced">Announced</option>
                <option value="development">Development</option>
                <option value="production">Production</option>
                <option value="post_production">Post-Production</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                  <th className="p-3 font-semibold">Title</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Production Company</th>
                  <th className="p-3 font-semibold">Country</th>
                  <th className="p-3 font-semibold">Director</th>
                  <th className="p-3 font-semibold">Distributor / Streaming</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {[
                  { id: "proj-1", title: "La Infiltrada", type: "Feature Film", status: "Production", company: "Morena Films", country: "ES", director: "Arantxa Echevarría", dist: "Warner Bros. Spain" },
                  { id: "proj-2", title: "Costiera", type: "TV Series", status: "Post-Production", company: "Fremantle", country: "UK / IT", director: "Adam Bernstein", dist: "Amazon Prime" },
                  { id: "proj-3", title: "Civil War", type: "Feature Film", status: "Released", company: "A24", country: "US", director: "Alex Garland", dist: "A24" },
                  { id: "proj-4", title: "Slow Horses S4", type: "TV Series", status: "Post-Production", company: "See-Saw Films", country: "UK", director: "Saul Metzstein", dist: "Apple TV+" },
                  { id: "proj-5", title: "Lupin S4", type: "TV Series", status: "Pre-Production", company: "Gaumont", country: "FR", director: "Ludovic Bernard", dist: "Netflix" },
                ].map((proj) => (
                  <tr key={proj.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      <Link href={`/projects/${proj.id}`} className="hover:text-accent hover:underline">
                        {proj.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{proj.type}</td>
                    <td className="p-3">
                      <Badge variant={proj.status === "Post-Production" ? "accent" : "secondary"}>
                        {proj.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{proj.company}</td>
                    <td className="p-3 font-mono">{proj.country}</td>
                    <td className="p-3 text-muted-foreground">{proj.director}</td>
                    <td className="p-3 text-muted-foreground">{proj.dist}</td>
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
