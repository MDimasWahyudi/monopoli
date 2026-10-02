import { MemoryStore, type RoomStore } from "./store";
import { SupabaseStore } from "./supabaseStore";

export class ConfigError extends Error {}

const g = globalThis as unknown as { __monopoliStore?: RoomStore };

/**
 * Supabase bila NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terisi.
 * Tanpa itu: penyimpanan memori hanya di luar produksi (untuk coba-coba lokal); di produksi → ConfigError.
 */
export function getStore(): RoomStore {
  if (g.__monopoliStore) return g.__monopoliStore;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    g.__monopoliStore = new SupabaseStore(url, key);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("[monopoli] Supabase belum dikonfigurasi: memakai penyimpanan memori (hanya untuk pengembangan).");
    g.__monopoliStore = new MemoryStore();
  } else {
    throw new ConfigError("Mode online belum dikonfigurasi (Supabase).");
  }
  return g.__monopoliStore;
}
