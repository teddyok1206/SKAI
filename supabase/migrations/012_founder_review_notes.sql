create table if not exists public.founder_review_notes (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  note text not null default '',
  calibration_label jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, reviewer_id),
  constraint founder_review_notes_note_length check (char_length(note) <= 4000)
);

alter table public.founder_review_notes enable row level security;

drop policy if exists "Reviewers can read own founder notes" on public.founder_review_notes;
create policy "Reviewers can read own founder notes"
  on public.founder_review_notes for select
  using (auth.uid() = reviewer_id);

drop policy if exists "Reviewers can insert own founder notes" on public.founder_review_notes;
create policy "Reviewers can insert own founder notes"
  on public.founder_review_notes for insert
  with check (auth.uid() = reviewer_id);

drop policy if exists "Reviewers can update own founder notes" on public.founder_review_notes;
create policy "Reviewers can update own founder notes"
  on public.founder_review_notes for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

create index if not exists founder_review_notes_reviewer_updated_idx
  on public.founder_review_notes (reviewer_id, updated_at desc);
