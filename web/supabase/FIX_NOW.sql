-- ★ 今はこのファイルだけ実行（SETUP_ALL.sql は不要）★
-- users テーブルは既にある → 足りない列だけ追加します

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

alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists friend_code text;
alter table public.users add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'name'
  ) then
    execute $sql$
      update public.users
      set display_name = coalesce(nullif(trim(name), ''), 'あなた')
      where display_name is null
    $sql$;
  end if;
end $$;

update public.users set display_name = 'あなた' where display_name is null;

do $$
declare
  r record;
  new_code text;
begin
  for r in select id from public.users where friend_code is null loop
    loop
      new_code := public.generate_friend_code();
      exit when not exists (select 1 from public.users where friend_code = new_code);
    end loop;
    update public.users set friend_code = new_code where id = r.id;
  end loop;
end $$;

alter table public.users alter column display_name set default 'あなた';
alter table public.users alter column display_name set not null;

create unique index if not exists users_friend_code_unique on public.users (friend_code);

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);

select '完了！ブラウザを F5 で再読み込みしてください' as message;
