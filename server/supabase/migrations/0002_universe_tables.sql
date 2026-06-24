-- 原点宇宙：前端数据表
-- 用于替代 localStorage，实现跨设备数据同步
-- 所有表使用 text 类型的 ID（与前端 mockData 保持一致）

-- ── users 表 ──
create table if not exists public.users (
  user_id text primary key,
  name text not null,
  avatar text default '',
  role text default '',
  skills jsonb default '[]',
  bio text default '',
  contact text default '',
  project_ids jsonb default '[]',
  team_ids jsonb default '[]',
  star_brightness real default 0,
  position jsonb default '{"x":0,"y":0,"z":0}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── projects 表 ──
create table if not exists public.projects (
  project_id text primary key,
  name text not null,
  one_sentence text default '',
  description text default '',
  document_text text default '',
  tags jsonb default '[]',
  tech_stack jsonb default '[]',
  track text default '',
  member_ids jsonb default '[]',
  demo_link text default '',
  github_link text default '',
  newspaper_id text default '',
  planet_orbit_user_id text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── newspapers 表 ──
create table if not exists public.newspapers (
  newspaper_id text primary key,
  title text not null,
  subtitle text default '',
  image_url text default '',
  project_summary text default '',
  editor_comment text default '',
  tags jsonb default '[]',
  share_quote text default '',
  future_headline text default '',
  template_style text default '',
  created_at timestamptz default now(),
  user_id text default '',
  project_id text default '',
  team_name text default '',
  highlights jsonb default '[]',
  published boolean default true,
  heat real default 0,
  ai_recommended boolean default false,
  future_score real default 0,
  updated_at timestamptz default now()
);

-- ── relations 表 ──
create table if not exists public.relations (
  relation_id text primary key,
  user_a text not null,
  user_b text not null,
  relation_type text default 'teammate',
  relation_title text default '',
  relation_color text default '#F4D593',
  project_id text default '',
  cooperation_roles jsonb default '[]',
  common_tags jsonb default '[]',
  cooperation_count integer default 1,
  weight real default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── tags 表 ──
create table if not exists public.tags (
  tag_id text primary key,
  name text not null,
  type text default 'keyword',
  created_at timestamptz default now()
);

-- ── user_settings 表（单用户模式，固定 user_id = 'default'）──
create table if not exists public.user_settings (
  user_id text primary key default 'default',
  sound_enabled boolean default true,
  volume real default 0.42,
  motion real default 0.8,
  updated_at timestamptz default now()
);

-- ── 索引 ──
create index if not exists idx_users_project_ids on public.users using gin (project_ids);
create index if not exists idx_users_team_ids on public.users using gin (team_ids);
create index if not exists idx_projects_member_ids on public.projects using gin (member_ids);
create index if not exists idx_newspapers_user_id on public.newspapers (user_id);
create index if not exists idx_newspapers_project_id on public.newspapers (project_id);
create index if not exists idx_relations_user_a on public.relations (user_a);
create index if not exists idx_relations_user_b on public.relations (user_b);

-- ── RLS 策略 ──
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.newspapers enable row level security;
alter table public.relations enable row level security;
alter table public.tags enable row level security;
alter table public.user_settings enable row level security;

-- 公共读取策略（所有表）
create policy "public read users" on public.users for select using (true);
create policy "public read projects" on public.projects for select using (true);
create policy "public read newspapers" on public.newspapers for select using (true);
create policy "public read relations" on public.relations for select using (true);
create policy "public read tags" on public.tags for select using (true);
create policy "public read user_settings" on public.user_settings for select using (true);

-- 公共写入策略（允许匿名写入，适合黑客松演示场景）
-- 生产环境应改为基于 auth.uid() 的策略
create policy "public insert users" on public.users for insert with check (true);
create policy "public update users" on public.users for update using (true);
create policy "public insert projects" on public.projects for insert with check (true);
create policy "public update projects" on public.projects for update using (true);
create policy "public insert newspapers" on public.newspapers for insert with check (true);
create policy "public update newspapers" on public.newspapers for update using (true);
create policy "public insert relations" on public.relations for insert with check (true);
create policy "public update relations" on public.relations for update using (true);
create policy "public insert tags" on public.tags for insert with check (true);
create policy "public update tags" on public.tags for update using (true);
create policy "public insert user_settings" on public.user_settings for insert with check (true);
create policy "public update user_settings" on public.user_settings for update using (true);
