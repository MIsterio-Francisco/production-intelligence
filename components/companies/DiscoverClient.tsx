"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CompanyWithDetails } from "@/types/company";
import { CompanyCard } from "./CompanyCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Filter,
  Search,
  Building2,
  LayoutGrid,
  List,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";

interface DiscoverClientProps {
  initialData: CompanyWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  countries: Array<{ code: string; name: string }>;
  dataMode: "LIVE" | "SEED" | "DEMO" | "ERROR";
  error?: string;
}

export function DiscoverClient({
  initialData,
  total,
  page,
  limit,
  totalPages,
  countries,
  dataMode,
  error,
}: DiscoverClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // State initialized from URL query params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [companyType, setCompanyType] = useState(searchParams.get("companyType") || "");
  const [minPower, setMinPower] = useState(searchParams.get("minPower") || "0");
  const [minMomentum, setMinMomentum] = useState(searchParams.get("minMomentum") || "0");
  const [minMclMatch, setMinMclMatch] = useState(searchParams.get("minMclMatch") || "0");
  const [sort, setSort] = useState(searchParams.get("sort") || "mcl_match_score");

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "" || value === "0") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 on new filter
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleApplyFilters = () => {
    updateFilters({
      search,
      country,
      category,
      companyType,
      minPower,
      minMomentum,
      minMclMatch,
      sort,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setCountry("");
    setCategory("");
    setCompanyType("");
    setMinPower("0");
    setMinMomentum("0");
    setMinMclMatch("0");
    setSort("mcl_match_score");

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
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Compass className="h-5 w-5 text-accent" />
            DISCOVER
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore the global production landscape and discover high-value commercial opportunities.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "table" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 text-xs"
          >
            <List className="h-3.5 w-3.5 mr-1" /> Table View
          </Button>
          <Button
            variant={viewMode === "grid" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Cards View
          </Button>
        </div>
      </div>

      {/* Main Discover Layout: Sidebar Filters + Results */}
      {dataMode === "ERROR" && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <strong>Catálogo real no disponible.</strong> {error || "No se pudo conectar con Supabase."} No se muestran registros seed como si fueran datos globales.
        </div>
      )}
      {(dataMode === "SEED" || dataMode === "DEMO") && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Modo demo:</strong> estos registros no representan el catálogo real de Supabase.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filter Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-accent" />
              <span>Filters</span>
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
            {/* Search input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Search Companies</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Company name, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            {/* Country Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Countries</option>
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>{item.name} ({item.code})</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Categories</option>
                <option value="film">Film</option>
                <option value="television">Television</option>
                <option value="documentary">Documentary</option>
                <option value="animation">Animation</option>
                <option value="postproduction">Post-Production</option>
                <option value="international">International</option>
                <option value="independent">Independent</option>
                <option value="studio">Studio</option>
                <option value="streaming">Streaming</option>
              </select>
            </div>

            {/* Company Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Company Type</label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Types</option>
                <option value="independent">Independent</option>
                <option value="studio">Studio</option>
                <option value="production_company">Production Company</option>
                <option value="broadcaster">Broadcaster</option>
                <option value="documentary">Documentary Studio</option>
              </select>
            </div>

            {/* Power Score Range */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex justify-between">
                <span>Min Power Score</span>
                <span className="font-mono text-accent font-bold">{minPower}+</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minPower}
                onChange={(e) => setMinPower(e.target.value)}
                className="w-full accent-accent"
              />
            </div>

            {/* Momentum Score Range */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex justify-between">
                <span>Min Momentum Score</span>
                <span className="font-mono text-emerald-600 font-bold">{minMomentum}+</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMomentum}
                onChange={(e) => setMinMomentum(e.target.value)}
                className="w-full accent-accent"
              />
            </div>

            {/* MCL Match Range */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex justify-between">
                <span>Min MCL Match</span>
                <span className="font-mono text-accent font-bold">{minMclMatch}+</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMclMatch}
                onChange={(e) => setMinMclMatch(e.target.value)}
                className="w-full accent-accent"
              />
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
                <Building2 className="h-4 w-4 text-accent" />
                <span>Companies ({total})</span>
              </CardTitle>

              {/* Sorting */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground hidden sm:inline">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    updateFilters({ sort: e.target.value });
                  }}
                  className="h-7 rounded border border-input bg-card px-2 text-xs font-medium focus:outline-none"
                >
                  <option value="mcl_match_score">MCL Match (High to Low)</option>
                  <option value="power_score">Power Score (High to Low)</option>
                  <option value="momentum_score">Momentum (High to Low)</option>
                  <option value="creative_score">Creative Score</option>
                  <option value="commercial_score">Commercial Score</option>
                  <option value="name">Company Name (A-Z)</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isPending ? (
                /* Loading State Skeletons */
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-secondary/60 animate-pulse rounded" />
                  ))}
                </div>
              ) : initialData.length === 0 ? (
                /* Empty State per PRD Section 24 */
                <div className="p-12 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No companies found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No production companies match your active filters. Try lowering score thresholds or clearing search parameters.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters} className="font-bold">
                    Clear All Filters
                  </Button>
                </div>
              ) : viewMode === "table" ? (
                /* Table View */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-mono uppercase text-[10px]">
                        <th className="p-3 font-semibold">Company</th>
                        <th className="p-3 font-semibold">Country</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold text-right">Power</th>
                        <th className="p-3 font-semibold text-right">Momentum</th>
                        <th className="p-3 font-semibold text-right">MCL Match</th>
                        <th className="p-3 font-semibold">Latest Activity / Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {initialData.map((co) => (
                        <tr key={co.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="p-3 font-bold text-foreground">
                            <Link href={`/companies/${co.slug}`} className="hover:text-accent hover:underline">
                              {co.name}
                            </Link>
                          </td>
                          <td className="p-3 font-mono">
                            {co.country_code} <span className="text-muted-foreground font-normal">({co.city || co.country_name})</span>
                          </td>
                          <td className="p-3 text-muted-foreground capitalize">
                            {co.categories?.[0] || co.company_type?.replace("_", " ") || "Film / TV"}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">{co.power_score || "N/A"}</td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                            {co.momentum_score || "N/A"}
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="accent" className="font-mono">
                              {co.mcl_match_score || "N/A"} Match
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground text-[11px] truncate max-w-[220px]">
                            {co.ai_summary || "Verified production company record."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Cards View */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {initialData.map((co) => (
                    <CompanyCard key={co.id} company={co} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border text-xs">
              <span className="text-muted-foreground">
                Showing Page <span className="font-bold text-foreground">{page}</span> of{" "}
                <span className="font-bold text-foreground">{totalPages}</span> ({total} Total Companies)
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
