alter table public.score_reports
  add column if not exists graph_annotations jsonb not null default '[]'::jsonb;
