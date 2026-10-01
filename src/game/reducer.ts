import {
  BOARD,
  BOARD_SIZE,
  CARDS,
  GO_SALARY,
  JAIL_FINE,
  JAIL_POSITION,
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

export type Phase = "roll" | "buy" | "end" | "over";

export type GameState = {
  players: Player[];
  current: number;
  phase: Phase;
  dice: [number, number] | null;
  rolledDoubles: boolean;
  doublesCount: number;
  /** tileIndex -> playerId */
  owners: Record<number, number>;
  log: string[];
  winner: number | null;
};

export type Action =
  | { type: "ROLL"; dice: [number, number]; cardIndex: number }
  | { type: "BUY" }
  | { type: "DECLINE" }
  | { type: "END_TURN" }
  | { type: "PAY_JAIL" };

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
    rolledDoubles: false,
    doublesCount: 0,
    owners: {},
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
  if (owner === undefined) return 0;
  switch (tile.type) {
    case "property": {
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
  for (const tile of ownedTiles(s, p.id)) {
    if (creditorId === null) delete s.owners[tile];
    else s.owners[tile] = creditorId;
  }
  const alive = s.players.filter((x) => !x.bankrupt);
  if (alive.length === 1) {
    s.winner = alive[0].id;
    s.phase = "over";
    log(s, `${alive[0].name} menang! 🎉`);
  }
}

/** Bayar ke pemain lain (creditorId) atau bank (null). Mengembalikan false bila pembayar bangkrut. */
function pay(s: GameState, p: Player, amount: number, creditorId: number | null): boolean {
  if (p.money >= amount) {
    p.money -= amount;
    if (creditorId !== null) s.players[creditorId].money += amount;
    return true;
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
        log(s, `${p.name} mendarat di ${tile.name} milik ${s.players[owner].name} dan membayar sewa ${money(rent)}.`);
        pay(s, p, rent, owner);
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

export function reducer(state: GameState, action: Action): GameState {
  if (state.phase === "over") return state;
  const s = structuredClone(state);
  const p = s.players[s.current];

  switch (action.type) {
    case "ROLL": {
      if (s.phase !== "roll") return state;
      const [a, b] = action.dice;
      const total = a + b;
      const doubles = a === b;
      s.dice = [a, b];
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
            if (pay(s, p, JAIL_FINE, null)) {
              move(s, p, total);
              land(s, p, action.cardIndex);
            } else {
              s.phase = "end";
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
