import {
  BOARD,
  BOARD_SIZE,
  CARDS,
  GO_SALARY,
  HOUSE_COST,
  JAIL_FINE,
  JAIL_POSITION,
  MAX_HOUSES,
  START_MONEY,
  isBuyable,
  tilesInGroup,
} from "./board";

export const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];

export type Player = {
  id: number;
  name: string;
  color: string;
  position: number;
  money: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
};

export type Phase = "roll" | "buy" | "end" | "debt" | "over";

/** Utang yang harus dilunasi sebelum game lanjut; pemain boleh menggadai/menjual bangunan dulu. */
export type Debt = {
  amount: number;
  /** Pemain penerima, atau null bila dibayar ke bank. */
  creditor: number | null;
  /** Lanjutan gerakan bila utang berasal dari denda penjara sebelum berjalan. */
  resume?: { steps: number; cardIndex: number };
};

export type Trade = {
  from: number;
  to: number;
  giveTiles: number[];
  giveMoney: number;
  getTiles: number[];
  getMoney: number;
};

export type GameState = {
  players: Player[];
  current: number;
  phase: Phase;
  dice: [number, number] | null;
  /** Bertambah tiap lemparan dadu; dipakai klien untuk memicu animasi. */
  rolls: number;
  rolledDoubles: boolean;
  doublesCount: number;
  /** tileIndex -> playerId */
  owners: Record<number, number>;
  /** tileIndex -> jumlah rumah (1-4), 5 = hotel */
  houses: Record<number, number>;
  /** tileIndex -> true bila digadaikan (tidak menghasilkan sewa) */
  mortgaged: Record<number, boolean>;
  debt: Debt | null;
  /** Tawaran tukar-menukar yang menunggu jawaban pemain tujuan. */
  trade: Trade | null;
  log: string[];
  winner: number | null;
};

export type Action =
  | { type: "ROLL"; dice: [number, number]; cardIndex: number }
  | { type: "BUY" }
  | { type: "DECLINE" }
  | { type: "END_TURN" }
  | { type: "PAY_JAIL" }
  | { type: "BUILD"; tile: number }
  | { type: "SELL"; tile: number }
  | { type: "MORTGAGE"; tile: number }
  | { type: "UNMORTGAGE"; tile: number }
  | { type: "PAY_DEBT" }
  | { type: "DECLARE_BANKRUPT" }
  | { type: "PROPOSE_TRADE"; trade: Trade }
  | { type: "ACCEPT_TRADE" }
  | { type: "REJECT_TRADE" }
  /** Pemain menyerah (atau dikeluarkan karena meninggalkan game online). */
  | { type: "FORFEIT"; player: number };

export function createGame(names: string[]): GameState {
  const players = names.map<Player>((name, id) => ({
    id,
    name: name.trim() || `Pemain ${id + 1}`,
    color: PLAYER_COLORS[id % PLAYER_COLORS.length],
    position: 0,
    money: START_MONEY,
    inJail: false,
    jailTurns: 0,
    bankrupt: false,
  }));
  return {
    players,
    current: 0,
    phase: "roll",
    dice: null,
    rolls: 0,
    rolledDoubles: false,
    doublesCount: 0,
    owners: {},
    houses: {},
    mortgaged: {},
    debt: null,
    trade: null,
    log: [`Game dimulai. Giliran ${players[0].name}.`],
    winner: null,
  };
}

export function ownedTiles(state: GameState, playerId: number): number[] {
  return Object.entries(state.owners)
    .filter(([, owner]) => owner === playerId)
    .map(([tile]) => Number(tile))
    .sort((a, b) => a - b);
}

function countOwned(state: GameState, playerId: number, tiles: number[]): number {
  return tiles.filter((t) => state.owners[t] === playerId).length;
}

/** Sewa yang harus dibayar atas petak tertentu (tanpa rumah/hotel di MVP). */
export function rentFor(state: GameState, tileIndex: number, diceTotal: number): number {
  const tile = BOARD[tileIndex];
  const owner = state.owners[tileIndex];
  if (owner === undefined || state.mortgaged[tileIndex]) return 0;
  switch (tile.type) {
    case "property": {
      const built = state.houses[tileIndex] ?? 0;
      if (built > 0) return tile.rents[built];
      const monopoly = countOwned(state, owner, tilesInGroup(tile.group)) === tilesInGroup(tile.group).length;
      return monopoly ? tile.rent * 2 : tile.rent;
    }
    case "station": {
      const stations = BOARD.flatMap((t, i) => (t.type === "station" ? [i] : []));
      return 25 * 2 ** (countOwned(state, owner, stations) - 1);
    }
    case "utility": {
      const utilities = BOARD.flatMap((t, i) => (t.type === "utility" ? [i] : []));
      return diceTotal * (countOwned(state, owner, utilities) === utilities.length ? 10 : 4);
    }
    default:
      return 0;
  }
}

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function log(s: GameState, msg: string) {
  s.log.push(msg);
  if (s.log.length > 100) s.log.shift();
}

function sendToJail(s: GameState, p: Player) {
  p.position = JAIL_POSITION;
  p.inJail = true;
  p.jailTurns = 0;
  s.rolledDoubles = false;
  log(s, `${p.name} masuk Penjara.`);
}

function declareBankrupt(s: GameState, p: Player, creditorId: number | null) {
  p.bankrupt = true;
  log(s, `${p.name} bangkrut!`);
  if (creditorId !== null) s.players[creditorId].money += p.money;
  p.money = 0;
  s.debt = null;
  for (const tile of ownedTiles(s, p.id)) {
    delete s.houses[tile]; // bangunan dikembalikan ke bank
    if (creditorId === null) {
      delete s.owners[tile];
      delete s.mortgaged[tile];
    } else {
      s.owners[tile] = creditorId; // status gadai ikut pindah
    }
  }
  const alive = s.players.filter((x) => !x.bankrupt);
  if (alive.length === 1) {
    s.winner = alive[0].id;
    s.phase = "over";
    log(s, `${alive[0].name} menang! 🎉`);
  }
}

export function mortgageValue(tileIndex: number): number {
  const tile = BOARD[tileIndex];
  return isBuyable(tile) ? tile.price / 2 : 0;
}

export function unmortgageCost(tileIndex: number): number {
  return Math.ceil((mortgageValue(tileIndex) * 11) / 10); // bunga 10%, hindari galat float
}

/** Uang tunai ditambah semua yang bisa dicairkan (gadai tanah, jual bangunan). */
export function liquidationValue(state: GameState, playerId: number): number {
  let total = state.players[playerId].money;
  for (const tile of ownedTiles(state, playerId)) {
    total += (state.houses[tile] ?? 0) * (houseCost(tile) / 2);
    if (!state.mortgaged[tile]) total += mortgageValue(tile);
  }
  return total;
}

/**
 * Bayar ke pemain lain (creditorId) atau bank (null).
 * Mengembalikan true bila lunas. Bila uang kurang tetapi aset cukup, pemain masuk fase "debt"
 * (boleh menggadai dulu); bila aset pun tidak cukup, langsung bangkrut.
 */
function pay(
  s: GameState,
  p: Player,
  amount: number,
  creditorId: number | null,
  resume?: Debt["resume"],
): boolean {
  if (p.money >= amount) {
    p.money -= amount;
    if (creditorId !== null) s.players[creditorId].money += amount;
    return true;
  }
  if (liquidationValue(s, p.id) >= amount) {
    s.debt = { amount, creditor: creditorId, resume };
    s.phase = "debt";
    log(s, `${p.name} kekurangan uang ${money(amount - p.money)}. Gadaikan properti atau jual bangunan untuk melunasi.`);
    return false;
  }
  declareBankrupt(s, p, creditorId);
  return false;
}

function land(s: GameState, p: Player, cardIndex: number) {
  const tile = BOARD[p.position];
  const total = s.dice ? s.dice[0] + s.dice[1] : 0;
  s.phase = "end";
  switch (tile.type) {
    case "property":
    case "station":
    case "utility": {
      const owner = s.owners[p.position];
      if (owner === undefined) {
        if (p.money >= tile.price) {
          s.phase = "buy";
          log(s, `${p.name} mendarat di ${tile.name} (${money(tile.price)}).`);
        } else {
          log(s, `${p.name} mendarat di ${tile.name}, tapi uang tidak cukup untuk membeli.`);
        }
      } else if (owner !== p.id) {
        const rent = rentFor(s, p.position, total);
        if (s.mortgaged[p.position]) {
          log(s, `${p.name} mendarat di ${tile.name} milik ${s.players[owner].name}, tetapi sedang digadai (tanpa sewa).`);
        } else {
          log(s, `${p.name} mendarat di ${tile.name} milik ${s.players[owner].name} dan membayar sewa ${money(rent)}.`);
          pay(s, p, rent, owner);
        }
      } else {
        log(s, `${p.name} mendarat di properti miliknya sendiri, ${tile.name}.`);
      }
      break;
    }
    case "tax":
      log(s, `${p.name} membayar ${tile.name} ${money(tile.amount)}.`);
      pay(s, p, tile.amount, null);
      break;
    case "card": {
      const c = CARDS[cardIndex % CARDS.length];
      log(s, `${tile.name}: ${c.text} (${c.amount >= 0 ? "+" : "-"}${money(Math.abs(c.amount))}).`);
      if (c.amount >= 0) p.money += c.amount;
      else pay(s, p, -c.amount, null);
      break;
    }
    case "gotojail":
      sendToJail(s, p);
      break;
    default:
      break;
  }
}

function move(s: GameState, p: Player, steps: number) {
  const next = (p.position + steps) % BOARD_SIZE;
  if (next < p.position) {
    p.money += GO_SALARY;
    log(s, `${p.name} melewati START dan menerima ${money(GO_SALARY)}.`);
  }
  p.position = next;
}

function nextPlayer(s: GameState) {
  let i = s.current;
  do {
    i = (i + 1) % s.players.length;
  } while (s.players[i].bankrupt);
  s.current = i;
}

export function houseCost(tileIndex: number): number {
  const tile = BOARD[tileIndex];
  return tile.type === "property" ? HOUSE_COST[tile.group] : 0;
}

function groupHouseCounts(state: GameState, tileIndex: number): number[] {
  const tile = BOARD[tileIndex];
  if (tile.type !== "property") return [];
  return tilesInGroup(tile.group).map((t) => state.houses[t] ?? 0);
}

/** Pemain aktif memiliki seluruh grup warna petak ini? */
export function ownsFullGroup(state: GameState, playerId: number, tileIndex: number): boolean {
  const tile = BOARD[tileIndex];
  return tile.type === "property" && tilesInGroup(tile.group).every((t) => state.owners[t] === playerId);
}

function canActNow(state: GameState): boolean {
  return (state.phase === "roll" || state.phase === "end") && !state.trade;
}

/** Menjual bangunan & menggadai juga boleh saat melunasi utang. */
function canRaiseCash(state: GameState): boolean {
  return (canActNow(state) || state.phase === "debt") && !state.trade;
}

function groupHasMortgage(state: GameState, tileIndex: number): boolean {
  const tile = BOARD[tileIndex];
  return tile.type === "property" && tilesInGroup(tile.group).some((t) => state.mortgaged[t]);
}

export function canBuild(state: GameState, tileIndex: number): boolean {
  const p = state.players[state.current];
  const built = state.houses[tileIndex] ?? 0;
  return (
    canActNow(state) &&
    BOARD[tileIndex].type === "property" &&
    state.owners[tileIndex] === p.id &&
    ownsFullGroup(state, p.id, tileIndex) &&
    !groupHasMortgage(state, tileIndex) &&
    built < MAX_HOUSES &&
    built === Math.min(...groupHouseCounts(state, tileIndex)) && // membangun merata
    p.money >= houseCost(tileIndex)
  );
}

export function canSell(state: GameState, tileIndex: number): boolean {
  const p = state.players[state.current];
  const built = state.houses[tileIndex] ?? 0;
  return (
    canRaiseCash(state) &&
    state.owners[tileIndex] === p.id &&
    built > 0 &&
    built === Math.max(...groupHouseCounts(state, tileIndex)) // menjual merata
  );
}

/** Boleh digadaikan: milik pemain aktif, belum digadai, dan tidak ada bangunan di seluruh grupnya. */
export function canMortgage(state: GameState, tileIndex: number): boolean {
  const p = state.players[state.current];
  const tile = BOARD[tileIndex];
  if (!canRaiseCash(state) || !isBuyable(tile)) return false;
  if (state.owners[tileIndex] !== p.id || state.mortgaged[tileIndex]) return false;
  return tile.type !== "property" || tilesInGroup(tile.group).every((t) => !state.houses[t]);
}

export function canUnmortgage(state: GameState, tileIndex: number): boolean {
  const p = state.players[state.current];
  return (
    canActNow(state) &&
    state.owners[tileIndex] === p.id &&
    !!state.mortgaged[tileIndex] &&
    p.money >= unmortgageCost(tileIndex)
  );
}

/** Petak yang boleh ditukar: tidak ada bangunan di grupnya (bangunan harus dijual dulu). */
export function isTradable(state: GameState, tileIndex: number): boolean {
  const tile = BOARD[tileIndex];
  if (!isBuyable(tile)) return false;
  return tile.type !== "property" || tilesInGroup(tile.group).every((t) => !state.houses[t]);
}

export function validateTrade(state: GameState, t: Trade): boolean {
  const from = state.players[t.from];
  const to = state.players[t.to];
  if (!from || !to || from.bankrupt || to.bankrupt || t.from === t.to) return false;
  const money = (n: number) => Number.isInteger(n) && n >= 0;
  if (!money(t.giveMoney) || !money(t.getMoney)) return false;
  if (from.money < t.giveMoney || to.money < t.getMoney) return false;
  if (t.giveTiles.length + t.getTiles.length === 0 && t.giveMoney + t.getMoney === 0) return false;
  const okTiles = (tiles: number[], owner: number) =>
    new Set(tiles).size === tiles.length && tiles.every((x) => state.owners[x] === owner && isTradable(state, x));
  return okTiles(t.giveTiles, t.from) && okTiles(t.getTiles, t.to);
}

export function reducer(state: GameState, action: Action): GameState {
  if (state.phase === "over") return state;
  // Saat ada tawaran tukar, hanya jawaban (atau menyerah) yang diterima.
  if (
    state.trade &&
    action.type !== "ACCEPT_TRADE" &&
    action.type !== "REJECT_TRADE" &&
    action.type !== "FORFEIT"
  ) {
    return state;
  }
  const s = structuredClone(state);
  const p = s.players[s.current];

  switch (action.type) {
    case "ROLL": {
      if (s.phase !== "roll") return state;
      const [a, b] = action.dice;
      const total = a + b;
      const doubles = a === b;
      s.dice = [a, b];
      s.rolls += 1;
      log(s, `${p.name} melempar dadu: ${a} + ${b} = ${total}.`);

      if (p.inJail) {
        if (doubles) {
          p.inJail = false;
          p.jailTurns = 0;
          s.rolledDoubles = false;
          log(s, `${p.name} keluar dari Penjara dengan angka kembar.`);
          move(s, p, total);
          land(s, p, action.cardIndex);
        } else {
          p.jailTurns += 1;
          s.rolledDoubles = false;
          if (p.jailTurns >= 3) {
            log(s, `${p.name} membayar denda ${money(JAIL_FINE)} dan keluar dari Penjara.`);
            p.inJail = false;
            p.jailTurns = 0;
            if (pay(s, p, JAIL_FINE, null, { steps: total, cardIndex: action.cardIndex })) {
              move(s, p, total);
              land(s, p, action.cardIndex);
            } else if (s.phase === "roll") {
              s.phase = "end"; // bangkrut (bukan fase utang/selesai)
            }
          } else {
            log(s, `${p.name} tetap di Penjara (${p.jailTurns}/3).`);
            s.phase = "end";
          }
        }
        return s;
      }

      if (doubles) {
        s.doublesCount += 1;
        if (s.doublesCount >= 3) {
          log(s, `${p.name} kembar 3 kali berturut-turut.`);
          sendToJail(s, p);
          s.phase = "end";
          return s;
        }
      }
      s.rolledDoubles = doubles;
      move(s, p, total);
      land(s, p, action.cardIndex);
      return s;
    }

    case "BUY": {
      if (s.phase !== "buy") return state;
      const tile = BOARD[p.position];
      if (!isBuyable(tile) || s.owners[p.position] !== undefined || p.money < tile.price) return state;
      p.money -= tile.price;
      s.owners[p.position] = p.id;
      s.phase = "end";
      log(s, `${p.name} membeli ${tile.name} seharga ${money(tile.price)}.`);
      return s;
    }

    case "DECLINE": {
      if (s.phase !== "buy") return state;
      s.phase = "end";
      log(s, `${p.name} tidak membeli ${BOARD[p.position].name}.`);
      return s;
    }

    case "PAY_JAIL": {
      if (s.phase !== "roll" || !p.inJail || p.money < JAIL_FINE) return state;
      p.money -= JAIL_FINE;
      p.inJail = false;
      p.jailTurns = 0;
      log(s, `${p.name} membayar denda ${money(JAIL_FINE)} dan keluar dari Penjara.`);
      return s;
    }

    case "BUILD": {
      if (!canBuild(state, action.tile)) return state;
      const cost = houseCost(action.tile);
      p.money -= cost;
      s.houses[action.tile] = (s.houses[action.tile] ?? 0) + 1;
      const name = BOARD[action.tile].name;
      log(s, `${p.name} membangun ${s.houses[action.tile] === MAX_HOUSES ? "hotel" : "rumah"} di ${name} (${money(cost)}).`);
      return s;
    }

    case "SELL": {
      if (!canSell(state, action.tile)) return state;
      const refund = houseCost(action.tile) / 2;
      p.money += refund;
      s.houses[action.tile] -= 1;
      if (s.houses[action.tile] === 0) delete s.houses[action.tile];
      log(s, `${p.name} menjual bangunan di ${BOARD[action.tile].name} (+${money(refund)}).`);
      return s;
    }

    case "MORTGAGE": {
      if (!canMortgage(state, action.tile)) return state;
      const value = mortgageValue(action.tile);
      p.money += value;
      s.mortgaged[action.tile] = true;
      log(s, `${p.name} menggadaikan ${BOARD[action.tile].name} (+${money(value)}).`);
      return s;
    }

    case "UNMORTGAGE": {
      if (!canUnmortgage(state, action.tile)) return state;
      const cost = unmortgageCost(action.tile);
      p.money -= cost;
      delete s.mortgaged[action.tile];
      log(s, `${p.name} menebus ${BOARD[action.tile].name} (${money(cost)}).`);
      return s;
    }

    case "PAY_DEBT": {
      if (s.phase !== "debt" || !s.debt || p.money < s.debt.amount) return state;
      const { amount, creditor, resume } = s.debt;
      p.money -= amount;
      if (creditor !== null) s.players[creditor].money += amount;
      s.debt = null;
      log(s, `${p.name} melunasi utang ${money(amount)}.`);
      if (resume) {
        move(s, p, resume.steps);
        land(s, p, resume.cardIndex);
      } else {
        s.phase = "end";
      }
      return s;
    }

    case "DECLARE_BANKRUPT": {
      if (s.phase !== "debt" || !s.debt) return state;
      declareBankrupt(s, p, s.debt.creditor);
      if (s.phase === "debt") s.phase = "end";
      return s;
    }

    case "PROPOSE_TRADE": {
      if (!canActNow(state) || action.trade.from !== s.current || !validateTrade(state, action.trade)) return state;
      s.trade = action.trade;
      log(s, `${p.name} menawarkan tukar-menukar kepada ${s.players[action.trade.to].name}.`);
      return s;
    }

    case "REJECT_TRADE": {
      if (!s.trade) return state;
      log(s, `${s.players[s.trade.to].name} menolak tawaran dari ${s.players[s.trade.from].name}.`);
      s.trade = null;
      return s;
    }

    case "ACCEPT_TRADE": {
      const t = s.trade;
      if (!t) return state;
      s.trade = null;
      if (!validateTrade(s, t)) {
        log(s, "Tawaran tidak lagi valid dan dibatalkan.");
        return s;
      }
      for (const x of t.giveTiles) s.owners[x] = t.to;
      for (const x of t.getTiles) s.owners[x] = t.from;
      s.players[t.from].money += t.getMoney - t.giveMoney;
      s.players[t.to].money += t.giveMoney - t.getMoney;
      log(s, `${s.players[t.to].name} menerima tawaran. Tukar-menukar dengan ${s.players[t.from].name} selesai.`);
      return s;
    }

    case "FORFEIT": {
      const quitter = s.players[action.player];
      if (!quitter || quitter.bankrupt) return state;
      const wasCurrent = action.player === s.current;
      if (s.trade && (s.trade.from === action.player || s.trade.to === action.player)) s.trade = null;
      log(s, `${quitter.name} menyerah.`);
      declareBankrupt(s, quitter, null);
      if (s.phase === "over") return s;
      if (wasCurrent) {
        s.debt = null;
        s.doublesCount = 0;
        s.rolledDoubles = false;
        nextPlayer(s);
        s.phase = "roll";
        log(s, `Giliran ${s.players[s.current].name}.`);
      }
      return s;
    }

    case "END_TURN": {
      if (s.phase !== "end") return state;
      if (s.rolledDoubles && !p.bankrupt && !p.inJail) {
        log(s, `${p.name} mendapat giliran lagi (angka kembar).`);
      } else {
        s.doublesCount = 0;
        s.rolledDoubles = false;
        nextPlayer(s);
        log(s, `Giliran ${s.players[s.current].name}.`);
      }
      s.phase = "roll";
      return s;
    }
  }
}
