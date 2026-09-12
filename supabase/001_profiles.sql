-- Corgi-Bot Community: Discord-authenticated public profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  username text,
  display_name text not null default 'Corgi Member',
  avatar_url text,
  role text not null default 'member' check (role in ('member','moderator','admin','developer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Prevent browser clients from changing privileged role values.
revoke update on public.profiles from anon, authenticated;
grant update (discord_id, username, display_name, avatar_url, updated_at) on public.profiles to authenticated;
grant select on public.profiles to anon, authenticated;
grant insert (id, discord_id, username, display_name, avatar_url, updated_at) on public.profiles to authenticated;
