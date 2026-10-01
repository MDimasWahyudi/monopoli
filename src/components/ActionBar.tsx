import { BOARD, JAIL_FINE, isBuyable } from "@/game/board";
import type { GameState } from "@/game/reducer";

const btn =
  "rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wider shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-8 sm:py-2.5 sm:text-base";

export default function ActionBar({
  state,
  busy,
  onRoll,
  onBuy,
  onDecline,
  onEndTurn,
  onPayJail,
}: {
  state: GameState;
  busy: boolean;
  onRoll: () => void;
  onBuy: () => void;
  onDecline: () => void;
  onEndTurn: () => void;
  onPayJail: () => void;
}) {
  const player = state.players[state.current];
  const tile = BOARD[player.position];
  return (
    <div className="absolute inset-x-0 bottom-[5%] flex flex-wrap items-center justify-center gap-2 px-2">
      {state.phase === "roll" && (
        <>
          <button
            className={`${btn} border-slate-300 bg-gradient-to-b from-slate-600 to-slate-800 text-white hover:from-slate-500`}
            onClick={onRoll}
            disabled={busy}
          >
            LEMPAR DADU
          </button>
          {player.inJail && (
            <button
              className={`${btn} border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-50`}
              onClick={onPayJail}
              disabled={busy || player.money < JAIL_FINE}
            >
              Bayar denda {JAIL_FINE}
            </button>
          )}
        </>
      )}
      {state.phase === "buy" && isBuyable(tile) && (
        <>
          <button
            className={`${btn} border-emerald-200 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white`}
            onClick={onBuy}
            disabled={busy || player.money < tile.price}
          >
            BELI {tile.name} ({tile.price})
          </button>
          <button
            className={`${btn} border-slate-300 bg-slate-100 text-slate-700 hover:bg-white`}
            onClick={onDecline}
            disabled={busy}
          >
            Lewati
          </button>
        </>
      )}
      {state.phase === "end" && (
        <button
          className={`${btn} border-sky-200 bg-gradient-to-b from-sky-400 to-sky-600 text-white`}
          onClick={onEndTurn}
          disabled={busy}
        >
          AKHIRI GILIRAN
        </button>
      )}
    </div>
  );
}
