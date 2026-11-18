-- ==============================================================================
-- FlashCard MinMin: Schema Supabase PostgreSQL (Chuẩn hóa đồ án & Đội nhóm)
-- ==============================================================================

-- 1. Bảng lưu trữ gói tổng hợp minmin_store (JSON Snapshot)
create table if not exists public.minmin_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.minmin_store enable row level security;
drop policy if exists "Public access minmin_store" on public.minmin_store;
create policy "Public access minmin_store" on public.minmin_store for all using (true) with check (true);
grant all on public.minmin_store to anon, authenticated;

-- 2. Bảng chuẩn hóa quan hệ nhiều cấp (Relational Architecture)
create table if not exists public.mm_folders (
  id text primary key,
  name text not null,
  icon text default '📁',
  author text default '',
  parent_id text null,
  created_at timestamptz default now()
);

create table if not exists public.mm_decks (
  id text primary key,
  folder_id text null,
  name text not null,
  note text default '',
  author text default '',
  updated_at text,
  created_at timestamptz default now()
);

-- Bổ sung cột cho các database đã tạo trước đó
alter table public.mm_folders add column if not exists author text default '';
alter table public.mm_decks add column if not exists note text default '';
alter table public.mm_decks add column if not exists author text default '';

create table if not exists public.mm_cards (
  id text primary key,
  deck_id text not null references public.mm_decks(id) on delete cascade,
  type text default 'basic',
  front text not null,
  back text not null,
  hint text default '',
  extra text default '',
  image text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_mm_cards_deck on public.mm_cards(deck_id);
create index if not exists idx_mm_decks_folder on public.mm_decks(folder_id);

alter table public.mm_folders enable row level security;
alter table public.mm_decks enable row level security;
alter table public.mm_cards enable row level security;

drop policy if exists "Public access mm_folders" on public.mm_folders;
create policy "Public access mm_folders" on public.mm_folders for all using (true) with check (true);

drop policy if exists "Public access mm_decks" on public.mm_decks;
create policy "Public access mm_decks" on public.mm_decks for all using (true) with check (true);

drop policy if exists "Public access mm_cards" on public.mm_cards;
create policy "Public access mm_cards" on public.mm_cards for all using (true) with check (true);

grant all on public.mm_folders to anon, authenticated;
grant all on public.mm_decks to anon, authenticated;
grant all on public.mm_cards to anon, authenticated;
