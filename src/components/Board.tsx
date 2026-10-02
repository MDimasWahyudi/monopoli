import { BOARD } from "@/game/board";
import type { GameState } from "@/game/reducer";
import { Hotel, House } from "./Buildings";
import CenterDecor from "./CenterDecor";
import Pawn from "./Pawn";
import Tile from "./Tile";

/** Posisi petak pada grid 11x11; petak 0 (START) di kanan bawah, berputar searah jarum jam terbalik. */
export function tileCoords(i: number): { row: number; col: number } {
  if (i <= 10) return { row: 10, col: 10 - i };
  if (i < 20) return { row: 20 - i, col: 0 };
  if (i <= 30) return { row: 0, col: i - 20 };
  return { row: i - 30, col: 10 };
}

const CELL = 100 / 11;

/** Titik dasar bangunan ke-n di sepanjang pita warna petak (satuan sel, relatif ke sudut kiri-atas petak). */
function buildingAnchor(i: number, slot: number, slots: number): { x: number; y: number } {
  const { row, col } = tileCoords(i);
  const t = (slot + 0.5) / slots;
  if (row === 10) return { x: col + t, y: row + 0.3 };
  if (row === 0) return { x: col + t, y: row + 0.97 };
  if (col === 0) return { x: col + 0.86, y: row + t * 0.8 + 0.18 };
  return { x: col + 0.14, y: row + t * 0.8 + 0.18 };
}

export default function Board({
  state,
  positions,
  hopMs,
  children,
}: {
  state: GameState;
  /** Posisi pion yang ditampilkan (bisa tertinggal dari state saat animasi berjalan). */
  positions: Record<number, number>;
  hopMs: number;
  children: React.ReactNode;
}) {
  const current = state.players[state.current];
  const alive = state.players.filter((p) => !p.bankrupt);

  return (
    <div className="scene w-full">
      <div className="plane mx-auto w-full max-w-[min(880px,calc(100vh-150px))] min-w-[300px]">
        <div className="frame relative rounded-2xl p-[2.2%]">
          <i className="corner -left-[0.8%] -top-[0.8%]" />
          <i className="corner -right-[0.8%] -top-[0.8%]" />
          <i className="corner -bottom-[0.8%] -left-[0.8%]" />
          <i className="corner -bottom-[0.8%] -right-[0.8%]" />

          <div className="preserve3d relative aspect-square">
            <div
              className="grid h-full w-full grid-cols-[repeat(11,minmax(0,1fr))] grid-rows-[repeat(11,minmax(0,1fr))]"
              style={{ transform: "translateZ(0)" }}
            >
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
                    mortgaged={!!state.mortgaged[i]}
                    active={!current.bankrupt && positions[current.id] === i && state.phase !== "over"}
                  />
                );
              })}
              <div
                style={{ gridRow: "2 / 11", gridColumn: "2 / 11" }}
                className="center-bg relative overflow-hidden"
              >
                <CenterDecor />
                {children}
              </div>
            </div>

            {/* Lapisan pion: berdiri tegak di atas papan yang miring */}
            <div className="preserve3d pointer-events-none absolute inset-0">
              {Object.entries(state.houses).flatMap(([tileStr, count]) => {
                const i = Number(tileStr);
                const hotel = count === 5;
                const slots = hotel ? 1 : 4;
                return Array.from({ length: hotel ? 1 : count }, (_, slot) => {
                  const { x, y } = buildingAnchor(i, slot, slots);
                  const w = hotel ? 0.5 : 0.24;
                  return (
                    <div
                      key={`${i}-${slot}-${hotel}`}
                      className="pop-in absolute"
                      style={{
                        left: `${x * CELL}%`,
                        top: `${y * CELL}%`,
                        width: `${CELL * w}%`,
                        aspectRatio: hotel ? "60 / 56" : "40 / 44",
                        transform: "translate(-50%, -100%) rotateX(calc(var(--tilt) * -1))",
                        transformOrigin: "50% 100%",
                        zIndex: tileCoords(i).row * 10,
                      }}
                    >
                      {hotel ? <Hotel /> : <House />}
                    </div>
                  );
                });
              })}
              {alive.map((p) => {
                const pos = positions[p.id];
                const { row, col } = tileCoords(pos);
                const stack = alive.filter((q) => positions[q.id] === pos);
                const idx = stack.findIndex((q) => q.id === p.id);
                const dx = (idx - (stack.length - 1) / 2) * 0.3;
                const isCurrent = p.id === current.id && state.phase !== "over";
                return (
                  <div
                    key={p.id}
                    className="absolute"
                    style={{
                      left: `${(col + 0.5 + dx) * CELL}%`,
                      top: `${(row + 0.78) * CELL}%`,
                      width: `${CELL * 0.5}%`,
                      aspectRatio: "2 / 3",
                      transform: "translate(-50%, -100%) rotateX(calc(var(--tilt) * -1))",
                      transformOrigin: "50% 100%",
                      transition: `left ${hopMs}ms linear, top ${hopMs}ms linear`,
                      zIndex: row * 10 + idx,
                    }}
                  >
                    <div
                      key={pos}
                      className="hop h-full w-full drop-shadow-[0_3px_2px_rgba(0,0,0,0.5)]"
                      style={{ ["--hop-ms" as string]: `${hopMs}ms` }}
                    >
                      <div className={`h-full w-full ${isCurrent ? "pawn-active" : ""}`}>
                        <Pawn color={p.color} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
