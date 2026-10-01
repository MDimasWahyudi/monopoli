export const PLAYER_AVATARS = ["🚀", "🐱", "🚗", "🚢"];
export const PLAYER_COLOR_NAMES = ["Merah", "Biru", "Hijau", "Kuning"];

/** Durasi animasi (ms); dipersingkat bila pengguna meminta mengurangi gerakan. */
export function timing() {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? { dice: 250, hop: 70 } : { dice: 1400, hop: 240 };
}
