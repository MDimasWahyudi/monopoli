# Monopoli Nusantara

Game monopoli sederhana bertema kota-kota Indonesia (Next.js + TypeScript + Tailwind).
MVP saat ini: mode hot-seat 2–4 pemain dalam satu perangkat, lengkap dengan rumah & hotel.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit test logika game
npm run build
```

Logika game ada di `src/game` (murni, tanpa React) sehingga bisa dipakai ulang untuk multiplayer nanti.
Deploy: import repo ini di Vercel, tanpa konfigurasi tambahan.
