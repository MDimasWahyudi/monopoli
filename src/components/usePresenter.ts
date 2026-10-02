"use client";

import { useEffect, useRef, useState } from "react";
import { movementPath } from "@/game/movement";
import type { GameState } from "@/game/reducer";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Timing = { dice: number; hop: number };

/**
 * Menampilkan perubahan state secara bertahap: lemparan dadu → pion berjalan → baru state akhir
 * (uang, log, pilihan beli) muncul. Dipakai bersama oleh mode lokal dan online, di mana state
 * baru bisa datang kapan saja (dari reducer lokal atau dari server).
 */
export function usePresenter(target: GameState, tm: Timing) {
  const [shown, setShown] = useState(target);
  const [moving, setMoving] = useState<Record<number, number>>({});
  const [dice, setDice] = useState<{ values: [number, number]; id: number }>({
    values: target.dice ?? [4, 3],
    id: 0,
  });
  const [busy, setBusy] = useState(false);

  const shownRef = useRef(target);
  const lastTarget = useRef(target);
  const queue = useRef<GameState[]>([]);
  const running = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (target === lastTarget.current) return;
    lastTarget.current = target;
    queue.current.push(target);
    if (running.current) return;
    running.current = true;
    setBusy(true);

    (async () => {
      while (queue.current.length && alive.current) {
        // Tertinggal jauh (mis. tab lama tidak aktif): lompat langsung ke state terbaru.
        if (queue.current.length > 2) queue.current = [queue.current[queue.current.length - 1]];
        const next = queue.current.shift()!;
        const prev = shownRef.current;
        if (next.rolls === prev.rolls + 1 && next.dice) {
          const values = next.dice;
          setDice((d) => ({ values, id: d.id + 1 }));
          await sleep(tm.dice + 150);
          for (const pos of movementPath(prev, next, values)) {
            if (!alive.current) return;
            setMoving({ [prev.current]: pos });
            await sleep(tm.hop);
          }
          setMoving({});
        }
        if (!alive.current) return;
        shownRef.current = next;
        setShown(next);
      }
      running.current = false;
      setBusy(false);
    })();
  }, [target, tm]);

  return { shown, moving, dice, busy };
}
