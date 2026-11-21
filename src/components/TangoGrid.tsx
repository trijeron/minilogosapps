import React from 'react';
import { Sun, Moon, Lightbulb, Play, AlertCircle } from 'lucide-react';
import { EdgeType, TangoSymbol } from '../types/tango';
import {
  TANGO_SIZE,
  getHorizontalEdgeIndex,
  getVerticalEdgeIndex,
  TangoConflicts,
} from '../utils/tangoEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface TangoGridProps {
  board: TangoSymbol[];
  given: boolean[];
  hintCells: number[];
  horizontalEdges: EdgeType[];
  verticalEdges: EdgeType[];
  selectedCell: number | null;
  onSelectCell: (index: number) => void;
  onCycleCell: (index: number) => void;
  conflicts: TangoConflicts;
  realTimeCheck: boolean;
  isPaused: boolean;
  onResume: () => void;
}

export const TangoGrid: React.FC<TangoGridProps> = ({
  board,
  given,
  hintCells,
  horizontalEdges,
  verticalEdges,
  selectedCell,
  onSelectCell,
  onCycleCell,
  conflicts,
  realTimeCheck,
  isPaused,
  onResume,
}) => {
  const { pick } = useLanguage();
  const selectedRow = selectedCell !== null ? Math.floor(selectedCell / TANGO_SIZE) : null;
  const selectedCol = selectedCell !== null ? selectedCell % TANGO_SIZE : null;
  const selectedValue = selectedCell !== null ? board[selectedCell] : 0;

  // Compute row counts
  const rowStats = Array.from({ length: TANGO_SIZE }, (_, r) => {
    let suns = 0;
    let moons = 0;
    for (let c = 0; c < TANGO_SIZE; c++) {
      const v = board[r * TANGO_SIZE + c];
      if (v === 1) suns++;
      if (v === 2) moons++;
    }
    const isBalanced = suns === 3 && moons === 3;
    const isOverflow = suns > 3 || moons > 3;
    return { suns, moons, isBalanced, isOverflow };
  });

  // Compute col counts
  const colStats = Array.from({ length: TANGO_SIZE }, (_, c) => {
    let suns = 0;
    let moons = 0;
    for (let r = 0; r < TANGO_SIZE; r++) {
      const v = board[r * TANGO_SIZE + c];
      if (v === 1) suns++;
      if (v === 2) moons++;
    }
    const isBalanced = suns === 3 && moons === 3;
    const isOverflow = suns > 3 || moons > 3;
    return { suns, moons, isBalanced, isOverflow };
  });

  return (
    <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center">
      {/* Grid container with outer border */}
      <div className="relative w-full aspect-square p-2 bg-slate-900 rounded-2xl shadow-md select-none">
        <div className="w-full h-full grid grid-cols-6 grid-rows-6 bg-slate-200 rounded-xl overflow-visible border-2 border-slate-900">
          {board.map((value, idx) => {
            const row = Math.floor(idx / TANGO_SIZE);
            const col = idx % TANGO_SIZE;

            const isSelected = selectedCell === idx;
            const isGiven = given[idx];
            const isHint = hintCells.includes(idx);
            const isRelated =
              selectedCell !== null && !isSelected && (row === selectedRow || col === selectedCol);
            const isSameValue =
              selectedValue > 0 && value === selectedValue && !isSelected;

            const isConflict = realTimeCheck && conflicts.violatingCells.has(idx);

            // Horizontal Edge to right neighbor
            const hasRightEdge = col < TANGO_SIZE - 1;
            const hEdgeIdx = hasRightEdge ? getHorizontalEdgeIndex(row, col) : -1;
            const hEdgeType = hasRightEdge ? horizontalEdges[hEdgeIdx] : 'none';
            const isHEdgeViolated = realTimeCheck && conflicts.edgeViolationH.has(hEdgeIdx);

            // Vertical Edge to bottom neighbor
            const hasBottomEdge = row < TANGO_SIZE - 1;
            const vEdgeIdx = hasBottomEdge ? getVerticalEdgeIndex(row, col) : -1;
            const vEdgeType = hasBottomEdge ? verticalEdges[vEdgeIdx] : 'none';
            const isVEdgeViolated = realTimeCheck && conflicts.edgeViolationV.has(vEdgeIdx);

            // Background shading
            let bgClass = 'bg-white';
            if (isSelected) {
              bgClass = 'bg-amber-100 ring-2 ring-amber-500 ring-inset z-10';
            } else if (isConflict) {
              bgClass = 'bg-rose-100';
            } else if (isSameValue) {
              bgClass = 'bg-amber-50';
            } else if (isRelated) {
              bgClass = 'bg-slate-50/90';
            }

            return (
              <div
                key={idx}
                className={`relative flex items-center justify-center border-r border-b border-slate-300 last:border-r-0 ${bgClass}`}
              >
                {/* Interactive Cell Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCell(idx);
                    if (!isGiven && !isHint) {
                      onCycleCell(idx);
                    }
                  }}
                  className="w-full h-full flex items-center justify-center p-1 cursor-pointer transition-transform active:scale-95"
                  title={pick(
                    `Řádek ${row + 1}, Sloupec ${col + 1} ${isGiven ? '(Pevné)' : isHint ? '(Nápověda)' : ''}`,
                    `Row ${row + 1}, Column ${col + 1} ${isGiven ? '(Given)' : isHint ? '(Hint)' : ''}`
                  )}
                >
                  {value === 1 && (
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs transition-transform ${
                        isConflict
                          ? 'bg-rose-500 text-white'
                          : isGiven
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-amber-400 text-amber-950 font-bold'
                      }`}
                    >
                      <Sun className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-in zoom-in-75 duration-100" />
                    </div>
                  )}

                  {value === 2 && (
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs transition-transform ${
                        isConflict
                          ? 'bg-rose-700 text-white'
                          : isGiven
                          ? 'bg-indigo-900 text-indigo-100'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <Moon className="w-4 h-4 sm:w-5 sm:h-5 fill-current animate-in zoom-in-75 duration-100" />
                    </div>
                  )}

                  {/* Empty cell placeholder dot */}
                  {value === 0 && (
                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                  )}

                  {/* Given / Hint corner marker */}
                  {isHint && (
                    <div className="absolute top-1 right-1 text-amber-600">
                      <Lightbulb className="w-2.5 h-2.5 fill-amber-400" />
                    </div>
                  )}
                  {isGiven && value > 0 && (
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </button>

                {/* Horizontal Edge Badge (= or x) */}
                {hEdgeType !== 'none' && (
                  <div
                    className={`absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black pointer-events-none shadow-xs border transition-colors ${
                      isHEdgeViolated
                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse ring-2 ring-rose-300'
                        : 'bg-slate-900 text-amber-300 border-slate-700'
                    }`}
                  >
                    {hEdgeType === 'equal' ? '=' : '×'}
                  </div>
                )}

                {/* Vertical Edge Badge (= or x) */}
                {vEdgeType !== 'none' && (
                  <div
                    className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black pointer-events-none shadow-xs border transition-colors ${
                      isVEdgeViolated
                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse ring-2 ring-rose-300'
                        : 'bg-slate-900 text-amber-300 border-slate-700'
                    }`}
                  >
                    {vEdgeType === 'equal' ? '=' : '×'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <h3 className="text-base font-bold mb-1">
              {pick('Hra Tango je pozastavena', 'Tango game paused')}
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-[200px]">
              {pick(
                'Pole je skryté, aby se nezastavoval čas při prohlížení.',
                'The board is hidden while the timer is paused.'
              )}
            </p>
            <button
              onClick={onResume}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide shadow-md active:scale-95 transition-transform"
            >
              {pick('Pokračovat ve hře', 'Resume game')}
            </button>
          </div>
        )}
      </div>

      {/* Row and Column Balance Trackers */}
      <div className="w-full mt-2 flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-700">{pick('Pravidlo:', 'Rule:')}</span>
          <span>
            {pick(
              'Každý řádek i sloupec = přesně 3 ☀️ a 3 🌙 (max 2 stejné vedle sebe)',
              'Every row & column = exactly 3 ☀️ and 3 🌙 (max 2 identical in a row)'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
