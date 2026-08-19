import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Filter, Shield } from "lucide-react";

export default function AlertsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Intelligence Alerts &amp; Signal Triggers
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure custom triggers for new productions, score threshold increases, and executive movement.
            </p>
          </div>
          <Button variant="accent" size="sm" className="font-bold">
            <Plus className="h-4 w-4 mr-1" /> Create New Alert Rule
          </Button>
        </div>

        {/* Section 11.8 PRD Example alert rules */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>Active Alert Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {[
                {
                  id: "rule-1",
                  name: "European High Match Feature Film Rule",
                  condition: "Notify when European production company has MCL Match > 85 and announces a new feature film.",
                  active: true,
                  triggered: "2 times this week",
                },
                {
                  id: "rule-2",
                  name: "UK Head of Post Executive Movement",
                  condition: "Notify when a UK production company updates Head of Post or Post Supervisor.",
                  active: true,
                  triggered: "1 time this month",
                },
              ].map((rule) => (
                <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span>{rule.name}</span>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] font-mono">{rule.condition}</p>
                    <div className="text-[10px] text-accent font-semibold">{rule.triggered}</div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    Edit Rule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
