drop policy if exists "Prompt comments are readable" on public.prompt_comments;

create policy "Prompt comments are readable"
  on public.prompt_comments for select
  using (
    exists (
      select 1 from public.published_attempts
      where published_attempts.attempt_id = prompt_comments.attempt_id
    )
  );
