-- LinkedIn profile provenance. Existing unverified URLs remain stored but are not contact links.

alter table people add column if not exists linkedin_status text not null default 'UNVERIFIED'
  check (linkedin_status in ('VERIFIED', 'PUBLIC', 'PROVIDER_MATCH', 'UNVERIFIED'));
alter table people add column if not exists linkedin_source_url text;
alter table people add column if not exists linkedin_last_checked_at timestamptz;

alter table people drop constraint if exists verified_linkedin_requires_evidence;
alter table people add constraint verified_linkedin_requires_evidence check (
  linkedin_status not in ('VERIFIED', 'PUBLIC')
  or (linkedin_url is not null and linkedin_source_url is not null and linkedin_last_checked_at is not null)
);

create index if not exists people_linkedin_status_idx on people(linkedin_status);

-- Do not grant trust retroactively to legacy or seed URLs.
update people
set linkedin_status = 'UNVERIFIED',
    linkedin_source_url = null,
    linkedin_last_checked_at = null
where linkedin_url is not null
  and linkedin_status = 'UNVERIFIED';
