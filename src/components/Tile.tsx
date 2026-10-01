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

type Side = "bottom" | "left" | "top" | "right" | "corner";

function sideOf(row: number, col: number): Side {
  if ((row === 0 || row === 10) && (col === 0 || col === 10)) return "corner";
  if (row === 10) return "bottom";
  if (col === 0) return "left";
  if (row === 0) return "top";
  return "right";
}

// Pita warna ada di sisi yang menghadap ke tengah papan; penanda pemilik di sisi luar.
const LAYOUT: Record<Side, { flex: string; band: string; owner: string }> = {
  bottom: { flex: "flex-col", band: "h-[24%] w-full", owner: "bottom-0 left-0 h-[9%] w-full" },
  top: { flex: "flex-col-reverse", band: "h-[24%] w-full", owner: "top-0 left-0 h-[9%] w-full" },
  left: { flex: "flex-row-reverse", band: "w-[24%] h-full", owner: "left-0 top-0 w-[9%] h-full" },
  right: { flex: "flex-row", band: "w-[24%] h-full", owner: "right-0 top-0 w-[9%] h-full" },
  corner: { flex: "flex-col", band: "", owner: "" },
};

export default function Tile({
  tile,
  row,
  col,
  owner,
  active,
}: {
  tile: TileData;
  row: number;
  col: number;
  owner?: Player;
  active: boolean;
}) {
  const side = sideOf(row, col);
  const layout = LAYOUT[side];
  const price = "price" in tile ? tile.price : "amount" in tile ? tile.amount : null;
  const corner = side === "corner";
  return (
    <div
      style={{ gridRow: row + 1, gridColumn: col + 1 }}
      className={`tile-bg relative flex min-w-0 border border-emerald-900/40 text-emerald-950 ${layout.flex} ${
        active ? "tile-active z-10" : ""
      }`}
    >
      {tile.type === "property" && (
        <div className={`shrink-0 border-emerald-900/40 ${layout.band}`} style={{ background: GROUP_COLORS[tile.group] }} />
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-px text-center leading-[1.05]">
        {ICONS[tile.type] && (
          <span className={corner ? "text-lg sm:text-3xl" : "text-[10px] sm:text-base"}>{ICONS[tile.type]}</span>
        )}
        <span
          className={`w-full break-words font-bold ${
            corner ? "text-[7px] sm:text-xs" : "text-[6px] sm:text-[9px] lg:text-[10px]"
          }`}
        >
          {tile.name}
        </span>
        {price !== null && <span className="text-[6px] opacity-70 sm:text-[9px]">{price}</span>}
      </div>
      {owner && (
        <div
          className={`absolute ${layout.owner}`}
          style={{ background: owner.color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)" }}
          title={`Milik ${owner.name}`}
        />
      )}
    </div>
  );
}
