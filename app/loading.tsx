import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Loading() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-secondary/60 rounded" />
            <div className="h-4 w-96 bg-secondary/40 rounded" />
          </div>
          <div className="h-8 w-32 rounded-full bg-secondary/60" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="h-3 w-20 bg-secondary/60 rounded" />
              <div className="h-7 w-16 bg-secondary/80 rounded" />
              <div className="h-3 w-24 bg-secondary/40 rounded" />
            </div>
          ))}
        </div>

        {/* Content Table/List Skeleton */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="h-5 w-48 bg-secondary/60 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded bg-secondary/30">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-secondary/60 rounded" />
                  <div className="h-3 w-60 bg-secondary/40 rounded" />
                </div>
                <div className="h-6 w-20 bg-secondary/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
