-- Daily verified company intake. A quota is a ceiling, never a reason to create synthetic data.

create table if not exists company_intake_candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  official_website_url text not null,
  normalized_domain text not null unique,
  discovery_source_url text not null,
  discovery_source_type text not null default 'MANUAL_RESEARCH',
  country_code text,
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'PROCESSING', 'ADMITTED', 'DUPLICATE', 'REJECTED', 'FAILED')),
  attempts integer not null default 0,
  last_error text,
  admitted_company_id uuid references companies(id) on delete set null,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_company_intake_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  status text not null default 'RUNNING' check (status in ('RUNNING', 'COMPLETED', 'FAILED')),
  quota integer not null default 2 check (quota between 1 and 2),
  candidates_checked integer not null default 0,
  companies_admitted integer not null default 0,
  duplicates_found integer not null default 0,
  candidates_rejected integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists company_intake_candidates_queue_idx
  on company_intake_candidates(status, created_at);
create index if not exists company_intake_candidates_company_idx
  on company_intake_candidates(admitted_company_id);

alter table company_intake_candidates enable row level security;
alter table daily_company_intake_runs enable row level security;

create policy "Authenticated users can read company intake candidates"
  on company_intake_candidates for select to authenticated using (true);
create policy "Authenticated users can read daily company intake runs"
  on daily_company_intake_runs for select to authenticated using (true);

-- Candidate creation and all state changes are server-side service-role operations.
