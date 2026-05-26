-- ============================================================
-- Storage バケット「drawings」を今すぐ作る（Bucket not found 対策）
-- Supabase ダッシュボード → SQL Editor → このファイルを貼って Run
-- ============================================================

-- お絵描きテーブル（まだ無い場合）
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  question_date date not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_date)
);

alter table public.drawings add column if not exists image_url text;

alter table public.drawings enable row level security;

drop policy if exists "drawings_select_own" on public.drawings;
create policy "drawings_select_own" on public.drawings for select using (auth.uid() = user_id);
drop policy if exists "drawings_insert_own" on public.drawings;
create policy "drawings_insert_own" on public.drawings for insert with check (auth.uid() = user_id);
drop policy if exists "drawings_update_own" on public.drawings;
create policy "drawings_update_own" on public.drawings for update using (auth.uid() = user_id);
drop policy if exists "drawings_delete_own" on public.drawings;
create policy "drawings_delete_own" on public.drawings for delete using (auth.uid() = user_id);

-- バケット（公開・5MB・画像のみ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'drawings',
  'drawings',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage の RLS ポリシー
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
