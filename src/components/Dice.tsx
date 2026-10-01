"use client";

import { useEffect, useRef, useState } from "react";

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Posisi sisi pada kubus (CSS) dan putaran kubus agar angka tertentu menghadap ke atas. */
const FACES: { value: number; transform: string }[] = [
  { value: 1, transform: "rotateY(0deg)" },
  { value: 6, transform: "rotateY(180deg)" },
  { value: 2, transform: "rotateY(90deg)" },
  { value: 5, transform: "rotateY(-90deg)" },
  { value: 3, transform: "rotateX(90deg)" },
  { value: 4, transform: "rotateX(-90deg)" },
];
const SHOW: Record<number, [number, number]> = {
  1: [0, 0],
  2: [0, 270],
  3: [270, 0],
  4: [90, 0],
  5: [0, 90],
  6: [0, 180],
};

function Die({ value, rollId, duration, dir }: { value: number; rollId: number; duration: number; dir: number }) {
  const [rot, setRot] = useState<[number, number]>(SHOW[value]);
  const tossRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rollId === 0) return;
    const spin = () => 360 * (2 + Math.floor(Math.random() * 2));
    setRot(([x, y]) => [
      Math.ceil(x / 360) * 360 + spin() + SHOW[value][0],
      Math.ceil(y / 360) * 360 + spin() + SHOW[value][1],
    ]);
    const delay = dir > 0 ? 70 : 0;
    const opts: KeyframeAnimationOptions = { duration, delay, easing: "ease-in-out", fill: "backwards" };
    tossRef.current?.animate(
      [
        { transform: `translate(${dir * 70}px, 130px) scale(0.5)`, offset: 0 },
        { transform: `translate(${dir * 12}px, -80px) scale(1.4)`, offset: 0.35 },
        { transform: "translate(0, 0) scale(1)", offset: 0.55 },
        { transform: "translate(0, -24px) scale(1.08)", offset: 0.7 },
        { transform: "translate(0, 0) scale(1)", offset: 0.82 },
        { transform: "translate(0, -7px) scale(1.02)", offset: 0.91 },
        { transform: "translate(0, 0) scale(1)", offset: 1 },
      ],
      opts,
    );
    shadowRef.current?.animate(
      [
        { transform: "translate(0,0) scale(0.3)", opacity: 0.05, offset: 0 },
        { transform: "translate(0,0) scale(0.55)", opacity: 0.12, offset: 0.35 },
        { transform: "translate(0,0) scale(1)", opacity: 0.4, offset: 0.55 },
        { transform: "translate(0,0) scale(0.8)", opacity: 0.25, offset: 0.7 },
        { transform: "translate(0,0) scale(1)", opacity: 0.4, offset: 0.82 },
        { transform: "translate(0,0) scale(0.92)", opacity: 0.32, offset: 0.91 },
        { transform: "translate(0,0) scale(1)", opacity: 0.4, offset: 1 },
      ],
      opts,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  return (
    <div className="relative [--d:40px] sm:[--d:52px] lg:[--d:60px]" style={{ width: "var(--d)", height: "var(--d)" }}>
      <div
        ref={shadowRef}
        className="absolute left-[8%] top-[78%] h-[40%] w-[84%] rounded-[50%] bg-black blur-[3px]"
        style={{ opacity: 0.4 }}
      />
      <div ref={tossRef} className="absolute inset-0" style={{ perspective: "700px" }}>
        <div
          className="h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot[0]}deg) rotateY(${rot[1]}deg)`,
            transition: `transform ${duration}ms cubic-bezier(0.15, 0.7, 0.25, 1)`,
          }}
        >
          {FACES.map((f) => (
            <div
              key={f.value}
              className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] rounded-[18%] border border-slate-300 p-[12%]"
              style={{
                background: "linear-gradient(145deg, #ffffff, #dfe3ea)",
                transform: `${f.transform} translateZ(calc(var(--d) / 2))`,
              }}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className={`m-auto h-[70%] w-[70%] rounded-full ${
                    PIPS[f.value].includes(i) ? (f.value === 1 ? "bg-red-600" : "bg-slate-900") : ""
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dice({
  values,
  rollId,
  duration,
}: {
  values: [number, number];
  rollId: number;
  duration: number;
}) {
  return (
    <div className="flex gap-4 sm:gap-6" role="img" aria-label={`Dadu ${values[0]} dan ${values[1]}`}>
      <Die value={values[0]} rollId={rollId} duration={duration} dir={-1} />
      <Die value={values[1]} rollId={rollId} duration={duration} dir={1} />
    </div>
  );
}
