-- Production Intelligence Database Schema Migration V1.1
-- Migration: 20260819000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- 1. companies
--------------------------------------------------
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  slug text UNIQUE NOT NULL,

  legal_name text,
  description text,

  company_type text,

  founded_year integer,

  website_url text,

  country_code text,
  country_name text,
  city text,
  region text,

  employee_count_min integer,
  employee_count_max integer,

  is_active boolean DEFAULT true,

  power_score numeric(5,2),
  creative_score numeric(5,2),
  commercial_score numeric(5,2),
  momentum_score numeric(5,2),
  international_score numeric(5,2),
  social_score numeric(5,2),
  mcl_match_score numeric(5,2),

  score_confidence numeric(5,2),

  ai_summary text,
  ai_opportunity_summary text,

  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 2. company_categories
--------------------------------------------------
CREATE TABLE company_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  category text NOT NULL,

  created_at timestamptz DEFAULT now(),

  UNIQUE(company_id, category)
);

--------------------------------------------------
-- 3. social_profiles
--------------------------------------------------
CREATE TABLE social_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  platform text NOT NULL,

  profile_url text,
  username text,

  follower_count integer,
  following_count integer,

  engagement_rate numeric(8,4),

  posts_last_30_days integer,

  estimated_growth_30d numeric(8,4),
  estimated_growth_90d numeric(8,4),

  last_post_at timestamptz,

  last_verified_at timestamptz,

  raw_data jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, platform)
);

--------------------------------------------------
-- 4. projects
--------------------------------------------------
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,
  slug text,

  project_type text,

  status text,

  release_date date,

  country_code text,

  genre text[],

  budget_min numeric,
  budget_max numeric,
  budget_currency text,

  director_name text,

  distributor text,

  streaming_platform text,

  description text,

  source_id uuid,

  announced_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 5. company_projects
--------------------------------------------------
CREATE TABLE company_projects (
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,

  role text,

  PRIMARY KEY(company_id, project_id)
);

--------------------------------------------------
-- 6. people
--------------------------------------------------
CREATE TABLE people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name text NOT NULL,

  first_name text,
  last_name text,

  job_title text,

  linkedin_url text,
  website_url text,

  country_code text,
  city text,

  bio text,

  profile_confidence numeric(5,2),

  ai_summary text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 7. company_people
--------------------------------------------------
CREATE TABLE company_people (
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,

  role text,
  seniority text,

  is_current boolean DEFAULT true,

  started_at date,
  ended_at date,

  confidence numeric(5,2),

  PRIMARY KEY(company_id, person_id, role)
);

--------------------------------------------------
-- 8. awards
--------------------------------------------------
CREATE TABLE awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  organization text,

  year integer,

  category text,

  project_id uuid REFERENCES projects(id),
  company_id uuid REFERENCES companies(id),

  result text,

  source_id uuid,

  created_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 9. sources
--------------------------------------------------
CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source_type text NOT NULL,

  source_name text,

  url text,

  title text,

  publisher text,

  published_at timestamptz,

  accessed_at timestamptz DEFAULT now(),

  credibility_score numeric(5,2),

  raw_content text,

  metadata jsonb
);

-- Foreign key link for projects.source_id and awards.source_id
ALTER TABLE projects ADD CONSTRAINT fk_projects_source FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL;
ALTER TABLE awards ADD CONSTRAINT fk_awards_source FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL;

--------------------------------------------------
-- 10. company_events
--------------------------------------------------
CREATE TABLE company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  event_type text NOT NULL,

  title text,

  description text,

  importance_score numeric(5,2),

  opportunity_score numeric(5,2),

  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,

  event_date timestamptz,

  created_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 11. company_scores
--------------------------------------------------
CREATE TABLE company_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  power_score numeric(5,2),
  creative_score numeric(5,2),
  commercial_score numeric(5,2),
  momentum_score numeric(5,2),
  international_score numeric(5,2),
  social_score numeric(5,2),
  mcl_match_score numeric(5,2),

  score_version text DEFAULT 'v1',

  score_breakdown jsonb,

  calculated_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 12. alerts
--------------------------------------------------
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,

  filters jsonb NOT NULL,

  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now()
);

--------------------------------------------------
-- 13. user_saved_companies
--------------------------------------------------
CREATE TABLE user_saved_companies (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  notes text,

  status text DEFAULT 'new',

  created_at timestamptz DEFAULT now(),

  PRIMARY KEY(user_id, company_id)
);

--------------------------------------------------
-- INDEXES
--------------------------------------------------
CREATE INDEX idx_companies_power ON companies(power_score DESC);
CREATE INDEX idx_companies_mcl ON companies(mcl_match_score DESC);
CREATE INDEX idx_companies_momentum ON companies(momentum_score DESC);
CREATE INDEX idx_companies_creative ON companies(creative_score DESC);
CREATE INDEX idx_companies_commercial ON companies(commercial_score DESC);
CREATE INDEX idx_companies_country ON companies(country_code);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_type ON companies(company_type);

CREATE INDEX idx_company_categories_company_id ON company_categories(company_id);
CREATE INDEX idx_company_categories_category ON company_categories(category);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_title ON projects(title);
CREATE INDEX idx_projects_type ON projects(project_type);

CREATE INDEX idx_events_date ON company_events(event_date DESC);
CREATE INDEX idx_events_company_id ON company_events(company_id);
CREATE INDEX idx_events_type ON company_events(event_type);

CREATE INDEX idx_people_name ON people(full_name);
CREATE INDEX idx_company_people_company_id ON company_people(company_id);
CREATE INDEX idx_company_people_person_id ON company_people(person_id);

CREATE INDEX idx_company_scores_company_id ON company_scores(company_id, calculated_at DESC);
CREATE INDEX idx_user_saved_companies_user_id ON user_saved_companies(user_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);

--------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_companies ENABLE ROW LEVEL SECURITY;

-- Public read access for intelligence data (authenticated & anon users can query)
CREATE POLICY "Allow read access to companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow read access to company_categories" ON company_categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to social_profiles" ON social_profiles FOR SELECT USING (true);
CREATE POLICY "Allow read access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow read access to company_projects" ON company_projects FOR SELECT USING (true);
CREATE POLICY "Allow read access to people" ON people FOR SELECT USING (true);
CREATE POLICY "Allow read access to company_people" ON company_people FOR SELECT USING (true);
CREATE POLICY "Allow read access to awards" ON awards FOR SELECT USING (true);
CREATE POLICY "Allow read access to sources" ON sources FOR SELECT USING (true);
CREATE POLICY "Allow read access to company_events" ON company_events FOR SELECT USING (true);
CREATE POLICY "Allow read access to company_scores" ON company_scores FOR SELECT USING (true);

-- User isolated access for alerts
CREATE POLICY "Users can manage their own alerts" ON alerts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User isolated access for saved companies
CREATE POLICY "Users can manage their saved companies" ON user_saved_companies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
