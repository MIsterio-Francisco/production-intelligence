-- Production Intelligence Migration
-- Migration: 20260819000002_intelligence_graph_schema.sql
-- Description: Enhance schema for Intelligence Graph relationships (projects, people, awards, sources, provenance)

-- 1. Add provenance fields to core tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS provenance_type text DEFAULT 'verified';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS data_classification text DEFAULT 'VERIFIED_FACT';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_title text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS writers text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS language text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS provenance_type text DEFAULT 'verified';

ALTER TABLE people ADD COLUMN IF NOT EXISTS provenance_type text DEFAULT 'verified';

ALTER TABLE awards ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE awards ADD COLUMN IF NOT EXISTS provenance_type text DEFAULT 'verified';

ALTER TABLE company_events ADD COLUMN IF NOT EXISTS provenance_type text DEFAULT 'verified';

-- 2. Performance indexes for Phase 3 graph traversals
CREATE INDEX IF NOT EXISTS idx_awards_company ON awards(company_id);
CREATE INDEX IF NOT EXISTS idx_awards_project ON awards(project_id);
CREATE INDEX IF NOT EXISTS idx_awards_person ON awards(person_id);
CREATE INDEX IF NOT EXISTS idx_projects_release ON projects(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_people_role ON company_people(role);
CREATE INDEX IF NOT EXISTS idx_people_seniority ON company_people(seniority);
CREATE INDEX IF NOT EXISTS idx_people_current ON company_people(is_current);

-- 3. Ensure RLS on awards table for authenticated users
DROP POLICY IF EXISTS "Allow read access to awards" ON awards;
CREATE POLICY "Authenticated read access to awards" ON awards
  FOR SELECT TO authenticated USING (true);
