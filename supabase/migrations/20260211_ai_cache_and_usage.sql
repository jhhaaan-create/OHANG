-- 1. AI 응답 캐시 테이블
create table if not exists public.ai_cache (
  id uuid default gen_random_uuid() primary key,
  cache_key text not null unique,
  result_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);
create index if not exists ai_cache_key_idx on public.ai_cache (cache_key);

-- 2. 유저 사용량 로그 테이블 (Rate Limiting)
create table if not exists public.user_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  feature_name text not null,
  used_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists user_usage_user_idx on public.user_usage (user_id, used_at);
