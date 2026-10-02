-- Skema Supabase untuk Monopoli Nusantara (mode online).
-- Jalankan di Supabase Dashboard → SQL Editor.

create table if not exists public.rooms (
  code        text primary key,
  status      text not null default 'lobby' check (status in ('lobby', 'playing', 'over')),
  players     jsonb not null default '[]'::jsonb,   -- daftar nama pemain di lobi (indeks = kursi)
  state       jsonb,                                  -- GameState saat bermain
  version     integer not null default 0,             -- naik tiap perubahan (kontrol konkurensi)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Token kursi (di-hash) disimpan terpisah dan TIDAK bisa dibaca klien.
create table if not exists public.seats (
  code        text not null references public.rooms (code) on delete cascade,
  seat        integer not null,
  token_hash  text not null,
  primary key (code, seat)
);

alter table public.rooms enable row level security;
alter table public.seats enable row level security;

-- Klien (anon) hanya boleh MEMBACA rooms, untuk Realtime. Semua tulis lewat server (service role).
drop policy if exists "rooms dapat dibaca" on public.rooms;
create policy "rooms dapat dibaca" on public.rooms for select using (true);
-- Tabel seats sengaja tanpa policy: anon tidak bisa membaca atau menulis.

-- Aktifkan Realtime untuk tabel rooms.
alter table public.rooms replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

-- (Opsional) Bersihkan room lama, mis. lewat pg_cron:
--   delete from public.rooms where updated_at < now() - interval '2 days';
