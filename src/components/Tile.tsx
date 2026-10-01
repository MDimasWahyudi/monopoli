import { GROUP_COLORS, type Tile as TileData } from "@/game/board";
import type { Player } from "@/game/reducer";

const ICONS: Partial<Record<TileData["type"], string>> = {
  go: "➡️",
  jail: "⛓️",
  parking: "🅿️",
  gotojail: "👮",
  card: "❓",
  station: "🚆",
  utility: "💡",
  tax: "💸",
};

export default function Tile({
  tile,
  row,
  col,
  owner,
  players,
  active,
}: {
  tile: TileData;
  row: number;
  col: number;
  owner?: Player;
  players: Player[];
  active: boolean;
}) {
  const corner = (row === 0 || row === 10) && (col === 0 || col === 10);
  const price = "price" in tile ? tile.price : "amount" in tile ? tile.amount : null;
  return (
    <div
      style={{ gridRow: row + 1, gridColumn: col + 1 }}
      className={`relative flex min-w-0 flex-col overflow-hidden border border-slate-700 bg-slate-100 text-slate-900 ${
        active ? "z-10 ring-2 ring-white" : ""
      } ${corner ? "bg-slate-200" : ""}`}
    >
      {tile.type === "property" && (
        <div className="h-[18%] shrink-0" style={{ background: GROUP_COLORS[tile.group] }} />
      )}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-px text-center leading-tight">
        {ICONS[tile.type] && <span className="text-[10px] sm:text-sm">{ICONS[tile.type]}</span>}
        <span className="w-full break-words text-[6px] font-semibold sm:text-[9px]">{tile.name}</span>
        {price !== null && <span className="text-[6px] text-slate-600 sm:text-[8px]">{price}</span>}
      </div>
      {owner && <div className="h-[8%] shrink-0" style={{ background: owner.color }} title={`Milik ${owner.name}`} />}
      {players.length > 0 && (
        <div className="absolute inset-x-0 bottom-[10%] flex flex-wrap justify-center gap-px">
          {players.map((p) => (
            <span
              key={p.id}
              title={p.name}
              className="h-2 w-2 rounded-full border border-white shadow sm:h-3 sm:w-3"
              style={{ background: p.color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
