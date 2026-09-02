import { NextResponse } from "next/server";
import { isAuthenticatedUser } from "@/lib/security/internal-auth";
import { researchExternalCompanies } from "@/lib/research/free-company-research";
import { readExternalResearchCache, saveExternalResearchCache } from "@/lib/research/external-research-cache";

export async function GET(request: Request) {
  if (!(await isAuthenticatedUser())) {
    return NextResponse.json({ data: null, error: "Authentication required." }, { status: 401 });
  }
  const url = new URL(request.url);
  try {
    const query = url.searchParams.get("q") || "";
    const country = url.searchParams.get("country") || undefined;
    try {
      const cached = await readExternalResearchCache(query, country);
      if (cached) return NextResponse.json({ data: cached.results, diagnostics: cached.diagnostics, error: null });
    } catch {
      // The search remains available while the cache migration is being deployed.
    }
    const research = await researchExternalCompanies(
      query,
      country
    );
    if (research.diagnostics.tavilyStatus === "OK") {
      try {
        await saveExternalResearchCache(query, country, research.results, research.diagnostics);
      } catch {
        return NextResponse.json({
          data: research.results,
          diagnostics: research.diagnostics,
          error: "Tavily consumió la consulta, pero no se pudo guardar el resultado. Aplica la migración external_research_cache antes de continuar.",
        }, { status: 503 });
      }
    }
    return NextResponse.json({ data: research.results, diagnostics: research.diagnostics, error: null });
  } catch (error) {
    return NextResponse.json({
      data: null,
      error: error instanceof Error ? error.message : "External research failed.",
    }, { status: 502 });
  }
}
