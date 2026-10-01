import { BOARD, JAIL_FINE, isBuyable } from "@/game/board";
import type { GameState } from "@/game/reducer";

const btn =
  "rounded-lg px-3 py-2 text-xs font-bold shadow transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:py-3 sm:text-sm";

export default function ActionBar({
  state,
  onRoll,
  onBuy,
  onDecline,
  onEndTurn,
  onPayJail,
}: {
  state: GameState;
  onRoll: () => void;
  onBuy: () => void;
  onDecline: () => void;
  onEndTurn: () => void;
  onPayJail: () => void;
}) {
  const player = state.players[state.current];
  const tile = BOARD[player.position];
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <p className="text-sm font-semibold sm:text-lg">
        Giliran <span style={{ color: player.color }}>{player.name}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {state.phase === "roll" && (
          <>
            <button className={`${btn} bg-amber-400 text-slate-900 hover:bg-amber-300`} onClick={onRoll}>
              🎲 Lempar Dadu
            </button>
            {player.inJail && (
              <button
                className={`${btn} bg-slate-600 hover:bg-slate-500`}
                onClick={onPayJail}
                disabled={player.money < JAIL_FINE}
              >
                Bayar denda {JAIL_FINE}
              </button>
            )}
          </>
        )}
        {state.phase === "buy" && isBuyable(tile) && (
          <>
            <button
              className={`${btn} bg-emerald-500 text-slate-900 hover:bg-emerald-400`}
              onClick={onBuy}
              disabled={player.money < tile.price}
            >
              Beli {tile.name} ({tile.price})
            </button>
            <button className={`${btn} bg-slate-600 hover:bg-slate-500`} onClick={onDecline}>
              Lewati
            </button>
          </>
        )}
        {state.phase === "end" && (
          <button className={`${btn} bg-sky-400 text-slate-900 hover:bg-sky-300`} onClick={onEndTurn}>
            Akhiri Giliran
          </button>
        )}
      </div>
    </div>
  );
}
