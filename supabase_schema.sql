-- Bảng chuẩn hóa nhiều cấp cho FlashCard MinMin (Chịu tải hàng nghìn thẻ, không bị nghẽn 1 cục JSON)
create table if not exists public.mm_folders (
  id text primary key,
  name text not null,
  icon text default '📁',
  parent_id text null,
  created_at timestamptz default now()
);

create table if not exists public.mm_decks (
  id text primary key,
  folder_id text null,
  name text not null,
  updated_at text,
  created_at timestamptz default now()
);

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
