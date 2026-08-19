import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, MapPin, Film, Building2 } from "lucide-react";
import Link from "next/link";

interface ProjectDetailsProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsProps) {
  const { id } = await params;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-subtle space-y-3">
          <div className="flex items-center space-x-2">
            <Badge variant="accent">Feature Film</Badge>
            <Badge variant="success">Post-Production</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">
            Project Intelligence: {id}
          </h1>
          <p className="text-xs text-muted-foreground">
            High-budget thriller requiring color grading, sound design, and finishing capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Film className="h-4 w-4 text-accent" />
                <span>Production Specs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Director</span>
                <span>Arantxa Echevarría</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Country</span>
                <span>Spain (ES)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-semibold text-foreground">Est. Budget</span>
                <span>€4,500,000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-foreground">Distributor</span>
                <span>Warner Bros. Spain</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent" />
                <span>Associated Production Company</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-bold text-base text-foreground">Morena Films</div>
              <p className="text-muted-foreground">MCL Match: 94 • Power Score: 88</p>
              <Link href="/companies/morena-films" className="inline-block">
                <Badge variant="accent">View Company Profile →</Badge>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
