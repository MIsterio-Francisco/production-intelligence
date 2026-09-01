-- Restore a column expected by the application but missing from the remote
-- PostgREST schema. Idempotent so it is safe for databases where it exists.

alter table public.companies
  add column if not exists data_classification text default 'VERIFIED_FACT';

update public.companies
set data_classification = case
  when provenance_type in ('legacy_catalog', 'curated_public_research') then 'SOURCE_CLAIM'
  when provenance_type in ('synthetic', 'demo') then 'UNKNOWN'
  else 'VERIFIED_FACT'
end
where data_classification is null;

create index if not exists companies_data_classification_idx
  on public.companies(data_classification);

comment on column public.companies.data_classification is
  'Evidence classification: VERIFIED_FACT, SOURCE_CLAIM, ESTIMATE, AI_INFERENCE, or UNKNOWN.';

notify pgrst, 'reload schema';
