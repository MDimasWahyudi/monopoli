/** Rumah (hijau) dan hotel (merah) bergaya isometrik, dengan sisi terang/gelap agar terlihat 3D. */

export function House() {
  return (
    <svg viewBox="0 0 40 44" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="20" cy="39" rx="17" ry="4.5" fill="rgba(0,0,0,0.3)" />
      {/* dinding kiri & kanan */}
      <polygon points="6,22 20,28 20,40 6,34" fill="#3fcf6a" stroke="#14532d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="20,28 34,22 34,34 20,40" fill="#1f8f43" stroke="#14532d" strokeWidth="1" strokeLinejoin="round" />
      {/* atap pelana */}
      <polygon points="3,22 20,29.5 37,22 20,8" fill="#e8543f" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="20,29.5 37,22 37,24 20,32" fill="#b3321f" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="3,22 20,29.5 20,32 3,24" fill="#d1432f" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      {/* pintu & jendela */}
      <polygon points="9,29 13,30.8 13,36 9,34.2" fill="#fde68a" />
      <polygon points="25,31 30,28.8 30,32.5 25,34.7" fill="#bbf7d0" opacity="0.9" />
    </svg>
  );
}

export function Hotel() {
  return (
    <svg viewBox="0 0 60 56" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="30" cy="51" rx="26" ry="5" fill="rgba(0,0,0,0.3)" />
      <polygon points="6,22 30,32 30,50 6,40" fill="#f2594a" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="30,32 54,22 54,40 30,50" fill="#b8281c" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="3,22 30,10 57,22 30,33" fill="#ff9a8c" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="3,22 30,33 30,36 3,25" fill="#d8392b" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="30,33 57,22 57,25 30,36" fill="#8f1d14" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      {/* jendela */}
      {[0, 1, 2].map((i) => (
        <polygon
          key={`l${i}`}
          points={`${10 + i * 6.5},${34 + i * 2.7} ${14 + i * 6.5},${35.7 + i * 2.7} ${14 + i * 6.5},${40 + i * 2.7} ${10 + i * 6.5},${38.3 + i * 2.7}`}
          fill="#fde68a"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <polygon
          key={`r${i}`}
          points={`${34 + i * 6.5},${38 - i * 2.7} ${38 + i * 6.5},${36.3 - i * 2.7} ${38 + i * 6.5},${40.6 - i * 2.7} ${34 + i * 6.5},${42.3 - i * 2.7}`}
          fill="#fecaca"
          opacity="0.9"
        />
      ))}
      {/* papan "H" di atap */}
      <rect x="25" y="14" width="10" height="9" rx="1.5" fill="#fff" stroke="#7f1d1d" strokeWidth="0.8" />
      <text x="30" y="21.3" textAnchor="middle" fontSize="8" fontWeight="800" fill="#b8281c">
        H
      </text>
    </svg>
  );
}
