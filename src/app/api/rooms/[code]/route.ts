import { respond } from "@/server/http";
import { getRoom } from "@/server/rooms";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const since = Number(new URL(req.url).searchParams.get("since"));
  return respond(async (store) => {
    const r = await getRoom(store, code);
    // Hemat bandwidth saat polling: tidak ada perubahan sejak versi `since`.
    if (r.ok && Number.isFinite(since) && r.room.version === since) return { ok: true as const, unchanged: true, version: since };
    return r;
  });
}
