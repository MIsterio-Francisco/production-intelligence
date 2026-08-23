-- Persistent weekly sales execution plan and append-only contact history.

alter table user_saved_companies add column if not exists week_start date;
alter table user_saved_companies add column if not exists next_action_at timestamptz;
alter table user_saved_companies add column if not exists last_contacted_at timestamptz;
alter table user_saved_companies add column if not exists updated_at timestamptz not null default now();

update user_saved_companies
set week_start = (current_date - ((extract(isodow from current_date)::integer - 1) * interval '1 day'))::date,
    status = case when status in ('new', 'target') then 'PLANNED' else upper(status) end,
    updated_at = now()
where week_start is null;

alter table user_saved_companies alter column week_start set default
  (current_date - ((extract(isodow from current_date)::integer - 1) * interval '1 day'))::date;

create table if not exists sales_contact_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  event_type text not null check (event_type in (
    'ADDED_TO_WEEK', 'STATUS_CHANGED', 'EMAIL_SENT', 'CALL_MADE', 'MESSAGE_SENT',
    'REPLY_RECEIVED', 'MEETING_BOOKED', 'NOTE_ADDED'
  )),
  previous_status text,
  new_status text,
  channel text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_saved_companies_week_idx on user_saved_companies(user_id, week_start);
create index if not exists sales_contact_log_user_date_idx on sales_contact_log(user_id, occurred_at desc);
create index if not exists sales_contact_log_company_idx on sales_contact_log(company_id, occurred_at desc);

alter table sales_contact_log enable row level security;
create policy "Users can manage their own sales contact log"
  on sales_contact_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
