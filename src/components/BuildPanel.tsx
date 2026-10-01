"use client";

import { BOARD, GROUP_COLORS, MAX_HOUSES, tilesInGroup, type ColorGroup } from "@/game/board";
import { canBuild, canSell, houseCost, ownsFullGroup, rentFor, type Action, type GameState } from "@/game/reducer";

const GROUPS: ColorGroup[] = ["brown", "lightblue", "pink", "orange", "red", "yellow", "green", "blue"];

export default function BuildPanel({
  state,
  onAction,
  onClose,
}: {
  state: GameState;
  onAction: (a: Action) => void;
  onClose: () => void;
}) {
  const player = state.players[state.current];
  const sets = GROUPS.filter((g) => ownsFullGroup(state, player.id, tilesInGroup(g)[0]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div
        className="pop-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Bangun rumah &amp; hotel</h2>
          <span className="font-semibold tabular-nums">Rp {player.money.toLocaleString("id-ID")}</span>
        </div>
        {sets.length === 0 ? (
          <p className="text-sm text-slate-600">
            Kamu belum memiliki satu grup warna penuh. Kumpulkan semua petak dalam satu warna untuk mulai membangun.
          </p>
        ) : (
          <div className="space-y-4">
            {sets.map((g) => (
              <div key={g} className="overflow-hidden rounded-lg border border-slate-300 bg-white">
                <div className="flex items-center justify-between px-3 py-1 text-xs font-bold" style={{ background: GROUP_COLORS[g] }}>
                  <span>Biaya per rumah: Rp {houseCost(tilesInGroup(g)[0])}</span>
                </div>
                {tilesInGroup(g).map((t) => {
                  const built = state.houses[t] ?? 0;
                  return (
                    <div key={t} className="flex items-center gap-2 border-t border-slate-200 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{BOARD[t].name}</p>
                        <p className="text-xs text-slate-500">
                          {built === MAX_HOUSES ? "Hotel" : `${built} rumah`} · sewa Rp {rentFor(state, t, 0)}
                        </p>
                      </div>
                      <button
                        className="h-8 w-8 rounded-full bg-slate-200 font-bold disabled:opacity-30"
                        disabled={!canSell(state, t)}
                        onClick={() => onAction({ type: "SELL", tile: t })}
                        aria-label={`Jual bangunan di ${BOARD[t].name}`}
                      >
                        −
                      </button>
                      <button
                        className="h-8 rounded-full bg-emerald-500 px-3 font-bold text-white disabled:opacity-30"
                        disabled={!canBuild(state, t)}
                        onClick={() => onAction({ type: "BUILD", tile: t })}
                        aria-label={`Bangun di ${BOARD[t].name}`}
                      >
                        + {built === MAX_HOUSES - 1 ? "Hotel" : "Rumah"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Bangun merata di tiap grup; jual bangunan mengembalikan setengah harga.</p>
        <button onClick={onClose} className="mt-3 w-full rounded-full bg-slate-700 py-2 font-bold text-white">
          Tutup
        </button>
      </div>
    </div>
  );
}
