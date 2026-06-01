alter table public.attempts
  add column if not exists counterfactual_report jsonb;
