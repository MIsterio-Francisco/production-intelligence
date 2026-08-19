import { ProviderRegistry } from "./registry";
import { normalizeRawPayload } from "./normalizer";
import { resolveCompanyEntity } from "./entity-resolution";
import { buildProvenanceMetadata } from "./provenance";
import { IngestionRunResult } from "./types";
import { createClient } from "../supabase/server";
import { calculateAndPersistCompanyScores } from "../services/scoring-service";
import { runSignalDetectionForCompany } from "../services/signal-service";

export async function runIngestionPipeline(
  providerId: string,
  limit: number = 10
): Promise<IngestionRunResult> {
  const provider = ProviderRegistry.get(providerId);

  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  const result: IngestionRunResult = {
    jobId: "",
    providerId,
    recordsFetched: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    affectedCompanyIds: [],
    status: "COMPLETED",
    errors: [],
  };

  try {
    const supabase = await createClient();

    // 1. Create Job Record
    const { data: job } = await (supabase.from("ingestion_jobs") as any).insert({
      provider_id: providerId,
      job_type: provider.config.provider_type,
      status: "RUNNING",
      started_at: new Date().toISOString(),
    }).select().single();

    result.jobId = job?.id || "job_mock_id";

    // 2. Fetch Existing Companies for Entity Resolution
    const { data: existingCompanies } = await supabase.from("companies").select("id, name, website_url, country_code");
    const formattedCandidates = (existingCompanies || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      website_url: c.website_url,
      country_code: c.country_code,
    }));

    // 3. Fetch Raw Records
    const rawRecords = await provider.fetchRawRecords(limit);
    result.recordsFetched = rawRecords.length;

    // 4. Process Each Record
    for (const raw of rawRecords) {
      try {
        const normalized = normalizeRawPayload(raw, provider.config.source_tier);

        // Check if content hash is unchanged
        const { data: existingRecord } = await (supabase.from("ingestion_records") as any)
          .select("content_hash")
          .eq("content_hash", normalized.content_hash)
          .limit(1)
          .single();

        if (existingRecord) {
          result.recordsSkipped++;
          continue;
        }

        // Entity Resolution
        const resolution = resolveCompanyEntity(
          normalized.data.name,
          normalized.data.website_url,
          formattedCandidates
        );

        let companyId = resolution.matchedId;

        // Persist ingestion record
        await (supabase.from("ingestion_records") as any).insert({
          job_id: result.jobId,
          provider_id: providerId,
          external_id: raw.external_id,
          entity_type: raw.entity_type,
          raw_payload: raw as any,
          normalized_payload: normalized as any,
          content_hash: normalized.content_hash,
          source_url: raw.source_url,
          published_at: raw.published_at,
          processing_status: resolution.status === "MATCHED" ? "PROCESSED" : "RAW",
        });

        if (companyId) {
          if (!result.affectedCompanyIds.includes(companyId)) {
            result.affectedCompanyIds.push(companyId);
          }

          // Queue company in data_refresh_queue
          await (supabase.from("data_refresh_queue") as any).insert({
            entity_type: "company",
            entity_id: companyId,
            reason: `New ingested payload from provider ${providerId}`,
            priority: "HIGH",
            status: "PENDING",
          });

          // Trigger Score & Signal Updates for Affected Company
          await calculateAndPersistCompanyScores(companyId);
          await runSignalDetectionForCompany(companyId);

          result.recordsUpdated++;
        } else {
          result.recordsCreated++;
        }
      } catch (err: any) {
        result.recordsFailed++;
        result.errors.push(`Record ${raw.external_id} failed: ${err.message}`);
      }
    }

    // 5. Complete Job Record
    await (supabase.from("ingestion_jobs") as any).update({
      status: result.recordsFailed > 0 ? "PARTIAL" : "COMPLETED",
      completed_at: new Date().toISOString(),
      records_fetched: result.recordsFetched,
      records_created: result.recordsCreated,
      records_updated: result.recordsUpdated,
      records_skipped: result.recordsSkipped,
      records_failed: result.recordsFailed,
    }).eq("id", result.jobId);

    return result;
  } catch (err: any) {
    result.status = "FAILED";
    result.errors.push(err.message);
    return result;
  }
}
