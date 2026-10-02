"use client";

import { useEffect, useState } from "react";
import type { ClientAction } from "@/game/actions";
import type { GameState } from "@/game/reducer";
import ActionBar from "./ActionBar";
import Board from "./Board";
import DebtPanel from "./DebtPanel";
import Dice from "./Dice";
import GameLog from "./GameLog";
import ManagePanel from "./ManagePanel";
import PlayerPanel from "./PlayerPanel";
import RulesPanel from "./RulesPanel";
import TradeResponse from "./TradeResponse";
import { PLAYER_COLOR_NAMES, timing } from "./theme";
import { usePresenter } from "./usePresenter";

/** mySeat: null = satu perangkat (semua pemain), angka = kursi online, SPECTATOR = hanya menonton. */
export const SPECTATOR = -1;

export type MatchProps = {
  /** State otoritatif terbaru (dari reducer lokal atau server). */
  state: GameState;
  send: (action: ClientAction) => void;
  mySeat: number | null;
  /** Permintaan ke server sedang berjalan. */
  pending?: boolean;
  /** Pesan galat singkat dari server (mis. "Bukan giliranmu"). */
  notice?: string | null;
  /** Info tambahan di header: kode room dan status koneksi. */
  roomInfo?: { code: string; connected: boolean };
  onExit: () => void;
  exitLabel: string;
};

export default function Match({ state: target, send, mySeat, pending, notice, roomInfo, onExit, exitLabel }: MatchProps) {
  const [tm] = useState(timing);
  const { shown: state, moving, dice, busy } = usePresenter(target, tm);
  const [rules, setRules] = useState(false);
  // Panel kelola; boughtTile terisi saat dibuka otomatis setelah membeli tanah.
  const [building, setBuilding] = useState<{ boughtTile?: number } | null>(null);

  const current = state.players[state.current];
  const winner = state.winner !== null ? state.players[state.winner] : null;
  const positions = Object.fromEntries(state.players.map((p) => [p.id, moving[p.id] ?? p.position]));

  const local = mySeat === null;
  const spectator = mySeat === SPECTATOR;
  const myTurn = local || mySeat === state.current;
  const locked = busy || !!pending;

  // Panel milik pemain lain tidak boleh tampil di perangkat ini.
  useEffect(() => {
    if (!myTurn) setBuilding(null);
  }, [myTurn]);

  const me = !local && !spectator ? state.players[mySeat] : null;
  const trade = state.trade;
  const iAmResponder = !!trade && (local || mySeat === trade.to);
  const iAmProposer = !!trade && !local && mySeat === trade.from;

  return (
    <main className="table-bg min-h-screen overflow-x-hidden pb-10">
      <header className="flex flex-col items-center gap-2 px-3 pt-4">
        <h1 className="rounded-md border-4 border-white bg-red-600 px-5 py-1 text-xl font-extrabold tracking-wider text-white shadow-lg sm:text-3xl">
          MONOPOLI <span className="text-sm font-semibold tracking-widest sm:text-lg">NUSANTARA</span>
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="rounded-full bg-slate-900/80 px-4 py-1 text-xs font-bold tracking-wider text-white shadow sm:text-sm">
            {winner ? "GAME SELESAI" : "GILIRAN"}:{" "}
            <span style={{ color: (winner ?? current).color, filter: "brightness(1.35)" }}>
              {(winner ?? current).name.toUpperCase()} ({PLAYER_COLOR_NAMES[(winner ?? current).id].toUpperCase()})
            </span>
            {!local && !spectator && !winner && state.current === mySeat && <span className="ml-2 text-amber-300">· GILIRANMU</span>}
          </p>
          <button
            onClick={() => setRules(true)}
            className="rounded-full border-2 border-[#6d4524] bg-[#f3ecdc] px-3 py-0.5 text-xs font-bold text-[#6d4524] shadow hover:bg-white sm:text-sm"
          >
            📖 Aturan
          </button>
          {roomInfo && (
            <span className="rounded-full bg-white/80 px-3 py-0.5 text-xs font-bold text-slate-700 shadow sm:text-sm">
              Room {roomInfo.code}{" "}
              <span className={roomInfo.connected ? "text-emerald-600" : "text-red-600"}>
                ● {roomInfo.connected ? "tersambung" : "menyambung ulang…"}
              </span>
            </span>
          )}
        </div>
        {me && <p className="text-xs font-semibold text-slate-600">Kamu bermain sebagai {me.name}</p>}
        {spectator && <p className="text-xs font-semibold text-slate-600">Mode menonton</p>}
        {notice && <p className="rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow">{notice}</p>}
      </header>

      <div className="mx-auto mt-3 grid max-w-[1400px] gap-3 px-2 lg:grid-cols-[230px_minmax(0,1fr)_280px] lg:px-0 lg:pr-4">
        <aside className="lg:pt-10">
          <PlayerPanel state={state} />
          {!winner && myTurn && !spectator && (state.phase === "roll" || state.phase === "end") && !trade && (
            <button
              onClick={() => setBuilding({})}
              disabled={locked}
              className="mt-3 w-full rounded-full border-2 border-white/70 bg-gradient-to-b from-emerald-500 to-emerald-700 py-2 text-sm font-bold text-white shadow-lg disabled:opacity-40"
            >
              🏠 Kelola Properti
            </button>
          )}
        </aside>

        <div className="lg:-mt-2">
          <Board state={state} positions={positions} hopMs={tm.hop}>
            <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 justify-center">
              <Dice values={dice.values} rollId={dice.id} duration={tm.dice} />
            </div>
            {winner ? (
              <div className="pop-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 text-center text-white">
                <p className="text-xl font-extrabold sm:text-4xl">🎉 {winner.name} menang!</p>
                <button onClick={onExit} className="rounded-full bg-amber-400 px-6 py-2 font-bold text-slate-900 shadow-lg">
                  {local ? "Main lagi" : "Kembali ke beranda"}
                </button>
              </div>
            ) : myTurn && !spectator ? (
              <ActionBar
                state={state}
                busy={locked}
                onRoll={() => send({ type: "ROLL" })}
                onBuy={() => {
                  send({ type: "BUY" });
                  setBuilding({ boughtTile: current.position });
                }}
                onDecline={() => send({ type: "DECLINE" })}
                onEndTurn={() => send({ type: "END_TURN" })}
                onPayJail={() => send({ type: "PAY_JAIL" })}
              />
            ) : (
              <p className="absolute inset-x-0 bottom-[6%] mx-auto w-fit rounded-full bg-slate-900/75 px-4 py-1.5 text-xs font-bold text-white shadow sm:text-sm">
                ⏳ Menunggu {current.name}…
              </p>
            )}
          </Board>
        </div>

        <aside className="space-y-3 lg:pt-10">
          <GameLog log={state.log} />
          {local ? (
            <button
              onClick={() => confirm("Keluar dan mulai game baru?") && onExit()}
              className="text-sm text-slate-600 underline"
            >
              Game baru
            </button>
          ) : (
            <div className="flex gap-4 text-sm">
              {me && !me.bankrupt && !winner && (
                <button
                  onClick={() => confirm("Yakin menyerah? Kamu akan dinyatakan bangkrut.") && send({ type: "FORFEIT", player: me.id })}
                  className="text-red-700 underline"
                >
                  Menyerah
                </button>
              )}
              <button onClick={onExit} className="text-slate-600 underline">
                {exitLabel}
              </button>
            </div>
          )}
          {!local && !spectator && mySeat === 0 && !winner && (
            <details className="text-xs text-slate-600">
              <summary className="cursor-pointer">Pemain tidak merespons?</summary>
              <div className="mt-1 space-y-1">
                {state.players
                  .filter((p) => p.id !== 0 && !p.bankrupt)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => confirm(`Keluarkan ${p.name} dari game?`) && send({ type: "FORFEIT", player: p.id })}
                      className="mr-2 rounded-full bg-white/70 px-2 py-0.5 font-semibold underline"
                    >
                      Keluarkan {p.name}
                    </button>
                  ))}
              </div>
            </details>
          )}
        </aside>
      </div>

      {rules && <RulesPanel onClose={() => setRules(false)} />}
      {building && !winner && myTurn && !spectator && (
        <ManagePanel
          state={state}
          onAction={send}
          onClose={() => setBuilding(null)}
          boughtTile={building.boughtTile}
        />
      )}
      {!winner && state.phase === "debt" && myTurn && !spectator && <DebtPanel state={state} onAction={send} />}
      {!winner && state.phase === "debt" && !myTurn && (
        <p className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {current.name} sedang melunasi utang…
        </p>
      )}
      {!winner && trade && iAmResponder && <TradeResponse state={state} onAction={send} />}
      {!winner && trade && !iAmResponder && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
          🤝 {state.players[trade.to].name} sedang menjawab tawaran dari {state.players[trade.from].name}…
          {iAmProposer && (
            <button onClick={() => send({ type: "REJECT_TRADE" })} className="rounded-full bg-white/20 px-3 py-0.5 text-xs hover:bg-white/30">
              Batalkan
            </button>
          )}
        </div>
      )}
    </main>
  );
}
