-- お題テーブル（アプリが期待する構造）
create table if not exists public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_prompts_created_at_idx
  on public.daily_prompts (created_at desc);

alter table public.daily_prompts enable row level security;

drop policy if exists "daily_prompts_select_authenticated" on public.daily_prompts;
create policy "daily_prompts_select_authenticated"
  on public.daily_prompts for select
  to authenticated
  using (true);

-- サンプル（任意）
-- insert into public.daily_prompts (prompt) values ('今日の気分を色だけで表してみて');
