import { describe, expect, it } from "vitest";
import { BOARD } from "@/game/board";
import { resolveAction, sanitizeAction, seatMayAct } from "@/game/actions";
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

describe("rumah dan hotel", () => {
  const withBrown = () => {
    const g = fresh();
    g.owners[1] = 0;
    g.owners[3] = 0;
    return g;
  };

  it("tidak bisa membangun tanpa memiliki satu grup penuh", () => {
    const g = fresh();
    g.owners[1] = 0;
    expect(reducer(g, { type: "BUILD", tile: 1 })).toBe(g);
  });

  it("membangun merata, memotong uang, dan menaikkan sewa", () => {
    let g = withBrown();
    g = reducer(g, { type: "BUILD", tile: 1 });
    expect(g.houses[1]).toBe(1);
    expect(g.players[0].money).toBe(1450);
    expect(reducer(g, { type: "BUILD", tile: 1 })).toBe(g); // harus merata dulu
    g = reducer(g, { type: "BUILD", tile: 3 });
    g = reducer(g, { type: "BUILD", tile: 1 });
    expect(g.houses[1]).toBe(2);
    expect(rentFor(g, 1, 0)).toBe(30);
    expect(rentFor(g, 3, 0)).toBe(20);
  });

  it("maksimal hotel dan sewanya", () => {
    let g = withBrown();
    for (let i = 0; i < 5; i++) {
      g = reducer(g, { type: "BUILD", tile: 1 });
      g = reducer(g, { type: "BUILD", tile: 3 });
    }
    expect(g.houses[1]).toBe(5);
    expect(reducer(g, { type: "BUILD", tile: 1 })).toBe(g);
    expect(rentFor(g, 1, 0)).toBe(250);
  });

  it("menjual mengembalikan setengah harga", () => {
    let g = withBrown();
    g = reducer(g, { type: "BUILD", tile: 1 });
    g = reducer(g, { type: "SELL", tile: 1 });
    expect(g.houses[1]).toBeUndefined();
    expect(g.players[0].money).toBe(1475);
  });

  it("tidak bisa membangun saat bukan fase roll/end atau uang kurang", () => {
    const g = withBrown();
    g.phase = "buy";
    expect(reducer(g, { type: "BUILD", tile: 1 })).toBe(g);
    const h = withBrown();
    h.players[0].money = 40;
    expect(reducer(h, { type: "BUILD", tile: 1 })).toBe(h);
  });

  it("bangunan hilang saat pemilik bangkrut, tanah pindah ke kreditor", () => {
    const g = createGame(["A", "B"]);
    g.owners[1] = 0;
    g.owners[3] = 0;
    g.owners[6] = 1;
    g.houses[1] = 2;
    g.players[0].position = 3;
    g.players[0].money = 1;
    let s = roll(g, 1, 2); // A mendarat di Medan milik B, sewa 6, tapi masih punya aset
    expect(s.phase).toBe("debt");
    s = reducer(s, { type: "DECLARE_BANKRUPT" });
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.owners[1]).toBe(1);
    expect(s.houses[1]).toBeUndefined();
  });
});

describe("gadai", () => {
  it("menggadai memberi setengah harga, sewa jadi nol, dan bisa ditebus +10%", () => {
    let g = fresh();
    g.owners[6] = 1;
    g.current = 1;
    g = reducer(g, { type: "MORTGAGE", tile: 6 });
    expect(g.mortgaged[6]).toBe(true);
    expect(g.players[1].money).toBe(1550);
    expect(rentFor(g, 6, 0)).toBe(0);
    expect(reducer(g, { type: "MORTGAGE", tile: 6 })).toBe(g);
    g = reducer(g, { type: "UNMORTGAGE", tile: 6 });
    expect(g.mortgaged[6]).toBeUndefined();
    expect(g.players[1].money).toBe(1550 - 55);
  });

  it("tidak bisa menggadai bila ada bangunan di grup; tidak bisa membangun bila ada yang digadai", () => {
    let g = fresh();
    g.owners[1] = 0;
    g.owners[3] = 0;
    g = reducer(g, { type: "BUILD", tile: 1 });
    expect(reducer(g, { type: "MORTGAGE", tile: 3 })).toBe(g);
    let h = fresh();
    h.owners[1] = 0;
    h.owners[3] = 0;
    h = reducer(h, { type: "MORTGAGE", tile: 3 });
    expect(reducer(h, { type: "BUILD", tile: 1 })).toBe(h);
  });

  it("mendarat di properti digadai tidak membayar sewa", () => {
    const g = fresh();
    g.owners[6] = 1;
    g.mortgaged[6] = true;
    const s = roll(g, 2, 4);
    expect(s.players[0].money).toBe(1500);
    expect(s.phase).toBe("end");
  });
});

describe("utang", () => {
  const indebted = () => {
    const g = fresh();
    g.owners[39] = 1;
    g.owners[37] = 1;
    g.owners[1] = 0;
    g.owners[3] = 0;
    g.owners[6] = 0;
    g.players[0].position = 36;
    g.players[0].money = 30; // aset: 30 + gadai 30 + 30 + 50 = 140
    return roll(g, 1, 2); // sewa 100 (set penuh, dobel 100)
  };

  it("masuk fase debt bila aset cukup, lalu lunas setelah menggadai", () => {
    let s = indebted();
    expect(s.phase).toBe("debt");
    expect(s.debt).toMatchObject({ amount: 100, creditor: 1 });
    expect(reducer(s, { type: "PAY_DEBT" })).toBe(s); // uang belum cukup
    expect(reducer(s, { type: "ROLL", dice: [1, 2], cardIndex: 0 })).toBe(s);
    s = reducer(s, { type: "MORTGAGE", tile: 1 }); // 60
    s = reducer(s, { type: "MORTGAGE", tile: 3 }); // 90
    expect(reducer(s, { type: "PAY_DEBT" })).toBe(s); // masih kurang
    s = reducer(s, { type: "MORTGAGE", tile: 6 }); // 140
    s = reducer(s, { type: "PAY_DEBT" });
    expect(s.phase).toBe("end");
    expect(s.players[0].money).toBe(40);
  });

  it("lunas setelah uang cukup lalu lanjut ke akhir giliran", () => {
    let s = indebted();
    s.players[0].money = 100;
    s = reducer(s, { type: "PAY_DEBT" });
    expect(s.phase).toBe("end");
    expect(s.debt).toBeNull();
    expect(s.players[1].money).toBe(1600);
  });

  it("langsung bangkrut bila seluruh aset pun tidak cukup", () => {
    const g = createGame(["A", "B"]);
    g.owners[39] = 1;
    g.owners[37] = 1;
    g.players[0].position = 36;
    g.players[0].money = 10;
    const s = roll(g, 1, 2);
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.phase).toBe("over");
  });

  it("denda penjara ke-3 yang ditunda melanjutkan gerakan setelah lunas", () => {
    const g = fresh();
    g.players[0].inJail = true;
    g.players[0].position = 10;
    g.players[0].jailTurns = 2;
    g.players[0].money = 20;
    g.owners[6] = 0;
    let s = roll(g, 1, 2);
    expect(s.phase).toBe("debt");
    s = reducer(s, { type: "MORTGAGE", tile: 6 }); // +50 = 70
    s = reducer(s, { type: "PAY_DEBT" });
    expect(s.players[0].inJail).toBe(false);
    expect(s.players[0].position).toBe(13);
    expect(s.players[0].money).toBe(20);
  });
});

describe("trading", () => {
  const base = () => {
    const g = fresh();
    g.owners[6] = 0;
    g.owners[8] = 1;
    return g;
  };
  const offer = { from: 0, to: 1, giveTiles: [6], giveMoney: 50, getTiles: [8], getMoney: 0 };

  it("tawaran diterima menukar tanah dan uang", () => {
    let g = reducer(base(), { type: "PROPOSE_TRADE", trade: offer });
    expect(g.trade).toEqual(offer);
    g = reducer(g, { type: "ACCEPT_TRADE" });
    expect(g.trade).toBeNull();
    expect(g.owners[6]).toBe(1);
    expect(g.owners[8]).toBe(0);
    expect(g.players[0].money).toBe(1450);
    expect(g.players[1].money).toBe(1550);
  });

  it("ditolak: tidak ada perubahan", () => {
    let g = reducer(base(), { type: "PROPOSE_TRADE", trade: offer });
    g = reducer(g, { type: "REJECT_TRADE" });
    expect(g.trade).toBeNull();
    expect(g.owners[6]).toBe(0);
  });

  it("aksi lain diblokir selama ada tawaran", () => {
    const g = reducer(base(), { type: "PROPOSE_TRADE", trade: offer });
    expect(roll(g, 1, 2)).toBe(g);
    expect(reducer(g, { type: "END_TURN" })).toBe(g);
  });

  it("menolak tawaran tidak valid", () => {
    const g = base();
    const bad = (t: Partial<typeof offer>) => reducer(g, { type: "PROPOSE_TRADE", trade: { ...offer, ...t } });
    expect(bad({ giveTiles: [8] })).toBe(g); // bukan milik pemberi
    expect(bad({ giveMoney: 9999 })).toBe(g); // uang kurang
    expect(bad({ to: 0 })).toBe(g); // dengan diri sendiri
    expect(bad({ giveTiles: [], getTiles: [], giveMoney: 0 })).toBe(g); // kosong
    g.owners[1] = 0;
    g.houses[1] = 1;
    expect(bad({ giveTiles: [1] })).toBe(g); // ada bangunan di grup
  });
});

describe("FORFEIT dan penghitung lemparan", () => {
  it("rolls bertambah tiap lemparan", () => {
    const s = roll(fresh(), 1, 2);
    expect(s.rolls).toBe(1);
  });

  it("pemain menyerah: bangkrut ke bank, giliran pindah bila sedang gilirannya", () => {
    const g = fresh();
    g.owners[6] = 0;
    g.houses[1] = 0;
    const s = reducer(g, { type: "FORFEIT", player: 0 });
    expect(s.players[0].bankrupt).toBe(true);
    expect(s.owners[6]).toBeUndefined();
    expect(s.current).toBe(1);
    expect(s.phase).toBe("roll");
  });

  it("menyerah saat bukan gilirannya tidak mengubah giliran; sisa satu pemain = menang", () => {
    let g = fresh();
    g = reducer(g, { type: "FORFEIT", player: 2 });
    expect(g.current).toBe(0);
    g = reducer(g, { type: "FORFEIT", player: 1 });
    expect(g.phase).toBe("over");
    expect(g.winner).toBe(0);
  });

  it("menyerah membatalkan tawaran tukar yang melibatkannya", () => {
    const g = fresh();
    g.owners[6] = 0;
    g.owners[8] = 1;
    let s = reducer(g, { type: "PROPOSE_TRADE", trade: { from: 0, to: 1, giveTiles: [6], giveMoney: 0, getTiles: [8], getMoney: 0 } });
    s = reducer(s, { type: "FORFEIT", player: 1 });
    expect(s.trade).toBeNull();
  });
});

describe("aksi klien", () => {
  it("sanitizeAction menolak input aneh", () => {
    expect(sanitizeAction(null)).toBeNull();
    expect(sanitizeAction({ type: "HACK" })).toBeNull();
    expect(sanitizeAction({ type: "BUILD", tile: 99 })).toBeNull();
    expect(sanitizeAction({ type: "BUILD", tile: "1" })).toBeNull();
    expect(sanitizeAction({ type: "PROPOSE_TRADE", trade: { from: 0, to: 1 } })).toBeNull();
    expect(sanitizeAction({ type: "PROPOSE_TRADE", trade: { from: 0, to: 1, giveTiles: "x", giveMoney: 0, getTiles: [], getMoney: 0 } })).toBeNull();
  });

  it("sanitizeAction menerima aksi valid dan membuang field tambahan (termasuk dadu dari klien)", () => {
    expect(sanitizeAction({ type: "ROLL", dice: [6, 6] })).toEqual({ type: "ROLL" });
    expect(sanitizeAction({ type: "BUILD", tile: 1, extra: 1 })).toEqual({ type: "BUILD", tile: 1 });
  });

  it("resolveAction mengacak dadu di sisi pengendali", () => {
    const a = resolveAction({ type: "ROLL" }, () => 0.999, 8);
    expect(a).toEqual({ type: "ROLL", dice: [6, 6], cardIndex: 7 });
    expect(resolveAction({ type: "BUY" }, () => 0, 8)).toEqual({ type: "BUY" });
  });

  it("seatMayAct: hanya pemain giliran, kecuali jawaban tukar dan menyerah", () => {
    const g = fresh();
    expect(seatMayAct(g, 0, { type: "ROLL" })).toBe(true);
    expect(seatMayAct(g, 1, { type: "ROLL" })).toBe(false);
    expect(seatMayAct(g, 1, { type: "FORFEIT", player: 1 })).toBe(true);
    expect(seatMayAct(g, 2, { type: "FORFEIT", player: 1 })).toBe(false);
    expect(seatMayAct(g, 0, { type: "FORFEIT", player: 1 })).toBe(true); // tuan rumah
    g.trade = { from: 0, to: 1, giveTiles: [], giveMoney: 10, getTiles: [], getMoney: 0 };
    expect(seatMayAct(g, 1, { type: "ACCEPT_TRADE" })).toBe(true);
    expect(seatMayAct(g, 0, { type: "ACCEPT_TRADE" })).toBe(false);
    expect(seatMayAct(g, 0, { type: "REJECT_TRADE" })).toBe(true); // pengaju boleh membatalkan
    expect(seatMayAct(g, 2, { type: "REJECT_TRADE" })).toBe(false);
  });
});
