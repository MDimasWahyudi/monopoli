import type { GameState } from "@/game/reducer";

export type RoomStatus = "lobby" | "playing" | "over";

export type RoomRow = {
  code: string;
  status: RoomStatus;
  /** Daftar pemain di lobi; indeks = nomor kursi = id pemain di game. */
  players: { name: string }[];
  state: GameState | null;
  /** Naik tiap perubahan; dipakai untuk kontrol konkurensi dan sinkronisasi klien. */
  version: number;
};

export type RoomPatch = Partial<Pick<RoomRow, "status" | "players" | "state">>;

/** Penyimpanan room. Semua tulis lewat server (service role); token kursi tidak pernah masuk ke RoomRow. */
export interface RoomStore {
  get(code: string): Promise<RoomRow | null>;
  /** false bila kode sudah dipakai. */
  create(row: RoomRow, hostTokenHash: string): Promise<boolean>;
  addSeat(code: string, seat: number, tokenHash: string): Promise<void>;
  seatHash(code: string, seat: number): Promise<string | null>;
  /** Menulis hanya bila versi masih sama; mengembalikan baris baru (version+1) atau null bila bentrok. */
  update(code: string, expectedVersion: number, patch: RoomPatch): Promise<RoomRow | null>;
}

/** Penyimpanan dalam memori untuk pengembangan lokal dan test (tidak dipakai di produksi). */
export class MemoryStore implements RoomStore {
  private rooms = new Map<string, RoomRow>();
  private seats = new Map<string, string>();

  async get(code: string) {
    const r = this.rooms.get(code);
    return r ? structuredClone(r) : null;
  }

  async create(row: RoomRow, hostTokenHash: string) {
    if (this.rooms.has(row.code)) return false;
    this.rooms.set(row.code, structuredClone(row));
    this.seats.set(`${row.code}:0`, hostTokenHash);
    return true;
  }

  async addSeat(code: string, seat: number, tokenHash: string) {
    this.seats.set(`${code}:${seat}`, tokenHash);
  }

  async seatHash(code: string, seat: number) {
    return this.seats.get(`${code}:${seat}`) ?? null;
  }

  async update(code: string, expectedVersion: number, patch: RoomPatch) {
    const r = this.rooms.get(code);
    if (!r || r.version !== expectedVersion) return null;
    const next: RoomRow = { ...r, ...structuredClone(patch), version: r.version + 1 };
    this.rooms.set(code, next);
    return structuredClone(next);
  }
}
