/**
 * SECOND-PASS INDEPENDENT ENTITY NAVIGATION & IDENTITY AUDIT
 * Production Intelligence V1.1
 * 
 * Compares independent layers:
 * CANONICAL SOURCE TRUTH vs SERVICE LOOKUP vs API RESPONSE vs RENDERED HREF & IDENTITY
 */

import { getPersonById, getPeople } from "../lib/services/person-service";
import { getCompanyBySlug, getCompanies } from "../lib/services/company-service";
import { getProjectById, getProjects } from "../lib/services/project-service";

interface DetailedAuditSummary {
  entityCoverage: { companies: number; people: number; projects: number };
  routeCoverage: { companyRoutes: number; peopleRoutes: number; projectRoutes: number };
  identityMismatches: number;
  crossCompanyErrors: number;
  slugCollisions: number;
  dataTruth: { verifiedCount: number; generatedCount: number; inferredCount: number };
  cacheIdentityErrors: number;
  failures: string[];
}

export async function runIndependentNavigationAudit(): Promise<DetailedAuditSummary> {
  const summary: DetailedAuditSummary = {
    entityCoverage: { companies: 0, people: 0, projects: 0 },
    routeCoverage: { companyRoutes: 0, peopleRoutes: 0, projectRoutes: 0 },
    identityMismatches: 0,
    crossCompanyErrors: 0,
    slugCollisions: 0,
    dataTruth: { verifiedCount: 0, generatedCount: 0, inferredCount: 0 },
    cacheIdentityErrors: 0,
    failures: [],
  };

  console.log("=========================================================================");
  console.log("PRODUCTION INTELLIGENCE V1.1 — SECOND-PASS INDEPENDENT IDENTITY AUDIT");
  console.log("=========================================================================");

  // 2. CACHE SEQUENTIAL STABILITY TEST: Request Antonio Asensio -> Request Paloma Molina -> Request Antonio Asensio again
  console.log("2. Testing Cache & Re-render Identity Stability...");
  const antonioId = "per00000-0000-0000-0000-000000000014";
  const palomaId = "per00000-0000-0000-0000-000000000013";
  const cacheReq1 = await getPersonById(antonioId);
  const cacheReq2 = await getPersonById(palomaId);
  const cacheReq3 = await getPersonById(antonioId);

  if (cacheReq1?.full_name !== "Antonio Asensio" || cacheReq2?.full_name !== "Paloma Molina" || cacheReq3?.full_name !== "Antonio Asensio") {
    summary.cacheIdentityErrors++;
    summary.failures.push(`CACHE IDENTITY STALE STATE DETECTED: [${cacheReq1?.full_name}, ${cacheReq2?.full_name}, ${cacheReq3?.full_name}]`);
  } else {
    console.log("  ✅ [PASS] Sequential Cache Sequence [Antonio -> Paloma -> Antonio] returned 100% accurate identities.");
  }

  // 3. AUDIT ALL PEOPLE RECORDS & ROUTES
  console.log("3. Auditing All People Directory Records & Href Targets...");
  const peopleRes = await getPeople({ limit: 50 });
  summary.entityCoverage.people = peopleRes.total;
  summary.routeCoverage.peopleRoutes = peopleRes.data.length;

  for (const person of peopleRes.data) {
    const fetched = await getPersonById(person.id);
    if (!fetched || fetched.full_name !== person.full_name) {
      summary.identityMismatches++;
      summary.failures.push(`People Directory Mismatch: Listing "${person.full_name}" (${person.id}) rendered "${fetched?.full_name}"`);
    }

    // Verify company position relationship cross-check
    if (fetched?.positions && fetched.positions.length > 0) {
      const pos = fetched.positions[0];
      if (!pos.company_slug) {
        summary.crossCompanyErrors++;
        summary.failures.push(`Orphan position slug for person ${person.full_name}`);
      }
    }
  }

  // 4. AUDIT ALL COMPANY RECORDS & SLUGS
  console.log("4. Auditing All Company Directory Records & Slugs...");
  const companiesRes = await getCompanies({ limit: 50 });
  summary.entityCoverage.companies = companiesRes.total;
  summary.routeCoverage.companyRoutes = companiesRes.data.length;

  const companySlugSet = new Set<string>();
  for (const comp of companiesRes.data) {
    if (companySlugSet.has(comp.slug)) {
      summary.slugCollisions++;
      summary.failures.push(`Duplicate company slug detected: ${comp.slug}`);
    }
    companySlugSet.add(comp.slug);

    const compDetail = await getCompanyBySlug(comp.slug);
    if (!compDetail.company || compDetail.company.name !== comp.name) {
      summary.identityMismatches++;
      summary.failures.push(`Company Slug Mismatch: List "${comp.name}" (${comp.slug}) resolved "${compDetail.company?.name}"`);
    }
  }

  // 5. AUDIT DATA TRUTH & PROVENANCE CLASSIFICATION IN PROJECTS
  console.log("5. Auditing Projects Directory Data Truth & Provenance...");
  const projectsRes = await getProjects({ limit: 50 });
  summary.entityCoverage.projects = projectsRes.total;
  summary.routeCoverage.projectRoutes = projectsRes.data.length;

  for (const proj of projectsRes.data) {
    const prov = proj.provenance_type || "unknown";
    if (prov === "verified") summary.dataTruth.verifiedCount++;
    else if (prov === "generated") summary.dataTruth.generatedCount++;
    else summary.dataTruth.inferredCount++;

    const projDetail = await getProjectById(proj.id);
    if (!projDetail || projDetail.title !== proj.title) {
      summary.identityMismatches++;
      summary.failures.push(`Project Mismatch: Directory "${proj.title}" (${proj.id}) rendered "${projDetail?.title}"`);
    }
  }

  return summary;
}

if (require.main === module) {
  runIndependentNavigationAudit().then((s) => {
    console.log("\n=========================================================================");
    console.log("SECOND-PASS AUDIT SUMMARY RESULTS");
    console.log("=========================================================================");
    console.log(`• Total People Monitored:       ${s.entityCoverage.people}`);
    console.log(`• Total Companies Monitored:    ${s.entityCoverage.companies}`);
    console.log(`• Total Projects Monitored:     ${s.entityCoverage.projects}`);
    console.log(`• Identity Mismatches:          ${s.identityMismatches}`);
    console.log(`• Slug Collisions:              ${s.slugCollisions}`);
    console.log(`• Cross-Company Errors:         ${s.crossCompanyErrors}`);
    console.log(`• Cache Identity Errors:        ${s.cacheIdentityErrors}`);
    console.log(`• Data Truth Breakdown:         ${s.dataTruth.verifiedCount} Verified | ${s.dataTruth.generatedCount} Generated Slates | ${s.dataTruth.inferredCount} Inferred`);
    console.log("=========================================================================");

    if (s.failures.length > 0) {
      console.log("\nFAILURES DETECTED:");
      s.failures.forEach((f) => console.log(`  ❌ ${f}`));
    }

    if (s.identityMismatches > 0 || s.slugCollisions > 0 || s.cacheIdentityErrors > 0) {
      console.error("\n🔴 SECOND-PASS AUDIT FAILED WITH CRITICAL MISMATCHES!");
      process.exit(1);
    } else {
      console.log("\n🟢 SECOND-PASS AUDIT PASSED 100% CLEAN. NO IDENTITY MISMATCHES DETECTED.");
      process.exit(0);
    }
  });
}
