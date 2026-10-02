"use client";

import { useCallback, useState } from "react";
import { resolveAction, type ClientAction } from "@/game/actions";
import { CARDS } from "@/game/board";
import { createGame, reducer, type GameState } from "@/game/reducer";
import Home from "./Home";
import Match from "./Match";
import Setup from "./Setup";

type Screen = { kind: "home" } | { kind: "local-setup" } | { kind: "local"; names: string[] };

export default function Game() {
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  if (screen.kind === "home") return <Home onLocal={() => setScreen({ kind: "local-setup" })} />;
  if (screen.kind === "local-setup")
    return <Setup onStart={(names) => setScreen({ kind: "local", names })} onBack={() => setScreen({ kind: "home" })} />;
  return <LocalMatch names={screen.names} onExit={() => setScreen({ kind: "home" })} />;
}

/** Mode satu perangkat: reducer dijalankan langsung di browser, dadu diacak dengan Math.random. */
function LocalMatch({ names, onExit }: { names: string[]; onExit: () => void }) {
  const [state, setState] = useState<GameState>(() => createGame(names));
  const send = useCallback(
    (action: ClientAction) => setState((s) => reducer(s, resolveAction(action, Math.random, CARDS.length))),
    [],
  );
  return <Match state={state} send={send} mySeat={null} onExit={onExit} exitLabel="Beranda" />;
}
