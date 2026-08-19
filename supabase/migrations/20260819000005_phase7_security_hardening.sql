-- Production Intelligence Migration
-- Migration: 20260819000005_phase7_security_hardening.sql
-- Description: Phase 7 security audit and user isolation policies for saved companies, alerts, and system health

-- 1. Ensure user_saved_companies security policies
ALTER TABLE user_saved_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manage own saved companies" ON user_saved_companies;
CREATE POLICY "User manage own saved companies" ON user_saved_companies
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Ensure alerts security policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manage own alerts" ON alerts;
CREATE POLICY "User manage own alerts" ON alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Ensure candidate tables and queues are protected
ALTER TABLE entity_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_refresh_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read entity_candidates" ON entity_candidates;
CREATE POLICY "Authenticated read entity_candidates" ON entity_candidates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read data_refresh_queue" ON data_refresh_queue;
CREATE POLICY "Authenticated read data_refresh_queue" ON data_refresh_queue
  FOR SELECT TO authenticated USING (true);
