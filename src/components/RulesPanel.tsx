"use client";

import { useEffect, useState } from "react";
import {
  BOARD,
  GO_SALARY,
  GROUP_COLORS,
  HOUSE_COST,
  JAIL_FINE,
  START_MONEY,
  tilesInGroup,
  type ColorGroup,
} from "@/game/board";
import { PLAYER_COLORS } from "@/game/reducer";
import { Hotel, House } from "./Buildings";
import Pawn from "./Pawn";

const money = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/* ---------- ilustrasi kecil ---------- */

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ n }: { n: number }) {
  return (
    <div className="grid h-11 w-11 grid-cols-3 grid-rows-3 gap-px rounded-lg border border-slate-300 bg-white p-1.5 shadow">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto h-1.5 w-1.5 rounded-full ${PIPS[n].includes(i) ? "bg-slate-900" : ""}`} />
      ))}
    </div>
  );
}

function MiniTile({
  group,
  name,
  price,
  owner,
  children,
}: {
  group?: ColorGroup;
  name: string;
  price?: number;
  owner?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex h-24 w-16 flex-col overflow-hidden rounded border border-emerald-900/40 bg-[#e6efdc] text-center text-emerald-950 shadow">
      {group && <div className="h-4 shrink-0" style={{ background: GROUP_COLORS[group] }} />}
      <div className="flex flex-1 flex-col items-center justify-center px-0.5 text-[9px] font-bold leading-tight">
        {name}
        {price !== undefined && <span className="font-normal opacity-70">{price}</span>}
      </div>
      {owner && <div className="h-2 shrink-0" style={{ background: owner }} />}
      {children}
    </div>
  );
}

const Arrow = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center text-slate-500">
    <span className="text-xl leading-none">➜</span>
    {label && <span className="text-[10px] font-semibold">{label}</span>}
  </div>
);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-xl border border-[#b79c68] bg-gradient-to-b from-[#ecdfc2] to-[#d8c498] p-4">
    {children}
  </div>
);

const PawnIcon = ({ color, size = 36 }: { color: string; size?: number }) => (
  <div style={{ width: size, height: size * 1.5 }}>
    <Pawn color={color} />
  </div>
);

/* ---------- isi aturan ---------- */

type Section = { id: string; icon: string; title: string; art: React.ReactNode; points: React.ReactNode[] };

const SECTIONS: Section[] = [
  {
    id: "tujuan",
    icon: "🎯",
    title: "Tujuan Game",
    art: (
      <Frame>
        {PLAYER_COLORS.slice(0, 3).map((c) => (
          <PawnIcon key={c} color={c} />
        ))}
        <Arrow />
        <div className="rounded-lg border-2 border-amber-600 bg-amber-200 px-4 py-3 text-center">
          <p className="text-2xl">🏆</p>
          <p className="text-xs font-bold">Pemain terakhir yang belum bangkrut</p>
        </div>
      </Frame>
    ),
    points: [
      `Setiap pemain mulai dengan ${money(START_MONEY)} dan satu pion di petak START.`,
      "Belilah properti, tagih sewa dari lawan, dan bangun rumah serta hotel agar sewa makin mahal.",
      "Pemain yang uangnya habis untuk membayar sewa, pajak, atau denda dinyatakan bangkrut.",
      "Kamu menang bila semua lawan sudah bangkrut.",
    ],
  },
  {
    id: "giliran",
    icon: "🎲",
    title: "Giliran Main",
    art: (
      <Frame>
        <div className="flex gap-2">
          <Die n={4} />
          <Die n={3} />
        </div>
        <Arrow label="jalan 7 petak" />
        <div className="flex items-end gap-0.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div
              key={n}
              className={`flex h-9 w-7 items-center justify-center rounded-sm border border-emerald-900/40 text-[10px] font-bold ${
                n === 7 ? "bg-amber-300" : "bg-[#e6efdc]"
              }`}
            >
              {n === 7 ? <PawnIcon color={PLAYER_COLORS[0]} size={14} /> : n}
            </div>
          ))}
        </div>
      </Frame>
    ),
    points: [
      <>
        Tekan <b>LEMPAR DADU</b>, lalu pionmu berjalan searah jarum jam sebanyak jumlah kedua dadu.
      </>,
      "Aksi bergantung pada petak tempat kamu mendarat (beli, bayar sewa, pajak, kartu, dan seterusnya).",
      <>
        Setelah selesai, tekan <b>AKHIRI GILIRAN</b> agar pemain berikutnya bermain.
      </>,
      <>
        Dapat <b>angka kembar</b> (dadu sama)? Kamu main lagi. Tiga kali kembar berturut-turut membuatmu masuk Penjara.
      </>,
    ],
  },
  {
    id: "properti",
    icon: "🏠",
    title: "Beli & Sewa",
    art: (
      <Frame>
        <MiniTile group="orange" name="Bogor" price={180} />
        <Arrow label="Beli" />
        <MiniTile group="orange" name="Bogor" price={180} owner={PLAYER_COLORS[0]} />
        <Arrow label="lawan mendarat" />
        <div className="flex flex-col items-center gap-1">
          <PawnIcon color={PLAYER_COLORS[1]} size={28} />
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">bayar sewa</span>
        </div>
      </Frame>
    ),
    points: [
      "Mendarat di properti yang belum dimiliki: kamu boleh membelinya dengan harga yang tertera, atau melewatinya.",
      "Garis warna di sisi luar petak menunjukkan siapa pemiliknya.",
      "Mendarat di properti milik lawan: kamu wajib membayar sewa kepadanya.",
      "Stasiun: sewa naik makin banyak stasiun yang dimiliki satu pemain. Utilitas: sewa dihitung dari angka dadu.",
    ],
  },
  {
    id: "set",
    icon: "🎨",
    title: "Set Warna",
    art: (
      <Frame>
        {(Object.keys(HOUSE_COST) as ColorGroup[]).map((g) => (
          <div key={g} className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {tilesInGroup(g).map((t) => (
                <span key={t} className="h-6 w-3.5 rounded-sm border border-black/20" style={{ background: GROUP_COLORS[g] }} />
              ))}
            </div>
            <span className="text-[10px] font-semibold">{tilesInGroup(g).length} petak</span>
          </div>
        ))}
      </Frame>
    ),
    points: [
      "Properti dibagi menjadi 8 kelompok warna, masing-masing 2–3 petak.",
      <>
        Jika satu pemain memiliki <b>seluruh petak satu warna</b>, sewa tanah kosong di set itu menjadi <b>dua kali lipat</b>.
      </>,
      "Set lengkap juga syarat untuk membangun rumah dan hotel.",
      "Set termurah: cokelat. Set termahal: biru tua (Jakarta Selatan dan Jakarta Pusat).",
    ],
  },
  {
    id: "bangun",
    icon: "🏗️",
    title: "Rumah & Hotel",
    art: (
      <Frame>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <div className="flex">
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className="h-9 w-8">
                  <House />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-semibold">{n} rumah</span>
          </div>
        ))}
        <Arrow />
        <div className="flex flex-col items-center gap-1">
          <div className="h-12 w-14">
            <Hotel />
          </div>
          <span className="text-[10px] font-semibold">Hotel</span>
        </div>
      </Frame>
    ),
    points: [
      <>
        Buka tombol <b>🏠 Bangun / Jual</b> (juga muncul otomatis setelah kamu membeli tanah) pada giliranmu, sebelum atau sesudah melempar dadu.
      </>,
      "Bangun merata: setiap petak dalam satu set harus punya jumlah rumah yang seimbang. Maksimal 4 rumah, lalu menjadi 1 hotel.",
      `Biaya per rumah: ${money(HOUSE_COST.brown)} (cokelat/biru muda) sampai ${money(HOUSE_COST.blue)} (hijau/biru tua).`,
      `Sewa naik tajam. Contoh ${BOARD[1].name}: ${BOARD[1].type === "property" ? BOARD[1].rents.map((r) => r).join(" → ") : ""} (kosong → hotel).`,
      "Menjual bangunan mengembalikan setengah dari biaya bangun.",
    ],
  },
  {
    id: "penjara",
    icon: "⛓️",
    title: "Penjara",
    art: (
      <Frame>
        <div className="flex flex-col items-center">
          <span className="text-4xl">👮</span>
          <span className="text-[10px] font-semibold">Masuk Penjara</span>
        </div>
        <Arrow />
        <div className="flex flex-col items-center">
          <span className="text-4xl">⛓️</span>
          <span className="text-[10px] font-semibold">Penjara</span>
        </div>
        <Arrow label="cara keluar" />
        <div className="flex flex-col gap-1 text-[11px] font-semibold">
          <span className="rounded bg-white/80 px-2 py-0.5">🎲 Angka kembar</span>
          <span className="rounded bg-white/80 px-2 py-0.5">💰 Bayar {money(JAIL_FINE)}</span>
          <span className="rounded bg-white/80 px-2 py-0.5">⏳ Tunggu 3 giliran</span>
        </div>
      </Frame>
    ),
    points: [
      "Kamu masuk Penjara bila mendarat di petak Masuk Penjara atau melempar angka kembar tiga kali berturut-turut.",
      <>
        Di Penjara kamu tidak berjalan. Keluar dengan: melempar <b>angka kembar</b>, membayar <b>denda {money(JAIL_FINE)}</b> sebelum melempar, atau otomatis membayar denda setelah 3 giliran gagal.
      </>,
      "Petak Penjara biasa (hanya lewat) tidak berbahaya.",
    ],
  },
  {
    id: "petak",
    icon: "🗺️",
    title: "Petak Khusus",
    art: (
      <Frame>
        {[
          ["➡️", "START", `+${money(GO_SALARY)}`],
          ["💸", "Pajak", "bayar ke bank"],
          ["❓", "Kartu", "untung / rugi"],
          ["🅿️", "Parkir Bebas", "istirahat"],
          ["👮", "Masuk Penjara", "langsung masuk"],
        ].map(([icon, name, note]) => (
          <div key={name} className="flex w-20 flex-col items-center rounded-lg bg-white/70 p-2 text-center shadow-sm">
            <span className="text-2xl">{icon}</span>
            <span className="text-[11px] font-bold leading-tight">{name}</span>
            <span className="text-[10px] text-slate-600">{note}</span>
          </div>
        ))}
      </Frame>
    ),
    points: [
      `START: setiap kali kamu mendarat atau melewatinya, kamu menerima ${money(GO_SALARY)}.`,
      `Pajak: ${BOARD[4].name} ${money(BOARD[4].type === "tax" ? BOARD[4].amount : 0)} dan ${BOARD[38].name} ${money(BOARD[38].type === "tax" ? BOARD[38].amount : 0)} dibayar ke bank.`,
      "Kesempatan dan Dana Umum: kamu mendapat atau kehilangan sejumlah uang secara acak.",
      "Parkir Bebas: tidak terjadi apa-apa.",
    ],
  },
  {
    id: "gadai",
    icon: "💰",
    title: "Gadai",
    art: (
      <Frame>
        <MiniTile group="red" name="Bandung" price={220} owner={PLAYER_COLORS[0]} />
        <Arrow label="Gadai" />
        <MiniTile group="red" name="Bandung" price={220} owner={PLAYER_COLORS[0]}>
          <div className="absolute inset-0 flex items-center justify-center bg-slate-500/55">
            <span className="-rotate-12 rounded border border-white/80 bg-slate-700/90 px-1 text-[9px] font-extrabold text-white">GADAI</span>
          </div>
        </MiniTile>
        <Arrow label="dapat" />
        <div className="rounded-lg bg-amber-200 px-3 py-2 text-center text-sm font-extrabold">💰 {money(110)}</div>
      </Frame>
    ),
    points: [
      <>
        Butuh uang? Buka <b>🏠 Kelola Properti → 💰 Gadai</b>. Bank memberi <b>setengah harga</b> properti.
      </>,
      "Properti yang digadai ditandai GADAI dan tidak menghasilkan sewa. Pemiliknya tetap kamu.",
      "Menebus kembali butuh harga gadai ditambah 10%.",
      "Properti dengan rumah/hotel baru bisa digadai setelah semua bangunan di grup warnanya dijual. Selama ada yang digadai di satu set, kamu tidak bisa membangun di set itu.",
      <>
        Kalau uangmu kurang saat harus membayar sewa atau pajak, game memberi kesempatan menggadai dan menjual bangunan dulu, baru <b>Bayar</b>. Kamu bangkrut hanya bila seluruh asetmu pun tidak cukup, atau memilih menyerah.
      </>,
    ],
  },
  {
    id: "tukar",
    icon: "🤝",
    title: "Tukar (Trading)",
    art: (
      <Frame>
        <div className="flex flex-col items-center gap-1">
          <PawnIcon color={PLAYER_COLORS[0]} size={26} />
          <MiniTile group="green" name="Surabaya" price={300} />
        </div>
        <span className="text-3xl text-slate-600">⇄</span>
        <div className="flex flex-col items-center gap-1">
          <PawnIcon color={PLAYER_COLORS[1]} size={26} />
          <div className="flex h-24 w-16 items-center justify-center rounded border border-amber-600 bg-amber-200 text-xl font-extrabold">💰</div>
        </div>
      </Frame>
    ),
    points: [
      <>
        Pada giliranmu, buka <b>🏠 Kelola Properti → 🤝 Tukar</b>, pilih pemain, lalu tentukan properti dan uang yang kamu berikan serta minta.
      </>,
      "Pemain tujuan akan melihat tawaran dan memilih Terima atau Tolak di perangkat yang sama. Permainan berhenti sampai tawaran dijawab.",
      "Properti yang ada bangunan di grup warnanya tidak bisa ditukar; jual dulu bangunannya.",
      "Properti yang digadai tetap bisa ditukar dan berpindah dalam keadaan tetap digadai.",
      "Tukar-menukar adalah cara terbaik melengkapi set warna!",
    ],
  },
  {
    id: "bangkrut",
    icon: "💥",
    title: "Bangkrut & Menang",
    art: (
      <Frame>
        <div className="flex flex-col items-center gap-1">
          <div className="opacity-60 grayscale">
            <PawnIcon color={PLAYER_COLORS[1]} size={30} />
          </div>
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">uang kurang</span>
        </div>
        <Arrow label="aset ke kreditor" />
        <div className="flex flex-col items-center gap-1">
          <PawnIcon color={PLAYER_COLORS[0]} size={30} />
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">🏆 pemenang</span>
        </div>
      </Frame>
    ),
    points: [
      "Bila kamu tidak sanggup membayar bahkan setelah mencairkan semua aset (gadai dan jual bangunan), atau memilih menyerah, kamu bangkrut dan keluar dari permainan.",
      "Seluruh uang dan tanahmu pindah ke pemain yang kamu bayar (atau kembali ke bank bila utang ke bank). Rumah dan hotel dibongkar.",
      "Pemain terakhir yang bertahan memenangkan game.",
      <>
        Tips: jangan menghabiskan semua uang. Sisakan kas untuk membayar sewa di petak yang penuh rumah dan hotel!
      </>,
    ],
  },
];

/* ---------- panel ---------- */

export default function RulesPanel({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const section = SECTIONS[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, SECTIONS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Aturan main"
    >
      <div
        className="pop-in flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border-4 border-[#6d4524] bg-[#f3ecdc] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#6d4524] px-4 py-2 text-white">
          <h2 className="font-extrabold tracking-wide">📖 Aturan Main</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold hover:bg-white/30"
            aria-label="Tutup aturan"
          >
            ✕ Tutup
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[#b79c68]/60 px-2 py-2" role="tablist">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                i === index ? "bg-[#6d4524] text-white" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <h3 className="text-xl font-extrabold">
            {section.icon} {section.title}
          </h3>
          {section.art}
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
            {section.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-[#b79c68]/60 px-4 py-2">
          <button
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
            className="rounded-full bg-slate-700 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-30"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs text-slate-500">
            {index + 1} / {SECTIONS.length}
          </span>
          <button
            onClick={() => (index === SECTIONS.length - 1 ? onClose() : setIndex(index + 1))}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white"
          >
            {index === SECTIONS.length - 1 ? "Mengerti ✓" : "Berikutnya →"}
          </button>
        </div>
      </div>
    </div>
  );
}
