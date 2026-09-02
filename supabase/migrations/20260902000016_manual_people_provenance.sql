-- Preserve evidence for people added through manual research.

alter table people add column if not exists research_source_url text;
alter table people add column if not exists research_last_checked_at timestamptz;

create index if not exists people_research_checked_idx
  on people(research_last_checked_at desc)
  where research_source_url is not null;
