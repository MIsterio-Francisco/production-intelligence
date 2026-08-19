-- Production Intelligence Migration
-- Migration: 20260819000004_ingestion_pipeline.sql
-- Description: Create schema tables for data collection, provider adapters, raw ingestion records, entity resolution, dirty entity queue, and job locking

-- 1. Table: ingestion_jobs
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, COMPLETED, PARTIAL, FAILED, CANCELLED
  started_at timestamptz,
  completed_at timestamptz,
  records_fetched integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_summary text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Table: ingestion_records
CREATE TABLE IF NOT EXISTS ingestion_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES ingestion_jobs(id) ON DELETE SET NULL,
  provider_id text NOT NULL,
  external_id text,
  entity_type text NOT NULL,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  content_hash text NOT NULL,
  source_url text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_status text NOT NULL DEFAULT 'RAW', -- RAW, PROCESSED, SKIPPED, CONFLICT, FAILED
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Table: company_aliases
CREATE TABLE IF NOT EXISTS company_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  confidence integer NOT NULL DEFAULT 95,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, normalized_alias)
);

-- 4. Table: entity_candidates
CREATE TABLE IF NOT EXISTS entity_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  external_id text,
  provider_id text NOT NULL,
  candidate_name text NOT NULL,
  candidate_payload jsonb NOT NULL,
  match_status text NOT NULL DEFAULT 'NEW', -- NEW, MATCHED, REJECTED, REVIEW
  match_confidence integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Table: data_refresh_queue
CREATE TABLE IF NOT EXISTS data_refresh_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  priority text NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
  status text NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
  attempts integer DEFAULT 0,
  scheduled_for timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_provider ON ingestion_jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_records_hash ON ingestion_records(content_hash);
CREATE INDEX IF NOT EXISTS idx_records_status ON ingestion_records(processing_status);
CREATE INDEX IF NOT EXISTS idx_aliases_norm ON company_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_refresh_queue_status ON data_refresh_queue(status, priority);

-- 7. RLS Policies (Authenticated Read Only)
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_refresh_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read ingestion_jobs" ON ingestion_jobs;
CREATE POLICY "Authenticated read ingestion_jobs" ON ingestion_jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read ingestion_records" ON ingestion_records;
CREATE POLICY "Authenticated read ingestion_records" ON ingestion_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read company_aliases" ON company_aliases;
CREATE POLICY "Authenticated read company_aliases" ON company_aliases FOR SELECT TO authenticated USING (true);
