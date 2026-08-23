"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Trophy,
  Building2,
  Clapperboard,
  Users,
  Flame,
  Activity,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Discover", href: "/discover", icon: Compass },
  { name: "Rankings", href: "/rankings", icon: Trophy },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Projects", href: "/projects", icon: Clapperboard },
  { name: "People", href: "/people", icon: Users },
  { name: "Opportunities", href: "/opportunities", icon: Flame, badge: "MCL" },
  { name: "What Changed", href: "/changes", icon: Activity, badge: "RADAR" },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [engineStatus, setEngineStatus] = useState<"checking" | "operational" | "degraded">("checking");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/health", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { status: "degraded" })
      .then((payload) => {
        if (active) setEngineStatus(payload.status === "operational" ? "operational" : "degraded");
      })
      .catch(() => { if (active) setEngineStatus("degraded"); });
    return () => { active = false; };
  }, []);

  const engineLabel = engineStatus === "operational" ? "Operativo" : engineStatus === "degraded" ? "Degradado" : "Comprobando";

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col justify-between hidden md:flex min-h-[calc(100vh-3.5rem)]">
      <div className="py-4 px-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Intelligence Engine
        </div>

        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-subtle"
                  : "text-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 m-2 rounded bg-background border border-border text-[11px] text-muted-foreground space-y-1.5">
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span>MCL Match Engine</span>
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              engineStatus === "operational" ? "bg-emerald-500" : engineStatus === "degraded" ? "bg-amber-500" : "bg-slate-400"
            )}
            title={`Estado del motor: ${engineLabel}`}
          />
        </div>
        <div className="text-[10px] text-muted-foreground font-mono font-bold bg-secondary p-1.5 rounded border border-border">
          Estado: {engineLabel}
        </div>
        <div className="text-[10px] text-muted-foreground">V1.5.6 Market Scanner</div>
      </div>
    </aside>
  );
}
