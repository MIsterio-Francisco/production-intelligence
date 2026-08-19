import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Globe, MapPin, Sparkles, Clapperboard, Users, Award, ExternalLink, Flame, ShieldAlert } from "lucide-react";

interface CompanyProfileProps {
  params: Promise<{ slug: string }>;
}

export default async function CompanyProfilePage({ params }: CompanyProfileProps) {
  const { slug } = await params;
  const companyName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero Section (Section 11.4 PRD) */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-subtle space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                  ES-PRODUCTION
                </span>
                <Badge variant="accent">Independent Studio</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {companyName || "Morena Films"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" /> Madrid, Spain
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-accent" /> www.morenafilms.com
                </span>
                <span>Founded: 1999</span>
              </div>
            </div>

            {/* Score Badges */}
            <div className="flex items-center gap-4">
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Power Score
                </div>
                <div className="text-3xl font-black font-mono text-foreground mt-0.5">
                  88
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                <div className="text-[10px] uppercase tracking-wider font-bold">
                  MCL Match
                </div>
                <div className="text-3xl font-black font-mono mt-0.5">
                  94
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {["Feature Film", "High-End TV Series", "International Co-Production", "Post-Production Heavy"].map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Score Breakdown (Section 11.4 PRD) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Creative Score", score: 86 },
            { label: "Commercial Score", score: 90 },
            { label: "Momentum", score: 92 },
            { label: "International", score: 85 },
            { label: "Social Presence", score: 65 },
          ].map((item) => (
            <Card key={item.label} className="p-3 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</p>
              <p className="text-lg font-black font-mono mt-1 text-foreground">{item.score}</p>
            </Card>
          ))}
        </div>

        {/* Commercial Brief Call-To-Action (Section 11.4 & 28 PRD) */}
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-extrabold text-sm uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>AI Commercial Brief Generator</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                Generate instant business intelligence on why your post-production &amp; finishing team should contact {companyName} right now.
              </p>
            </div>
            <Button variant="accent" className="font-bold shrink-0">
              Why should I contact this company?
            </Button>
          </CardContent>
        </Card>

        {/* Profile Tabs Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview & Projects */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent" />
                  <span>Company Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground space-y-2">
                <p>
                  Morena Films is an independent film and television production company based in Madrid, Spain. Founded in 1999, the company focuses on high-impact commercial feature films and premium television series for European and global streaming markets.
                </p>
                <p>
                  Known for producing feature films with significant post-production, color grading, and finishing requirements, as well as high-budget Netflix and Amazon Prime originals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clapperboard className="h-4 w-4 text-accent" />
                  <span>Recent &amp; Upcoming Projects</span>
                </CardTitle>
                <span className="text-[10px] font-mono text-muted-foreground">3 Active</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {[
                    { title: "La Infiltrada", type: "Feature Film", status: "Production", release: "2025", director: "Arantxa Echevarría" },
                    { title: "Cerdita (Piggy)", type: "Feature Film", status: "Completed", release: "2023", director: "Carlota Pereda" },
                    { title: "Las Niñas de Cristal", type: "Netflix Film", status: "Released", release: "2022", director: "Jota Linares" },
                  ].map((proj) => (
                    <div key={proj.title} className="p-3.5 flex items-center justify-between hover:bg-secondary/40">
                      <div>
                        <div className="font-bold text-foreground">{proj.title}</div>
                        <div className="text-[11px] text-muted-foreground">{proj.type} • Director: {proj.director}</div>
                      </div>
                      <div className="text-right font-mono">
                        <Badge variant="outline">{proj.status}</Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{proj.release}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Decision Makers & Sources */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span>Key Decision Makers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {[
                    { name: "Pedro Uriol", role: "Head of Production / Producer", confidence: 95 },
                    { name: "Álvaro Longoria", role: "Founder / Executive Producer", confidence: 98 },
                    { name: "Merry Colomer", role: "Producer / Post Supervisor", confidence: 90 },
                  ].map((person) => (
                    <div key={person.name} className="p-3.5 space-y-1">
                      <div className="font-bold text-foreground flex items-center justify-between">
                        <span>{person.name}</span>
                        <span className="text-[10px] font-mono text-emerald-700">{person.confidence}% Conf.</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{person.role}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-accent" />
                  <span>Data Traceability &amp; Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-[11px] text-muted-foreground space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
                  <span>Official Website</span>
                  <span className="font-mono text-emerald-700">Verified Fact</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
                  <span>IMDbPro Production Registry</span>
                  <span className="font-mono text-emerald-700">Verified Fact</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
                  <span>AI Inferred Opportunity Signals</span>
                  <span className="font-mono text-amber-700">AI Inference</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
