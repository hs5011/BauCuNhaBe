-- Supabase schema for BauCuNhaBe
-- Chạy trong Supabase SQL Editor.

create table if not exists public.users (
  id text primary key,
  full_name text not null,
  position text not null,
  email text not null,
  phone text not null,
  username text not null unique,
  password text,
  role text not null,
  voting_area text,
  created_at timestamptz not null default now()
);

create table if not exists public.voting_areas (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.voters (
  id text primary key,
  full_name text not null,
  id_card text not null,
  address text,
  neighborhood text,
  constituency text,
  voting_group text,
  voting_area text,
  has_voted boolean not null default false,
  voted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists voters_id_card_idx on public.voters (id_card);
create index if not exists voters_voting_area_idx on public.voters (voting_area);

create table if not exists public.election_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists election_settings_set_updated_at on public.election_settings;
create trigger election_settings_set_updated_at
before update on public.election_settings
for each row execute function public.set_updated_at();

-- ===== SECURITY NOTE =====
-- Để chạy nhanh demo, bạn có thể TẠM TẮT RLS cho các bảng.
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.voters DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.voting_areas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.election_settings DISABLE ROW LEVEL SECURITY;
--
-- Khi cần bảo mật, hãy bật RLS và viết policy theo Supabase Auth (khuyến nghị).

