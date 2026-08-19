import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Linkedin, MapPin } from "lucide-react";
import Link from "next/link";

interface PersonDetailProps {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailProps) {
  const { id } = await params;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-subtle space-y-3">
          <div className="flex items-center space-x-2">
            <Badge variant="accent">Head of Production</Badge>
            <Badge variant="success">95% Confidence</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">
            Executive Profile: {id}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-accent" /> Madrid, Spain • Verified Decision Maker
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Current Affiliation &amp; Scope</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-bold text-base text-foreground">Morena Films</div>
              <p className="text-muted-foreground">Primary Contact for Post-Production Vendor Contracts &amp; Finishing Operations.</p>
              <Link href="/companies/morena-films" className="inline-block">
                <Badge variant="accent">Open Company Profile →</Badge>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
