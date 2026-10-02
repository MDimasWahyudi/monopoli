"use client";

import type { Action, GameState } from "@/game/reducer";
import MortgageTab from "./MortgageTab";

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Muncul otomatis saat pemain kekurangan uang tetapi masih punya aset yang bisa dicairkan. */
export default function DebtPanel({ state, onAction }: { state: GameState; onAction: (a: Action) => void }) {
  const debt = state.debt;
  if (!debt) return null;
  const p = state.players[state.current];
  const creditor = debt.creditor === null ? "Bank" : state.players[debt.creditor].name;
  const short = Math.max(0, debt.amount - p.money);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="pop-in flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-4 border-red-700 bg-[#f3ecdc] shadow-2xl">
        <div className="bg-red-700 px-4 py-2 text-white">
          <h2 className="font-extrabold">⚠️ {p.name} harus membayar {money(debt.amount)}</h2>
          <p className="text-sm">
            ke {creditor} · uangmu {money(p.money)}
            {short > 0 ? ` · kurang ${money(short)}` : " · sudah cukup!"}
          </p>
        </div>
        <div className="overflow-y-auto p-3">
          <p className="mb-2 text-sm text-slate-600">
            Gadaikan properti atau jual bangunan untuk mengumpulkan uang, lalu bayar. Bila menyerah, kamu bangkrut.
          </p>
          <MortgageTab state={state} onAction={onAction} />
        </div>
        <div className="flex gap-2 p-3">
          <button
            onClick={() => confirm("Yakin menyerah dan bangkrut?") && onAction({ type: "DECLARE_BANKRUPT" })}
            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
          >
            Menyerah
          </button>
          <button
            disabled={short > 0}
            onClick={() => onAction({ type: "PAY_DEBT" })}
            className="flex-1 rounded-full bg-emerald-600 py-2 font-bold text-white disabled:opacity-30"
          >
            Bayar {money(debt.amount)}
          </button>
        </div>
      </div>
    </div>
  );
}
