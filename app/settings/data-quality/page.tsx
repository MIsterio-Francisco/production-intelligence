import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ShieldCheck, Activity, RefreshCw, AlertCircle, CheckCircle2, FileSearch, Layers } from "lucide-react";
import { ProviderRegistry } from "@/lib/ingestion/registry";
import { getCompanies } from "@/lib/services/company-service";

export const dynamic = "force-dynamic";

export default async function DataQualityDashboardPage() {
  const companiesRes = await getCompanies({ limit: 100 });
  const companies = companiesRes.data || [];
  const providerConfigs = ProviderRegistry.getAllConfigs();

  const totalCompanies = companies.length;
  const verifiedCompanies = companies.filter((c) => !c.is_demo).length;
  const demoCompanies = companies.filter((c) => c.is_demo).length;
  const withWebsite = companies.filter((c) => c.website_url).length;
  const withCity = companies.filter((c) => c.city).length;
  const highQualityCount = companies.filter((c) => c.data_quality_score != null && c.data_quality_score >= 80).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" />
              Data Quality &amp; Governance Dashboard (Phase 8)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              System health monitoring, provenance verification, entity resolution stats, and data freshness metrics.
            </p>
          </div>
          <Badge variant="accent" className="font-mono text-xs font-bold">
            Data Quality Score System v1.0
          </Badge>
        </div>

        {/* Operational Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Companies
              </span>
              <span className="text-2xl font-black text-foreground">{totalCompanies}</span>
              <span className="text-[10px] text-muted-foreground block">Intelligence graph entries</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Verified Facts
              </span>
              <span className="text-2xl font-black text-emerald-600">{totalCompanies}</span>
              <span className="text-[10px] text-emerald-700 block">Tier 1 &amp; Tier 2 sources</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Website Coverage
              </span>
              <span className="text-2xl font-black text-foreground">
                {totalCompanies > 0 ? `${Math.round((withWebsite / totalCompanies) * 100)}%` : "0%"}
              </span>
              <span className="text-[10px] text-muted-foreground block">{withWebsite} of {totalCompanies} domains</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                High Quality (≥80)
              </span>
              <span className="text-2xl font-black text-accent">
                {totalCompanies > 0 ? `${Math.round((highQualityCount / totalCompanies) * 100)}%` : "0%"}
              </span>
              <span className="text-[10px] text-accent block">{highQualityCount} high-confidence companies</span>
            </CardContent>
          </Card>
        </div>

        {/* Data Quality & Source Provenance Rules */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Data Classification &amp; Provenance Taxonomy</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">Strict Non-Hallucination Policy</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded border border-border bg-background space-y-1">
                <Badge variant="success" className="text-[10px]">VERIFIED_FACT</Badge>
                <p className="text-[11px] text-foreground font-sans pt-1">
                  Official company disclosures, registered press releases, and tier 1 festival catalogs.
                </p>
              </div>
              <div className="p-3 rounded border border-border bg-background space-y-1">
                <Badge variant="secondary" className="text-[10px]">ESTIMATE</Badge>
                <p className="text-[11px] text-foreground font-sans pt-1">
                  Budget ranges reported by established trade press and aggregator estimates.
                </p>
              </div>
              <div className="p-3 rounded border border-border bg-background space-y-1">
                <Badge variant="accent" className="text-[10px]">AI_INFERENCE</Badge>
                <p className="text-[11px] text-foreground font-sans pt-1">
                  Structured summaries extracted by server-side AI reasoning over verified evidence packets.
                </p>
              </div>
              <div className="p-3 rounded border border-border bg-background space-y-1">
                <Badge variant="warning" className="text-[10px]">UNKNOWN</Badge>
                <p className="text-[11px] text-foreground font-sans pt-1">
                  Explicit fallback state when data is unverified or missing (no zero-penalties).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
