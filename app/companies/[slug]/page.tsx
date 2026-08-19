import React from "react";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCompanyBySlug } from "@/lib/services/company-service";
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
} from "lucide-react";
import Link from "next/link";

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

  const latestEvent = events?.[0];

  // Group Projects by Role (PRD Section 10)
  const projectsByRole = (projects || []).reduce((acc: Record<string, any[]>, proj: any) => {
    const role = proj.company_role || "producer";
    if (!acc[role]) acc[role] = [];
    acc[role].push(proj);
    return acc;
  }, {});

  // Group People into Current vs Former (PRD Section 14)
  const currentPeople = (people || []).filter((p) => p.is_current !== false);
  const formerPeople = (people || []).filter((p) => p.is_current === false);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HERO SECTION (PRD Section 7) */}
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
                    className="flex items-center gap-1 hover:text-accent underline transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5 text-accent" /> {company.website_url.replace("https://", "").replace("http://", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {company.founded_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Founded {company.founded_year}
                  </span>
                )}
              </div>
            </div>

            {/* SCORE HEADER CARDS (PRD Section 7) */}
            <div className="flex items-center gap-4">
              <div className="text-center p-3.5 rounded-lg bg-background border border-border min-w-[100px]">
                <div className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                  Power Score
                </div>
                <div className="text-3xl font-black font-mono text-foreground mt-0.5">
                  {company.power_score || "N/A"}
                </div>
              </div>

              <div className="text-center p-3.5 rounded-lg bg-accent/10 border border-accent/30 text-accent min-w-[100px]">
                <div className="text-[9px] uppercase tracking-wider font-bold">
                  MCL Match
                </div>
                <div className="text-3xl font-black font-mono mt-0.5">
                  {company.mcl_match_score || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Categories & Graph Counts Bar (PRD Section 22) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {(company.categories || ["film", "television"]).map((cat) => (
                <Badge key={cat} variant="outline" className="capitalize text-xs">
                  {cat.replace("_", " ")}
                </Badge>
              ))}
            </div>

            {/* Cross Entity Graph Counts */}
            <div className="flex items-center space-x-3 font-mono text-[11px] text-muted-foreground">
              <span><strong className="text-foreground">{projects.length}</strong> Projects</span>
              <span>•</span>
              <span><strong className="text-foreground">{people.length}</strong> People</span>
              <span>•</span>
              <span><strong className="text-foreground">{events.length}</strong> Events</span>
            </div>
          </div>
        </div>

        {/* SECONDARY SCORES & EXPLANATIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Creative Score", score: company.creative_score, desc: "Festivals & awards" },
            { label: "Commercial Score", score: company.commercial_score, desc: "Box office & platform scale" },
            { label: "Momentum", score: company.momentum_score, desc: "Activity in last 90 days" },
            { label: "International", score: company.international_score, desc: "Co-productions & cross-border" },
            { label: "Social Presence", score: company.social_score, desc: "Digital engagement index" },
          ].map((item) => (
            <Card key={item.label} className="p-3 text-center hover:border-neutral-300 transition-colors">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</p>
              <p className="text-lg font-black font-mono mt-0.5 text-foreground">{item.score || "N/A"}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{item.desc}</p>
            </Card>
          ))}
        </div>

        {/* LATEST ACTIVITY HIGHLIGHT */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Latest Verified Intelligence Activity
              </span>
              <p className="font-semibold text-xs text-foreground mt-0.5">
                {latestEvent ? `${latestEvent.title} — ${latestEvent.description}` : company.ai_summary || "No recent intelligence activity recorded."}
              </p>
            </div>
          </div>
          {latestEvent && (
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {new Date(latestEvent.event_date).toLocaleDateString()}
            </span>
          )}
        </div>

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
                    <span>Company Profile &amp; Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground space-y-3">
                  <p>{company.description || "No company description available yet."}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px] border-t border-border">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Legal Name</span>
                      <span className="font-bold text-foreground">{company.legal_name || company.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Company Type</span>
                      <span className="font-bold text-foreground capitalize">{company.company_type?.replace("_", " ")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Employees Range</span>
                      <span className="font-bold text-foreground">
                        {company.employee_count_min ? `${company.employee_count_min} - ${company.employee_count_max}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TIMELINE SECTION */}
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
                    <p className="text-xs text-muted-foreground italic">No intelligence events available yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Provenance &amp; Score Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Data Provenance</span>
                    <Badge variant="success" className="uppercase font-mono text-[10px]">
                      {company.provenance_type || "verified"}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Classification</span>
                    <span className="font-mono font-semibold text-foreground">{company.data_classification || "VERIFIED_FACT"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Confidence Level</span>
                    <span className="font-mono font-bold text-emerald-700">{company.score_confidence || 95}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PROJECTS TAB GROUPED BY ROLE (PRD Section 10) */}
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
                            <th className="p-3 font-semibold">Director</th>
                            <th className="p-3 font-semibold">Distributor / Streaming</th>
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
                              <td className="p-3 text-muted-foreground">{proj.director_name || "N/A"}</td>
                              <td className="p-3 text-muted-foreground">{proj.distributor || proj.streaming_platform || "N/A"}</td>
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
                  No projects have been added yet.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* PEOPLE TAB DISTINGUISHING CURRENT VS FORMER (PRD Section 14) */}
        {tab === "people" && (
          <div className="space-y-6">
            {/* CURRENT PEOPLE */}
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span>Current Key Executives ({currentPeople.length})</span>
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
                          <th className="p-3 font-semibold">Seniority</th>
                          <th className="p-3 font-semibold text-right">Confidence</th>
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
                            <td className="p-3 text-muted-foreground">{p.seniority || "Executive"}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">
                              {p.confidence || 90}%
                            </td>
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
                    No current executives linked.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FORMER PEOPLE */}
            {formerPeople.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Former Executives &amp; Past Affiliations ({formerPeople.length})</span>
                  </CardTitle>
                  <Badge variant="secondary">FORMER</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                          <th className="p-3 font-semibold">Name</th>
                          <th className="p-3 font-semibold">Former Role</th>
                          <th className="p-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium">
                        {formerPeople.map((p: any) => (
                          <tr key={p.id} className="hover:bg-secondary/40">
                            <td className="p-3 font-bold text-foreground">
                              <Link href={`/people/${p.id}`} className="hover:text-accent hover:underline">
                                {p.full_name}
                              </Link>
                            </td>
                            <td className="p-3 text-muted-foreground capitalize">{p.role?.replace("_", " ")}</td>
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
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* SOCIAL TAB */}
        {tab === "social" && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">
                Verified Social Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {socialProfiles.length > 0 ? (
                <div className="divide-y divide-border text-xs">
                  {socialProfiles.map((soc: any) => (
                    <div key={soc.id} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                      <div>
                        <span className="font-bold text-foreground uppercase text-[11px] block">{soc.platform}</span>
                        <a
                          href={soc.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline text-xs flex items-center gap-1 mt-0.5"
                        >
                          @{soc.username} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-4 font-mono text-xs text-right">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase block">Followers</span>
                          <span className="font-bold">{soc.follower_count?.toLocaleString() || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase block">Engagement</span>
                          <span className="font-bold text-emerald-600">{soc.engagement_rate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Not available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SOURCES TAB */}
        {tab === "sources" && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-accent" />
                <span>Evidence &amp; Traceable Data Sources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sources.length > 0 ? (
                <div className="divide-y divide-border text-xs">
                  {sources.map((src: any) => (
                    <div key={src.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-secondary/40">
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground">{src.title || src.source_name}</span>
                        <p className="text-[11px] text-muted-foreground">
                          Publisher: {src.publisher || "Official"} • Type: {src.source_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 font-mono text-xs">
                        <Badge variant="success">{src.credibility_score}% Credibility</Badge>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline flex items-center gap-1 font-bold"
                          >
                            View Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No intelligence sources available.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
