alter table public.score_reports
  add column if not exists judge_mode text not null default 'heuristic',
  add column if not exists judge_runs jsonb not null default '[]'::jsonb,
  add column if not exists judge_disagreement jsonb not null default '[]'::jsonb;
