create extension if not exists "pgcrypto";

create table if not exists public.problems (
  id text primary key,
  title text not null,
  subtitle text not null,
  category text not null,
  difficulty text not null,
  goal_profile text not null,
  estimated_minutes integer not null default 20,
  statement text not null,
  user_goal text not null,
  constraints jsonb not null default '[]'::jsonb,
  starter_context jsonb not null default '[]'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb,
  allowed_providers jsonb not null default '["mock"]'::jsonb,
  rubric jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references public.problems(id),
  user_id uuid,
  status text not null default 'draft',
  title text not null,
  provider text not null,
  model text not null,
  final_answer text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trace_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  problem_id text not null references public.problems(id),
  role text not null,
  content text not null,
  summary text,
  provider text,
  model text,
  latency_ms integer,
  usage_input_tokens integer,
  usage_output_tokens integer,
  estimated_cost_usd numeric(12, 8),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.judge_runs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  status text not null default 'pending',
  judge_provider text not null,
  judge_model text not null,
  rubric_version text not null default 'v0',
  report jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.score_reports (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  problem_id text not null references public.problems(id),
  total_score integer not null,
  axis_scores jsonb not null,
  coach_summary text not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  bottlenecks jsonb not null default '[]'::jsonb,
  workflow jsonb not null default '[]'::jsonb,
  next_practice_targets jsonb not null default '[]'::jsonb,
  graph_annotations jsonb not null default '[]'::jsonb,
  judge_provider text not null,
  judge_model text not null,
  judge_mode text not null default 'heuristic',
  judge_runs jsonb not null default '[]'::jsonb,
  judge_disagreement jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.published_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  problem_id text not null references public.problems(id),
  title text not null,
  workflow jsonb not null default '[]'::jsonb,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_comments (
  id uuid primary key default gen_random_uuid(),
  trace_event_id uuid references public.trace_events(id) on delete cascade,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  user_id uuid,
  parent_id uuid references public.prompt_comments(id) on delete cascade,
  author_label text not null default 'SKAI learner',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists trace_events_attempt_id_idx on public.trace_events(attempt_id);
create index if not exists attempts_problem_id_idx on public.attempts(problem_id);
create index if not exists score_reports_problem_id_idx on public.score_reports(problem_id);
create index if not exists prompt_comments_attempt_id_idx on public.prompt_comments(attempt_id);
create index if not exists prompt_comments_trace_event_id_idx on public.prompt_comments(trace_event_id);
