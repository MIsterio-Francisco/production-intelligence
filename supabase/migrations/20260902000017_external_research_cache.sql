create table if not exists external_research_cache (
  query_key text primary key,
  query_text text not null,
  country_code text,
  results jsonb not null default '[]'::jsonb,
  diagnostics jsonb not null default '{}'::jsonb,
  tavily_credits integer not null default 1 check (tavily_credits >= 0),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists external_research_cache_expires_idx
  on external_research_cache(expires_at);

alter table external_research_cache enable row level security;

drop policy if exists "Authenticated users can read research cache" on external_research_cache;
create policy "Authenticated users can read research cache"
  on external_research_cache for select to authenticated using (true);

comment on table external_research_cache is
  'Persists paid Tavily search results so identical research can be reused without spending another credit.';
