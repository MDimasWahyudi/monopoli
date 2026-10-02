import { describe, expect, it } from "vitest";
import { applyAction, createRoom, getRoom, joinRoom, startGame } from "@/server/rooms";
import { MemoryStore, type RoomStore } from "@/server/store";

async function setup(players = 2) {
  const store = new MemoryStore();
  const host = await createRoom(store, "Dimas");
  if (!host.ok) throw new Error("create gagal");
  const code = host.room.code;
  const seats = [{ seat: host.seat, token: host.token }];
  for (let i = 1; i < players; i++) {
    const j = await joinRoom(store, code, `P${i + 1}`);
    if (!j.ok) throw new Error("join gagal");
    seats.push({ seat: j.seat, token: j.token });
  }
  return { store, code, seats };
}

describe("lobi", () => {
  it("membuat room dengan kode 5 karakter dan tuan rumah di kursi 0", async () => {
    const store = new MemoryStore();
    const r = await createRoom(store, "  Dimas   Wahyudi  ");
    expect(r.ok && r.room.code).toMatch(/^[A-Z2-9]{5}$/);
    expect(r.ok && r.seat).toBe(0);
    expect(r.ok && r.room.players[0].name).toBe("Dimas Wahyudi");
    expect(r.ok && r.room.status).toBe("lobby");
  });

  it("tidak membocorkan token ke data publik", async () => {
    const { store, code, seats } = await setup(2);
    const r = await getRoom(store, code);
    expect(JSON.stringify(r)).not.toContain(seats[0].token);
    expect(JSON.stringify(r)).not.toContain("token");
  });

  it("join mendapat kursi berurutan, kode tidak sensitif huruf, penuh di 4 pemain", async () => {
    const { store, code } = await setup(4);
    const full = await joinRoom(store, code.toLowerCase(), "Lima");
    expect(full).toMatchObject({ ok: false, status: 409 });
    expect((await joinRoom(store, "ZZZZZ", "x")).ok).toBe(false);
  });

  it("dua pemain bergabung bersamaan mendapat kursi berbeda", async () => {
    const store = new MemoryStore();
    const host = await createRoom(store, "H");
    if (!host.ok) throw new Error();
    const [a, b] = await Promise.all([joinRoom(store, host.room.code, "A"), joinRoom(store, host.room.code, "B")]);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(new Set([a.seat, b.seat]).size).toBe(2);
  });

  it("hanya tuan rumah yang bisa memulai, minimal 2 pemain", async () => {
    const solo = await setup(1);
    expect(await startGame(solo.store, solo.code, 0, solo.seats[0].token)).toMatchObject({ ok: false, status: 409 });
    const { store, code, seats } = await setup(3);
    expect(await startGame(store, code, 1, seats[1].token)).toMatchObject({ ok: false, status: 403 });
    expect(await startGame(store, code, 0, "token-palsu")).toMatchObject({ ok: false, status: 401 });
    const started = await startGame(store, code, 0, seats[0].token);
    expect(started.ok && started.room.status).toBe("playing");
    expect(started.ok && started.room.state?.players).toHaveLength(3);
    expect(await joinRoom(store, code, "Telat")).toMatchObject({ ok: false, status: 409 });
  });
});

describe("aksi game", () => {
  it("hanya pemain giliran yang bisa melempar; dadu diacak server", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    expect(await applyAction(store, code, 1, seats[1].token, { type: "ROLL" })).toMatchObject({ ok: false, status: 403 });
    const r = await applyAction(store, code, 0, seats[0].token, { type: "ROLL", dice: [6, 6] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.room.state?.rolls).toBe(1);
      expect(r.room.state?.dice).toHaveLength(2);
      expect(r.room.version).toBeGreaterThan(1);
    }
  });

  it("menolak token salah, kursi milik orang lain, dan aksi sampah", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    expect(await applyAction(store, code, 0, seats[1].token, { type: "ROLL" })).toMatchObject({ ok: false, status: 401 });
    expect(await applyAction(store, code, "0", seats[0].token, { type: "ROLL" })).toMatchObject({ ok: false, status: 401 });
    expect(await applyAction(store, code, 0, seats[0].token, { type: "HACK" })).toMatchObject({ ok: false, status: 400 });
    expect(await applyAction(store, code, 0, seats[0].token, { type: "BUILD", tile: 999 })).toMatchObject({ ok: false, status: 400 });
  });

  it("aksi tidak valid pada fase sekarang ditolak tanpa mengubah versi", async () => {
    const { store, code, seats } = await setup(2);
    const s = await startGame(store, code, 0, seats[0].token);
    const v = s.ok ? s.room.version : -1;
    expect(await applyAction(store, code, 0, seats[0].token, { type: "END_TURN" })).toMatchObject({ ok: false, status: 409 });
    const r = await getRoom(store, code);
    expect(r.ok && r.room.version).toBe(v);
  });

  it("bermain beberapa giliran sampai ganti pemain", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    let current = 0;
    for (let i = 0; i < 6; i++) {
      const tok = seats[current].token;
      let r = await applyAction(store, code, current, tok, { type: "ROLL" });
      if (!r.ok) throw new Error(r.error);
      if (r.room.state?.phase === "buy") r = await applyAction(store, code, current, tok, { type: "DECLINE" });
      if (r.ok && r.room.state?.phase === "end") r = await applyAction(store, code, current, tok, { type: "END_TURN" });
      if (!r.ok) throw new Error(r.error);
      current = r.room.state!.current;
    }
    const final = await getRoom(store, code);
    expect(final.ok && final.room.state!.rolls).toBeGreaterThanOrEqual(6);
  });

  it("menyerah: tuan rumah menang bila lawan menyerah, status room jadi over", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    const r = await applyAction(store, code, 1, seats[1].token, { type: "FORFEIT", player: 1 });
    expect(r.ok && r.room.status).toBe("over");
    expect(r.ok && r.room.state?.winner).toBe(0);
    expect(await applyAction(store, code, 0, seats[0].token, { type: "ROLL" })).toMatchObject({ ok: false, status: 409 });
  });

  it("tuan rumah dapat mengeluarkan pemain yang menghilang", async () => {
    const { store, code, seats } = await setup(3);
    await startGame(store, code, 0, seats[0].token);
    const r = await applyAction(store, code, 0, seats[0].token, { type: "FORFEIT", player: 2 });
    expect(r.ok && r.room.state?.players[2].bankrupt).toBe(true);
    expect(r.ok && r.room.status).toBe("playing");
  });
});

describe("konkurensi", () => {
  it("mengulang bila versi berubah di tengah jalan", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    // Penyimpanan yang menyisipkan satu pembaruan lain tepat sebelum update pertama.
    let injected = false;
    const racing: RoomStore = {
      get: (c) => store.get(c),
      create: (r, h) => store.create(r, h),
      addSeat: (c, s, h) => store.addSeat(c, s, h),
      seatHash: (c, s) => store.seatHash(c, s),
      async update(c, v, patch) {
        if (!injected) {
          injected = true;
          const row = await store.get(c);
          await store.update(c, v, { players: row!.players }); // naikkan versi
        }
        return store.update(c, v, patch);
      },
    };
    const r = await applyAction(racing, code, 0, seats[0].token, { type: "ROLL" });
    expect(r.ok).toBe(true);
    expect(injected).toBe(true);
  });

  it("dua ROLL bersamaan: hanya satu yang berhasil", async () => {
    const { store, code, seats } = await setup(2);
    await startGame(store, code, 0, seats[0].token);
    const results = await Promise.all([
      applyAction(store, code, 0, seats[0].token, { type: "ROLL" }),
      applyAction(store, code, 0, seats[0].token, { type: "ROLL" }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const final = await getRoom(store, code);
    expect(final.ok && final.room.state!.rolls).toBe(1);
  });
});
