-- Push delivery reliability metadata.
-- Failed deliveries remain pending for retry until the dispatcher reaches its retry limit.
alter table public.push_outbox add column if not exists attempt_count integer not null default 0;
alter table public.push_outbox add column if not exists last_attempt_at timestamptz;
alter table public.push_outbox add column if not exists last_error text;

create index if not exists push_outbox_pending_retry_idx
 on public.push_outbox(created_at)
 where sent_at is null;
