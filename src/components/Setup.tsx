"use client";

import { useState } from "react";
import { PLAYER_COLORS } from "@/game/reducer";

export default function Setup({ onStart }: { onStart: (names: string[]) => void }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["", "", "", ""]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Monopoli Nusantara</h1>
        <p className="mt-1 text-slate-400">Main bergantian dalam satu perangkat.</p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Jumlah pemain</p>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`flex-1 rounded-lg border py-2 font-bold ${
                count === n ? "border-amber-400 bg-amber-400 text-slate-900" : "border-slate-600"
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
            <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: PLAYER_COLORS[i] }} />
            <input
              value={names[i]}
              maxLength={16}
              placeholder={`Pemain ${i + 1}`}
              onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
        ))}
      </div>
      <button
        onClick={() => onStart(names.slice(0, count))}
        className="rounded-lg bg-emerald-500 py-3 text-lg font-bold text-slate-900 hover:bg-emerald-400"
      >
        Mulai Game
      </button>
    </main>
  );
}
