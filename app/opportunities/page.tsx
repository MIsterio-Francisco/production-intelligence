import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunitiesClient } from "@/components/opportunities/OpportunitiesClient";
import { getSignals } from "@/lib/services/signal-service";

interface OpportunitiesPageProps {
  searchParams: Promise<{
    severity?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const resolvedParams = await searchParams;

  const result = await getSignals({
    severity: resolvedParams.severity as any,
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 20,
  });

  return (
    <AppLayout>
      <OpportunitiesClient
        initialSignals={result.data}
        total={result.total}
        page={result.page}
        limit={result.limit}
        totalPages={result.totalPages}
      />
    </AppLayout>
  );
}
