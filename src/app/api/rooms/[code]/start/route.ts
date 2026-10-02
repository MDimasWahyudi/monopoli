import { readJson, respond } from "@/server/http";
import { startGame } from "@/server/rooms";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await readJson(req);
  return respond((store) => startGame(store, code, body.seat, body.token));
}
