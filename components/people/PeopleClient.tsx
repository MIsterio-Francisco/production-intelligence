"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PersonWithGraph } from "@/lib/services/person-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import Link from "next/link";

interface PeopleClientProps {
  initialData: PersonWithGraph[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function PeopleClient({
  initialData,
  total,
  page,
  limit,
  totalPages,
}: PeopleClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");

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
    updateFilters({ search, role, country });
  };

  const handleClearFilters = () => {
    setSearch("");
    setRole("");
    setCountry("");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            DECISION MAKER INTELLIGENCE DIRECTORY
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify Heads of Post, Producers, Heads of VFX, and Executive Decision Makers globally.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filters */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-accent" />
              <span>Executive Filters</span>
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
              <label className="font-semibold text-muted-foreground">Search Executive / Company</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name, company, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Key Industry Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="head_of_post">Head of Post Production</option>
                <option value="post_producer">Post Producer</option>
                <option value="head_of_production">Head of Production</option>
                <option value="executive_producer">Executive Producer</option>
                <option value="producer">Producer</option>
                <option value="head_of_vfx">Head of VFX</option>
                <option value="founder">Founder / CEO</option>
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

        {/* Results Table */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Identified Executives ({total})</span>
              </CardTitle>
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
                  <h3 className="text-base font-bold text-foreground">No decision makers found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No executives match your current search and role filters.
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
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Job Title</th>
                        <th className="p-3 font-semibold">Affiliated Companies</th>
                        <th className="p-3 font-semibold">Location</th>
                        <th className="p-3 font-semibold text-right">Confidence</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {initialData.map((person) => (
                        <tr key={person.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="p-3 font-bold text-foreground">
                            <Link href={`/people/${person.id}`} className="hover:text-accent hover:underline">
                              {person.full_name}
                            </Link>
                          </td>
                          <td className="p-3 font-semibold text-accent">{person.job_title || "Executive"}</td>
                          <td className="p-3">
                            {person.positions && person.positions.length > 0 ? (
                              person.positions.map((pos, idx) => (
                                <span key={pos.company_id || idx}>
                                  {idx > 0 && ", "}
                                  <Link href={`/companies/${pos.company_slug}`} className="hover:underline font-bold text-foreground">
                                    {pos.company_name}
                                  </Link>
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">{person.city ? `${person.city}, ${person.country_code}` : person.country_code || "Global"}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {person.profile_confidence || 95}%
                          </td>
                          <td className="p-3 text-right">
                            <Link href={`/people/${person.id}`}>
                              <Badge variant="outline">Inspect Profile →</Badge>
                            </Link>
                          </td>
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
                <span className="font-bold text-foreground">{totalPages}</span> ({total} Total Decision Makers)
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
