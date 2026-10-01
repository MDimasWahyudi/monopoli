import { BOARD } from "@/game/board";
import type { GameState } from "@/game/reducer";
import Tile from "./Tile";

/** Posisi petak pada grid 11x11; petak 0 (START) di kanan bawah, berputar searah jarum jam terbalik. */
export function tileCoords(i: number): { row: number; col: number } {
  if (i <= 10) return { row: 10, col: 10 - i };
  if (i < 20) return { row: 20 - i, col: 0 };
  if (i <= 30) return { row: 0, col: i - 20 };
  return { row: i - 30, col: 10 };
}

export default function Board({ state, children }: { state: GameState; children: React.ReactNode }) {
  const current = state.players[state.current];
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[760px] grid-cols-[repeat(11,minmax(0,1fr))] grid-rows-[repeat(11,minmax(0,1fr))] border-2 border-slate-600 bg-emerald-900">
      {BOARD.map((tile, i) => {
        const { row, col } = tileCoords(i);
        const ownerId = state.owners[i];
        return (
          <Tile
            key={i}
            tile={tile}
            row={row}
            col={col}
            owner={ownerId === undefined ? undefined : state.players[ownerId]}
            players={state.players.filter((p) => !p.bankrupt && p.position === i)}
            active={current.position === i && !current.bankrupt}
          />
        );
      })}
      <div
        style={{ gridRow: "2 / 11", gridColumn: "2 / 11" }}
        className="flex flex-col items-center justify-center gap-2 p-2 text-center sm:gap-4"
      >
        {children}
      </div>
    </div>
  );
}
