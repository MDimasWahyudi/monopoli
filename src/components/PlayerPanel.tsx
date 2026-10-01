import { BOARD, GROUP_COLORS } from "@/game/board";
import { ownedTiles, type GameState } from "@/game/reducer";

export default function PlayerPanel({ state }: { state: GameState }) {
  return (
    <div className="space-y-2">
      {state.players.map((p) => {
        const tiles = ownedTiles(state, p.id);
        const isCurrent = state.current === p.id && state.phase !== "over";
        return (
          <div
            key={p.id}
            className={`rounded-lg border p-3 ${isCurrent ? "border-white bg-slate-800" : "border-slate-700 bg-slate-900"} ${
              p.bankrupt ? "opacity-40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                {p.name}
                {p.inJail && <span title="Di penjara">⛓️</span>}
                {p.bankrupt && <span className="text-xs font-normal text-red-400">bangkrut</span>}
              </div>
              <span className="tabular-nums">Rp {p.money.toLocaleString("id-ID")}</span>
            </div>
            {tiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tiles.map((t) => {
                  const tile = BOARD[t];
                  const color = tile.type === "property" ? GROUP_COLORS[tile.group] : "#94a3b8";
                  return (
                    <span
                      key={t}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-900"
                      style={{ background: color }}
                    >
                      {tile.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
