-- お絵描き保存用テーブル
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

create policy "drawings_select_own"
  on public.drawings for select
  using (auth.uid() = user_id);

create policy "drawings_insert_own"
  on public.drawings for insert
  with check (auth.uid() = user_id);

create policy "drawings_update_own"
  on public.drawings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "drawings_delete_own"
  on public.drawings for delete
  using (auth.uid() = user_id);
