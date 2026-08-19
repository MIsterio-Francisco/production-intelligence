import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Sliders, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              Platform Settings &amp; Customization
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure scoring engine weights, API connections, and account parameters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-accent" />
                <span>Scoring Version &amp; Weight Config</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3 text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="font-semibold text-foreground">Active Scoring Version</span>
                <span className="font-mono text-accent font-bold">v1 (Default)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="font-semibold text-foreground">Mode</span>
                <span>Premium Post-Production &amp; Color Grading</span>
              </div>
              <p className="text-[11px] pt-1">
                Scoring weights are defined in modular engine configurations (`lib/scoring/`).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" />
                <span>Database &amp; API Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3 text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="font-semibold text-foreground">Supabase PostgreSQL</span>
                <span className="font-mono text-emerald-600 font-bold">Connected</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="font-semibold text-foreground">OpenAI API Engine</span>
                <span className="font-mono text-emerald-600 font-bold">Server-Side Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
