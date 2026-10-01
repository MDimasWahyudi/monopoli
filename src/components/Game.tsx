"use client";

import { useReducer, useState } from "react";
import { CARDS } from "@/game/board";
import { createGame, reducer } from "@/game/reducer";
import ActionBar from "./ActionBar";
import Board from "./Board";
import Dice from "./Dice";
import GameLog from "./GameLog";
import PlayerPanel from "./PlayerPanel";
import Setup from "./Setup";

const d6 = () => Math.floor(Math.random() * 6) + 1;

export default function Game() {
  const [names, setNames] = useState<string[] | null>(null);
  if (!names) return <Setup onStart={setNames} />;
  return <Match names={names} onExit={() => setNames(null)} />;
}

function Match({ names, onExit }: { names: string[]; onExit: () => void }) {
  const [state, dispatch] = useReducer(reducer, names, createGame);
  const winner = state.winner !== null ? state.players[state.winner] : null;

  return (
    <main className="mx-auto grid max-w-7xl gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
      <Board state={state}>
        <Dice dice={state.dice} />
        {winner ? (
          <div className="space-y-3">
            <p className="text-xl font-extrabold sm:text-3xl">🎉 {winner.name} menang!</p>
            <button onClick={onExit} className="rounded-lg bg-amber-400 px-5 py-2 font-bold text-slate-900">
              Main lagi
            </button>
          </div>
        ) : (
          <ActionBar
            state={state}
            onRoll={() =>
              dispatch({
                type: "ROLL",
                dice: [d6(), d6()],
                cardIndex: Math.floor(Math.random() * CARDS.length),
              })
            }
            onBuy={() => dispatch({ type: "BUY" })}
            onDecline={() => dispatch({ type: "DECLINE" })}
            onEndTurn={() => dispatch({ type: "END_TURN" })}
            onPayJail={() => dispatch({ type: "PAY_JAIL" })}
          />
        )}
      </Board>
      <aside className="space-y-4">
        <PlayerPanel state={state} />
        <GameLog log={state.log} />
        <button
          onClick={() => confirm("Keluar dan mulai game baru?") && onExit()}
          className="text-sm text-slate-400 underline"
        >
          Game baru
        </button>
      </aside>
    </main>
  );
}
