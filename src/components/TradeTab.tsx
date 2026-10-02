"use client";

import { useState } from "react";
import { BOARD, GROUP_COLORS } from "@/game/board";
import { isTradable, ownedTiles, validateTrade, type Action, type GameState, type Trade } from "@/game/reducer";

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function TradeSummary({ state, trade }: { state: GameState; trade: Trade }) {
  const from = state.players[trade.from];
  const to = state.players[trade.to];
  const list = (tiles: number[], cash: number) => (
    <ul className="space-y-1 text-sm">
      {tiles.map((t) => (
        <li key={t} className="flex items-center gap-2">
          <span
            className="h-4 w-2 rounded-sm"
            style={{ background: BOARD[t].type === "property" ? GROUP_COLORS[(BOARD[t] as { group: keyof typeof GROUP_COLORS }).group] : "#94a3b8" }}
          />
          {BOARD[t].name}
        </li>
      ))}
      {cash > 0 && <li className="font-semibold">💰 {money(cash)}</li>}
      {tiles.length === 0 && cash === 0 && <li className="text-slate-400">(tidak ada)</li>}
    </ul>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 rounded-lg border border-slate-300 bg-white p-3">
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-slate-500">{from.name} memberi</p>
        {list(trade.giveTiles, trade.giveMoney)}
      </div>
      <span className="self-center text-2xl">⇄</span>
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-slate-500">{to.name} memberi</p>
        {list(trade.getTiles, trade.getMoney)}
      </div>
    </div>
  );
}

export default function TradeTab({
  state,
  onAction,
  onSent,
}: {
  state: GameState;
  onAction: (a: Action) => void;
  onSent: () => void;
}) {
  const me = state.players[state.current];
  const others = state.players.filter((p) => !p.bankrupt && p.id !== me.id);
  const [partnerId, setPartnerId] = useState(others[0]?.id ?? -1);
  const [giveTiles, setGiveTiles] = useState<number[]>([]);
  const [getTiles, setGetTiles] = useState<number[]>([]);
  const [giveMoney, setGiveMoney] = useState(0);
  const [getMoney, setGetMoney] = useState(0);

  if (others.length === 0) return <p className="text-sm text-slate-600">Tidak ada pemain lain.</p>;

  const partner = state.players[partnerId];
  const toggle = (list: number[], set: (v: number[]) => void, t: number) =>
    set(list.includes(t) ? list.filter((x) => x !== t) : [...list, t]);
  const trade: Trade = { from: me.id, to: partnerId, giveTiles, giveMoney, getTiles, getMoney };
  const valid = validateTrade(state, trade);

  const column = (title: string, owner: number, picked: number[], set: (v: number[]) => void, cash: number, setCash: (n: number) => void) => (
    <div className="min-w-0 rounded-lg border border-slate-300 bg-white p-2">
      <p className="mb-1 truncate text-xs font-bold uppercase text-slate-500">{title}</p>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {ownedTiles(state, owner).map((t) => {
          const ok = isTradable(state, t);
          return (
            <label key={t} className={`flex items-center gap-1.5 text-xs ${ok ? "" : "opacity-40"}`}>
              <input type="checkbox" disabled={!ok} checked={picked.includes(t)} onChange={() => toggle(picked, set, t)} />
              <span
                className="h-3 w-1.5 shrink-0 rounded-sm"
                style={{ background: BOARD[t].type === "property" ? GROUP_COLORS[(BOARD[t] as { group: keyof typeof GROUP_COLORS }).group] : "#94a3b8" }}
              />
              <span className="truncate">
                {BOARD[t].name}
                {state.mortgaged[t] ? " (gadai)" : ""}
                {!ok ? " · ada bangunan" : ""}
              </span>
            </label>
          );
        })}
        {ownedTiles(state, owner).length === 0 && <p className="text-xs text-slate-400">Tidak punya properti</p>}
      </div>
      <label className="mt-2 flex items-center gap-1 text-xs">
        💰 Rp
        <input
          type="number"
          min={0}
          max={state.players[owner].money}
          step={10}
          value={cash}
          onChange={(e) => setCash(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="w-full rounded border border-slate-300 px-1 py-0.5"
        />
      </label>
    </div>
  );

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        Tukar dengan
        <select
          value={partnerId}
          onChange={(e) => {
            setPartnerId(Number(e.target.value));
            setGetTiles([]);
            setGetMoney(0);
          }}
          className="rounded border border-slate-300 bg-white px-2 py-1"
        >
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {column(`${me.name} memberi`, me.id, giveTiles, setGiveTiles, giveMoney, setGiveMoney)}
        {column(`${partner.name} memberi`, partnerId, getTiles, setGetTiles, getMoney, setGetMoney)}
      </div>
      <button
        disabled={!valid}
        onClick={() => {
          onAction({ type: "PROPOSE_TRADE", trade });
          onSent();
        }}
        className="w-full rounded-full bg-emerald-600 py-2 font-bold text-white disabled:opacity-30"
      >
        Ajukan tawaran ke {partner.name}
      </button>
      <p className="text-xs text-slate-500">
        {partner.name} akan diminta menerima atau menolak di perangkat ini. Properti yang ada bangunannya di grup
        tersebut tidak bisa ditukar; jual dulu bangunannya. Properti yang digadai berpindah dalam keadaan tetap digadai.
      </p>
    </div>
  );
}
