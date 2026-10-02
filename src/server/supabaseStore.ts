import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RoomPatch, RoomRow, RoomStore } from "./store";

const COLUMNS = "code,status,players,state,version";

/** Implementasi RoomStore di atas tabel `rooms` dan `seats` (lihat supabase/schema.sql). */
export class SupabaseStore implements RoomStore {
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async get(code: string) {
    const { data, error } = await this.db.from("rooms").select(COLUMNS).eq("code", code).maybeSingle();
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data as RoomRow | null) ?? null;
  }

  async create(row: RoomRow, hostTokenHash: string) {
    const { error } = await this.db.from("rooms").insert(row);
    if (error) {
      if (error.code === "23505") return false; // kode sudah ada
      throw new Error(`Supabase: ${error.message}`);
    }
    await this.addSeat(row.code, 0, hostTokenHash);
    return true;
  }

  async addSeat(code: string, seat: number, tokenHash: string) {
    const { error } = await this.db.from("seats").insert({ code, seat, token_hash: tokenHash });
    if (error) throw new Error(`Supabase: ${error.message}`);
  }

  async seatHash(code: string, seat: number) {
    const { data, error } = await this.db
      .from("seats")
      .select("token_hash")
      .eq("code", code)
      .eq("seat", seat)
      .maybeSingle();
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data?.token_hash as string | undefined) ?? null;
  }

  async update(code: string, expectedVersion: number, patch: RoomPatch) {
    const { data, error } = await this.db
      .from("rooms")
      .update({ ...patch, version: expectedVersion + 1, updated_at: new Date().toISOString() })
      .eq("code", code)
      .eq("version", expectedVersion)
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data as RoomRow | null) ?? null;
  }
}
