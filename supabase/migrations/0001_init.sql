-- ============================================================
-- kehua9 埋点系统迁移：Laf(Sealos) -> Supabase
-- 执行位置：Supabase Dashboard -> SQL Editor -> New query -> 粘贴本文件全部内容 -> Run
-- 说明：只需执行一次；再次执行也是幂等的（if not exists 保护）
-- ============================================================

-- 1. 创建埋点数据表
--    列名使用 snake_case（PostgREST REST API 不暴露含大写字母的列名）
--    time 保持文本格式 "YYYY-MM-DD hh:mm:ss"，与前端统计逻辑兼容
create table if not exists public.analytics (
  id bigint generated always as identity primary key,
  event_name text not null,
  params jsonb not null default '{}'::jsonb,
  city text,
  user_id text not null,
  time text,
  session_id text,
  created_at timestamptz not null default now()
);

-- 2. 索引（按用户 / 时间查询）
create index if not exists analytics_user_idx on public.analytics (user_id);
create index if not exists analytics_time_idx on public.analytics (time);

-- 3. 开启行级安全（RLS）
alter table public.analytics enable row level security;

-- 4. 策略：允许匿名插入（浏览器端 anon key 上报埋点）
drop policy if exists "allow_anon_insert_analytics" on public.analytics;
create policy "allow_anon_insert_analytics"
  on public.analytics
  for insert
  to anon
  with check (true);

-- 5. 策略：允许匿名查询（数据监控面板 ?analyticsData=true 拉数据）
--    ⚠️ 说明：anon key 是公开的，此策略意味着任何拿到 anon key 的人都能读埋点数据。
--    埋点数据敏感度较低（事件类型 + 城市 + 匿名指纹），个人站点可接受。
--    如果后续介意，可改为 to authenticated（面板登录后查询），或加自定义 header token 校验。
drop policy if exists "allow_anon_select_analytics" on public.analytics;
create policy "allow_anon_select_analytics"
  on public.analytics
  for select
  to anon
  using (true);
