import React from 'react';
import { Crown, X, Lightbulb, Play } from 'lucide-react';
import { QueensBoardSize, QueensCellState } from '../types/queens';
import { REGION_COLORS, QueensConflicts } from '../utils/queensEngine';

interface QueensGridProps {
  board: QueensCellState[];
  regions: number[];
  size: QueensBoardSize;
  hintCells: number[];
  selectedCell: number | null;
  onSelectCell: (index: number) => void;
  onCellClick: (index: number) => void;
  conflicts: QueensConflicts;
  realTimeCheck: boolean;
  isPaused: boolean;
  onResume: () => void;
}

export const QueensGrid: React.FC<QueensGridProps> = ({
  board,
  regions,
  size,
  hintCells,
  selectedCell,
  onSelectCell,
  onCellClick,
  conflicts,
  realTimeCheck,
  isPaused,
  onResume,
}) => {
  const gridColsClass =
    size === 6
      ? 'grid-cols-6 grid-rows-6'
      : size === 8
      ? 'grid-cols-8 grid-rows-8'
      : 'grid-cols-10 grid-rows-10';

  const iconSizeClass =
    size === 6
      ? 'w-5 h-5 sm:w-6 sm:h-6'
      : size === 8
      ? 'w-4 h-4 sm:w-4.5 sm:h-4.5'
      : 'w-3 h-3 sm:w-3.5 sm:h-3.5';

  const badgeSizeClass =
    size === 6
      ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl'
      : size === 8
      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg'
      : 'w-5 h-5 sm:w-6 sm:h-6 rounded-md';

  return (
    <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center">
      {/* Grid Container */}
      <div className="relative w-full aspect-square p-1.5 sm:p-2 bg-slate-900 rounded-2xl shadow-md select-none">
        <div className={`w-full h-full grid ${gridColsClass} bg-slate-300 rounded-xl overflow-hidden border-2 border-slate-900`}>
          {board.map((value, idx) => {
            const row = Math.floor(idx / size);
            const col = idx % size;
            const regId = regions[idx] ?? 0;
            const regColor = REGION_COLORS[regId % REGION_COLORS.length];

            const isSelected = selectedCell === idx;
            const isHint = hintCells.includes(idx);
            const isConflicting =
              realTimeCheck && value === 2 && conflicts.allViolatingQueens.has(idx);

            // Boundary between different regions has thick border
            const isDifferentRight =
              col < size - 1 && regions[idx] !== regions[idx + 1];
            const isDifferentBottom =
              row < size - 1 && regions[idx] !== regions[idx + size];

            const borderClasses = `
              ${col < size - 1 ? (isDifferentRight ? 'border-r-2 border-r-slate-900' : 'border-r border-r-slate-400/40') : ''}
              ${row < size - 1 ? (isDifferentBottom ? 'border-b-2 border-b-slate-900' : 'border-b border-b-slate-400/40') : ''}
            `;

            let cellBg = regColor.bg;
            if (isSelected) {
              cellBg += ' ring-2 ring-indigo-600 ring-inset z-10';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectCell(idx);
                  onCellClick(idx);
                }}
                aria-label={`Řádek ${row + 1}, sloupec ${col + 1}, oblast ${regColor.name}`}
                className={`relative flex items-center justify-center cursor-pointer transition-all active:scale-95 ${borderClasses} ${cellBg}`}
              >
                {/* 1st click = Queen 👑 (Dáma / Koruna) */}
                {value === 2 && (
                  <div
                    className={`${badgeSizeClass} flex items-center justify-center shadow-md transition-transform animate-in zoom-in-75 duration-75 ${
                      isConflicting
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                        : isHint
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                        : 'bg-amber-400 text-amber-950 font-bold'
                    }`}
                  >
                    <Crown className={`${iconSizeClass} fill-current stroke-[1.5]`} />
                  </div>
                )}

                {/* 2nd click = Cross ✕ (Křížek) */}
                {value === 1 && (
                  <div className="flex items-center justify-center text-slate-500 font-bold">
                    <X className={`${iconSizeClass} stroke-[2.5]`} />
                  </div>
                )}

                {/* Empty cell */}
                {value === 0 && (
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400/30" />
                )}

                {/* Hint marker */}
                {isHint && value === 2 && (
                  <div className="absolute top-0.5 right-0.5 text-amber-950">
                    <Lightbulb className="w-2 h-2 fill-amber-300" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <h3 className="text-base font-bold mb-1">Hra Queens je pozastavena</h3>
            <p className="text-xs text-slate-300 mb-4 max-w-[200px]">
              Pole je skryté, aby se nezastavoval čas při prohlížení.
            </p>
            <button
              onClick={onResume}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-md active:scale-95 transition-transform"
            >
              Pokračovat ve hře
            </button>
          </div>
        )}
      </div>

      {/* Legend of N regions */}
      <div className="w-full mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
        <span className="font-semibold text-slate-700">{size} barevných oblastí:</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: size }, (_, i) => {
            const rc = REGION_COLORS[i % REGION_COLORS.length];
            return (
              <div
                key={i}
                title={`Oblast ${i + 1}: ${rc.name}`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-slate-300 ${rc.bg}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
