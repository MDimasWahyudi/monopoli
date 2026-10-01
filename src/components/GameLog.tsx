"use client";

import { useEffect, useRef } from "react";

export default function GameLog({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [log.length]);
  return (
    <div ref={ref} className="h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm lg:h-64">
      {log.map((line, i) => (
        <p key={i} className={i === log.length - 1 ? "text-white" : "text-slate-400"}>
          {line}
        </p>
      ))}
    </div>
  );
}
