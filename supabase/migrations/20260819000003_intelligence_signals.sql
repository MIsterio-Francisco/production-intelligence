-- Production Intelligence Migration
-- Migration: 20260819000003_intelligence_signals.sql
-- Description: Create tables for intelligence signals, AI commercial briefs, and user alerts

-- 1. Table: intelligence_signals
CREATE TABLE IF NOT EXISTS intelligence_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
  signal_score integer NOT NULL DEFAULT 50, -- 0 - 100
  confidence integer NOT NULL DEFAULT 90, -- 0 - 100
  status text NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, DISMISSED, EXPIRED
  signal_title text NOT NULL,
  signal_description text,
  signal_date timestamptz NOT NULL DEFAULT now(),
  detected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  dedupe_key text UNIQUE,
  evidence jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Table: ai_company_briefs
CREATE TABLE IF NOT EXISTS ai_company_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brief_type text NOT NULL DEFAULT 'COMMERCIAL_BRIEF',
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_version text NOT NULL DEFAULT 'v1.0',
  content jsonb NOT NULL,
  source_snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- 3. Table: user_alert_notifications
CREATE TABLE IF NOT EXISTS user_alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_id uuid NOT NULL REFERENCES intelligence_signals(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES alerts(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_signals_company ON intelligence_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_signals_status ON intelligence_signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_score ON intelligence_signals(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_date ON intelligence_signals(signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_briefs_company ON ai_company_briefs(company_id);
CREATE INDEX IF NOT EXISTS idx_user_alert_notifs ON user_alert_notifications(user_id, is_read);

-- 5. RLS Policies (Authenticated Only)
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_company_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read intelligence_signals" ON intelligence_signals;
CREATE POLICY "Authenticated read intelligence_signals" ON intelligence_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read ai_company_briefs" ON ai_company_briefs;
CREATE POLICY "Authenticated read ai_company_briefs" ON ai_company_briefs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "User read own alert notifications" ON user_alert_notifications;
CREATE POLICY "User read own alert notifications" ON user_alert_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
