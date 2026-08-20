-- Production Intelligence V1.5.2 — Source Authenticity & Source Health Migration
-- Misterio Color Lab

-- 1. Extend market_sources with V1.5.2 authenticity & health columns
ALTER TABLE public.market_sources
ADD COLUMN IF NOT EXISTS expected_domain text,
ADD COLUMN IF NOT EXISTS authenticity_status text DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS fallback_sources text[],
ADD COLUMN IF NOT EXISTS entity_scope text,
ADD COLUMN IF NOT EXISTS consecutive_invalid_content integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_http_status integer,
ADD COLUMN IF NOT EXISTS last_error text,
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- 2. Create source_authenticity_audits table
CREATE TABLE IF NOT EXISTS public.source_authenticity_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL,
  url text NOT NULL,
  domain text NOT NULL,
  authenticity_status text NOT NULL,
  evidence_eligible boolean NOT NULL DEFAULT false,
  confidence integer NOT NULL DEFAULT 0,
  reasons jsonb DEFAULT '[]'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create discovered_sources table
CREATE TABLE IF NOT EXISTS public.discovered_sources (
  id text PRIMARY KEY,
  entity_id text,
  entity_name text NOT NULL,
  url text NOT NULL,
  domain text NOT NULL,
  suggested_tier text NOT NULL DEFAULT 'TIER_2_TRADE_PRESS',
  discovery_reason text NOT NULL,
  status text NOT NULL DEFAULT 'DISCOVERED_SOURCE',
  discovered_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

-- 4. Enable RLS
ALTER TABLE public.source_authenticity_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read source_authenticity_audits to authenticated"
ON public.source_authenticity_audits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read discovered_sources to authenticated"
ON public.discovered_sources FOR SELECT TO authenticated USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_source_auth_source_id ON public.source_authenticity_audits(source_id);
CREATE INDEX IF NOT EXISTS idx_source_auth_status ON public.source_authenticity_audits(authenticity_status);
CREATE INDEX IF NOT EXISTS idx_discovered_sources_status ON public.discovered_sources(status);
