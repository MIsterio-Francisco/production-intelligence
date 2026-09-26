-- Separate discovery hints from verified company facts.

alter table company_intake_candidates
  add column if not exists website_verification text not null default 'SEARCH_CANDIDATE'
    check (website_verification in ('SOURCE_ASSERTED', 'SEARCH_CANDIDATE', 'MISSING')),
  add column if not exists country_verification text not null default 'UNVERIFIED'
    check (country_verification in ('SOURCE_ASSERTED', 'UNVERIFIED'));

comment on column company_intake_candidates.website_verification is
  'Status at discovery time. Admission still requires fetching and validating the site.';
comment on column company_intake_candidates.country_verification is
  'Prevents a requested search market from being persisted as a company country fact.';

-- The original seed labels itself as demo data. Make that distinction effective
-- in existing databases instead of allowing seed rows to appear as live facts.
update companies
set is_demo = true,
    provenance_type = 'seed',
    data_classification = 'DEMO'
where id::text like 'c0000000-0000-0000-0000-%';
