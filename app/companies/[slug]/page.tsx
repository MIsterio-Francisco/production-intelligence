import React from "react";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyBySlug } from "@/lib/services/company-service";
import { SCORING_ENGINE_VERSION, calculateAllCompanyScores } from "@/lib/scoring";
import { SaveCompanyButton } from "@/components/companies/SaveCompanyButton";
import {
  Building2,
  Globe,
  MapPin,
  Clapperboard,
  Users,
  Award,
  ExternalLink,
  Flame,
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getCompanyInstagramData } from "@/lib/services/social-service";
import { CompanySocialTab } from "@/components/companies/CompanySocialTab";
import Link from "next/link";
import { VerifiedContactEmails } from "@/components/companies/VerifiedContactEmails";

interface CompanyProfileProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CompanyProfilePage({ params, searchParams }: CompanyProfileProps) {
  const { slug } = await params;
  const { tab = "overview" } = await searchParams;

  const { company, projects, people, socialProfiles, sources, events } = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  // Calculate live deterministic scores & explanation using engine v1.0
  const scoresResult = calculateAllCompanyScores({
    id: company.id,
    name: company.name,
    country_code: company.country_code,
    company_type: company.company_type,
    employee_count_min: company.employee_count_min,
    employee_count_max: company.employee_count_max,
    founded_year: company.founded_year,
    is_active: company.is_active,
    categories: company.categories || [],
    projects,
    people,
    events,
    awards: [],
    socialProfiles,
  });

  const latestEvent = events?.[0];

  // Group Projects by Role
  const projectsByRole = (projects || []).reduce((acc: Record<string, any[]>, proj: any) => {
    const role = proj.company_role || "producer";
    if (!acc[role]) acc[role] = [];
    acc[role].push(proj);
    return acc;
  }, {});

  // Group People into Current vs Former
  const currentPeople = (people || []).filter((p) => p.is_current !== false);
  const formerPeople = (people || []).filter((p) => p.is_current === false);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HERO SECTION */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-subtle space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-secondary px-2.5 py-0.5 rounded border border-border text-muted-foreground uppercase">
                  {company.country_code || "GLOBAL"}
                </span>
                <Badge variant="secondary" className="capitalize">
                  {company.company_type?.replace("_", " ") || "Production House"}
                </Badge>
                {company.is_active && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Studio
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {company.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" />{" "}
                  {company.city ? `${company.city}, ${company.country_name}` : company.country_name || "Global"}
                </span>

                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent underline transition-colors font-medium text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5 text-accent" /> {company.website_url.replace("https://", "").replace("http://", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {company.contact_email && company.provenance_type === "verified" && (
                  <a href={`mailto:${company.contact_email}`} className="underline hover:text-accent">
                    {company.contact_email}
                  </a>
                )}

                {company.phone && company.provenance_type === "verified" && <span>{company.phone}</span>}

                <Badge variant={company.provenance_type === "verified" ? "success" : "outline"} className="font-mono text-[10px] uppercase">
                  {company.provenance_type === "verified" ? "Verified record" : company.provenance_type === "synthetic" ? "Demo record" : "Seed record — verify before contact"}
                </Badge>

                {company.founded_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Founded {company.founded_year}
                  </span>
                )}
              </div>

              <div className="pt-2">
                <SaveCompanyButton companyId={company.id} />
              </div>

              <VerifiedContactEmails companyId={company.slug || company.id} />
            </div>

            {/* SCORE HEADER CARDS WITH CONFIDENCE & VERSION (PRD Section 30) */}
            <div className="flex items-center gap-4">
              <div className="text-center p-3.5 rounded-lg bg-background border border-border min-w-[110px]">
                <div className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground flex items-center justify-center gap-1">
                  Power Score
                </div>
                <div className="text-3xl font-black font-mono text-foreground mt-0.5">
                  {scoresResult.powerScore}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  {scoresResult.confidence}% Conf ({SCORING_ENGINE_VERSION})
                </div>
              </div>

              <div className="text-center p-3.5 rounded-lg bg-accent/10 border border-accent/30 text-accent min-w-[110px]">
                <div className="text-[9px] uppercase tracking-wider font-bold">
                  MCL Match
                </div>
                <div className="text-3xl font-black font-mono mt-0.5">
                  {scoresResult.mclMatchScore}
                </div>
                <div className="text-[9px] font-mono text-accent/80 mt-0.5">
                  {scoresResult.confidence}% Conf ({SCORING_ENGINE_VERSION})
                </div>
              </div>
            </div>
          </div>

          {/* Categories & Graph Counts Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {(company.categories || ["film", "television"]).map((cat) => (
                <Badge key={cat} variant="outline" className="capitalize text-xs">
                  {cat.replace("_", " ")}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-3 font-mono text-[11px] text-muted-foreground">
              <span><strong className="text-foreground">{projects.length}</strong> Projects</span>
              <span>•</span>
              <span><strong className="text-foreground">{people.length}</strong> People</span>
              <span>•</span>
              <span><strong className="text-foreground">{events.length}</strong> Events</span>
            </div>
          </div>
        </div>

        {/* SECONDARY SCORES & STATUS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Creative Score", score: scoresResult.creativeScore },
            { label: "Commercial Score", score: scoresResult.commercialScore },
            { label: "Momentum", score: scoresResult.momentumScore },
            { label: "International", score: scoresResult.internationalScore },
            { label: "Social Presence", score: scoresResult.socialScore !== null ? scoresResult.socialScore : "Not enough data" },
          ].map((item) => (
            <Card key={item.label} className="p-3 text-center hover:border-neutral-300 transition-colors">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</p>
              <p className="text-lg font-black font-mono mt-0.5 text-foreground">
                {typeof item.score === "number" ? item.score : item.score}
              </p>
            </Card>
          ))}
        </div>

        {/* DETERMINISTIC SCORE BREAKDOWN & EXPLANATIONS (PRD Section 22 & 30) */}
        <Card className="border-border bg-card">
          <CardHeader className="py-3.5 px-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-accent" />
              <span>How are these scores calculated? (Deterministic Engine {SCORING_ENGINE_VERSION})</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {scoresResult.confidenceTier}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Drivers */}
              <div className="space-y-2 p-3.5 rounded bg-emerald-50/50 border border-emerald-200">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Positive Score Drivers
                </span>
                <ul className="space-y-1 text-[11px] text-emerald-900 font-medium">
                  {scoresResult.explanation.drivers.map((driver, idx) => (
                    <li key={idx}>+ {driver}</li>
                  ))}
                </ul>
              </div>

              {/* Data Limitations */}
              <div className="space-y-2 p-3.5 rounded bg-amber-50/50 border border-amber-200">
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Data Limitations &amp; Caveats
                </span>
                <ul className="space-y-1 text-[11px] text-amber-900 font-medium">
                  {scoresResult.explanation.limitations.map((lim, idx) => (
                    <li key={idx}>- {lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PROFILE TABS NAVIGATION */}
        <div className="flex space-x-1 border-b border-border pb-2 overflow-x-auto text-xs font-bold">
          {[
            { id: "overview", label: "OVERVIEW", count: null },
            { id: "projects", label: "PROJECTS", count: projects.length },
            { id: "people", label: "PEOPLE", count: people.length },
            { id: "social", label: "SOCIAL", count: socialProfiles.length },
            { id: "sources", label: "SOURCES", count: sources.length },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/companies/${slug}?tab=${t.id}`}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-subtle"
                  : "bg-secondary text-secondary-foreground hover:bg-neutral-200"
              }`}
            >
              {t.label} {t.count !== null && <span className="ml-1 opacity-70 font-mono">({t.count})</span>}
            </Link>
          ))}
        </div>

        {/* TAB CONTENTS */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-accent" />
                    <span>Company Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground space-y-3">
                  <p>{company.description || "No company description available."}</p>
                </CardContent>
              </Card>

              {/* TIMELINE */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>Intelligence Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {events && events.length > 0 ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-border">
                      {events.map((ev: any) => (
                        <div key={ev.id} className="relative pl-6 space-y-1">
                          <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">
                            •
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{ev.title}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {new Date(ev.event_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No events recorded.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Engine Snapshot Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Scoring Version</span>
                    <span className="font-mono font-bold text-foreground">{SCORING_ENGINE_VERSION}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Calculated Confidence</span>
                    <span className="font-mono font-bold text-emerald-700">{scoresResult.confidence}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Provenential Source</span>
                    <Badge variant="success">VERIFIED FACT</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {tab === "projects" && (
          <div className="space-y-6">
            {Object.keys(projectsByRole).length > 0 ? (
              Object.entries(projectsByRole).map(([role, roleProjects]) => (
                <Card key={role}>
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-secondary/30">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Clapperboard className="h-4 w-4 text-accent" />
                      <span>{role.replace("_", " ")} ({roleProjects.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                            <th className="p-3 font-semibold">Title</th>
                            <th className="p-3 font-semibold">Type</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-medium">
                          {roleProjects.map((proj: any) => (
                            <tr key={proj.id} className="hover:bg-secondary/40">
                              <td className="p-3 font-bold text-foreground">
                                <Link href={`/projects/${proj.id}`} className="hover:text-accent hover:underline">
                                  {proj.title}
                                </Link>
                              </td>
                              <td className="p-3 text-muted-foreground capitalize">{proj.project_type?.replace("_", " ")}</td>
                              <td className="p-3">
                                <Badge variant={proj.status === "post_production" ? "accent" : "secondary"}>
                                  {proj.status?.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <Link href={`/projects/${proj.id}`}>
                                  <Badge variant="outline">Inspect Project →</Badge>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-xs text-muted-foreground">
                  No projects linked.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* PEOPLE TAB */}
        {tab === "people" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span>Current Executives ({currentPeople.length})</span>
                </CardTitle>
                <Badge variant="success">CURRENT</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {currentPeople.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                          <th className="p-3 font-semibold">Name</th>
                          <th className="p-3 font-semibold">Role</th>
                          <th className="p-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium">
                        {currentPeople.map((p: any) => (
                          <tr key={p.id} className="hover:bg-secondary/40">
                            <td className="p-3 font-bold text-foreground">
                              <Link href={`/people/${p.id}`} className="hover:text-accent hover:underline">
                                {p.full_name}
                              </Link>
                            </td>
                            <td className="p-3 text-accent font-semibold capitalize">{p.role?.replace("_", " ")}</td>
                            <td className="p-3 text-right">
                              <Link href={`/people/${p.id}`}>
                                <Badge variant="outline">Inspect Profile →</Badge>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No executives linked.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SOCIAL TAB */}
        {tab === "social" && (
          <CompanySocialTab
            companyName={company.name}
            companySlug={slug}
            initialSocialData={getCompanyInstagramData(slug, company.name)}
          />
        )}
      </div>
    </AppLayout>
  );
}
