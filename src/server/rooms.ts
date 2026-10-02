import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { resolveAction, sanitizeAction, seatMayAct } from "@/game/actions";
import { CARDS } from "@/game/board";
import { createGame, reducer } from "@/game/reducer";
import type { RoomRow, RoomStore } from "./store";

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter yang mudah tertukar

export type Fail = { ok: false; status: number; error: string };
export type Ok<T> = { ok: true } & T;
type Result<T> = Ok<T> | Fail;

const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");

function secureRng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

function newCode(): string {
  let c = "";
  for (let i = 0; i < 5; i++) c += CODE_ALPHABET[Math.floor(secureRng() * CODE_ALPHABET.length)];
  return c;
}

export const normalizeCode = (c: string) => c.trim().toUpperCase();

function cleanName(name: unknown, fallback: string): string {
  if (typeof name !== "string") return fallback;
  const n = name.replace(/\s+/g, " ").trim().slice(0, 16);
  return n || fallback;
}

/** Data room yang aman dikirim ke klien (tanpa token). */
export type PublicRoom = Pick<RoomRow, "code" | "status" | "players" | "state" | "version">;
const toPublic = (r: RoomRow): PublicRoom => ({
  code: r.code,
  status: r.status,
  players: r.players,
  state: r.state,
  version: r.version,
});

export async function createRoom(store: RoomStore, name: unknown): Promise<Result<{ room: PublicRoom; seat: number; token: string }>> {
  const token = newToken();
  const players = [{ name: cleanName(name, "Pemain 1") }];
  for (let i = 0; i < 8; i++) {
    const row: RoomRow = { code: newCode(), status: "lobby", players, state: null, version: 0 };
    if (await store.create(row, hash(token))) return { ok: true, room: toPublic(row), seat: 0, token };
  }
  return fail(503, "Gagal membuat kode room, coba lagi.");
}

export async function getRoom(store: RoomStore, code: string): Promise<Result<{ room: PublicRoom }>> {
  const row = await store.get(normalizeCode(code));
  return row ? { ok: true, room: toPublic(row) } : fail(404, "Room tidak ditemukan.");
}

export async function joinRoom(store: RoomStore, code: string, name: unknown): Promise<Result<{ room: PublicRoom; seat: number; token: string }>> {
  const c = normalizeCode(code);
  const token = newToken();
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await store.get(c);
    if (!row) return fail(404, "Room tidak ditemukan.");
    if (row.status !== "lobby") return fail(409, "Game sudah dimulai.");
    if (row.players.length >= MAX_PLAYERS) return fail(409, "Room penuh.");
    const seat = row.players.length;
    const players = [...row.players, { name: cleanName(name, `Pemain ${seat + 1}`) }];
    const updated = await store.update(c, row.version, { players });
    if (!updated) continue; // bentrok dengan pemain lain yang bergabung bersamaan
    await store.addSeat(c, seat, hash(token));
    return { ok: true, room: toPublic(updated), seat, token };
  }
  return fail(409, "Server sibuk, coba lagi.");
}

/** Memverifikasi token kursi; perbandingan waktu-konstan. */
async function authSeat(store: RoomStore, code: string, seat: unknown, token: unknown): Promise<boolean> {
  if (!Number.isInteger(seat) || typeof token !== "string" || token.length > 100) return false;
  const stored = await store.seatHash(code, seat as number);
  if (!stored) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(hash(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startGame(store: RoomStore, code: string, seat: unknown, token: unknown): Promise<Result<{ room: PublicRoom }>> {
  const c = normalizeCode(code);
  if (!(await authSeat(store, c, seat, token))) return fail(401, "Tidak berhak.");
  if (seat !== 0) return fail(403, "Hanya tuan rumah yang bisa memulai game.");
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await store.get(c);
    if (!row) return fail(404, "Room tidak ditemukan.");
    if (row.status !== "lobby") return fail(409, "Game sudah dimulai.");
    if (row.players.length < MIN_PLAYERS) return fail(409, `Butuh minimal ${MIN_PLAYERS} pemain.`);
    const state = createGame(row.players.map((p) => p.name));
    const updated = await store.update(c, row.version, { status: "playing", state });
    if (updated) return { ok: true, room: toPublic(updated) };
  }
  return fail(409, "Server sibuk, coba lagi.");
}

export async function applyAction(
  store: RoomStore,
  code: string,
  seat: unknown,
  token: unknown,
  rawAction: unknown,
): Promise<Result<{ room: PublicRoom }>> {
  const c = normalizeCode(code);
  if (!(await authSeat(store, c, seat, token))) return fail(401, "Tidak berhak.");
  const action = sanitizeAction(rawAction);
  if (!action) return fail(400, "Aksi tidak valid.");

  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await store.get(c);
    if (!row) return fail(404, "Room tidak ditemukan.");
    if (row.status !== "playing" || !row.state) return fail(409, "Game belum berjalan atau sudah selesai.");
    if (!seatMayAct(row.state, seat as number, action)) return fail(403, "Bukan giliranmu.");
    const next = reducer(row.state, resolveAction(action, secureRng, CARDS.length));
    if (next === row.state) return fail(409, "Aksi tidak bisa dilakukan sekarang.");
    const updated = await store.update(c, row.version, {
      state: next,
      status: next.phase === "over" ? "over" : "playing",
    });
    if (updated) return { ok: true, room: toPublic(updated) };
    // versi berubah saat kita menghitung: ulangi dengan state terbaru
  }
  return fail(409, "Server sibuk, coba lagi.");
}
