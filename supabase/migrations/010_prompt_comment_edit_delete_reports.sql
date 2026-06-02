alter table public.prompt_comments
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists report_count integer not null default 0;

create table if not exists public.prompt_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.prompt_comments(id) on delete cascade,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

create index if not exists prompt_comment_reports_comment_id_idx
  on public.prompt_comment_reports(comment_id);

alter table public.prompt_comment_reports enable row level security;

drop policy if exists "Users can update own prompt comments" on public.prompt_comments;

create policy "Users can update own prompt comments"
  on public.prompt_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can report comments" on public.prompt_comment_reports;

create policy "Authenticated users can report comments"
  on public.prompt_comment_reports for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and exists (
      select 1 from public.published_attempts
      where published_attempts.attempt_id = prompt_comment_reports.attempt_id
    )
  );

create or replace function public.increment_prompt_comment_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompt_comments
  set report_count = report_count + 1
  where id = new.comment_id;
  return new;
end;
$$;

drop trigger if exists prompt_comment_report_count_insert on public.prompt_comment_reports;

create trigger prompt_comment_report_count_insert
after insert on public.prompt_comment_reports
for each row
execute function public.increment_prompt_comment_report_count();
