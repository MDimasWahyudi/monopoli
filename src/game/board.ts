export type ColorGroup =
  | "brown"
  | "lightblue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "blue";

export type Tile =
  | { type: "go"; name: string }
  | { type: "property"; name: string; price: number; rent: number; group: ColorGroup }
  | { type: "station"; name: string; price: number }
  | { type: "utility"; name: string; price: number }
  | { type: "tax"; name: string; amount: number }
  | { type: "card"; name: string }
  | { type: "jail"; name: string }
  | { type: "parking"; name: string }
  | { type: "gotojail"; name: string };

export const BOARD_SIZE = 40;
export const JAIL_POSITION = 10;
export const GO_SALARY = 200;
export const JAIL_FINE = 50;
export const START_MONEY = 1500;

const prop = (name: string, group: ColorGroup, price: number, rent: number): Tile => ({
  type: "property",
  name,
  group,
  price,
  rent,
});
const station = (name: string): Tile => ({ type: "station", name, price: 200 });
const utility = (name: string): Tile => ({ type: "utility", name, price: 150 });
const card = (name: string): Tile => ({ type: "card", name });

export const BOARD: Tile[] = [
  { type: "go", name: "START" },
  prop("Sabang", "brown", 60, 2),
  card("Dana Umum"),
  prop("Banda Aceh", "brown", 60, 4),
  { type: "tax", name: "Pajak Penghasilan", amount: 200 },
  station("Stasiun Gambir"),
  prop("Medan", "lightblue", 100, 6),
  card("Kesempatan"),
  prop("Pekanbaru", "lightblue", 100, 6),
  prop("Padang", "lightblue", 120, 8),
  { type: "jail", name: "Penjara" },
  prop("Palembang", "pink", 140, 10),
  utility("Listrik PLN"),
  prop("Lampung", "pink", 140, 10),
  prop("Jambi", "pink", 160, 12),
  station("Stasiun Bandung"),
  prop("Bogor", "orange", 180, 14),
  card("Dana Umum"),
  prop("Bekasi", "orange", 180, 14),
  prop("Depok", "orange", 200, 16),
  { type: "parking", name: "Parkir Bebas" },
  prop("Bandung", "red", 220, 18),
  card("Kesempatan"),
  prop("Cirebon", "red", 220, 18),
  prop("Semarang", "red", 240, 20),
  station("Stasiun Yogyakarta"),
  prop("Solo", "yellow", 260, 22),
  prop("Magelang", "yellow", 260, 22),
  utility("Air PDAM"),
  prop("Malang", "yellow", 280, 24),
  { type: "gotojail", name: "Masuk Penjara" },
  prop("Surabaya", "green", 300, 26),
  prop("Denpasar", "green", 300, 26),
  card("Dana Umum"),
  prop("Makassar", "green", 320, 28),
  station("Stasiun Gubeng"),
  card("Kesempatan"),
  prop("Jakarta Selatan", "blue", 350, 35),
  { type: "tax", name: "Pajak Mewah", amount: 100 },
  prop("Jakarta Pusat", "blue", 400, 50),
];

export const GROUP_COLORS: Record<ColorGroup, string> = {
  brown: "#8b5a2b",
  lightblue: "#7dd3fc",
  pink: "#f472b6",
  orange: "#fb923c",
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#2563eb",
};

export function tilesInGroup(group: ColorGroup): number[] {
  return BOARD.flatMap((t, i) => (t.type === "property" && t.group === group ? [i] : []));
}

export function isBuyable(tile: Tile): tile is Extract<Tile, { price: number }> {
  return tile.type === "property" || tile.type === "station" || tile.type === "utility";
}

/** Kartu Kesempatan / Dana Umum versi sederhana: hanya mengubah uang. */
export const CARDS: { text: string; amount: number }[] = [
  { text: "Menang lomba 17 Agustusan", amount: 100 },
  { text: "Dividen saham", amount: 50 },
  { text: "Warisan dari om", amount: 150 },
  { text: "Jual barang bekas online", amount: 40 },
  { text: "Bayar biaya dokter", amount: -50 },
  { text: "Denda parkir liar", amount: -30 },
  { text: "Servis kendaraan", amount: -80 },
  { text: "Traktir teman makan", amount: -20 },
];
