-- ============================================================
-- Supabase Storage + drawings.image_url
-- 002 実行済みの場合: このファイルを SQL Editor で実行
-- ============================================================

-- image_data → image_url に変更（既存環境用）
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'drawings'
      and column_name = 'image_data'
  ) then
    alter table public.drawings rename column image_data to image_url;
  end if;
end $$;

alter table public.drawings add column if not exists image_url text;

comment on column public.drawings.image_url is
  'Supabase Storage 上の画像の公開 URL';

-- Storage バケット（公開読み取り・認証ユーザーのみアップロード）
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

-- 自分のフォルダ（{user_id}/...）にのみアップロード・更新・削除
create policy "drawings_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'drawings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "drawings_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'drawings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "drawings_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'drawings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 公開バケット: 画像の読み取り（URL を知っている人が閲覧可能）
create policy "drawings_storage_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'drawings');
