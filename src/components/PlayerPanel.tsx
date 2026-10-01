import { BOARD, GROUP_COLORS } from "@/game/board";
import { ownedTiles, type GameState } from "@/game/reducer";
import { PLAYER_AVATARS } from "./theme";

export default function PlayerPanel({ state }: { state: GameState }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
      {state.players.map((p) => {
        const tiles = ownedTiles(state, p.id);
        const isCurrent = state.current === p.id && state.phase !== "over";
        return (
          <div
            key={p.id}
            className={`relative rounded-xl border-2 p-2 text-white shadow-lg transition sm:p-3 lg:rounded-l-none ${
              isCurrent ? "border-white lg:translate-x-2 lg:scale-[1.03]" : "border-white/30"
            } ${p.bankrupt ? "opacity-40 grayscale" : ""}`}
            style={{ background: `linear-gradient(135deg, ${p.color}, color-mix(in srgb, ${p.color} 55%, black))` }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-white/25 text-xl sm:h-11 sm:w-11 sm:text-2xl">
                {PLAYER_AVATARS[p.id]}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                  {p.name} {p.inJail && "⛓️"}
                </p>
                <p className="text-sm font-semibold tabular-nums sm:text-lg [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                  {p.bankrupt ? "Bangkrut" : `Rp ${p.money.toLocaleString("id-ID")}`}
                </p>
              </div>
            </div>
            <div className="mt-2 flex min-h-3 flex-wrap gap-1">
              {tiles.map((t) => {
                const tile = BOARD[t];
                const color = tile.type === "property" ? GROUP_COLORS[tile.group] : "#cbd5e1";
                return (
                  <span
                    key={t}
                    title={tile.name}
                    className="h-3 w-4 rounded-sm border border-white/70 shadow-sm sm:h-3.5 sm:w-5"
                    style={{ background: color }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
