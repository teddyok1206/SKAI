alter table public.prompt_comments
  add column if not exists author_label text not null default 'SKAI learner';

create index if not exists prompt_comments_attempt_id_idx on public.prompt_comments(attempt_id);
create index if not exists prompt_comments_trace_event_id_idx on public.prompt_comments(trace_event_id);

drop policy if exists "Authenticated users can comment" on public.prompt_comments;

create policy "Authenticated users can comment"
  on public.prompt_comments for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and exists (
      select 1 from public.published_attempts
      where published_attempts.attempt_id = prompt_comments.attempt_id
    )
  );
