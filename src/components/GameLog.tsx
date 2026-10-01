"use client";

import { useEffect, useRef } from "react";

export default function GameLog({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [log.length]);
  return (
    <div
      ref={ref}
      className="h-40 overflow-y-auto rounded-xl border border-white/60 bg-white/70 p-3 text-xs shadow-lg backdrop-blur lg:h-72 lg:text-sm"
    >
      {log.map((line, i) => (
        <p key={i} className={i === log.length - 1 ? "font-semibold text-slate-900" : "text-slate-500"}>
          {line}
        </p>
      ))}
    </div>
  );
}
