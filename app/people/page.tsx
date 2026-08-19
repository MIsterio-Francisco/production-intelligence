import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Linkedin, Building2 } from "lucide-react";
import Link from "next/link";

export default function PeoplePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Decision Maker Intelligence & Executive Directory
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Identify Heads of Post, Producers, Heads of VFX, and Executive Decision Makers globally.
            </p>
          </div>
        </div>

        {/* Search & Role Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input placeholder="Search executive by name, job title, or company..." className="h-10 text-xs" />
          </div>
          <div>
            <select className="w-full h-10 rounded-md border border-input bg-card px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">All Key Roles</option>
              <option value="head_of_post">Head of Post Production</option>
              <option value="post_producer">Post Producer</option>
              <option value="head_of_production">Head of Production</option>
              <option value="executive_producer">Executive Producer</option>
              <option value="producer">Producer</option>
              <option value="head_of_vfx">Head of VFX</option>
              <option value="founder_ceo">Founder / CEO</option>
            </select>
          </div>
        </div>

        {/* Decision Makers Table */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span>Identified Key Decision Makers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Job Title / Role</th>
                  <th className="p-3 font-semibold">Company</th>
                  <th className="p-3 font-semibold">Location</th>
                  <th className="p-3 font-semibold text-right">Confidence</th>
                  <th className="p-3 font-semibold text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {[
                  { id: "p-1", name: "Pedro Uriol", role: "Head of Production", company: "Morena Films", slug: "morena-films", location: "Madrid, Spain", confidence: 95 },
                  { id: "p-2", name: "Iain Canning", role: "Co-Founder / Producer", company: "See-Saw Films", slug: "see-saw-films", location: "London, UK", confidence: 98 },
                  { id: "p-3", name: "Merry Colomer", role: "Producer / Post Supervisor", company: "Morena Films", slug: "morena-films", location: "Madrid, Spain", confidence: 92 },
                  { id: "p-4", name: "Lorenzo Gangarossa", role: "Head of Drama / Producer", company: "Wildside", slug: "wildside", location: "Rome, Italy", confidence: 90 },
                  { id: "p-5", name: "Samantha Waite", role: "Head of Post Production", company: "Fremantle UK", slug: "fremantle", location: "London, UK", confidence: 96 },
                ].map((person) => (
                  <tr key={person.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      <Link href={`/people/${person.id}`} className="hover:text-accent hover:underline">
                        {person.name}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold text-accent">{person.role}</td>
                    <td className="p-3">
                      <Link href={`/companies/${person.slug}`} className="hover:underline font-medium">
                        {person.company}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{person.location}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{person.confidence}%</td>
                    <td className="p-3 text-right">
                      <Link href={`/people/${person.id}`}>
                        <Badge variant="outline">Inspect</Badge>
                      </Link>
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
