"use client";

import { BOARD, GROUP_COLORS } from "@/game/board";
import {
  canMortgage,
  canSell,
  canUnmortgage,
  houseCost,
  mortgageValue,
  ownedTiles,
  unmortgageCost,
  type Action,
  type GameState,
} from "@/game/reducer";

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Daftar properti pemain aktif dengan tombol gadai / tebus, dan jual bangunan bila ada. */
export default function MortgageTab({ state, onAction }: { state: GameState; onAction: (a: Action) => void }) {
  const player = state.players[state.current];
  const tiles = ownedTiles(state, player.id);

  if (tiles.length === 0) return <p className="text-sm text-slate-600">Kamu belum memiliki properti.</p>;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        {tiles.map((t, i) => {
          const tile = BOARD[t];
          const color = tile.type === "property" ? GROUP_COLORS[tile.group] : "#94a3b8";
          const built = state.houses[t] ?? 0;
          const gadai = !!state.mortgaged[t];
          return (
            <div key={t} className={`flex items-center gap-2 px-3 py-2 text-sm ${i ? "border-t border-slate-200" : ""} ${gadai ? "bg-slate-100" : ""}`}>
              <span className="h-6 w-2 shrink-0 rounded-sm" style={{ background: color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {tile.name} {gadai && <span className="rounded bg-slate-600 px-1 text-[10px] text-white">GADAI</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {gadai
                    ? `Tebus ${money(unmortgageCost(t))}`
                    : built > 0
                      ? `${built === 5 ? "Hotel" : `${built} rumah`} · jual bangunan dulu`
                      : `Nilai gadai ${money(mortgageValue(t))}`}
                </p>
              </div>
              {built > 0 && (
                <button
                  className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold disabled:opacity-30"
                  disabled={!canSell(state, t)}
                  onClick={() => onAction({ type: "SELL", tile: t })}
                  title={`Jual satu bangunan, +${money(houseCost(t) / 2)}`}
                >
                  Jual bangunan
                </button>
              )}
              {gadai ? (
                <button
                  className="rounded-full bg-sky-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
                  disabled={!canUnmortgage(state, t)}
                  onClick={() => onAction({ type: "UNMORTGAGE", tile: t })}
                >
                  Tebus
                </button>
              ) : (
                <button
                  className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
                  disabled={!canMortgage(state, t)}
                  onClick={() => onAction({ type: "MORTGAGE", tile: t })}
                >
                  Gadai
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Properti yang digadai menerima setengah harga dari bank dan tidak menghasilkan sewa. Menebusnya butuh harga gadai + 10%.
        Properti dengan bangunan baru bisa digadai setelah semua bangunan di grupnya dijual.
      </p>
    </div>
  );
}
