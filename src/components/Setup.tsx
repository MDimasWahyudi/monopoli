"use client";

import { useState } from "react";
import { PLAYER_COLORS } from "@/game/reducer";
import { PLAYER_AVATARS } from "./theme";

export default function Setup({ onStart }: { onStart: (names: string[]) => void }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["", "", "", ""]);

  return (
    <main className="table-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-6 shadow-2xl">
        <div className="text-center">
          <h1 className="inline-block rounded-md border-4 border-white bg-red-600 px-4 py-1 text-2xl font-extrabold tracking-wider text-white shadow">
            MONOPOLI
          </h1>
          <p className="mt-2 text-sm font-semibold tracking-widest text-slate-600">NUSANTARA</p>
          <p className="mt-1 text-sm text-slate-500">Main bergantian dalam satu perangkat.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Jumlah pemain</p>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 rounded-lg border-2 py-2 font-bold ${
                  count === n ? "border-[#6d4524] bg-[#6d4524] text-white" : "border-[#6d4524]/30"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: count }, (_, i) => (
            <label key={i} className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-lg shadow"
                style={{ background: PLAYER_COLORS[i] }}
              >
                {PLAYER_AVATARS[i]}
              </span>
              <input
                value={names[i]}
                maxLength={16}
                placeholder={`Pemain ${i + 1}`}
                onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          ))}
        </div>
        <button
          onClick={() => onStart(names.slice(0, count))}
          className="w-full rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 py-3 text-lg font-bold tracking-wider text-white shadow-lg active:scale-95"
        >
          MULAI GAME
        </button>
      </div>
    </main>
  );
}
