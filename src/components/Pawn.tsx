export default function Pawn({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 60" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="20" cy="56" rx="15" ry="4.5" fill="rgba(0,0,0,0.35)" />
      <path
        d="M7 55 Q7 47 15 43 Q11 35 16 29 L24 29 Q29 35 25 43 Q33 47 33 55 Z"
        fill={color}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="1.5"
      />
      <ellipse cx="20" cy="29" rx="8" ry="3" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
      <circle cx="20" cy="17" r="9.5" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
      <ellipse cx="16.5" cy="13.5" rx="3" ry="4.2" fill="rgba(255,255,255,0.55)" />
      <path d="M11 52 Q20 56 29 52" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
    </svg>
  );
}
