-- Production Intelligence Migration
-- Migration: 20260819000006_phase8_real_data_launch.sql
-- Description: Schema additions for Phase 8 data quality score, is_demo flag, and provider observability

-- 1. Add data_quality_score and is_demo flag to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_quality_score integer DEFAULT 85;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- 2. Add data_quality_score to ingestion_records
ALTER TABLE ingestion_records ADD COLUMN IF NOT EXISTS data_quality_score integer DEFAULT 80;

-- 3. Indexes for Data Quality and Demo Filtering
CREATE INDEX IF NOT EXISTS idx_companies_quality ON companies(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_companies_is_demo ON companies(is_demo);
CREATE INDEX IF NOT EXISTS idx_records_quality ON ingestion_records(data_quality_score);

-- 4. Set demo flag for initial 25 seed companies
UPDATE companies SET is_demo = false WHERE is_demo IS NULL;
