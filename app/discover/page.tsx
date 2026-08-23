import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DiscoverClient } from "@/components/companies/DiscoverClient";
import { getAvailableCompanyCountries, getCompanies } from "@/lib/services/company-service";

interface DiscoverPageProps {
  searchParams: Promise<{
    search?: string;
    country?: string;
    category?: string;
    companyType?: string;
    minPower?: string;
    minMomentum?: string;
    minMclMatch?: string;
    sort?: string;
    order?: "asc" | "desc";
    page?: string;
    limit?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const resolvedParams = await searchParams;

  const [result, countries] = await Promise.all([getCompanies({
    search: resolvedParams.search,
    country: resolvedParams.country,
    category: resolvedParams.category,
    companyType: resolvedParams.companyType,
    minPower: resolvedParams.minPower ? parseFloat(resolvedParams.minPower) : undefined,
    minMomentum: resolvedParams.minMomentum ? parseFloat(resolvedParams.minMomentum) : undefined,
    minMclMatch: resolvedParams.minMclMatch ? parseFloat(resolvedParams.minMclMatch) : undefined,
    sort: resolvedParams.sort || "mcl_match_score",
    order: resolvedParams.order || "desc",
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 200,
  }), getAvailableCompanyCountries()]);

  return (
    <AppLayout>
      <DiscoverClient
        initialData={result.data}
        total={result.total}
        page={result.page}
        limit={result.limit}
        totalPages={result.totalPages}
        countries={countries}
        dataMode={result.dataMode || "LIVE"}
        error={result.error}
      />
    </AppLayout>
  );
}
