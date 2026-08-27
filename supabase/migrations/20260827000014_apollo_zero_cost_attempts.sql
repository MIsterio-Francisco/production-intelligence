-- Apollo only charges when qualifying data is returned. Keep failed/no-match calls
-- in the audit log without incorrectly reducing the internal credit estimate.
alter table apollo_usage_log
  drop constraint if exists apollo_usage_log_estimated_credits_check;

alter table apollo_usage_log
  add constraint apollo_usage_log_estimated_credits_check
  check (estimated_credits >= 0);
