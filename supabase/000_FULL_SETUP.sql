-- Corgi-Bot Web V4 — FULL SETUP FIXED
-- Run this ONE file in Supabase SQL Editor.
-- Designed for a fresh Corgi-Bot Supabase project and safe to re-run.

DO $$
DECLARE existing_type text;
BEGIN
  SELECT data_type INTO existing_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='id';

  IF existing_type IS NOT NULL AND existing_type <> 'uuid' THEN
    RAISE EXCEPTION 'Corgi-Bot setup stopped: public.profiles.id must be uuid, but found %. Use a fresh Corgi-Bot project or migrate the old schema first.', existing_type;
  END IF;
END $$;

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

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
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


-- ==========================================
-- FULL COMMUNITY EXTENSION
-- ==========================================

-- Corgi-Bot Web V4 — Full Community Backend
-- Run AFTER 001_profiles.sql in Supabase SQL Editor.
-- Safe to re-run: objects use IF NOT EXISTS / CREATE OR REPLACE where possible.

create extension if not exists pgcrypto;

-- ---------- Role helpers ----------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('moderator','admin','developer');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin','developer');
$$;

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'developer';
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_developer() to anon, authenticated;

-- Safe public profile surface for article/forum attribution.
create or replace view public.public_profiles as
select id, display_name, username, avatar_url, role
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ---------- Automatic profile creation ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name', 'Corgi Member'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    discord_id = coalesce(excluded.discord_id, public.profiles.discord_id),
    username = coalesce(excluded.username, public.profiles.username),
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------- News ----------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 3 and 180),
  excerpt text not null default '',
  content text not null,
  tag text not null default 'UPDATE',
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  views bigint not null default 0
);

create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx on public.articles(status, published_at desc);
create index if not exists article_comments_article_idx on public.article_comments(article_id, created_at);

-- ---------- Forum ----------
create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'Thảo luận chung',
  title text not null check (char_length(title) between 4 and 180),
  body text not null check (char_length(body) between 2 and 10000),
  pinned boolean not null default false,
  locked boolean not null default false,
  removed_at timestamptz,
  views bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_topics_created_idx on public.forum_topics(pinned desc, created_at desc);
create index if not exists forum_replies_topic_idx on public.forum_replies(topic_id, created_at);

-- ---------- Support ----------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 180),
  category text not null default 'Hỗ trợ chung',
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets(user_id, created_at desc);
create index if not exists support_messages_ticket_idx on public.support_messages(ticket_id, created_at);

-- ---------- Bot command directory ----------
create table if not exists public.bot_commands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_name text not null default 'Khác',
  description text not null default '',
  usage text,
  enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.bot_commands(name, group_name, description, usage, sort_order)
values
('/ai','Hệ thống','Trò chuyện với trợ lý AI của Corgi-Bot.','/ai <nội dung>',10),
('/moderation','Quản lý','Mở nhóm công cụ moderation.','/moderation',20),
('/setup','Quản lý','Cấu hình các module chính của server.','/setup',30),
('/ticket','Quản lý','Thiết lập và sử dụng hệ thống ticket.','/ticket',40),
('/reactionrole','Quản lý','Tạo reaction role cho thành viên.','/reactionrole',50),
('/stats','Quản lý','Xem/cấu hình thống kê server.','/stats',60),
('/giveaway','Cộng đồng','Tạo và quản lý giveaway.','/giveaway',70),
('/poll','Cộng đồng','Tạo khảo sát.','/poll',80),
('/contest','Cộng đồng','Tổ chức contest và bình chọn.','/contest',90),
('/help','Cộng đồng','Xem hướng dẫn lệnh và tính năng.','/help',100),
('/balance','Kinh tế','Xem số dư economy.','/balance',110),
('/daily','Kinh tế','Nhận phần thưởng hằng ngày.','/daily',120),
('/inventory','Kinh tế','Xem kho đồ.','/inventory',130),
('/leaderboard','Kinh tế','Xem bảng xếp hạng.','/leaderboard',140),
('/transfer','Kinh tế','Chuyển tài nguyên cho thành viên khác.','/transfer',150),
('/premium','Premium','Xem quyền lợi Premium.','/premium',160),
('/redeem','Premium','Nhập giftcode/redeem code.','/redeem <code>',170),
('/game','Giải trí','Mở khu vực game.','/game',180)
on conflict (name) do nothing;

-- ---------- Updated-at helper ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop/recreate generic updated_at triggers.
do $$
declare t text;
begin
  foreach t in array array['articles','article_comments','forum_topics','forum_replies','support_tickets','bot_commands'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute procedure public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- Guard moderation-only fields ----------
create or replace function public.guard_forum_topic_moderation()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.is_staff() and (
    new.pinned is distinct from old.pinned or
    new.locked is distinct from old.locked or
    new.removed_at is distinct from old.removed_at
  ) then
    raise exception 'Only staff may change moderation fields';
  end if;
  return new;
end;
$$;

drop trigger if exists forum_topics_guard_moderation on public.forum_topics;
create trigger forum_topics_guard_moderation before update on public.forum_topics
for each row execute procedure public.guard_forum_topic_moderation();

create or replace function public.guard_support_status()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.is_staff() and (
    new.status is distinct from old.status or
    new.closed_at is distinct from old.closed_at
  ) then
    raise exception 'Only staff may change ticket status';
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_guard_status on public.support_tickets;
create trigger support_tickets_guard_status before update on public.support_tickets
for each row execute procedure public.guard_support_status();

-- ---------- Counter RPCs ----------
create or replace function public.increment_article_view(p_slug text)
returns void language sql security definer set search_path=public as $$
  update public.articles set views = views + 1 where slug = p_slug and status = 'published';
$$;

create or replace function public.increment_topic_view(p_topic_id uuid)
returns void language sql security definer set search_path=public as $$
  update public.forum_topics set views = views + 1 where id = p_topic_id and removed_at is null;
$$;

grant execute on function public.increment_article_view(text) to anon, authenticated;
grant execute on function public.increment_topic_view(uuid) to anon, authenticated;

-- Developer-only role assignment.
create or replace function public.admin_set_profile_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_developer() then raise exception 'Developer role required'; end if;
  if p_role not in ('member','moderator','admin','developer') then raise exception 'Invalid role'; end if;
  update public.profiles set role = p_role, updated_at = now() where id = p_user_id;
end;
$$;
grant execute on function public.admin_set_profile_role(uuid,text) to authenticated;

-- ---------- RLS ----------
alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.bot_commands enable row level security;

-- Articles
DROP POLICY IF EXISTS articles_read ON public.articles;
create policy articles_read on public.articles for select using (status='published' or public.is_staff());
DROP POLICY IF EXISTS articles_staff_insert ON public.articles;
create policy articles_staff_insert on public.articles for insert to authenticated with check (public.is_admin());
DROP POLICY IF EXISTS articles_staff_update ON public.articles;
create policy articles_staff_update on public.articles for update to authenticated using (public.is_admin()) with check (public.is_admin());
DROP POLICY IF EXISTS articles_staff_delete ON public.articles;
create policy articles_staff_delete on public.articles for delete to authenticated using (public.is_admin());

-- Likes
DROP POLICY IF EXISTS likes_read ON public.article_likes;
create policy likes_read on public.article_likes for select using (true);
DROP POLICY IF EXISTS likes_insert_own ON public.article_likes;
create policy likes_insert_own on public.article_likes for insert to authenticated with check (user_id = auth.uid());
DROP POLICY IF EXISTS likes_delete_own ON public.article_likes;
create policy likes_delete_own on public.article_likes for delete to authenticated using (user_id = auth.uid());

-- Comments
DROP POLICY IF EXISTS comments_read ON public.article_comments;
create policy comments_read on public.article_comments for select using (not hidden or public.is_staff());
DROP POLICY IF EXISTS comments_insert_own ON public.article_comments;
create policy comments_insert_own on public.article_comments for insert to authenticated with check (user_id=auth.uid());
DROP POLICY IF EXISTS comments_update_own ON public.article_comments;
create policy comments_update_own on public.article_comments for update to authenticated using (user_id=auth.uid() or public.is_staff()) with check (user_id=auth.uid() or public.is_staff());
DROP POLICY IF EXISTS comments_delete_own ON public.article_comments;
create policy comments_delete_own on public.article_comments for delete to authenticated using (user_id=auth.uid() or public.is_staff());

-- Forum topics
DROP POLICY IF EXISTS topics_read ON public.forum_topics;
create policy topics_read on public.forum_topics for select using (removed_at is null or public.is_staff());
DROP POLICY IF EXISTS topics_insert ON public.forum_topics;
create policy topics_insert on public.forum_topics for insert to authenticated with check (author_id=auth.uid());
DROP POLICY IF EXISTS topics_update ON public.forum_topics;
create policy topics_update on public.forum_topics for update to authenticated using (author_id=auth.uid() or public.is_staff()) with check (author_id=auth.uid() or public.is_staff());
DROP POLICY IF EXISTS topics_delete ON public.forum_topics;
create policy topics_delete on public.forum_topics for delete to authenticated using (author_id=auth.uid() or public.is_staff());

-- Forum replies
DROP POLICY IF EXISTS replies_read ON public.forum_replies;
create policy replies_read on public.forum_replies for select using (removed_at is null or public.is_staff());
DROP POLICY IF EXISTS replies_insert ON public.forum_replies;
create policy replies_insert on public.forum_replies for insert to authenticated with check (
  author_id=auth.uid() and exists(select 1 from public.forum_topics t where t.id=topic_id and t.removed_at is null and t.locked=false)
);
DROP POLICY IF EXISTS replies_update ON public.forum_replies;
create policy replies_update on public.forum_replies for update to authenticated using (author_id=auth.uid() or public.is_staff()) with check (author_id=auth.uid() or public.is_staff());
DROP POLICY IF EXISTS replies_delete ON public.forum_replies;
create policy replies_delete on public.forum_replies for delete to authenticated using (author_id=auth.uid() or public.is_staff());

-- Support tickets/messages
DROP POLICY IF EXISTS tickets_read ON public.support_tickets;
create policy tickets_read on public.support_tickets for select to authenticated using (user_id=auth.uid() or public.is_staff());
DROP POLICY IF EXISTS tickets_insert ON public.support_tickets;
create policy tickets_insert on public.support_tickets for insert to authenticated with check (user_id=auth.uid() and status='open');
DROP POLICY IF EXISTS tickets_update ON public.support_tickets;
create policy tickets_update on public.support_tickets for update to authenticated using (user_id=auth.uid() or public.is_staff()) with check (user_id=auth.uid() or public.is_staff());
DROP POLICY IF EXISTS tickets_delete ON public.support_tickets;
create policy tickets_delete on public.support_tickets for delete to authenticated using (public.is_admin());

DROP POLICY IF EXISTS support_messages_read ON public.support_messages;
create policy support_messages_read on public.support_messages for select to authenticated using (
  exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.is_staff()))
);
DROP POLICY IF EXISTS support_messages_insert ON public.support_messages;
create policy support_messages_insert on public.support_messages for insert to authenticated with check (
  author_id=auth.uid() and exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.is_staff()) and t.status <> 'closed')
);

-- Commands
DROP POLICY IF EXISTS commands_read ON public.bot_commands;
create policy commands_read on public.bot_commands for select using (enabled=true or public.is_staff());
DROP POLICY IF EXISTS commands_staff_insert ON public.bot_commands;
create policy commands_staff_insert on public.bot_commands for insert to authenticated with check (public.is_admin());
DROP POLICY IF EXISTS commands_staff_update ON public.bot_commands;
create policy commands_staff_update on public.bot_commands for update to authenticated using (public.is_admin()) with check (public.is_admin());
DROP POLICY IF EXISTS commands_staff_delete ON public.bot_commands;
create policy commands_staff_delete on public.bot_commands for delete to authenticated using (public.is_admin());

-- ---------- Optional first news article seed ----------
insert into public.articles(slug,title,excerpt,content,tag,status,published_at)
values(
  'corgi-bot-community-site',
  'Corgi-Bot mở rộng website cộng đồng',
  'Website chính thức bổ sung Tin tức, Diễn đàn và khu vực hỗ trợ cho cộng đồng.',
  E'Corgi-Bot đang mở rộng website từ một trang giới thiệu thành trung tâm cộng đồng hoàn chỉnh.\n\nTin tức tập trung vào cập nhật bot, thay đổi tính năng và thông báo quan trọng. Diễn đàn là nơi thành viên trao đổi kinh nghiệm, góp ý và đề xuất tính năng mới.\n\nTất cả nội dung cộng đồng ở bản V4 được lưu thật trong Supabase thay vì localStorage.',
  'WEBSITE',
  'published',
  now()
)
on conflict (slug) do nothing;
