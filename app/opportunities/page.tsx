import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunitiesClient } from "@/components/opportunities/OpportunitiesClient";
import { TopTargetsView } from "@/components/opportunities/TopTargetsView";
import { getSignals } from "@/lib/services/signal-service";
import { getTopCommercialTargets } from "@/lib/services/opportunity-engine";

interface OpportunitiesPageProps {
  searchParams: Promise<{
    severity?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const resolvedParams = await searchParams;

  const [signalsResult, topTargets] = await Promise.all([
    getSignals({
      severity: resolvedParams.severity as any,
      page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
      limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 20,
    }),
    Promise.resolve(getTopCommercialTargets(10)),
  ]);

  return (
    <AppLayout>
      <div className="space-y-8">
        <TopTargetsView targets={topTargets} />

        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Feed Completo de Señales de Mercado</h3>
          <OpportunitiesClient
            initialSignals={signalsResult.data}
            total={signalsResult.total}
            page={signalsResult.page}
            limit={signalsResult.limit}
            totalPages={signalsResult.totalPages}
          />
        </div>
      </div>
    </AppLayout>
  );
}
