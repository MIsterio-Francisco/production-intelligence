-- Contact email provenance and verification.
-- Inferred addresses are deliberately never contactable.

create table if not exists contact_emails (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  owner_type text not null check (owner_type in ('COMPANY', 'PERSON')),
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  status text not null check (status in ('VERIFIED', 'PUBLIC', 'INFERRED', 'UNVERIFIED')),
  source_type text not null check (source_type in ('OFFICIAL_WEBSITE', 'APOLLO', 'MANUAL', 'PATTERN_INFERENCE')),
  source_url text,
  provider_record_id text,
  verification_provider text,
  verification_result text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_email_owner check (
    (owner_type = 'COMPANY' and person_id is null) or
    (owner_type = 'PERSON' and person_id is not null)
  ),
  constraint public_email_requires_source check (status <> 'PUBLIC' or source_url is not null)
);

create index if not exists contact_emails_company_idx on contact_emails(company_id);
create index if not exists contact_emails_person_idx on contact_emails(person_id) where person_id is not null;
create index if not exists contact_emails_status_idx on contact_emails(status);
create unique index if not exists contact_emails_company_unique
  on contact_emails(company_id, normalized_email) where person_id is null;
create unique index if not exists contact_emails_person_unique
  on contact_emails(company_id, person_id, normalized_email) where person_id is not null;

alter table contact_emails enable row level security;

create policy "Authenticated users can read contact email evidence"
  on contact_emails for select to authenticated using (true);

-- Writes are performed server-side through the service-role client only.
