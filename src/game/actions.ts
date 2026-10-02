import { BOARD_SIZE } from "./board";
import type { Action, GameState, Trade } from "./reducer";

/** Aksi yang dikirim klien: lemparan dadu tidak membawa angka (diacak oleh server/pengendali). */
export type ClientAction = Exclude<Action, { type: "ROLL" }> | { type: "ROLL" };

const SIMPLE = new Set(["BUY", "DECLINE", "END_TURN", "PAY_JAIL", "PAY_DEBT", "DECLARE_BANKRUPT", "ACCEPT_TRADE", "REJECT_TRADE", "ROLL"]);
const TILE = new Set(["BUILD", "SELL", "MORTGAGE", "UNMORTGAGE"]);

const isTile = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < BOARD_SIZE;
const isTileList = (x: unknown): x is number[] => Array.isArray(x) && x.length <= BOARD_SIZE && x.every(isTile);
const isMoney = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 1_000_000;
const isSeat = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < 8;

/** Memeriksa bentuk aksi dari input tak tepercaya. Mengembalikan null bila tidak valid. */
export function sanitizeAction(raw: unknown): ClientAction | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const type = a.type;
  if (typeof type !== "string") return null;
  if (SIMPLE.has(type)) return { type } as ClientAction;
  if (TILE.has(type)) return isTile(a.tile) ? ({ type, tile: a.tile } as ClientAction) : null;
  if (type === "FORFEIT") return isSeat(a.player) ? { type, player: a.player } : null;
  if (type === "PROPOSE_TRADE") {
    const t = a.trade as Record<string, unknown> | undefined;
    if (!t || typeof t !== "object") return null;
    if (!isSeat(t.from) || !isSeat(t.to)) return null;
    if (!isTileList(t.giveTiles) || !isTileList(t.getTiles) || !isMoney(t.giveMoney) || !isMoney(t.getMoney)) return null;
    const trade: Trade = {
      from: t.from,
      to: t.to,
      giveTiles: t.giveTiles,
      giveMoney: t.giveMoney,
      getTiles: t.getTiles,
      getMoney: t.getMoney,
    };
    return { type, trade };
  }
  return null;
}

export type Rng = () => number; // [0, 1)

/** Mengubah aksi klien menjadi aksi reducer; ROLL mendapat dadu dan kartu acak. */
export function resolveAction(action: ClientAction, rng: Rng, cardCount: number): Action {
  if (action.type !== "ROLL") return action;
  const d6 = () => Math.floor(rng() * 6) + 1;
  return { type: "ROLL", dice: [d6(), d6()], cardIndex: Math.floor(rng() * cardCount) };
}

/** Siapa (kursi) yang berhak mengirim aksi ini pada state sekarang. */
export function seatMayAct(state: GameState, seat: number, action: ClientAction): boolean {
  switch (action.type) {
    case "ACCEPT_TRADE":
      return !!state.trade && seat === state.trade.to;
    case "REJECT_TRADE":
      return !!state.trade && (seat === state.trade.to || seat === state.trade.from);
    case "FORFEIT":
      return seat === action.player || seat === 0; // tuan rumah boleh mengeluarkan pemain yang menghilang
    case "PROPOSE_TRADE":
      return seat === state.current && action.trade.from === seat;
    default:
      return seat === state.current;
  }
}
