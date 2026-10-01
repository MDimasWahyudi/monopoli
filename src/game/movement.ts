import { BOARD_SIZE } from "./board";
import type { GameState } from "./reducer";

/**
 * Daftar petak yang dilewati pion pemain aktif selama animasi,
 * dihitung dari state sebelum (prev) dan sesudah (next) lemparan dadu.
 * Kosong bila pion tidak berjalan (tetap di penjara, atau kembar tiga kali).
 * Petak terakhir adalah petak pendaratan; bila setelahnya dikirim ke penjara,
 * posisi akhir di `next` berbeda dan pion "melompat" ke penjara.
 */
export function movementPath(prev: GameState, next: GameState, dice: [number, number]): number[] {
  const before = prev.players[prev.current];
  const after = next.players[prev.current];
  if (after.position === before.position) return [];
  const thirdDouble = !before.inJail && dice[0] === dice[1] && prev.doublesCount === 2;
  if (thirdDouble) return [];
  const total = dice[0] + dice[1];
  return Array.from({ length: total }, (_, i) => (before.position + i + 1) % BOARD_SIZE);
}
