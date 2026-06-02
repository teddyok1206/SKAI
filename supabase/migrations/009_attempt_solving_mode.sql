alter table public.attempts
  add column if not exists solving_mode text;

create index if not exists attempts_solving_mode_idx
  on public.attempts(solving_mode);
