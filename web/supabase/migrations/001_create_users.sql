-- ============================================================
-- ユーザーテーブル（auth.users と 1:1）
-- Supabase SQL Editor で実行するか: supabase db push
-- ============================================================

-- フレンドコード生成（6文字・紛らわしい文字を除外）
create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  i int;
  attempts int := 0;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.users where friend_code = result
    );
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'friend_code generation failed';
    end if;
  end loop;
  return result;
end;
$$;

-- ユーザープロフィール
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'あなた',
  avatar_url text,
  friend_code text not null unique default public.generate_friend_code(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_friend_code_idx on public.users (friend_code);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Google ログイン後に profiles を自動作成
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS
alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);
