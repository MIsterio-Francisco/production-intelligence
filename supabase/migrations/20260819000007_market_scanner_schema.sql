-- Production Intelligence Migration V1.5
-- Migration: 20260819000007_market_scanner_schema.sql
-- Description: Create schema tables for Market Sources, Raw Signals, Project Events, Person Events, What Changed Feed, and Market Scan Logs

-- 1. Table: market_sources
CREATE TABLE IF NOT EXISTS market_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  source_tier text NOT NULL DEFAULT 'TIER_2_TRADE_PRESS',
  source_type text NOT NULL,
  enabled boolean DEFAULT true,
  scan_frequency text NOT NULL DEFAULT 'STANDARD',
  reliability_score integer DEFAULT 90,
  rate_limit_per_min integer DEFAULT 60,
  last_scanned_at timestamptz,
  next_scan_at timestamptz,
  last_etag text,
  last_modified text,
  status text NOT NULL DEFAULT 'CONNECTED',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Table: raw_signals
CREATE TABLE IF NOT EXISTS raw_signals (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES market_sources(id) ON DELETE CASCADE,
  url text,
  title text NOT NULL,
  content_summary text,
  published_at timestamptz NOT NULL,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  fingerprint text NOT NULL UNIQUE,
  source_tier text NOT NULL,
  entity_name text,
  project_title text,
  person_name text,
  role_title text,
  proposed_status text,
  status text NOT NULL DEFAULT 'NEW',
  error_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Table: project_events
CREATE TABLE IF NOT EXISTS project_events (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  published_at timestamptz,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  url text,
  source_tier text NOT NULL,
  confidence text NOT NULL DEFAULT 'HIGH',
  is_evidence_based boolean NOT NULL DEFAULT true,
  claim text NOT NULL,
  previous_state text,
  resulting_state text,
  status text NOT NULL DEFAULT 'VERIFIED',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Table: person_events
CREATE TABLE IF NOT EXISTS person_events (
  id text PRIMARY KEY,
  person_id text,
  person_name text NOT NULL,
  company_name text NOT NULL,
  event_type text NOT NULL,
  previous_role text,
  new_role text,
  event_date timestamptz NOT NULL,
  source text NOT NULL,
  source_tier text NOT NULL,
  confidence text NOT NULL DEFAULT 'HIGH',
  is_evidence_based boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'VERIFIED',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Table: what_changed_entries
CREATE TABLE IF NOT EXISTS what_changed_entries (
  id text PRIMARY KEY,
  change_type text NOT NULL,
  entity_id text NOT NULL,
  entity_type text NOT NULL,
  entity_name text NOT NULL,
  company_name text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  source_name text NOT NULL,
  source_tier text NOT NULL,
  previous_value text,
  new_value text,
  fact_summary text NOT NULL,
  commercial_impact text NOT NULL,
  sales_readiness_before text,
  sales_readiness_after text,
  is_evidence_based boolean NOT NULL DEFAULT true,
  priority text NOT NULL DEFAULT 'MEDIUM',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Table: market_scan_runs
CREATE TABLE IF NOT EXISTS market_scan_runs (
  id text PRIMARY KEY,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NOT NULL,
  mode text NOT NULL DEFAULT 'RECENTLY_SCANNED',
  sources_scanned integer DEFAULT 0,
  documents_found integer DEFAULT 0,
  new_signals integer DEFAULT 0,
  duplicate_signals integer DEFAULT 0,
  claims_extracted integer DEFAULT 0,
  claims_verified integer DEFAULT 0,
  events_detected integer DEFAULT 0,
  conflicts_detected integer DEFAULT 0,
  opportunities_changed integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_signals_fp ON raw_signals(fingerprint);
CREATE INDEX IF NOT EXISTS idx_signals_status ON raw_signals(status);
CREATE INDEX IF NOT EXISTS idx_proj_events_proj ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_what_changed_prio ON what_changed_entries(priority, detected_at);

-- 8. RLS
ALTER TABLE market_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_changed_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read market_sources" ON market_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read raw_signals" ON raw_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read project_events" ON project_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read person_events" ON person_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read what_changed_entries" ON what_changed_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read market_scan_runs" ON market_scan_runs FOR SELECT TO authenticated USING (true);
