/** Hiasan di tengah papan: bank, dek kartu, dan uang. Murni dekoratif. */

function Deck({ label, from, to, className }: { label: string; from: string; to: string; className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="relative aspect-[4/3] w-full">
        {[2, 1, 0].map((i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center rounded-md border border-white/40 text-2xl font-extrabold text-white/90 shadow-md sm:text-5xl"
            style={{
              background: `linear-gradient(135deg, ${from}, ${to})`,
              transform: `translate(${i * 3}px, ${-i * 3}px) rotate(${i}deg)`,
            }}
          >
            {i === 0 && "?"}
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[7px] font-bold tracking-wider text-amber-950/70 sm:text-xs">{label}</p>
    </div>
  );
}

function Bill({ value, color, className }: { value: number; color: string; className: string }) {
  return (
    <div
      className={`absolute flex items-center justify-center rounded-sm border border-black/20 text-[8px] font-bold text-black/60 shadow sm:text-sm ${className}`}
      style={{ background: color }}
    >
      {value}
    </div>
  );
}

export default function CenterDecor() {
  return (
    <>
      {/* Bank */}
      <div className="absolute left-[7%] top-[7%] w-[24%]">
        <div
          className="relative aspect-square w-full rounded-lg border border-white/50 shadow-lg"
          style={{ background: "linear-gradient(145deg, #dfe4ea, #6b7685)" }}
        >
          <div className="absolute inset-[22%] rounded-full border-2 border-slate-500/70 bg-slate-300/70 shadow-inner" />
          <div className="absolute inset-[40%] rounded-full bg-slate-600 shadow" />
          <div className="absolute -inset-1 rounded-xl bg-sky-300/20 blur-md" />
        </div>
        <p className="mt-1 text-center text-[7px] font-bold tracking-widest text-amber-950/70 sm:text-xs">BANK</p>
      </div>

      <Deck label="KESEMPATAN" from="#6d5bd0" to="#2b2f78" className="right-[8%] top-[8%] w-[27%] -rotate-6" />
      <Deck label="DANA UMUM" from="#2aa6b8" to="#175a7a" className="bottom-[9%] left-[8%] w-[27%] rotate-3" />

      {/* Uang */}
      <div className="absolute right-[10%] bottom-[10%] h-[18%] w-[26%]">
        <Bill value={50} color="#f9a8d4" className="inset-x-0 top-[30%] h-[55%] -rotate-12" />
        <Bill value={100} color="#bef264" className="inset-x-0 top-[15%] h-[55%] rotate-6" />
        <Bill value={500} color="#fcd34d" className="inset-x-[6%] top-0 h-[55%] -rotate-3" />
      </div>
    </>
  );
}
