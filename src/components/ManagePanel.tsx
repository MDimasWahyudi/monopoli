"use client";

import { useState } from "react";
import type { Action, GameState } from "@/game/reducer";
import BuildTab from "./BuildTab";
import MortgageTab from "./MortgageTab";
import TradeTab from "./TradeTab";

export type ManageTab = "build" | "mortgage" | "trade";

const TABS: { id: ManageTab; label: string }[] = [
  { id: "build", label: "🏗️ Bangun" },
  { id: "mortgage", label: "💰 Gadai" },
  { id: "trade", label: "🤝 Tukar" },
];

export default function ManagePanel({
  state,
  onAction,
  onClose,
  initialTab = "build",
  boughtTile,
}: {
  state: GameState;
  onAction: (a: Action) => void;
  onClose: () => void;
  initialTab?: ManageTab;
  boughtTile?: number;
}) {
  const [tab, setTab] = useState<ManageTab>(initialTab);
  const player = state.players[state.current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div
        className="pop-in flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="text-lg font-extrabold">
            {boughtTile !== undefined ? `Properti dibeli! 🎉` : "Kelola properti"}
          </h2>
          <span className="font-semibold tabular-nums">Rp {player.money.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex gap-1 px-3 py-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-2 py-1 text-sm font-bold ${
                tab === t.id ? "bg-[#6d4524] text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto px-4 pb-2">
          {tab === "build" && <BuildTab state={state} onAction={onAction} boughtTile={boughtTile} />}
          {tab === "mortgage" && <MortgageTab state={state} onAction={onAction} />}
          {tab === "trade" && <TradeTab state={state} onAction={onAction} onSent={onClose} />}
        </div>
        <div className="p-3">
          <button onClick={onClose} className="w-full rounded-full bg-slate-700 py-2 font-bold text-white">
            {boughtTile !== undefined ? "Lanjut" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}
