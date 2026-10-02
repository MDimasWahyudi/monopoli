"use client";

import type { Action, GameState } from "@/game/reducer";
import { PLAYER_AVATARS } from "./theme";
import { TradeSummary } from "./TradeTab";

/** Muncul untuk pemain tujuan; menahan permainan sampai tawaran dijawab. */
export default function TradeResponse({ state, onAction }: { state: GameState; onAction: (a: Action) => void }) {
  const trade = state.trade;
  if (!trade) return null;
  const to = state.players[trade.to];
  const from = state.players[trade.from];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="pop-in w-full max-w-md space-y-3 rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-4 shadow-2xl">
        <h2 className="text-lg font-extrabold">
          {PLAYER_AVATARS[to.id]} {to.name}, ada tawaran dari {from.name}!
        </h2>
        <p className="text-sm text-slate-600">Serahkan perangkat kepada {to.name}, lalu pilih jawaban.</p>
        <TradeSummary state={state} trade={trade} />
        <div className="flex gap-2">
          <button onClick={() => onAction({ type: "REJECT_TRADE" })} className="flex-1 rounded-full bg-slate-300 py-2 font-bold">
            Tolak
          </button>
          <button
            onClick={() => onAction({ type: "ACCEPT_TRADE" })}
            className="flex-1 rounded-full bg-emerald-600 py-2 font-bold text-white"
          >
            Terima
          </button>
        </div>
      </div>
    </div>
  );
}
