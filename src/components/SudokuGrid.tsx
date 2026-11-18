import React from 'react';
import { Lightbulb, Play } from 'lucide-react';
import { BOARD_SIZE, getBlockIndex } from '../utils/sudokuEngine';

interface SudokuGridProps {
  board: number[];
  given: boolean[];
  hintCells: number[];
  notes: number[][];
  selectedCell: number | null;
  onSelectCell: (index: number) => void;
  conflictingCells: Set<number>;
  incorrectCells: Set<number>;
  realTimeCheck: boolean;
  isPaused: boolean;
  onResume: () => void;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  board,
  given,
  hintCells,
  notes,
  selectedCell,
  onSelectCell,
  conflictingCells,
  incorrectCells,
  realTimeCheck,
  isPaused,
  onResume,
}) => {
  const selectedRow = selectedCell !== null ? Math.floor(selectedCell / BOARD_SIZE) : null;
  const selectedCol = selectedCell !== null ? selectedCell % BOARD_SIZE : null;
  const selectedBlock =
    selectedRow !== null && selectedCol !== null
      ? getBlockIndex(selectedRow, selectedCol)
      : null;
  const selectedValue = selectedCell !== null ? board[selectedCell] : null;

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-square p-1.5 bg-slate-900 rounded-2xl shadow-md">
      {/* 6x6 Grid Container */}
      <div className="w-full h-full grid grid-cols-6 grid-rows-6 bg-slate-300 rounded-xl overflow-hidden border-2 border-slate-900">
        {board.map((value, idx) => {
          const row = Math.floor(idx / BOARD_SIZE);
          const col = idx % BOARD_SIZE;
          const block = getBlockIndex(row, col);

          const isSelected = selectedCell === idx;
          const isGiven = given[idx];
          const isHint = hintCells.includes(idx);
          const isConflict = realTimeCheck && conflictingCells.has(idx);
          const isIncorrect = realTimeCheck && incorrectCells.has(idx);
          const isRelated =
            selectedCell !== null &&
            !isSelected &&
            (row === selectedRow || col === selectedCol || block === selectedBlock);
          const isSameValue =
            selectedValue !== null &&
            selectedValue > 0 &&
            value === selectedValue &&
            !isSelected;

          // Thick dividing lines for 2x3 blocks:
          // Heavy horizontal border between row 1-2, and row 3-4 (after row 1 and 3)
          const isBlockBottom = row === 1 || row === 3;
          // Heavy vertical border between col 2-3 (after col 2)
          const isBlockRight = col === 2;

          // Border classes
          const borderClasses = `
            ${col < BOARD_SIZE - 1 ? (isBlockRight ? 'border-r-3 border-r-slate-900' : 'border-r border-r-slate-300') : ''}
            ${row < BOARD_SIZE - 1 ? (isBlockBottom ? 'border-b-3 border-b-slate-900' : 'border-b border-b-slate-300') : ''}
          `;

          // Background shading
          let bgClass = 'bg-white';
          if (isSelected) {
            bgClass = 'bg-indigo-100 ring-2 ring-indigo-600 ring-inset z-10';
          } else if (isConflict || isIncorrect) {
            bgClass = 'bg-rose-100 text-rose-700';
          } else if (isSameValue) {
            bgClass = 'bg-indigo-100/90 text-indigo-950 font-bold';
          } else if (isRelated) {
            bgClass = 'bg-slate-50/90';
          }

          // Text styling
          let textClass = 'text-slate-900 font-bold';
          if (isConflict || isIncorrect) {
            textClass = 'text-rose-600 font-bold';
          } else if (isHint) {
            textClass = 'text-amber-700 font-bold';
          } else if (!isGiven && value > 0) {
            textClass = 'text-indigo-600 font-semibold';
          }

          const cellNotes = notes[idx] || [];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectCell(idx)}
              aria-label={`Řádek ${row + 1}, sloupec ${col + 1}, hodnota ${value || 'prázdné'}`}
              className={`relative flex items-center justify-center cursor-pointer transition-colors select-none active:scale-[0.98] ${borderClasses} ${bgClass}`}
            >
              {/* Main Digit */}
              {value > 0 ? (
                <span className={`text-2xl sm:text-3xl leading-none select-none tracking-tight ${textClass}`}>
                  {value}
                </span>
              ) : cellNotes.length > 0 ? (
                /* 2x3 Notes Grid (1-3 top, 4-6 bottom) */
                <div className="w-full h-full p-1 grid grid-cols-3 grid-rows-2 text-center pointer-events-none select-none">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className="flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-bold leading-none text-slate-500"
                    >
                      {cellNotes.includes(num) ? num : ''}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Little Hint Badge */}
              {isHint && (
                <div
                  title="Vyplněno nápovědou"
                  className="absolute top-1 right-1 text-amber-500 pointer-events-none"
                >
                  <Lightbulb className="w-2.5 h-2.5 fill-amber-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
          <h3 className="text-base font-bold mb-1">Hra je pozastavena</h3>
          <p className="text-xs text-slate-300 mb-4 max-w-[200px]">
            Hrací pole je skryté, aby se nezastavoval čas při prohlížení.
          </p>
          <button
            onClick={onResume}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-transform"
          >
            Pokračovat ve hře
          </button>
        </div>
      )}
    </div>
  );
};
