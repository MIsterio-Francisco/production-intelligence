-- Production Intelligence Migration
-- Migration: 20260819000001_fix_rls_authenticated_only.sql
-- Description: Restrict intelligence data read access to authenticated users only per PRD Section 8

-- Drop permissive public read policies
DROP POLICY IF EXISTS "Allow read access to companies" ON companies;
DROP POLICY IF EXISTS "Allow read access to company_categories" ON company_categories;
DROP POLICY IF EXISTS "Allow read access to social_profiles" ON social_profiles;
DROP POLICY IF EXISTS "Allow read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow read access to company_projects" ON company_projects;
DROP POLICY IF EXISTS "Allow read access to people" ON people;
DROP POLICY IF EXISTS "Allow read access to company_people" ON company_people;
DROP POLICY IF EXISTS "Allow read access to awards" ON awards;
DROP POLICY IF EXISTS "Allow read access to sources" ON sources;
DROP POLICY IF EXISTS "Allow read access to company_events" ON company_events;
DROP POLICY IF EXISTS "Allow read access to company_scores" ON company_scores;

-- Create authenticated-only read policies
CREATE POLICY "Authenticated read access to companies" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to company_categories" ON company_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to social_profiles" ON social_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to projects" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to company_projects" ON company_projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to people" ON people
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to company_people" ON company_people
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to awards" ON awards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to sources" ON sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to company_events" ON company_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to company_scores" ON company_scores
  FOR SELECT TO authenticated USING (true);
