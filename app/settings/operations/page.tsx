import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Cpu, Server, CheckCircle2, AlertCircle, Clock, Database, Radio } from "lucide-react";
import { ProviderRegistry } from "@/lib/ingestion/registry";
import { createClient } from "@/lib/supabase/server";
import { CompanyIntakeQueueForm } from "@/components/settings/CompanyIntakeQueueForm";

export const dynamic = "force-dynamic";

export default async function OperationsDashboardPage() {
  const providerConfigs = ProviderRegistry.getAllConfigs();
  const supabase = await createClient();

  const { data: recentJobs } = await (supabase.from("ingestion_jobs") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: queueItems } = await (supabase.from("data_refresh_queue") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const [{ data: intakeCandidates }, { data: intakeRuns }] = await Promise.all([
    (supabase.from("company_intake_candidates") as any).select("*").order("created_at", { ascending: false }).limit(10),
    (supabase.from("daily_company_intake_runs") as any).select("*").order("run_date", { ascending: false }).limit(7),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Operational Systems &amp; Pipeline Dashboard (Phase 9)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live provider connection states, scheduled CRON job logs, queue depths, and execution telemetry.
            </p>
          </div>
          <Badge variant="accent" className="font-mono text-xs font-bold">
            Scheduler Status: CRON-READY
          </Badge>
        </div>

        {/* Operational Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Providers
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {providerConfigs.filter((p) => p.status === "CONNECTED").length}
              </span>
              <span className="text-[10px] text-muted-foreground block">Connected data pipelines</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Unconfigured Providers
              </span>
              <span className="text-2xl font-black text-amber-600">
                {providerConfigs.filter((p) => p.status === "NOT_CONFIGURED").length}
              </span>
              <span className="text-[10px] text-amber-700 block">Requires authorized API keys</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Recent Jobs Executed
              </span>
              <span className="text-2xl font-black text-foreground">{(recentJobs || []).length}</span>
              <span className="text-[10px] text-muted-foreground block">Pipeline job runs</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Refresh Queue Depth
              </span>
              <span className="text-2xl font-black text-accent">{(queueItems || []).length}</span>
              <span className="text-[10px] text-accent block">Dirty entities pending score check</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" /> Admisión diaria de productoras verificadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Máximo dos productoras al día. La web oficial debe demostrar actividad de producción cinematográfica o televisiva. Apollo nunca se ejecuta automáticamente.
            </p>
            <CompanyIntakeQueueForm />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded border border-border p-3"><span className="block text-muted-foreground">En cola</span><strong>{(intakeCandidates || []).filter((item: any) => item.status === "QUEUED").length}</strong></div>
              <div className="rounded border border-border p-3"><span className="block text-muted-foreground">Admitidas</span><strong>{(intakeCandidates || []).filter((item: any) => item.status === "ADMITTED").length}</strong></div>
              <div className="rounded border border-border p-3"><span className="block text-muted-foreground">Rechazadas</span><strong>{(intakeCandidates || []).filter((item: any) => item.status === "REJECTED").length}</strong></div>
              <div className="rounded border border-border p-3"><span className="block text-muted-foreground">Última ejecución</span><strong>{intakeRuns?.[0]?.run_date || "Pendiente"}</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Live Data Provider Status Matrix */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-accent" />
              <span>Provider Capabilities &amp; Connection Lifecycle Matrix</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">Strict Truthful Status</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                    <th className="p-3 font-semibold">Provider Name</th>
                    <th className="p-3 font-semibold">Provider Type</th>
                    <th className="p-3 font-semibold">Lifecycle Status</th>
                    <th className="p-3 font-semibold">Source Tier</th>
                    <th className="p-3 font-semibold">Rate Limit</th>
                    <th className="p-3 font-semibold text-right">Reliability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {providerConfigs.map((prov) => (
                    <tr key={prov.provider_id} className="hover:bg-secondary/40">
                      <td className="p-3 font-bold text-foreground">
                        {prov.provider_name}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground text-[11px]">{prov.provider_type}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            prov.status === "CONNECTED"
                              ? "success"
                              : prov.status === "NOT_CONFIGURED"
                              ? "warning"
                              : "secondary"
                          }
                          className="font-mono text-[10px]"
                        >
                          {prov.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[11px]">Tier {prov.source_tier}</td>
                      <td className="p-3 font-mono text-muted-foreground text-[11px]">{prov.rate_limit_per_min} req/min</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {prov.reliability_score}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Ingestion Pipeline Execution Telemetry */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-600" />
              <span>Recent Pipeline Job Log Telemetry</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">Idempotent &amp; Lock-Protected</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {(!recentJobs || recentJobs.length === 0) ? (
              <p className="text-muted-foreground font-mono text-[11px]">No external job runs logged yet.</p>
            ) : (
              <div className="space-y-2 font-mono">
                {recentJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-bold text-foreground text-xs">{job.provider_id}</span>
                      <span className="text-[10px] text-muted-foreground">({job.job_type})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">
                        {job.records_fetched || 0} fetched / {job.records_updated || 0} updated
                      </span>
                      <Badge variant="success" className="font-mono text-[10px]">{job.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
