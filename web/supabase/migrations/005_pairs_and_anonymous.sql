-- ペアリング + 匿名ログイン用プロフィール名

-- 匿名ユーザーの display_name を metadata から拾う
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1),
    'あなた'
  );
  v_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  insert into public.users (id, email, display_name, avatar_url)
  values (new.id, new.email, v_name, v_avatar)
  on conflict (id) do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    display_name = case
      when public.users.display_name = 'あなた' then excluded.display_name
      else public.users.display_name
    end;

  return new;
end;
$$;

-- 二人のペア
create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users (id) on delete cascade,
  user_b uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a <> user_b)
);

create index if not exists pairs_user_a_idx on public.pairs (user_a);
create index if not exists pairs_user_b_idx on public.pairs (user_b);

alter table public.pairs enable row level security;

create policy "pairs_select_own"
  on public.pairs for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "pairs_insert_own"
  on public.pairs for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- ペア相手のプロフィールを閲覧
drop policy if exists "users_select_partner" on public.users;
create policy "users_select_partner"
  on public.users for select
  using (
    exists (
      select 1 from public.pairs p
      where (p.user_a = auth.uid() and p.user_b = users.id)
         or (p.user_b = auth.uid() and p.user_a = users.id)
    )
  );
