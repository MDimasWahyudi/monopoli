import { describe, expect, it } from "vitest";
import { BOARD } from "@/game/board";
import { movementPath } from "@/game/movement";
import { createGame, reducer, rentFor, type GameState } from "@/game/reducer";

const roll = (s: GameState, a: number, b: number, cardIndex = 0) =>
  reducer(s, { type: "ROLL", dice: [a, b], cardIndex });

const fresh = () => createGame(["A", "B", "C"]);

describe("gerak dan START", () => {
  it("memindahkan pemain sesuai dadu", () => {
    const s = roll(fresh(), 1, 2);
    expect(s.players[0].position).toBe(3);
  });

  it("memberi gaji saat melewati START", () => {
    const g = fresh();
    g.players[0].position = 38;
    const s = roll(g, 2, 3);
    expect(s.players[0].position).toBe(3);
    expect(s.players[0].money).toBe(1500 + 200);
  });
});

describe("beli properti dan sewa", () => {
  it("masuk fase buy lalu membeli", () => {
    let s = roll(fresh(), 2, 4); // A ke petak 6 (Medan)
    expect(s.phase).toBe("buy");
    expect(reducer(s, { type: "END_TURN" })).toBe(s);
    s = reducer(s, { type: "BUY" });
    expect(s.owners[6]).toBe(0);
    expect(s.players[0].money).toBe(1500 - 100);
    expect(s.phase).toBe("end");
  });

  it("membayar sewa ke pemilik", () => {
    const g = fresh();
    g.owners[6] = 1;
    const s = roll(g, 2, 4);
    expect(s.players[0].money).toBe(1500 - 6);
    expect(s.players[1].money).toBe(1500 + 6);
    expect(s.phase).toBe("end");
  });

  it("sewa dobel bila memiliki satu grup warna", () => {
    const g = fresh();
    g.owners[1] = 1;
    g.owners[3] = 1;
    expect(rentFor(g, 1, 0)).toBe(4);
  });

  it("sewa stasiun naik sesuai jumlah dimiliki", () => {
    const g = fresh();
    g.owners[5] = 1;
    expect(rentFor(g, 5, 0)).toBe(25);
    g.owners[15] = 1;
    expect(rentFor(g, 5, 0)).toBe(50);
  });

  it("sewa utilitas = 4x dadu (10x bila punya keduanya)", () => {
    const g = fresh();
    g.owners[12] = 1;
    expect(rentFor(g, 12, 7)).toBe(28);
    g.owners[28] = 1;
    expect(rentFor(g, 12, 7)).toBe(70);
  });
});

describe("giliran", () => {
  it("angka kembar memberi giliran lagi, tiga kali kembar masuk penjara", () => {
    let s = roll(fresh(), 1, 1); // petak 2 (kartu)
    s = reducer(s, { type: "END_TURN" });
    expect(s.current).toBe(0);
    s = roll(s, 2, 2); // petak 6 (Medan)
    s = reducer(s, { type: "DECLINE" });
    s = reducer(s, { type: "END_TURN" });
    s = roll(s, 3, 3);
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(10);
    s = reducer(s, { type: "END_TURN" });
    expect(s.current).toBe(1);
  });

  it("tidak bisa roll dua kali", () => {
    const s = roll(fresh(), 1, 2);
    expect(roll(s, 1, 2)).toBe(s);
  });
});

describe("penjara", () => {
  it("keluar dengan membayar denda", () => {
    const g = fresh();
    g.players[0].inJail = true;
    g.players[0].position = 10;
    const s = reducer(g, { type: "PAY_JAIL" });
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].money).toBe(1450);
  });

  it("keluar otomatis dengan angka kembar", () => {
    const g = fresh();
    g.players[0].inJail = true;
    g.players[0].position = 10;
    const s = roll(g, 2, 2);
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].position).toBe(14);
  });

  it("wajib bayar setelah 3 kali gagal", () => {
    let g = fresh();
    g.players[0].inJail = true;
    g.players[0].position = 10;
    for (let i = 0; i < 3; i++) {
      g = roll(g, 1, 2);
      if (i < 2) {
        expect(g.players[0].inJail).toBe(true);
        g = reducer(g, { type: "END_TURN" });
        g = { ...g, current: 0, phase: "roll" }; // lewati giliran pemain lain
      }
    }
    expect(g.players[0].inJail).toBe(false);
    expect(g.players[0].money).toBe(1450);
    expect(g.players[0].position).toBe(13);
  });

  it("masuk penjara dari petak Masuk Penjara", () => {
    const g = fresh();
    g.players[0].position = 27;
    const s = roll(g, 1, 2);
    expect(s.players[0].inJail).toBe(true);
    expect(s.players[0].position).toBe(10);
  });
});

describe("bangkrut dan pemenang", () => {
  it("pemain bangkrut menyerahkan aset ke kreditor, game selesai bila tersisa satu", () => {
    const g = createGame(["A", "B"]);
    g.owners[39] = 1;
    g.owners[37] = 1;
    g.players[0].position = 36;
    g.players[0].money = 10;
    const s = roll(g, 1, 2); // petak 39, sewa 100 (dobel 100) > 10
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.phase).toBe("over");
    expect(s.winner).toBe(1);
    expect(s.players[1].money).toBe(1500 + 10);
  });

  it("pemain bangkrut dilewati", () => {
    let g = fresh();
    g.players[1].bankrupt = true;
    g = roll(g, 1, 3); // petak 4 (pajak)
    g = reducer(g, { type: "END_TURN" });
    expect(g.current).toBe(2);
  });
});

describe("jalur animasi pion", () => {
  const path = (s: GameState, a: number, b: number) =>
    movementPath(s, roll(s, a, b), [a, b]);

  it("melewati tiap petak, termasuk memutar lewat START", () => {
    expect(path(fresh(), 1, 2)).toEqual([1, 2, 3]);
    const g = fresh();
    g.players[0].position = 38;
    expect(path(g, 2, 3)).toEqual([39, 0, 1, 2, 3]);
  });

  it("tetap sampai petak Masuk Penjara sebelum melompat ke penjara", () => {
    const g = fresh();
    g.players[0].position = 27;
    expect(path(g, 1, 2).at(-1)).toBe(30);
  });

  it("kosong bila tetap di penjara atau kembar tiga kali", () => {
    const g = fresh();
    g.players[0].inJail = true;
    g.players[0].position = 10;
    expect(path(g, 1, 2)).toEqual([]);
    const h = fresh();
    h.doublesCount = 2;
    expect(path(h, 3, 3)).toEqual([]);
  });
});
