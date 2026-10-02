import { readJson, respond } from "@/server/http";
import { createRoom } from "@/server/rooms";

export async function POST(req: Request) {
  const body = await readJson(req);
  return respond((store) => createRoom(store, body.name));
}
