create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'SKAI learner',
  bio text,
  preferred_locale text not null default 'ko',
  default_author_label text not null default 'SKAI learner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_preferred_locale_check check (preferred_locale in ('ko', 'en')),
  constraint user_profiles_display_name_length check (char_length(display_name) between 1 and 60),
  constraint user_profiles_default_author_label_length check (char_length(default_author_label) between 1 and 60),
  constraint user_profiles_bio_length check (bio is null or char_length(bio) <= 240)
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
