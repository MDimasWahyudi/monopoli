const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value }: { value: number }) {
  return (
    <div className="grid h-10 w-10 grid-cols-3 grid-rows-3 gap-0.5 rounded-lg bg-white p-1.5 shadow sm:h-14 sm:w-14">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${PIPS[value].includes(i) ? "bg-slate-900" : ""}`} />
      ))}
    </div>
  );
}

export default function Dice({ dice }: { dice: [number, number] | null }) {
  if (!dice) return <div className="h-10 sm:h-14" />;
  return (
    <div className="flex gap-2" aria-label={`Dadu ${dice[0]} dan ${dice[1]}`}>
      <Die value={dice[0]} />
      <Die value={dice[1]} />
    </div>
  );
}
