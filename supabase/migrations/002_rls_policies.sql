alter table public.problems enable row level security;
alter table public.attempts enable row level security;
alter table public.trace_events enable row level security;
alter table public.judge_runs enable row level security;
alter table public.score_reports enable row level security;
alter table public.published_attempts enable row level security;
alter table public.prompt_comments enable row level security;

create policy "Published problems are readable"
  on public.problems for select
  using (is_published = true);

create policy "Authenticated users can seed demo problems"
  on public.problems for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update demo problems"
  on public.problems for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Users can read own attempts"
  on public.attempts for select
  using (user_id = auth.uid());

create policy "Users can insert own attempts"
  on public.attempts for insert
  with check (user_id = auth.uid());

create policy "Users can update own attempts"
  on public.attempts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can read trace events for own attempts"
  on public.trace_events for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = trace_events.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert trace events for own attempts"
  on public.trace_events for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = trace_events.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can update trace events for own attempts"
  on public.trace_events for update
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = trace_events.attempt_id
      and attempts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = trace_events.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can read judge runs for own attempts"
  on public.judge_runs for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = judge_runs.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert judge runs for own attempts"
  on public.judge_runs for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = judge_runs.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can read score reports for own attempts"
  on public.score_reports for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = score_reports.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can insert score reports for own attempts"
  on public.score_reports for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = score_reports.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can update score reports for own attempts"
  on public.score_reports for update
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = score_reports.attempt_id
      and attempts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = score_reports.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Published attempts are public"
  on public.published_attempts for select
  using (true);

create policy "Users can publish own attempts"
  on public.published_attempts for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = published_attempts.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Users can update own published attempts"
  on public.published_attempts for update
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = published_attempts.attempt_id
      and attempts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = published_attempts.attempt_id
      and attempts.user_id = auth.uid()
    )
  );

create policy "Prompt comments are readable"
  on public.prompt_comments for select
  using (true);

create policy "Authenticated users can comment"
  on public.prompt_comments for insert
  with check (auth.role() = 'authenticated');

