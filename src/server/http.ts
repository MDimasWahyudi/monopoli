import { ConfigError, getStore } from "./getStore";
import type { RoomStore } from "./store";
import type { Fail } from "./rooms";

type Handler = (store: RoomStore) => Promise<{ ok: true; [k: string]: unknown } | Fail>;

/** Membungkus logika room menjadi Response JSON dengan penanganan galat seragam. */
export async function respond(handler: Handler): Promise<Response> {
  try {
    const result = await handler(getStore());
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
    const { ok: _ok, ...body } = result;
    void _ok;
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ConfigError) return Response.json({ error: e.message, code: "not_configured" }, { status: 503 });
    console.error("[monopoli] API error:", e);
    return Response.json({ error: "Terjadi kesalahan di server." }, { status: 500 });
  }
}

/** Membaca body JSON; mengembalikan objek kosong bila tidak valid. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
