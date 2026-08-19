import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectsClient } from "@/components/projects/ProjectsClient";
import { getProjects } from "@/lib/services/project-service";

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    projectType?: string;
    status?: string;
    country?: string;
    sort?: string;
    order?: "asc" | "desc";
    page?: string;
    limit?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedParams = await searchParams;

  const result = await getProjects({
    search: resolvedParams.search,
    projectType: resolvedParams.projectType,
    status: resolvedParams.status,
    country: resolvedParams.country,
    sort: resolvedParams.sort || "release_date",
    order: resolvedParams.order || "desc",
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    limit: resolvedParams.limit ? parseInt(resolvedParams.limit, 10) : 20,
  });

  return (
    <AppLayout>
      <ProjectsClient
        initialData={result.data}
        total={result.total}
        page={result.page}
        limit={result.limit}
        totalPages={result.totalPages}
      />
    </AppLayout>
  );
}
