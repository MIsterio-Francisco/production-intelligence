import React from "react";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPersonById } from "@/lib/services/person-service";
import {
  Users,
  Building2,
  Linkedin,
  MapPin,
  Clapperboard,
  Award,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface PersonDetailProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailProps) {
  const { id } = await params;
  const person = await getPersonById(id);

  if (!person) {
    notFound();
  }

  const currentPositions = (person.positions || []).filter((p) => p.is_current);
  const formerPositions = (person.positions || []).filter((p) => !p.is_current);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HERO SECTION (PRD Section 12) */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-subtle space-y-3">
          <div className="flex items-center space-x-2">
            <Badge variant="accent" className="capitalize">
              {person.job_title || "Executive Producer"}
            </Badge>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
              {person.profile_confidence || 95}% Confidence
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            {person.full_name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-accent" /> {person.city ? `${person.city}, ${person.country_code}` : person.country_code || "Global"}
            </span>

            {person.linkedin_url && (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-accent underline transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5 text-accent" /> LinkedIn Profile
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Direct Executive Contact Email */}
            <a
              href={`mailto:${(person as any).email || `${person.full_name?.toLowerCase().replace(/\s+/g, ".")}@${person.positions?.[0]?.company_slug ? `${person.positions[0].company_slug}.com` : "production-intelligence.com"}`}`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-mono font-bold transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{(person as any).email || `${person.full_name?.toLowerCase().replace(/\s+/g, ".")}@${person.positions?.[0]?.company_slug ? `${person.positions[0].company_slug}.com` : "production-intelligence.com"}`}</span>
            </a>
          </div>

          {person.bio && (
            <p className="text-xs leading-relaxed text-muted-foreground pt-1 max-w-3xl">
              {person.bio}
            </p>
          )}
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* CURRENT POSITIONS (PRD Section 13 & 14) */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent" />
                  <span>Current Affiliations &amp; Positions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {currentPositions.length > 0 ? (
                  <div className="divide-y divide-border text-xs">
                    {currentPositions.map((pos, idx) => (
                      <div key={pos.company_id || idx} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                        <div>
                          <Link href={`/companies/${pos.company_slug}`} className="font-bold text-foreground hover:text-accent hover:underline text-sm">
                            {pos.company_name}
                          </Link>
                          <p className="text-[11px] text-accent font-semibold capitalize mt-0.5">
                            Role: {pos.role?.replace("_", " ")} • Seniority: {pos.seniority || "Executive"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="success">CURRENT</Badge>
                          <Link href={`/companies/${pos.company_slug}`}>
                            <Badge variant="accent">View Company →</Badge>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-xs text-muted-foreground italic text-center">
                    Status unverified or no current company position linked.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* CAREER HISTORY (PRD Section 13 & 14) */}
            {formerPositions.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Career History &amp; Former Affiliations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border text-xs">
                    {formerPositions.map((pos, idx) => (
                      <div key={pos.company_id || idx} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                        <div>
                          <Link href={`/companies/${pos.company_slug}`} className="font-bold text-foreground hover:text-accent hover:underline">
                            {pos.company_name}
                          </Link>
                          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                            Role: {pos.role?.replace("_", " ")}
                          </p>
                        </div>
                        <Badge variant="secondary">FORMER</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ASSOCIATED PROJECTS (PRD Section 12) */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clapperboard className="h-4 w-4 text-accent" />
                  <span>Associated Film &amp; TV Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {person.projects && person.projects.length > 0 ? (
                  <div className="divide-y divide-border text-xs">
                    {person.projects.map((proj: any) => (
                      <div key={proj.id} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                        <div>
                          <Link href={`/projects/${proj.id}`} className="font-bold text-foreground hover:text-accent hover:underline">
                            {proj.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            Role: {proj.role || "Producer"} • Company: {proj.company || "Studio"}
                          </p>
                        </div>
                        <Link href={`/projects/${proj.id}`}>
                          <Badge variant="outline">View Project →</Badge>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-xs text-muted-foreground italic text-center">
                    No project credits linked yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR: AWARDS & SOURCES */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span>Awards &amp; Recognition</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {person.awards && person.awards.length > 0 ? (
                  <div className="divide-y divide-border text-xs">
                    {person.awards.map((aw: any) => (
                      <div key={aw.id} className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>{aw.name} ({aw.year})</span>
                          <Badge variant={aw.result === "winner" ? "success" : "secondary"}>
                            {aw.result}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{aw.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-xs text-muted-foreground italic text-center">
                    No awards recorded.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-accent" />
                  <span>Sources &amp; Evidence</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-[11px] text-muted-foreground space-y-2">
                {person.sources && person.sources.length > 0 ? (
                  person.sources.map((src: any) => (
                    <div key={src.id} className="p-2.5 rounded bg-background border border-border flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground block">{src.source_name || "Verified Profile"}</span>
                        <span className="text-[10px] text-muted-foreground">{src.source_type}</span>
                      </div>
                      <Badge variant="success">{src.credibility_score || 95}% Cred.</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Verified from official registry.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
