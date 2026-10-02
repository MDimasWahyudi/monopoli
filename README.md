# Monopoli Nusantara

Game monopoli sederhana bertema kota-kota Indonesia (Next.js + TypeScript + Tailwind).

- **Satu perangkat**: 2–4 pemain bergantian di layar yang sama (tanpa server).
- **Online**: buat room, bagikan kode atau tautan, main bersama dari perangkat berbeda (2–4 pemain).
- Rumah & hotel, gadai, trading, fase utang, aturan main bergambar di dalam game.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit test logika game dan server room
npm run build
```

## Mode online

Arsitektur: **server otoritatif** di Vercel (API routes) + **Supabase** untuk penyimpanan dan Realtime.

- Semua aksi dikirim ke `/api/rooms/[code]/action`. Server memeriksa token kursi dan giliran, mengacak dadu
  (klien tidak bisa menentukan angka dadu), menjalankan reducer yang sama dengan mode lokal, lalu menyimpan
  state baru dengan kontrol versi (optimistic concurrency).
- Browser berlangganan perubahan tabel `rooms` lewat Supabase Realtime; polling ringan jadi cadangan.
- Token kursi hanya disimpan sebagai hash di tabel `seats` yang tidak bisa dibaca klien.

### Setup Supabase

1. Buat proyek di [supabase.com](https://supabase.com) (tier gratis cukup).
2. Buka **SQL Editor**, tempel isi [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**.
3. Di **Project Settings → API**, salin `Project URL`, `anon public` key, dan `service_role` key.
4. Lokal: salin `.env.example` menjadi `.env.local` dan isi ketiganya. Restart `npm run dev`.
5. Vercel: **Project → Settings → Environment Variables**, tambahkan tiga variabel yang sama
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), lalu redeploy.

> `SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia: jangan memakai awalan `NEXT_PUBLIC_` dan jangan di-commit.

Tanpa variabel Supabase, saat pengembangan (`npm run dev`) server memakai penyimpanan **memori** sehingga mode online
tetap bisa dicoba di satu mesin (polling tiap 2 detik, data hilang saat server restart). Di produksi tanpa konfigurasi,
tombol online menampilkan pesan "belum dikonfigurasi" sementara mode satu perangkat tetap jalan.

### Catatan

- Room lama tidak dihapus otomatis; lihat contoh query pembersihan di `supabase/schema.sql`.
- Pemain yang meninggalkan game: tuan rumah bisa mengeluarkannya ("Pemain tidak merespons?"), pemain juga bisa menyerah sendiri.
- Identitas pemain disimpan di `localStorage`, jadi memuat ulang halaman atau kembali ke tautan room tetap masuk sebagai pemain yang sama di browser itu.

## Struktur

```
src/game/        logika murni (board, reducer, aksi, jalur gerak) – dipakai klien dan server
src/server/      penyimpanan room (Supabase + memori), logika room, helper HTTP
src/app/api/     API routes
src/components/  UI (papan 3D, panel, lobi, Match)
supabase/        skema SQL
```

Deploy: import repo ini di Vercel (framework Next.js terdeteksi otomatis) dan isi environment variable di atas untuk mode online.
