import React from 'react';
import { MahjongTheme, MahjongTile as MahjongTileModel } from '../types/mahjong';
import { useLanguage } from '../i18n/LanguageContext';
import { getMahjongTileCorner, getMahjongTileLabel } from '../utils/mahjongEngine';

interface MahjongTileProps {
  tile: MahjongTileModel;
  theme: MahjongTheme;
  viewAngle?: '3d' | 'flat';
  isFree: boolean;
  isSelected: boolean;
  isHinted: boolean;
  isBlockedShake: boolean;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  compact: boolean;
  onClick: () => void;
}

const DOT_PIP_POSITIONS: Record<number, [number, number, string][]> = {
  1: [[50, 50, '#dc2626']],
  2: [
    [32, 30, '#059669'],
    [68, 70, '#1d4ed8'],
  ],
  3: [
    [28, 25, '#1d4ed8'],
    [50, 50, '#dc2626'],
    [72, 75, '#059669'],
  ],
  4: [
    [32, 30, '#1d4ed8'],
    [68, 30, '#059669'],
    [32, 70, '#059669'],
    [68, 70, '#1d4ed8'],
  ],
  5: [
    [28, 26, '#1d4ed8'],
    [72, 26, '#059669'],
    [50, 50, '#dc2626'],
    [28, 74, '#059669'],
    [72, 74, '#1d4ed8'],
  ],
  6: [
    [34, 24, '#059669'],
    [66, 24, '#059669'],
    [34, 50, '#dc2626'],
    [66, 50, '#dc2626'],
    [34, 76, '#dc2626'],
    [66, 76, '#dc2626'],
  ],
  7: [
    [26, 22, '#059669'],
    [50, 28, '#059669'],
    [74, 34, '#059669'],
    [34, 56, '#dc2626'],
    [66, 56, '#dc2626'],
    [34, 78, '#dc2626'],
    [66, 78, '#dc2626'],
  ],
  8: [
    [34, 20, '#1d4ed8'],
    [66, 20, '#1d4ed8'],
    [34, 40, '#1d4ed8'],
    [66, 40, '#1d4ed8'],
    [34, 60, '#1d4ed8'],
    [66, 60, '#1d4ed8'],
    [34, 80, '#1d4ed8'],
    [66, 80, '#1d4ed8'],
  ],
  9: [
    [26, 22, '#059669'],
    [50, 22, '#059669'],
    [74, 22, '#059669'],
    [26, 50, '#dc2626'],
    [50, 50, '#dc2626'],
    [74, 50, '#dc2626'],
    [26, 78, '#1d4ed8'],
    [50, 78, '#1d4ed8'],
    [74, 78, '#1d4ed8'],
  ],
};

function renderClassicGlyph(tile: MahjongTileModel, compact: boolean) {
  const { suit, rank, symbol } = tile.def;

  if (suit === 'dots') {
    const pips = DOT_PIP_POSITIONS[rank] || DOT_PIP_POSITIONS[1];
    const r = rank === 1 ? 19 : rank >= 7 ? 7.5 : 9;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-1" aria-hidden="true">
        {pips.map(([cx, cy, color], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={r} fill={color} />
            <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke="#ffffff" strokeWidth="2.2" />
          </g>
        ))}
      </svg>
    );
  }

  if (suit === 'bamboo') {
    if (rank === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-1" aria-hidden="true">
          <rect x="44" y="16" width="12" height="68" rx="6" fill="#059669" />
          <circle cx="50" cy="50" r="16" fill="#dc2626" opacity="0.9" />
          <circle cx="50" cy="50" r="7" fill="#fef3c7" />
        </svg>
      );
    }
    const cols = rank <= 4 ? 2 : 3;
    const sticks = Array.from({ length: rank }, (_, i) => i);
    return (
      <div
        className={`grid ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-0.5 items-center justify-items-center w-4/5 h-3/4`}
        aria-hidden="true"
      >
        {sticks.map((s) => (
          <span
            key={s}
            className={`w-1 sm:w-1.5 h-2.5 sm:h-3.5 rounded-full ${
              s % 3 === 1 && rank >= 5 ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          />
        ))}
      </div>
    );
  }

  if (suit === 'chars') {
    return (
      <div className="flex flex-col items-center justify-center leading-none select-none">
        <span
          className={`font-black text-red-700 ${
            compact ? 'text-xs sm:text-base' : 'text-sm sm:text-xl'
          }`}
        >
          {symbol}
        </span>
        <span
          className={`font-extrabold text-slate-700 ${
            compact ? 'text-[8px] sm:text-[10px]' : 'text-[9px] sm:text-xs'
          }`}
        >
          萬
        </span>
      </div>
    );
  }

  if (suit === 'winds') {
    return (
      <span
        className={`font-black text-indigo-950 leading-none ${
          compact ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'
        }`}
      >
        {symbol}
      </span>
    );
  }

  if (suit === 'dragons') {
    if (rank === 3) {
      return (
        <div
          className="w-3/5 h-3/5 rounded-xs border-2 border-blue-700 bg-blue-50/40"
          aria-hidden="true"
        />
      );
    }
    return (
      <span
        className={`font-black leading-none ${
          rank === 1 ? 'text-red-600' : 'text-emerald-700'
        } ${compact ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'}`}
      >
        {symbol}
      </span>
    );
  }

  return (
    <span className={compact ? 'text-sm sm:text-lg leading-none' : 'text-base sm:text-xl leading-none'}>
      {symbol}
    </span>
  );
}

function renderComicGlyph(tile: MahjongTileModel) {
  const { suit, rank } = tile.def;

  // 1. Comic Pop-Art Orbs / Star Medallions (Dots)
  if (suit === 'dots') {
    if (rank === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <polygon
            points="50,7 61,28 85,20 75,43 94,58 70,66 74,90 50,77 26,90 30,66 6,58 25,43 15,20 39,28"
            fill="#facc15"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="52" r="21" fill="#ef4444" stroke="#0f172a" strokeWidth="4.5" />
          <circle cx="43" cy="45" r="5.5" fill="#ffffff" />
          <circle cx="57" cy="59" r="3" fill="#fecaca" />
        </svg>
      );
    }
    const pips = DOT_PIP_POSITIONS[rank] || DOT_PIP_POSITIONS[2];
    const r = rank >= 7 ? 8.5 : 10.5;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {pips.map(([cx, cy, color], idx) => (
          <g key={idx}>
            <circle cx={cx + 2} cy={cy + 2.5} r={r} fill="#0f172a" />
            <circle cx={cx} cy={cy} r={r} fill={color} stroke="#0f172a" strokeWidth="3.5" />
            <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.28} fill="#ffffff" />
          </g>
        ))}
      </svg>
    );
  }

  // 2. Comic Bamboo Spears / Cute Emerald Totem
  if (suit === 'bamboo') {
    if (rank === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <rect x="40" y="16" width="20" height="70" rx="8" fill="#22c55e" stroke="#0f172a" strokeWidth="4.5" />
          <rect x="34" y="34" width="32" height="8" rx="4" fill="#fde047" stroke="#0f172a" strokeWidth="3.5" />
          <rect x="34" y="60" width="32" height="8" rx="4" fill="#fde047" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M50 18 C32 6, 20 20, 38 28 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M50 18 C68 6, 80 20, 62 28 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="3.5" />
        </svg>
      );
    }
    const cols = rank <= 4 ? 2 : 3;
    const rows = Math.ceil(rank / cols);
    const coords: [number, number, string][] = [];
    for (let i = 0; i < rank; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols === 2 ? (col === 0 ? 34 : 66) : col === 0 ? 25 : col === 1 ? 50 : 75;
      const y =
        rows === 1 ? 50 : rows === 2 ? (row === 0 ? 31 : 69) : row === 0 ? 22 : row === 1 ? 50 : 78;
      const fill = i % 3 === 1 && rank >= 5 ? '#ef4444' : '#16a34a';
      coords.push([x, y, fill]);
    }
    const h = rows === 3 ? 22 : 28;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {coords.map(([cx, cy, fill], idx) => (
          <g key={idx}>
            <rect
              x={cx - 5}
              y={cy - h / 2}
              width="12"
              height={h}
              rx="5"
              fill={fill}
              stroke="#0f172a"
              strokeWidth="3.2"
            />
            <line
              x1={cx - 6}
              y1={cy}
              x2={cx + 8}
              y2={cy}
              stroke="#fde047"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
    );
  }

  // 3. Comic Action Starburst Numbers (Characters 1..9)
  if (suit === 'chars') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <polygon
          points="50,8 62,24 83,16 78,37 94,50 78,63 83,84 62,76 50,92 38,76 17,84 22,63 6,50 22,37 17,16 38,24"
          fill="#fee2e2"
          stroke="#0f172a"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="27" fill="#ef4444" stroke="#0f172a" strokeWidth="4" />
        <text
          x="52"
          y="63"
          textAnchor="middle"
          fontSize="38"
          fontWeight="900"
          fill="#0f172a"
        >
          {rank}
        </text>
        <text
          x="50"
          y="61"
          textAnchor="middle"
          fontSize="38"
          fontWeight="900"
          fill="#fef08a"
          stroke="#0f172a"
          strokeWidth="2"
        >
          {rank}
        </text>
      </svg>
    );
  }

  // 4. Comic Elemental Emblems (Winds: V, J, Z, S)
  if (suit === 'winds') {
    if (rank === 1) {
      // Východní vítr: Comic Rising Sun
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <circle cx="50" cy="52" r="24" fill="#f59e0b" stroke="#0f172a" strokeWidth="4.5" />
          <path d="M50 10 L56 24 L44 24 Z M88 52 L74 58 L74 46 Z M12 52 L26 46 L26 58 Z M22 22 L34 30 L26 38 Z M78 22 L74 38 L66 30 Z" fill="#fde047" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="43" cy="46" r="4" fill="#ffffff" />
        </svg>
      );
    }
    if (rank === 2) {
      // Jižní vítr: Comic Flame
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path
            d="M52 10 C68 30, 82 44, 78 66 C74 84, 58 92, 46 90 C26 88, 18 70, 24 52 C28 40, 36 36, 38 26 C44 34, 46 24, 52 10 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M50 42 C60 54, 64 64, 58 76 C52 84, 38 82, 36 70 C35 60, 42 54, 50 42 Z"
            fill="#fde047"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    if (rank === 3) {
      // Západní vítr: Comic Lightning Gust
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path
            d="M28 56 C14 56, 12 36, 26 34 C30 20, 52 18, 60 30 C76 28, 88 44, 76 56 Z"
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <polygon
            points="54,48 38,68 50,68 42,90 68,62 54,62"
            fill="#facc15"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    // Severní vítr: Comic Mountain & Frost Peak
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <polygon points="10,82 44,22 76,82" fill="#6366f1" stroke="#0f172a" strokeWidth="4.5" strokeLinejoin="round" />
        <polygon points="44,22 57,46 47,42 40,48 32,43" fill="#e0e7ff" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
        <polygon points="48,82 70,40 92,82" fill="#818cf8" stroke="#0f172a" strokeWidth="4.5" strokeLinejoin="round" />
      </svg>
    );
  }

  // 5. Comic Dragons (Red, Green, White Armored Shield)
  if (suit === 'dragons') {
    if (rank === 1) {
      // Červený drak
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path d="M26 26 L18 10 L38 20 Z M74 26 L82 10 L62 20 Z" fill="#facc15" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round" />
          <rect x="20" y="22" width="60" height="54" rx="18" fill="#ef4444" stroke="#0f172a" strokeWidth="4.5" />
          <ellipse cx="38" cy="45" rx="7" ry="8" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
          <ellipse cx="62" cy="45" rx="7" ry="8" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
          <circle cx="39" cy="45" r="2.8" fill="#0f172a" />
          <circle cx="61" cy="45" r="2.8" fill="#0f172a" />
          <path d="M32 64 Q50 74 68 64" fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <polygon points="42,66 47,76 52,67" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
          <polygon points="53,67 58,76 62,65" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
        </svg>
      );
    }
    if (rank === 2) {
      // Zelený drak
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path d="M26 28 L14 14 L38 20 Z M74 28 L86 14 L62 20 Z" fill="#fb923c" stroke="#0f172a" strokeWidth="4" strokeLinejoin="round" />
          <rect x="20" y="22" width="60" height="56" rx="20" fill="#10b981" stroke="#0f172a" strokeWidth="4.5" />
          <circle cx="38" cy="45" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
          <circle cx="62" cy="45" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
          <circle cx="39" cy="45" r="3.2" fill="#0f172a" />
          <circle cx="61" cy="45" r="3.2" fill="#0f172a" />
          <rect x="34" y="60" width="32" height="10" rx="5" fill="#a7f3d0" stroke="#0f172a" strokeWidth="3" />
        </svg>
      );
    }
    // Bílý drak: Comic Armored Shield + Spark
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path
          d="M20 18 H80 V52 C80 74, 50 88, 50 88 C50 88, 20 74, 20 52 Z"
          fill="#e0f2fe"
          stroke="#0f172a"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M30 28 H70 V50 C70 65, 50 75, 50 75 C50 75, 30 65, 30 50 Z"
          fill="#3b82f6"
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <polygon points="50,36 55,47 66,50 55,54 50,65 45,54 34,50 45,47" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }

  // 6. Comic Flowers (1..4)
  if (suit === 'flowers') {
    const petalColor =
      rank === 1 ? '#f472b6' : rank === 2 ? '#fb7185' : rank === 3 ? '#facc15' : '#c084fc';
    const centerColor = rank === 3 ? '#92400e' : '#fde047';
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="50"
            cy="26"
            rx="13"
            ry="18"
            fill={petalColor}
            stroke="#0f172a"
            strokeWidth="3.8"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="16" fill={centerColor} stroke="#0f172a" strokeWidth="4" />
        <circle cx="45" cy="47" r="2.3" fill="#0f172a" />
        <circle cx="55" cy="47" r="2.3" fill="#0f172a" />
        <path d="M44 54 Q50 59 56 54" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Comic Seasons (1..4: Sprout, Sun, Maple Leaf, Ice Crystal)
  if (rank === 1) {
    // Jaro
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path d="M50 86 V42" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 62 C24 58, 18 36, 40 34 C48 34, 50 48, 50 62 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="4" />
        <path d="M50 52 C76 48, 82 24, 60 22 C52 22, 50 38, 50 52 Z" fill="#22c55e" stroke="#0f172a" strokeWidth="4" />
        <circle cx="50" cy="24" r="11" fill="#f472b6" stroke="#0f172a" strokeWidth="3.8" />
      </svg>
    );
  }
  if (rank === 2) {
    // Léto
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="10"
            x2="50"
            y2="22"
            stroke="#0f172a"
            strokeWidth="6"
            strokeLinecap="round"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="24" fill="#facc15" stroke="#0f172a" strokeWidth="4.5" />
        <rect x="33" y="42" width="14" height="9" rx="3" fill="#0f172a" />
        <rect x="53" y="42" width="14" height="9" rx="3" fill="#0f172a" />
        <line x1="47" y1="45" x2="53" y2="45" stroke="#0f172a" strokeWidth="3" />
        <path d="M41 59 Q50 67 59 59" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (rank === 3) {
    // Podzim
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path
          d="M50 12 L59 32 L78 24 L69 44 L88 52 L68 64 L74 78 L52 70 V88 H48 V70 L26 78 L32 64 L12 52 L31 44 L22 24 L41 32 Z"
          fill="#f97316"
          stroke="#0f172a"
          strokeWidth="4.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // Zima
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
      {[0, 60, 120].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="12"
          x2="50"
          y2="88"
          stroke="#0f172a"
          strokeWidth="7"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      {[0, 60, 120].map((deg) => (
        <line
          key={`in-${deg}`}
          x1="50"
          y1="14"
          x2="50"
          y2="86"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="11" fill="#e0f2fe" stroke="#0f172a" strokeWidth="4" />
    </svg>
  );
}

function renderFairytaleGlyph(tile: MahjongTileModel) {
  const { suit, rank } = tile.def;

  // 1. Fairytale Gems & Royal Gold Coin (Dots)
  if (suit === 'dots') {
    if (rank === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <circle cx="50" cy="52" r="34" fill="#fbbf24" stroke="#78350f" strokeWidth="4" />
          <circle cx="50" cy="52" r="26" fill="none" stroke="#fef3c7" strokeWidth="2.5" strokeDasharray="5 4" />
          <polygon
            points="50,31 64,52 50,73 36,52"
            fill="#e11d48"
            stroke="#451a03"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <polygon points="50,37 56,52 50,59 44,52" fill="#fda4af" />
        </svg>
      );
    }
    const pips = DOT_PIP_POSITIONS[rank] || DOT_PIP_POSITIONS[2];
    const r = rank >= 7 ? 8.5 : 10.5;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {pips.map(([cx, cy, color], idx) => {
          const gemFill = color === '#dc2626' ? '#e11d48' : color === '#059669' ? '#10b981' : '#3b82f6';
          return (
            <g key={idx}>
              <polygon
                points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
                fill={gemFill}
                stroke="#78350f"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <circle cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.22} fill="#ffffff" />
            </g>
          );
        })}
      </svg>
    );
  }

  // 2. Fairytale Magic Star Wand & Enchanted Beanstalks (Bamboo)
  if (suit === 'bamboo') {
    if (rank === 1) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <line x1="24" y1="82" x2="62" y2="38" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
          <line x1="24" y1="82" x2="62" y2="38" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
          <polygon
            points="66,14 72,26 86,26 75,35 79,48 66,40 53,48 57,35 46,26 60,26"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <circle cx="30" cy="40" r="3.5" fill="#fde047" />
          <circle cx="80" cy="62" r="3" fill="#fde047" />
        </svg>
      );
    }
    const cols = rank <= 4 ? 2 : 3;
    const rows = Math.ceil(rank / cols);
    const coords: [number, number, string][] = [];
    for (let i = 0; i < rank; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols === 2 ? (col === 0 ? 34 : 66) : col === 0 ? 25 : col === 1 ? 50 : 75;
      const y =
        rows === 1 ? 50 : rows === 2 ? (row === 0 ? 31 : 69) : row === 0 ? 22 : row === 1 ? 50 : 78;
      const fill = i % 3 === 1 && rank >= 5 ? '#e11d48' : '#10b981';
      coords.push([x, y, fill]);
    }
    const h = rows === 3 ? 21 : 27;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        {coords.map(([cx, cy, fill], idx) => (
          <g key={idx}>
            <line
              x1={cx}
              y1={cy - h / 2}
              x2={cx}
              y2={cy + h / 2}
              stroke="#451a03"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
            <line
              x1={cx}
              y1={cy - h / 2}
              x2={cx}
              y2={cy + h / 2}
              stroke={fill}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <ellipse
              cx={cx + 5}
              cy={cy - 2}
              rx="4.5"
              ry="2.8"
              fill="#a7f3d0"
              stroke="#451a03"
              strokeWidth="1.8"
            />
          </g>
        ))}
      </svg>
    );
  }

  // 3. Fairytale Royal Crest Seal (Chars 1..9)
  if (suit === 'chars') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path
          d="M22 20 H78 V54 C78 74, 50 88, 50 88 C50 88, 22 74, 22 54 Z"
          fill="#9f1239"
          stroke="#b45309"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M29 27 H71 V53 C71 67, 50 78, 50 78 C50 78, 29 67, 29 53 Z"
          fill="none"
          stroke="#fde68a"
          strokeWidth="2.2"
        />
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fontSize="36"
          fontWeight="800"
          fontFamily="Georgia, serif"
          fill="#fef3c7"
        >
          {rank}
        </text>
      </svg>
    );
  }

  // 4. Fairytale Kingdom Motifs (Winds: Crown, Castle Tower, Crescent Moon, Storybook)
  if (suit === 'winds') {
    if (rank === 1) {
      // Zlatá královská koruna
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <polygon
            points="16,74 14,34 35,50 50,24 65,50 86,34 84,74"
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="16" y="70" width="68" height="10" rx="3" fill="#d97706" stroke="#78350f" strokeWidth="3.5" />
          <circle cx="50" cy="56" r="5" fill="#e11d48" />
          <circle cx="31" cy="60" r="3.8" fill="#2563eb" />
          <circle cx="69" cy="60" r="3.8" fill="#10b981" />
        </svg>
      );
    }
    if (rank === 2) {
      // Pohádkový hrad / věžička
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <rect x="32" y="42" width="36" height="44" fill="#fde68a" stroke="#78350f" strokeWidth="3.8" />
          <polygon points="26,44 50,14 74,44" fill="#6366f1" stroke="#312e81" strokeWidth="3.8" strokeLinejoin="round" />
          <line x1="50" y1="14" x2="50" y2="6" stroke="#78350f" strokeWidth="3" />
          <polygon points="50,6 66,10 50,15" fill="#e11d48" />
          <path d="M43 86 V67 A7 7 0 0 1 57 67 V86 Z" fill="#78350f" />
          <circle cx="50" cy="52" r="4" fill="#38bdf8" stroke="#312e81" strokeWidth="2" />
        </svg>
      );
    }
    if (rank === 3) {
      // Zlatý pohádkový půlměsíc a hvězdičky
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path
            d="M60 16 C36 18, 22 38, 24 60 C27 80, 48 90, 68 82 C50 80, 40 66, 42 48 C43 32, 52 22, 60 16 Z"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon points="68,30 71,38 79,38 73,43 75,51 68,46 61,51 63,43 57,38 65,38" fill="#fef08a" stroke="#78350f" strokeWidth="2.2" />
        </svg>
      );
    }
    // Kouzelná kniha pohádek
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path d="M14 26 Q32 20 50 30 Q68 20 86 26 V76 Q68 70 50 80 Q32 70 14 76 Z" fill="#fef3c7" stroke="#78350f" strokeWidth="4" strokeLinejoin="round" />
        <line x1="50" y1="30" x2="50" y2="80" stroke="#78350f" strokeWidth="3.5" />
        <polygon points="66,74 66,90 72,85 78,90 78,74" fill="#e11d48" />
        <line x1="23" y1="42" x2="41" y2="44" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="23" y1="54" x2="41" y2="56" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 5. Fairytale Creatures (Red Fire Dragon, Emerald Dragon, Silver Unicorn Shield)
  if (suit === 'dragons') {
    if (rank === 1) {
      // Pohádkový ohnivý drak
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path d="M22 60 C10 38, 22 22, 38 30 C46 18, 62 18, 66 32 C82 26, 90 42, 76 58 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="3.8" strokeLinejoin="round" />
          <circle cx="42" cy="44" r="5" fill="#fef08a" />
          <circle cx="58" cy="44" r="5" fill="#fef08a" />
          <circle cx="42" cy="44" r="2" fill="#450a0a" />
          <circle cx="58" cy="44" r="2" fill="#450a0a" />
          <path d="M36 68 Q50 56 64 68 Q58 84 50 86 Q42 84 36 68 Z" fill="#fb923c" stroke="#7c2d12" strokeWidth="3" />
        </svg>
      );
    }
    if (rank === 2) {
      // Lesní smaragdový dráček s drahokamem
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
          <path d="M26 32 L18 16 L40 24 Z M74 32 L82 16 L60 24 Z" fill="#fbbf24" stroke="#064e3b" strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="50" cy="46" r="24" fill="#059669" stroke="#064e3b" strokeWidth="4" />
          <circle cx="41" cy="42" r="4.5" fill="#ffffff" />
          <circle cx="59" cy="42" r="4.5" fill="#ffffff" />
          <circle cx="41" cy="42" r="2" fill="#064e3b" />
          <circle cx="59" cy="42" r="2" fill="#064e3b" />
          <polygon points="50,62 60,75 50,88 40,75" fill="#fde047" stroke="#78350f" strokeWidth="3" />
        </svg>
      );
    }
    // Stříbrný jednorožec / kouzelný erb (Bílý drak)
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <polygon points="50,8 42,36 58,36" fill="#fde047" stroke="#78350f" strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M26 62 C26 40, 38 32, 50 32 C62 32, 74 40, 74 62 C74 78, 60 86, 50 86 C40 86, 26 78, 26 62 Z" fill="#f8fafc" stroke="#1e3a8a" strokeWidth="4" />
        <circle cx="41" cy="54" r="3.5" fill="#1e3a8a" />
        <circle cx="59" cy="54" r="3.5" fill="#1e3a8a" />
        <path d="M40 68 Q50 75 60 68" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Fairytale Flowers (1..4: Enchanted Rose, Royal Lily, Golden Bell, Lotus)
  if (suit === 'flowers') {
    const color =
      rank === 1 ? '#f43f5e' : rank === 2 ? '#a855f7' : rank === 3 ? '#f59e0b' : '#ec4899';
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path d="M50 56 V88" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="38" cy="72" rx="10" ry="5" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" transform="rotate(-25 38 72)" />
        <circle cx="50" cy="38" r="20" fill={color} stroke="#78350f" strokeWidth="3.8" />
        <path d="M38 36 Q50 24 62 36 Q54 48 50 42 Q46 48 38 36 Z" fill="#fef3c7" opacity="0.7" />
      </svg>
    );
  }

  // 7. Fairytale Seasons (Butterfly, Royal Sun, Pumpkin Carriage, Ice Crystal)
  if (rank === 1) {
    // Motýlek
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <ellipse cx="32" cy="40" rx="18" ry="15" fill="#34d399" stroke="#065f46" strokeWidth="3.5" />
        <ellipse cx="68" cy="40" rx="18" ry="15" fill="#34d399" stroke="#065f46" strokeWidth="3.5" />
        <ellipse cx="36" cy="64" rx="13" ry="11" fill="#fde047" stroke="#78350f" strokeWidth="3.2" />
        <ellipse cx="64" cy="64" rx="13" ry="11" fill="#fde047" stroke="#78350f" strokeWidth="3.2" />
        <rect x="46" y="28" width="8" height="48" rx="4" fill="#451a03" />
      </svg>
    );
  }
  if (rank === 2) {
    // Zlaté sluníčko
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <circle cx="50" cy="50" r="24" fill="#fbbf24" stroke="#78350f" strokeWidth="4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <polygon
            key={deg}
            points="46,18 50,8 54,18"
            fill="#f59e0b"
            stroke="#78350f"
            strokeWidth="2"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </svg>
    );
  }
  if (rank === 3) {
    // Pohádková dýně
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
        <path d="M50 20 C52 12, 60 12, 62 18" fill="none" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="50" cy="56" rx="32" ry="26" fill="#f97316" stroke="#7c2d12" strokeWidth="4" />
        <ellipse cx="50" cy="56" rx="14" ry="26" fill="#fb923c" stroke="#7c2d12" strokeWidth="3" />
      </svg>
    );
  }
  // Ledový krystal
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-0.5" aria-hidden="true">
      <polygon
        points="50,10 62,38 90,50 62,62 50,90 38,62 10,50 38,38"
        fill="#bae6fd"
        stroke="#1e3a8a"
        strokeWidth="3.8"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#1e3a8a" strokeWidth="3" />
    </svg>
  );
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  theme,
  viewAngle = '3d',
  isFree,
  isSelected,
  isHinted,
  isBlockedShake,
  leftPct,
  topPct,
  widthPct,
  heightPct,
  compact,
  onClick,
}) => {
  const { lang, pick } = useLanguage();
  if (tile.removed) return null;

  const tileLabel = getMahjongTileLabel(tile.def, lang);
  const cornerText = getMahjongTileCorner(tile.def, lang);

  const isComic = theme === 'comic';
  const isFairytale = theme === 'fairytale';
  const is3D = viewAngle === '3d';
  const z = tile.z;

  // Painter's algorithm: higher z on top; within same layer, bottom-right tiles draw above
  // top-left tiles so adjacent bricks naturally hide interior 3D extruded walls.
  const zIndex = z * 600 + Math.round(tile.y) * 24 + Math.round(tile.x) + (isSelected ? 120 : 0);

  const cornerColor =
    tile.def.suit === 'chars' || (tile.def.suit === 'dragons' && tile.def.rank === 1)
      ? 'text-red-700'
      : tile.def.suit === 'bamboo' || (tile.def.suit === 'dragons' && tile.def.rank === 2)
        ? 'text-emerald-800'
        : tile.def.suit === 'flowers'
          ? 'text-pink-700'
          : tile.def.suit === 'seasons'
            ? 'text-amber-800'
            : 'text-slate-800';

  // Subtle top-face brightness progression by layer so higher stacks pop visually
  const faceBg = isSelected
    ? isComic
      ? '#fef08a'
      : isFairytale
        ? '#fef3c7'
        : '#fffbeb'
    : isHinted
      ? isComic
        ? '#cffafe'
        : '#ecfeff'
      : !isFree
        ? isComic
          ? ['#cfc8b8', '#d8d2c3', '#e0dacd', '#e8e3d8', '#efebe2'][Math.min(z, 4)]
          : isFairytale
            ? ['#dcd2c0', '#e3dac8', '#eae2d2', '#f1eadc', '#f6f1e6'][Math.min(z, 4)]
            : ['#e1d9c6', '#e8e1cf', '#efe9d9', '#f5f0e3', '#faf6ec'][Math.min(z, 4)]
        : isComic
          ? ['#f7f3e3', '#faf7ea', '#fdfbf2', '#fffef8', '#ffffff'][Math.min(z, 4)]
          : isFairytale
            ? ['#f9f0dc', '#fbf4e4', '#fdf8ec', '#fffbf4', '#fffefa'][Math.min(z, 4)]
            : ['#f6f1e3', '#faf6eb', '#fdfbf3', '#fffef9', '#ffffff'][Math.min(z, 4)];

  // Rich 3D extruded bottom-right block walls + layer-elevated cast shadow
  const shadowBlur = 6 + z * 2.5;
  const castX = 6 + z * 1.4;
  const castY = 8 + z * 2.2;
  const castAlpha = Math.min(0.52, 0.30 + z * 0.055);

  const boxShadow = is3D
    ? isComic
      ? isSelected
        ? `inset 1px 1px 0 rgba(255,255,255,0.8), 1.5px 2px 0 #fde047, 3px 4px 0 #f59e0b, 4.5px 6px 0 #0f172a, ${castX + 2}px ${castY + 3}px ${shadowBlur + 2}px rgba(15,23,42,0.45)`
        : isFree
          ? `inset 1px 1px 0 rgba(255,255,255,0.85), 1.5px 2px 0 #fde68a, 3px 4px 0 #d97706, 4.5px 6px 0 #0f172a, ${castX}px ${castY}px ${shadowBlur}px rgba(15,23,42,${castAlpha})`
          : `inset 1px 1px 0 rgba(255,255,255,0.45), 1.5px 2px 0 #cbd5e1, 3px 4px 0 #64748b, 4.5px 6px 0 #1e293b, ${castX}px ${castY}px ${shadowBlur}px rgba(15,23,42,${castAlpha})`
      : isFairytale
        ? isSelected
          ? `inset 1px 1px 0 rgba(255,255,255,0.9), 1.2px 1.6px 0 #fcd34d, 2.4px 3.2px 0 #d97706, 3.8px 5px 0 #92400e, 5px 6.6px 0 #451a03, ${castX + 2}px ${castY + 3}px ${shadowBlur + 3}px rgba(24,9,44,0.5)`
          : isFree
            ? `inset 1px 1px 0 rgba(255,255,255,0.85), 1.2px 1.6px 0 #e7cfa0, 2.4px 3.2px 0 #b45309, 3.8px 5px 0 #78350f, 5px 6.6px 0 #451a03, ${castX}px ${castY}px ${shadowBlur}px rgba(24,9,44,${castAlpha})`
            : `inset 1px 1px 0 rgba(255,255,255,0.4), 1.2px 1.6px 0 #c9bda7, 2.4px 3.2px 0 #78716c, 3.8px 5px 0 #57534e, 5px 6.6px 0 #292524, ${castX}px ${castY}px ${shadowBlur}px rgba(20,10,35,${castAlpha})`
        : isSelected
          ? `inset 1px 1px 0 rgba(255,255,255,0.95), 1.2px 1.6px 0 #fde68a, 2.4px 3.2px 0 #16a34a, 3.8px 5px 0 #15803d, 5px 6.6px 0 #14532d, ${castX + 2}px ${castY + 3}px ${shadowBlur + 3}px rgba(5,25,18,0.48)`
          : isFree
            ? `inset 1px 1px 0 rgba(255,255,255,0.9), 1.2px 1.6px 0 #e2d8be, 2.4px 3.2px 0 #16a34a, 3.8px 5px 0 #15803d, 5px 6.6px 0 #14532d, ${castX}px ${castY}px ${shadowBlur}px rgba(5,25,18,${castAlpha})`
            : `inset 1px 1px 0 rgba(255,255,255,0.4), 1.2px 1.6px 0 #cfc6b2, 2.4px 3.2px 0 #4b7c65, 3.8px 5px 0 #2d5a46, 5px 6.6px 0 #1b3a2d, ${castX}px ${castY}px ${shadowBlur}px rgba(5,25,18,${castAlpha})`
    : undefined;

  const frameStyleClass = isComic
    ? isSelected
      ? 'border-2 border-slate-950 ring-2 ring-amber-400 -translate-y-1'
      : isHinted
        ? 'border-2 border-slate-950 ring-3 ring-cyan-400'
        : isFree
          ? 'border-2 border-slate-950 hover:-translate-y-0.5 cursor-pointer'
          : 'border-2 border-slate-700 cursor-not-allowed brightness-90'
    : isFairytale
      ? isSelected
        ? 'border-2 border-amber-500 ring-2 ring-amber-300 -translate-y-1'
        : isHinted
          ? 'border-2 border-cyan-500 ring-3 ring-cyan-400'
          : isFree
            ? 'border border-amber-600/80 hover:-translate-y-0.5 cursor-pointer'
            : 'border border-stone-500/75 cursor-not-allowed brightness-90'
      : isSelected
        ? 'border border-amber-500 ring-2 ring-amber-400 -translate-y-1'
        : isHinted
          ? 'border border-cyan-500 ring-3 ring-cyan-400'
          : isFree
            ? 'border border-amber-400/90 hover:-translate-y-0.5 cursor-pointer'
            : 'border border-stone-400/80 cursor-not-allowed brightness-90';

  const flatShadowClass = !is3D
    ? isComic
      ? isFree
        ? 'shadow-[2px_3px_0px_0px_#0f172a]'
        : 'shadow-[2px_2px_0px_0px_#334155]'
      : isFree
        ? 'shadow-[2px_3px_0px_0px_#b45309,3px_5px_8px_rgba(0,0,0,0.28)]'
        : 'shadow-[2px_3px_0px_0px_#78716c,2px_4px_5px_rgba(0,0,0,0.25)]'
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${tileLabel}${isFree ? '' : pick(' (zablokovaný kámen)', ' (blocked tile)')}`}
      aria-label={tileLabel}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        zIndex,
        backgroundColor: faceBg,
        boxShadow,
      }}
      className={`absolute rounded-md sm:rounded-lg transition-transform duration-150 flex items-center justify-center p-0.5 select-none focus-visible:outline-2 focus-visible:outline-amber-400 ${frameStyleClass} ${flatShadowClass} ${
        isBlockedShake ? 'ring-2 ring-rose-500' : ''
      }`}
    >
      {/* Top-left rank / localized wind-flower badge for quick scanning */}
      <span
        className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 leading-none tabular-nums ${
          isComic ? 'font-black' : 'font-extrabold'
        } ${cornerColor} ${compact ? 'text-[7px] sm:text-[9px]' : 'text-[8px] sm:text-[10px]'}`}
      >
        {cornerText}
      </span>

      {/* Center tile artwork */}
      <div className="w-full h-full flex items-center justify-center pt-1">
        {isComic
          ? renderComicGlyph(tile)
          : isFairytale
            ? renderFairytaleGlyph(tile)
            : renderClassicGlyph(tile, compact)}
      </div>
    </button>
  );
};
