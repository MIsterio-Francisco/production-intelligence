"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProjectWithGraph } from "@/lib/services/project-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clapperboard,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Film,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ProjectsClientProps {
  initialData: ProjectWithGraph[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ProjectsClient({
  initialData,
  total,
  page,
  limit,
  totalPages,
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [projectType, setProjectType] = useState(searchParams.get("projectType") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "release_date");

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleApplyFilters = () => {
    updateFilters({ search, projectType, status, country, sort });
  };

  const handleClearFilters = () => {
    setSearch("");
    setProjectType("");
    setStatus("");
    setCountry("");
    setSort("release_date");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-accent" />
            PROJECTS INTELLIGENCE DIRECTORY
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor active feature films, TV series, documentaries, and animation projects worldwide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filters */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-accent" />
              <span>Project Filters</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Search Title / Director</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Project title, director..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none"
              >
                <option value="">All Project Types</option>
                <option value="feature_film">Feature Film</option>
                <option value="tv_series">TV Series</option>
                <option value="documentary">Documentary</option>
                <option value="short">Short Film</option>
                <option value="animation">Animation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Production Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="announced">Announced</option>
                <option value="development">Development</option>
                <option value="pre_production">Pre-Production</option>
                <option value="production">Production</option>
                <option value="post_production">Post-Production</option>
                <option value="completed">Completed</option>
                <option value="released">Released</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none"
              >
                <option value="">All Countries</option>
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="FR">France (FR)</option>
                <option value="ES">Spain (ES)</option>
                <option value="DE">Germany (DE)</option>
                <option value="IT">Italy (IT)</option>
              </select>
            </div>

            <Button variant="accent" onClick={handleApplyFilters} className="w-full font-bold">
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Film className="h-4 w-4 text-accent" />
                <span>Monitored Projects ({total})</span>
              </CardTitle>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    updateFilters({ sort: e.target.value });
                  }}
                  className="h-7 rounded border border-input bg-card px-2 text-xs font-medium focus:outline-none"
                >
                  <option value="release_date">Release Date (Newest First)</option>
                  <option value="title">Project Title (A-Z)</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isPending ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-secondary/60 animate-pulse rounded" />
                  ))}
                </div>
              ) : initialData.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No projects found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No production projects match your selected parameters.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters} className="font-bold">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                        <th className="p-3 font-semibold">Title</th>
                        <th className="p-3 font-semibold">Type</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Production Companies</th>
                        <th className="p-3 font-semibold">Country</th>
                        <th className="p-3 font-semibold">Director</th>
                        <th className="p-3 font-semibold">Distributor / Streaming</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {initialData.map((proj) => (
                        <tr key={proj.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="p-3 font-bold text-foreground">
                            <Link href={`/projects/${proj.id}`} className="hover:text-accent hover:underline">
                              {proj.title}
                            </Link>
                          </td>
                          <td className="p-3 text-muted-foreground capitalize">
                            {proj.project_type?.replace("_", " ")}
                          </td>
                          <td className="p-3">
                            <Badge variant={proj.status === "post_production" ? "accent" : "secondary"}>
                              {proj.status?.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">
                            {proj.companies && proj.companies.length > 0 ? (
                              proj.companies.map((co, idx) => (
                                <span key={co.id || idx}>
                                  {idx > 0 && ", "}
                                  <Link href={`/companies/${co.slug}`} className="text-foreground hover:text-accent hover:underline font-semibold">
                                    {co.name}
                                  </Link>
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3 font-mono">{proj.country_code}</td>
                          <td className="p-3 text-muted-foreground">{proj.director_name || "N/A"}</td>
                          <td className="p-3 text-muted-foreground">{proj.distributor || proj.streaming_platform || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border text-xs">
              <span className="text-muted-foreground">
                Showing Page <span className="font-bold text-foreground">{page}</span> of{" "}
                <span className="font-bold text-foreground">{totalPages}</span> ({total} Total Projects)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
