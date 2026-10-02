"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, saveIdentity } from "@/lib/onlineApi";
import RulesPanel from "./RulesPanel";

const NAME_KEY = "monopoli:name";

export default function Home({ onLocal }: { onLocal: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* abaikan */
    }
  }, []);

  async function enter(kind: "create" | "join") {
    setError(null);
    const trimmed = name.trim();
    const c = code.trim().toUpperCase();
    if (!trimmed) return setError("Isi nama kamu dulu.");
    if (kind === "join" && c.length < 4) return setError("Masukkan kode room.");
    try {
      localStorage.setItem(NAME_KEY, trimmed);
    } catch {
      /* abaikan */
    }
    setBusy(true);
    const r = kind === "create" ? await api.create(trimmed) : await api.join(c, trimmed);
    setBusy(false);
    if (!r.ok) {
      return setError(
        r.code === "not_configured"
          ? "Mode online belum dikonfigurasi di server ini (Supabase)."
          : r.status === 404
            ? "Room dengan kode itu tidak ditemukan."
            : r.error,
      );
    }
    saveIdentity(r.data.room.code, { seat: r.data.seat, token: r.data.token });
    router.push(`/room/${r.data.room.code}`);
  }

  return (
    <main className="table-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-6 shadow-2xl">
        <div className="text-center">
          <h1 className="inline-block rounded-md border-4 border-white bg-red-600 px-4 py-1 text-2xl font-extrabold tracking-wider text-white shadow">
            MONOPOLI
          </h1>
          <p className="mt-2 text-sm font-semibold tracking-widest text-slate-600">NUSANTARA</p>
        </div>

        <button
          onClick={onLocal}
          className="w-full rounded-xl border-2 border-[#6d4524] bg-white/70 px-4 py-3 text-left font-bold hover:bg-white"
        >
          👥 Main di satu perangkat
          <span className="block text-xs font-normal text-slate-500">Gantian di layar yang sama, 2–4 pemain</span>
        </button>

        <div className="space-y-3 rounded-xl border-2 border-[#6d4524] bg-white/70 p-4">
          <p className="font-bold">🌐 Main online</p>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namamu"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            aria-label="Namamu"
          />
          <button
            disabled={busy}
            onClick={() => enter("create")}
            className="w-full rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 py-2.5 font-bold text-white shadow active:scale-95 disabled:opacity-50"
          >
            Buat room baru
          </button>
          <div className="flex gap-2">
            <input
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KODE"
              className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono tracking-widest"
              aria-label="Kode room"
            />
            <button
              disabled={busy}
              onClick={() => enter("join")}
              className="flex-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-600 py-2 font-bold text-white shadow active:scale-95 disabled:opacity-50"
            >
              Gabung room
            </button>
          </div>
          {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        </div>

        <button
          onClick={() => setRules(true)}
          className="w-full rounded-full border-2 border-[#6d4524] py-2 text-sm font-bold text-[#6d4524] hover:bg-white/60"
        >
          📖 Baca aturan main
        </button>
      </div>
      {rules && <RulesPanel onClose={() => setRules(false)} />}
    </main>
  );
}
