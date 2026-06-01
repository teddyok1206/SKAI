alter table public.attempts
  add column if not exists branch_metadata jsonb;

alter table public.trace_events
  add column if not exists source_trace_event_id uuid,
  add column if not exists branch_id uuid;

create index if not exists attempts_branch_metadata_parent_idx
  on public.attempts ((branch_metadata->>'parentAttemptId'));

create index if not exists trace_events_source_trace_event_id_idx
  on public.trace_events(source_trace_event_id);

create index if not exists trace_events_branch_id_idx
  on public.trace_events(branch_id);
