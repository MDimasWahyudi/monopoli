import type { ClientAction } from "@/game/actions";
import type { PublicRoom } from "@/server/rooms";

export type Identity = { seat: number; token: string };

const key = (code: string) => `monopoli:room:${code}`;

export function loadIdentity(code: string): Identity | null {
  try {
    const raw = localStorage.getItem(key(code));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return Number.isInteger(v?.seat) && typeof v?.token === "string" ? v : null;
  } catch {
    return null;
  }
}

export function saveIdentity(code: string, id: Identity) {
  try {
    localStorage.setItem(key(code), JSON.stringify(id));
  } catch {
    /* penyimpanan tidak tersedia: pemain harus bergabung ulang bila halaman dimuat ulang */
  }
}

export function clearIdentity(code: string) {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* abaikan */
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; code?: string };

async function call<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: body.error ?? "Terjadi kesalahan.", code: body.code };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: "Tidak bisa terhubung ke server." };
  }
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

type Joined = { room: PublicRoom; seat: number; token: string };

export const api = {
  create: (name: string) => call<Joined>("/api/rooms", post({ name })),
  join: (code: string, name: string) => call<Joined>(`/api/rooms/${code}/join`, post({ name })),
  fetchRoom: (code: string, since?: number) =>
    call<{ room: PublicRoom } | { unchanged: true; version: number }>(
      `/api/rooms/${code}${since !== undefined ? `?since=${since}` : ""}`,
    ),
  start: (code: string, id: Identity) => call<{ room: PublicRoom }>(`/api/rooms/${code}/start`, post(id)),
  action: (code: string, id: Identity, action: ClientAction) =>
    call<{ room: PublicRoom }>(`/api/rooms/${code}/action`, post({ ...id, action })),
};
