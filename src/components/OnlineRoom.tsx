"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientAction } from "@/game/actions";
import { PLAYER_COLORS } from "@/game/reducer";
import { api, clearIdentity, loadIdentity, saveIdentity, type Identity } from "@/lib/onlineApi";
import type { PublicRoom } from "@/server/rooms";
import Match, { SPECTATOR } from "./Match";
import RulesPanel from "./RulesPanel";
import { PLAYER_AVATARS } from "./theme";
import { useRoom } from "./useRoom";

const MAX_PLAYERS = 4;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="table-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] p-6 shadow-2xl">{children}</div>
    </main>
  );
}

export default function OnlineRoom({ code }: { code: string }) {
  const router = useRouter();
  const { room, notFound, connected, apply } = useRoom(code);
  // undefined = belum dibaca dari localStorage
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined);
  useEffect(() => setIdentity(loadIdentity(code)), [code]);

  if (notFound)
    return (
      <Shell>
        <h1 className="text-xl font-extrabold">Room tidak ditemukan</h1>
        <p className="text-sm text-slate-600">Kode {code} tidak ada atau sudah kedaluwarsa.</p>
        <button onClick={() => router.push("/")} className="w-full rounded-full bg-slate-700 py-2 font-bold text-white">
          Ke beranda
        </button>
      </Shell>
    );

  if (!room || identity === undefined)
    return (
      <Shell>
        <p className="text-center font-semibold text-slate-600">Memuat room {code}…</p>
      </Shell>
    );

  // Token dari room lama dengan kode sama: abaikan.
  const seat = identity && identity.seat < room.players.length ? identity : null;

  if (room.status === "lobby")
    return <Lobby room={room} identity={seat} onJoined={(id, r) => (saveIdentity(code, id), setIdentity(id), apply(r))} onStarted={apply} connected={connected} />;

  return (
    <OnlineMatch
      room={room}
      identity={seat}
      connected={connected}
      apply={apply}
      onStale={() => {
        clearIdentity(code);
        setIdentity(null);
      }}
      onExit={() => router.push("/")}
    />
  );
}

function OnlineMatch({
  room,
  identity,
  connected,
  apply,
  onStale,
  onExit,
}: {
  room: PublicRoom;
  identity: Identity | null;
  connected: boolean;
  apply: (r: PublicRoom) => void;
  onStale: () => void;
  onExit: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const send = useCallback(
    async (action: ClientAction) => {
      if (!identity || inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      const r = await api.action(room.code, identity, action);
      inFlight.current = false;
      setPending(false);
      if (r.ok) return apply(r.data.room);
      if (r.status === 401) return onStale();
      setNotice(r.error);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), 3500);
    },
    [identity, room.code, apply, onStale],
  );

  if (!room.state) return null;
  return (
    <Match
      state={room.state}
      send={send}
      mySeat={identity ? identity.seat : SPECTATOR}
      pending={pending}
      notice={notice}
      roomInfo={{ code: room.code, connected }}
      onExit={onExit}
      exitLabel="Keluar ke beranda"
    />
  );
}

function Lobby({
  room,
  identity,
  connected,
  onJoined,
  onStarted,
}: {
  room: PublicRoom;
  identity: Identity | null;
  connected: boolean;
  onJoined: (id: Identity, room: PublicRoom) => void;
  onStarted: (room: PublicRoom) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rules, setRules] = useState(false);

  const isHost = identity?.seat === 0;
  const link = typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Tidak bisa menyalin; salin tautan dari address bar.");
    }
  }

  async function join() {
    setBusy(true);
    setError(null);
    const r = await api.join(room.code, name.trim());
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onJoined({ seat: r.data.seat, token: r.data.token }, r.data.room);
  }

  async function start() {
    if (!identity) return;
    setBusy(true);
    setError(null);
    const r = await api.start(room.code, identity);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onStarted(r.data.room);
  }

  return (
    <Shell>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kode room</p>
        <p className="font-mono text-5xl font-extrabold tracking-[0.3em] text-[#6d4524]">{room.code}</p>
        <p className={`mt-1 text-xs font-semibold ${connected ? "text-emerald-600" : "text-red-600"}`}>
          ● {connected ? "tersambung" : "menyambung…"}
        </p>
      </div>
      <button onClick={copy} className="w-full rounded-full border-2 border-[#6d4524] py-2 text-sm font-bold text-[#6d4524] hover:bg-white/60">
        {copied ? "✓ Tautan disalin" : "🔗 Salin tautan undangan"}
      </button>

      <ul className="space-y-2">
        {Array.from({ length: MAX_PLAYERS }, (_, i) => {
          const p = room.players[i];
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${p ? "border-white/70 text-white" : "border-dashed border-slate-300 text-slate-400"}`}
              style={p ? { background: `linear-gradient(135deg, ${PLAYER_COLORS[i]}, color-mix(in srgb, ${PLAYER_COLORS[i]} 55%, black))` } : undefined}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-white/25 text-xl">
                {p ? PLAYER_AVATARS[i] : "·"}
              </span>
              <span className="flex-1 font-bold">{p ? p.name : "Menunggu pemain…"}</span>
              {p && i === 0 && <span className="rounded-full bg-black/30 px-2 text-xs">tuan rumah</span>}
              {p && identity?.seat === i && <span className="rounded-full bg-black/30 px-2 text-xs">kamu</span>}
            </li>
          );
        })}
      </ul>

      {!identity && room.players.length < MAX_PLAYERS && (
        <div className="space-y-2 rounded-xl border-2 border-[#6d4524] bg-white/70 p-3">
          <p className="text-sm font-bold">Gabung ke room ini</p>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namamu"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            aria-label="Namamu"
          />
          <button
            disabled={busy || !name.trim()}
            onClick={join}
            className="w-full rounded-full bg-gradient-to-b from-sky-400 to-sky-600 py-2 font-bold text-white disabled:opacity-40"
          >
            Gabung
          </button>
        </div>
      )}
      {!identity && room.players.length >= MAX_PLAYERS && <p className="text-center text-sm text-slate-600">Room penuh.</p>}

      {isHost && (
        <button
          disabled={busy || room.players.length < 2}
          onClick={start}
          className="w-full rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 py-3 text-lg font-bold tracking-wider text-white shadow-lg disabled:opacity-40"
        >
          {room.players.length < 2 ? "Menunggu minimal 2 pemain" : "MULAI GAME"}
        </button>
      )}
      {identity && !isHost && <p className="text-center text-sm font-semibold text-slate-600">⏳ Menunggu tuan rumah memulai game…</p>}
      {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

      <div className="flex justify-between text-sm">
        <button onClick={() => setRules(true)} className="font-bold text-[#6d4524] underline">
          📖 Aturan
        </button>
        <button onClick={() => router.push("/")} className="text-slate-500 underline">
          ← Beranda
        </button>
      </div>
      {rules && <RulesPanel onClose={() => setRules(false)} />}
    </Shell>
  );
}
