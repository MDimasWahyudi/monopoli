"use client";

import { useEffect, useRef, useState } from "react";
import { CARDS } from "@/game/board";
import { movementPath } from "@/game/movement";
import { createGame, reducer, type Action, type GameState } from "@/game/reducer";
import ActionBar from "./ActionBar";
import Board from "./Board";
import Dice from "./Dice";
import GameLog from "./GameLog";
import PlayerPanel from "./PlayerPanel";
import Setup from "./Setup";
import { PLAYER_COLOR_NAMES, timing } from "./theme";

const d6 = () => Math.floor(Math.random() * 6) + 1;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Game() {
  const [names, setNames] = useState<string[] | null>(null);
  if (!names) return <Setup onStart={setNames} />;
  return <Match names={names} onExit={() => setNames(null)} />;
}

function Match({ names, onExit }: { names: string[]; onExit: () => void }) {
  const [state, setState] = useState<GameState>(() => createGame(names));
  const [busy, setBusy] = useState(false);
  const [dice, setDice] = useState<{ values: [number, number]; id: number }>({ values: [4, 3], id: 0 });
  // Posisi pion sementara selama animasi berjalan (pemain -> petak).
  const [moving, setMoving] = useState<Record<number, number>>({});
  const [tm] = useState(timing);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const current = state.players[state.current];
  const winner = state.winner !== null ? state.players[state.winner] : null;
  const positions = Object.fromEntries(state.players.map((p) => [p.id, moving[p.id] ?? p.position]));

  const act = (action: Action) => setState((s) => reducer(s, action));

  async function roll() {
    if (busy || state.phase !== "roll") return;
    const values: [number, number] = [d6(), d6()];
    const next = reducer(state, { type: "ROLL", dice: values, cardIndex: Math.floor(Math.random() * CARDS.length) });
    const path = movementPath(state, next, values);
    const playerId = state.current;

    setBusy(true);
    setDice((d) => ({ values, id: d.id + 1 }));
    await sleep(tm.dice + 150);
    for (const pos of path) {
      if (!alive.current) return;
      setMoving({ [playerId]: pos });
      await sleep(tm.hop);
    }
    if (!alive.current) return;
    // Uang, log, dan pilihan beli baru muncul setelah pion tiba.
    setState(next);
    setMoving({});
    setBusy(false);
  }

  return (
    <main className="table-bg min-h-screen overflow-x-hidden pb-10">
      <header className="flex flex-col items-center gap-2 px-3 pt-4">
        <h1 className="rounded-md border-4 border-white bg-red-600 px-5 py-1 text-xl font-extrabold tracking-wider text-white shadow-lg sm:text-3xl">
          MONOPOLI <span className="text-sm font-semibold tracking-widest sm:text-lg">NUSANTARA</span>
        </h1>
        <p className="rounded-full bg-slate-900/80 px-4 py-1 text-xs font-bold tracking-wider text-white shadow sm:text-sm">
          {winner ? "GAME SELESAI" : "GILIRAN"}:{" "}
          <span style={{ color: (winner ?? current).color, filter: "brightness(1.35)" }}>
            {(winner ?? current).name.toUpperCase()} ({PLAYER_COLOR_NAMES[(winner ?? current).id].toUpperCase()})
          </span>
        </p>
      </header>

      <div className="mx-auto mt-3 grid max-w-[1400px] gap-3 px-2 lg:grid-cols-[230px_minmax(0,1fr)_280px] lg:px-0 lg:pr-4">
        <aside className="lg:pt-10">
          <PlayerPanel state={state} />
        </aside>

        <div className="lg:-mt-2">
          <Board state={state} positions={positions} hopMs={tm.hop}>
            <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 justify-center">
              <Dice values={dice.values} rollId={dice.id} duration={tm.dice} />
            </div>
            {winner ? (
              <div className="pop-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 text-center text-white">
                <p className="text-xl font-extrabold sm:text-4xl">🎉 {winner.name} menang!</p>
                <button
                  onClick={onExit}
                  className="rounded-full bg-amber-400 px-6 py-2 font-bold text-slate-900 shadow-lg"
                >
                  Main lagi
                </button>
              </div>
            ) : (
              <ActionBar
                state={state}
                busy={busy}
                onRoll={roll}
                onBuy={() => act({ type: "BUY" })}
                onDecline={() => act({ type: "DECLINE" })}
                onEndTurn={() => act({ type: "END_TURN" })}
                onPayJail={() => act({ type: "PAY_JAIL" })}
              />
            )}
          </Board>
        </div>

        <aside className="space-y-3 lg:pt-10">
          <GameLog log={state.log} />
          <button
            onClick={() => confirm("Keluar dan mulai game baru?") && onExit()}
            className="text-sm text-slate-600 underline"
          >
            Game baru
          </button>
        </aside>
      </div>
    </main>
  );
}
