-- ============================================================
-- ふたりおえ — 初回セットアップ（これを1回だけ SQL Editor で実行）
-- Supabase ダッシュボード → SQL Editor → New query → 貼り付け → Run
-- ============================================================

-- ---------- 共通関数 ----------
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- users ----------
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

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- ---------- drawings ----------
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  question_date date not null default (current_date),
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_date)
);

create index if not exists drawings_user_date_idx
  on public.drawings (user_id, question_date desc);

drop trigger if exists drawings_updated_at on public.drawings;
create trigger drawings_updated_at
  before update on public.drawings
  for each row execute function public.set_updated_at();

alter table public.drawings enable row level security;

drop policy if exists "drawings_select_own" on public.drawings;
create policy "drawings_select_own" on public.drawings for select using (auth.uid() = user_id);
drop policy if exists "drawings_insert_own" on public.drawings;
create policy "drawings_insert_own" on public.drawings for insert with check (auth.uid() = user_id);
drop policy if exists "drawings_update_own" on public.drawings;
create policy "drawings_update_own" on public.drawings for update using (auth.uid() = user_id);
drop policy if exists "drawings_delete_own" on public.drawings;
create policy "drawings_delete_own" on public.drawings for delete using (auth.uid() = user_id);

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drawings', 'drawings', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "drawings_storage_insert_own" on storage.objects;
create policy "drawings_storage_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'drawings' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "drawings_storage_update_own" on storage.objects;
create policy "drawings_storage_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'drawings' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "drawings_storage_delete_own" on storage.objects;
create policy "drawings_storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'drawings' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "drawings_storage_select_public" on storage.objects;
create policy "drawings_storage_select_public" on storage.objects for select to public
  using (bucket_id = 'drawings');

-- ---------- daily_prompts ----------
create table if not exists public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_date date not null unique,
  prompt_text text not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.daily_prompts enable row level security;

drop policy if exists "daily_prompts_select_authenticated" on public.daily_prompts;
create policy "daily_prompts_select_authenticated"
  on public.daily_prompts for select to authenticated using (true);

-- ---------- pairs ----------
create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users (id) on delete cascade,
  user_b uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a <> user_b)
);

alter table public.pairs enable row level security;

drop policy if exists "pairs_select_own" on public.pairs;
create policy "pairs_select_own" on public.pairs for select
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "pairs_insert_own" on public.pairs;
create policy "pairs_insert_own" on public.pairs for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "users_select_partner" on public.users;
create policy "users_select_partner" on public.users for select
  using (
    exists (
      select 1 from public.pairs p
      where (p.user_a = auth.uid() and p.user_b = users.id)
         or (p.user_b = auth.uid() and p.user_a = users.id)
    )
  );

-- 完了
select 'SETUP_ALL 完了' as status;
