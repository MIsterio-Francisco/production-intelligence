/**
 * INDEPENDENT CANONICAL IDENTITY & NAVIGATION AUDIT SUITE
 * Production Intelligence V1.1
 * 
 * Independent audit checking:
 * 1. ID Uniqueness & Collision Detection
 * 2. Company -> Person -> Detail Navigation Fidelity
 * 3. Person -> Company Bidirectional Consistency
 * 4. Provenance Label Truth (No synthetic data marked verified)
 * 5. Zero Fabrication (No missing ID returns fake person)
 */

import { getFallbackPeople, getFallbackPersonById } from "../lib/services/person-service";
import { getFallbackCompanies, getFallbackCompanyBySlug } from "../lib/services/company-service";
import { getFallbackProjects, getFallbackProjectById } from "../lib/services/project-service";

interface Failure {
  code: string;
  description: string;
  expected: string;
  actual: string;
}

interface AuditReport {
  passed: boolean;
  totalChecks: number;
  failures: Failure[];
  metrics: {
    totalPeopleAudited: number;
    totalCompaniesAudited: number;
    totalProjectsAudited: number;
    totalCompanyPersonLinksAudited: number;
    collisionsDetected: number;
    identityMismatches: number;
    syntheticMarkedVerified: number;
    unresolvedPersonLinks: number;
  };
}

export function runCanonicalIdentityAudit(): AuditReport {
  const failures: Failure[] = [];
  let totalChecks = 0;

  const metrics = {
    totalPeopleAudited: 0,
    totalCompaniesAudited: 0,
    totalProjectsAudited: 0,
    totalCompanyPersonLinksAudited: 0,
    collisionsDetected: 0,
    identityMismatches: 0,
    syntheticMarkedVerified: 0,
    unresolvedPersonLinks: 0,
  };

  // 1. AUDIT PEOPLE DIRECTORY & CANONICAL RESOLUTION
  const peoplePage = getFallbackPeople({}, 1, 100);
  metrics.totalPeopleAudited = peoplePage.data.length;

  const personIdMap = new Map<string, string>(); // ID -> Name

  for (const person of peoplePage.data) {
    totalChecks++;
    // Check ID Uniqueness
    if (personIdMap.has(person.id)) {
      metrics.collisionsDetected++;
      failures.push({
        code: "ID_COLLISION",
        description: `Duplicate person ID in directory: ${person.id}`,
        expected: "Unique ID",
        actual: `Collision between "${personIdMap.get(person.id)}" and "${person.full_name}"`,
      });
    }
    personIdMap.set(person.id, person.full_name);

    // Check Resolution Match
    totalChecks++;
    const resolved = getFallbackPersonById(person.id);
    if (!resolved) {
      metrics.unresolvedPersonLinks++;
      failures.push({
        code: "UNRESOLVED_PERSON",
        description: `Person in directory could not be resolved by ID: ${person.id}`,
        expected: person.full_name,
        actual: "null",
      });
    } else if (resolved.full_name !== person.full_name) {
      metrics.identityMismatches++;
      failures.push({
        code: "DIRECTORY_IDENTITY_MISMATCH",
        description: `Person directory listing vs detail mismatch for ID ${person.id}`,
        expected: person.full_name,
        actual: resolved.full_name,
      });
    }

    // Check Provenance Label
    totalChecks++;
    if (person.provenance_type === "verified") {
      // Synthetic data check
      if (person.id.startsWith("per_gen_") || person.id.startsWith("per_dyn_")) {
        metrics.syntheticMarkedVerified++;
        failures.push({
          code: "PROVENANCE_FRAUD",
          description: `Synthetic person marked as verified: ${person.id} (${person.full_name})`,
          expected: "synthetic / generated",
          actual: "verified",
        });
      }
    }
  }

  // 2. AUDIT COMPANY ROSTER -> PERSON DETAIL NAVIGATION
  const companiesPage = getFallbackCompanies({}, 1, 100);
  metrics.totalCompaniesAudited = companiesPage.data.length;

  for (const companySummary of companiesPage.data) {
    totalChecks++;
    const companyDetail = getFallbackCompanyBySlug(companySummary.slug);
    if (!companyDetail.company) {
      failures.push({
        code: "UNRESOLVED_COMPANY",
        description: `Company in directory could not be resolved by slug: ${companySummary.slug}`,
        expected: companySummary.name,
        actual: "null",
      });
      continue;
    }

    // Audit Company People Roster Links
    for (const personLink of companyDetail.people) {
      metrics.totalCompanyPersonLinksAudited++;
      totalChecks++;

      const targetPerson = getFallbackPersonById(personLink.id);
      if (!targetPerson) {
        metrics.unresolvedPersonLinks++;
        failures.push({
          code: "ORPHAN_COMPANY_PERSON_LINK",
          description: `Company "${companyDetail.company.name}" links to person ID "${personLink.id}" (${personLink.full_name}) which cannot be resolved`,
          expected: personLink.full_name,
          actual: "null (Unresolved / Fabrication)",
        });
      } else if (targetPerson.full_name !== personLink.full_name) {
        metrics.identityMismatches++;
        failures.push({
          code: "COMPANY_PERSON_NAV_MISMATCH",
          description: `Clicking "${personLink.full_name}" (ID ${personLink.id}) from company "${companyDetail.company.name}" page opened wrong person "${targetPerson.full_name}"`,
          expected: personLink.full_name,
          actual: targetPerson.full_name,
        });
      }
    }
  }

  // 3. AUDIT BIDIRECTIONAL PERSON -> COMPANY
  for (const person of peoplePage.data) {
    if (person.positions && person.positions.length > 0) {
      for (const pos of person.positions) {
        if (!pos.company_slug) continue;
        totalChecks++;
        const companyDetail = getFallbackCompanyBySlug(pos.company_slug);
        if (!companyDetail.company) {
          failures.push({
            code: "ORPHAN_POSITION_COMPANY_SLUG",
            description: `Person "${person.full_name}" position lists company_slug "${pos.company_slug}" which does not exist`,
            expected: pos.company_name,
            actual: "null",
          });
        }
      }
    }
  }

  // 4. AUDIT NON-EXISTENT ID RESOLUTION (ZERO FABRICATION)
  totalChecks++;
  const fakePerson = getFallbackPersonById("per_non_existent_1234567890");
  if (fakePerson !== null) {
    failures.push({
      code: "FABRICATION_DETECTED",
      description: "Non-existent person ID returned a fabricated person instead of null",
      expected: "null",
      actual: fakePerson.full_name,
    });
  }

  // 5. AUDIT PROJECTS PROVENANCE & RESOLUTION
  const projectsPage = getFallbackProjects({}, 1, 100);
  metrics.totalProjectsAudited = projectsPage.data.length;

  for (const proj of projectsPage.data) {
    totalChecks++;
    const resolvedProj = getFallbackProjectById(proj.id);
    if (!resolvedProj || resolvedProj.title !== proj.title) {
      metrics.identityMismatches++;
      failures.push({
        code: "PROJECT_IDENTITY_MISMATCH",
        description: `Project directory "${proj.title}" (${proj.id}) mismatch vs detail "${resolvedProj?.title}"`,
        expected: proj.title,
        actual: resolvedProj?.title || "null",
      });
    }

    totalChecks++;
    if (proj.provenance_type === "verified" && (proj.id.startsWith("p_gen_") || proj.id.startsWith("p_dyn_"))) {
      metrics.syntheticMarkedVerified++;
      failures.push({
        code: "PROVENANCE_FRAUD_PROJECT",
        description: `Synthetic project marked as verified: ${proj.id} (${proj.title})`,
        expected: "synthetic / generated",
        actual: "verified",
      });
    }
  }

  return {
    passed: failures.length === 0,
    totalChecks,
    failures,
    metrics,
  };
}

if (require.main === module) {
  console.log("=========================================================================");
  console.log("PRODUCTION INTELLIGENCE V1.1 — CANONICAL IDENTITY AUDIT SUITE");
  console.log("=========================================================================");

  const report = runCanonicalIdentityAudit();

  console.log(`Total Checks Executed:              ${report.totalChecks}`);
  console.log(`Total People Audited:              ${report.metrics.totalPeopleAudited}`);
  console.log(`Total Companies Audited:           ${report.metrics.totalCompaniesAudited}`);
  console.log(`Total Projects Audited:            ${report.metrics.totalProjectsAudited}`);
  console.log(`Total Company-Person Links:        ${report.metrics.totalCompanyPersonLinksAudited}`);
  console.log(`ID Collisions Detected:            ${report.metrics.collisionsDetected}`);
  console.log(`Identity Mismatches:               ${report.metrics.identityMismatches}`);
  console.log(`Unresolved Person Links:           ${report.metrics.unresolvedPersonLinks}`);
  console.log(`Synthetic Marked Verified:         ${report.metrics.syntheticMarkedVerified}`);
  console.log("=========================================================================");

  if (report.failures.length > 0) {
    console.error("\nFAILURES DETECTED:");
    report.failures.forEach((f, idx) => {
      console.error(`\n[Failure ${idx + 1}] Code: ${f.code}`);
      console.error(`Description: ${f.description}`);
      console.error(`Expected: ${f.expected}`);
      console.error(`Actual:   ${f.actual}`);
    });
    console.error("\n🔴 AUDIT VERDICT: RED — NOT PRODUCTION SAFE");
    process.exit(1);
  } else {
    console.log("\n🟢 AUDIT VERDICT: GREEN — 100% CANONICAL IDENTITY PASSED");
    process.exit(0);
  }
}
