import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PeopleClient } from "@/components/people/PeopleClient";
import { getPeople } from "@/lib/services/person-service";

interface PeoplePageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    country?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const resolvedParams = await searchParams;

  const result = await getPeople({
    search: resolvedParams.search,
    role: resolvedParams.role,
    country: resolvedParams.country,
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 20,
  });

  return (
    <AppLayout>
      <PeopleClient
        initialData={result.data}
        total={result.total}
        page={result.page}
        limit={result.limit}
        totalPages={result.totalPages}
      />
    </AppLayout>
  );
}
