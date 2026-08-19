import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyWithDetails } from "@/types/company";
import { MapPin, ArrowUpRight, Flame, Building2, Activity } from "lucide-react";

interface CompanyCardProps {
  company: CompanyWithDetails;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Card className="hover:border-accent/40 transition-all duration-150 flex flex-col justify-between shadow-subtle group">
      <CardHeader className="p-4 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-bold uppercase bg-background px-2 py-0.5 rounded border border-border text-muted-foreground">
            {company.country_code || "GLOBAL"}
          </span>
          <Badge variant="accent" className="font-mono text-[11px]">
            {company.mcl_match_score ? `${company.mcl_match_score} Match` : "N/A"}
          </Badge>
        </div>

        <CardTitle className="text-base font-extrabold mt-2 text-foreground group-hover:text-accent transition-colors">
          <Link href={`/companies/${company.slug}`} className="flex items-center justify-between">
            <span>{company.name}</span>
            <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent shrink-0" />
          </Link>
        </CardTitle>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-accent" /> {company.city ? `${company.city}, ${company.country_name || company.country_code}` : company.country_name || "Global"}
          </span>
          <span>•</span>
          <span className="capitalize">{company.company_type?.replace("_", " ") || "Production House"}</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
        <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11px]">
          {company.description || "Leading production company operating in film and television development."}
        </p>

        {/* Score Badges Row */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-center font-mono">
          <div className="bg-background p-1.5 rounded border border-border">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Power</span>
            <span className="text-sm font-black text-foreground">{company.power_score || "N/A"}</span>
          </div>

          <div className="bg-background p-1.5 rounded border border-border">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Momentum</span>
            <span className="text-sm font-black text-emerald-600">{company.momentum_score || "N/A"}</span>
          </div>

          <div className="bg-accent/10 p-1.5 rounded border border-accent/20 text-accent">
            <span className="text-[9px] uppercase font-bold block">MCL</span>
            <span className="text-sm font-black">{company.mcl_match_score || "N/A"}</span>
          </div>
        </div>

        {/* Latest Activity Signal if present */}
        {company.ai_summary && (
          <div className="text-[10px] text-muted-foreground flex items-start gap-1.5 bg-background p-2 rounded border border-border">
            <Activity className="h-3 w-3 text-accent shrink-0 mt-0.5" />
            <span className="line-clamp-1">{company.ai_summary}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
