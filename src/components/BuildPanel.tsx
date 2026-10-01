"use client";

import { BOARD, GROUP_COLORS, MAX_HOUSES, tilesInGroup, type ColorGroup } from "@/game/board";
import { canBuild, canSell, houseCost, ownsFullGroup, rentFor, type Action, type GameState } from "@/game/reducer";

const GROUPS: ColorGroup[] = ["brown", "lightblue", "pink", "orange", "red", "yellow", "green", "blue"];

export default function BuildPanel({
  state,
  onAction,
  onClose,
  boughtTile,
}: {
  state: GameState;
  onAction: (a: Action) => void;
  onClose: () => void;
  /** Petak yang baru saja dibeli; bila ada, panel dibuka dengan sambutan pembelian. */
  boughtTile?: number;
}) {
  const player = state.players[state.current];
  const sets = GROUPS.filter((g) => ownsFullGroup(state, player.id, tilesInGroup(g)[0]));
  const partial = GROUPS.filter((g) => {
    if (sets.includes(g)) return false;
    return tilesInGroup(g).some((t) => state.owners[t] === player.id);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div
        className="pop-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">
            {boughtTile !== undefined ? `${BOARD[boughtTile].name} dibeli! 🎉` : "Bangun rumah & hotel"}
          </h2>
          <span className="font-semibold tabular-nums">Rp {player.money.toLocaleString("id-ID")}</span>
        </div>
        {boughtTile !== undefined && sets.length > 0 && (
          <p className="mb-3 text-sm text-slate-600">Mau langsung membangun rumah atau hotel? Pilih di bawah, atau lewati.</p>
        )}
        {sets.length === 0 ? (
          <p className="text-sm text-slate-600">
            Belum ada kelompok warna yang lengkap, jadi belum bisa membangun. Kumpulkan semua petak dalam satu warna.
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
        {partial.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Progres kelompok warna</p>
            <div className="space-y-1">
              {partial.map((g) => {
                const all = tilesInGroup(g);
                const mine = all.filter((t) => state.owners[t] === player.id).length;
                return (
                  <div key={g} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-5 rounded-sm border border-black/20" style={{ background: GROUP_COLORS[g] }} />
                    <span className="flex-1 truncate text-slate-600">{all.map((t) => BOARD[t].name).join(", ")}</span>
                    <span className="font-semibold tabular-nums">
                      {mine}/{all.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Bangun merata di tiap grup; jual bangunan mengembalikan setengah harga.</p>
        <button onClick={onClose} className="mt-3 w-full rounded-full bg-slate-700 py-2 font-bold text-white">
          {boughtTile !== undefined ? "Lanjut" : "Tutup"}
        </button>
      </div>
    </div>
  );
}
