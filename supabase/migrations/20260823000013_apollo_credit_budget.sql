-- Apollo credit guard. Usage is an internal estimate per API request; Apollo remains authoritative.

create table if not exists apollo_budget_settings (
  id integer primary key check (id = 1),
  phase text not null check (phase in ('PROMO', 'STANDARD')),
  promo_started_at timestamptz not null,
  promo_expires_at timestamptz not null,
  promo_credit_limit integer not null check (promo_credit_limit > 0),
  promo_daily_limit integer not null check (promo_daily_limit > 0),
  standard_monthly_limit integer not null check (standard_monthly_limit > 0),
  standard_daily_limit integer not null check (standard_daily_limit > 0),
  updated_at timestamptz not null default now()
);

insert into apollo_budget_settings (
  id, phase, promo_started_at, promo_expires_at, promo_credit_limit,
  promo_daily_limit, standard_monthly_limit, standard_daily_limit
) values (
  1, 'PROMO', '2026-08-23T00:00:00+02:00', '2026-09-22T00:00:00+02:00', 336, 12, 75, 3
) on conflict (id) do nothing;

create table if not exists apollo_usage_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  person_id uuid references people(id) on delete set null,
  phase text not null check (phase in ('PROMO', 'STANDARD')),
  estimated_credits integer not null default 1 check (estimated_credits > 0),
  status text not null default 'RESERVED'
    check (status in ('RESERVED', 'MATCHED', 'NO_MATCH', 'FAILED')),
  provider_record_id text,
  error_code text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists apollo_usage_requested_idx on apollo_usage_log(requested_at desc);
create index if not exists apollo_usage_company_idx on apollo_usage_log(company_id, requested_at desc);

alter table apollo_budget_settings enable row level security;
alter table apollo_usage_log enable row level security;
create policy "Authenticated users can read Apollo budget" on apollo_budget_settings
  for select to authenticated using (true);
create policy "Authenticated users can read Apollo usage" on apollo_usage_log
  for select to authenticated using (true);

create or replace function refresh_apollo_budget_phase()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare current_phase text;
begin
  update apollo_budget_settings
  set phase = case when now() >= promo_expires_at then 'STANDARD' else 'PROMO' end,
      updated_at = now()
  where id = 1
  returning phase into current_phase;
  return current_phase;
end;
$$;

create or replace function reserve_apollo_credit(p_company_id uuid, p_person_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  settings apollo_budget_settings%rowtype;
  today_used integer;
  period_used integer;
  usage_id uuid;
begin
  perform refresh_apollo_budget_phase();
  select * into settings from apollo_budget_settings where id = 1 for update;

  select coalesce(sum(estimated_credits), 0)::integer into today_used
  from apollo_usage_log
  where requested_at >= date_trunc('day', now());

  if settings.phase = 'PROMO' then
    select coalesce(sum(estimated_credits), 0)::integer into period_used
    from apollo_usage_log where requested_at >= settings.promo_started_at and requested_at < settings.promo_expires_at;
    if today_used >= settings.promo_daily_limit or period_used >= settings.promo_credit_limit then return null; end if;
  else
    select coalesce(sum(estimated_credits), 0)::integer into period_used
    from apollo_usage_log where requested_at >= date_trunc('month', now());
    if today_used >= settings.standard_daily_limit or period_used >= settings.standard_monthly_limit then return null; end if;
  end if;

  insert into apollo_usage_log(company_id, person_id, phase)
  values (p_company_id, p_person_id, settings.phase)
  returning id into usage_id;
  return usage_id;
end;
$$;

revoke all on function reserve_apollo_credit(uuid, uuid) from public, anon, authenticated;
revoke all on function refresh_apollo_budget_phase() from public, anon, authenticated;
grant execute on function reserve_apollo_credit(uuid, uuid) to service_role;
grant execute on function refresh_apollo_budget_phase() to service_role;
