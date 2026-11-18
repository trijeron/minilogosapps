import React from 'react';
import { Undo2, Eraser, Edit3, Lightbulb, RotateCcw, Check } from 'lucide-react';

interface KeypadProps {
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  notesMode: boolean;
  onToggleNotesMode: () => void;
  hintsLeft: number;
  onUseHint: () => void;
  onResetBoard: () => void;
  remainingCounts: Record<number, number>;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onNumberSelect,
  onErase,
  onUndo,
  canUndo,
  notesMode,
  onToggleNotesMode,
  hintsLeft,
  onUseHint,
  onResetBoard,
  remainingCounts,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2.5 max-w-[420px] mx-auto">
      {/* Action Tools Row */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* 1. Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-xs font-semibold ${
            canUndo && !disabled
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs'
              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title="Vrátit poslední tah"
        >
          <Undo2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Zpět</span>
        </button>

        {/* 2. Erase */}
        <button
          type="button"
          onClick={onErase}
          disabled={disabled}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs transition-all text-xs font-semibold"
          title="Smazat hodnotu nebo poznámku"
        >
          <Eraser className="w-4 h-4 mb-0.5 text-slate-600" />
          <span className="text-[10px] tracking-tight">Smazat</span>
        </button>

        {/* 3. Notes Toggle */}
        <button
          type="button"
          onClick={onToggleNotesMode}
          disabled={disabled}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-xs font-semibold relative ${
            notesMode
              ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs'
          }`}
          title={notesMode ? 'Režim poznámek: Zapnuto' : 'Režim poznámek: Vypnuto'}
        >
          <Edit3 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">
            {notesMode ? 'Pozn. ZAP' : 'Poznámky'}
          </span>
          {notesMode && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
          )}
        </button>

        {/* 4. Hint (Max 3) */}
        <button
          type="button"
          onClick={onUseHint}
          disabled={hintsLeft <= 0 || disabled}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-xs font-semibold relative ${
            hintsLeft > 0 && !disabled
              ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 active:scale-95 shadow-2xs'
              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title={`Nápověda (zbývá: ${hintsLeft}/3)`}
        >
          <Lightbulb
            className={`w-4 h-4 mb-0.5 ${hintsLeft > 0 ? 'fill-amber-400 text-amber-600' : 'text-slate-300'}`}
          />
          <span className="text-[10px] tracking-tight">
            Nápověda <span className="font-mono">({hintsLeft})</span>
          </span>
        </button>

        {/* 5. Reset Field */}
        <button
          type="button"
          onClick={onResetBoard}
          disabled={disabled}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-95 shadow-2xs transition-all text-xs font-semibold"
          title="Resetovat hřiště do původního stavu (nápovědy zůstávají)"
        >
          <RotateCcw className="w-4 h-4 mb-0.5 text-slate-600" />
          <span className="text-[10px] tracking-tight">Reset</span>
        </button>
      </div>

      {/* Digits 1 to 6 keypad */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const remaining = remainingCounts[num] ?? 0;
          const isCompleted = remaining === 0;

          return (
            <button
              key={num}
              type="button"
              onClick={() => onNumberSelect(num)}
              disabled={disabled}
              className={`h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-center font-bold transition-all relative active:scale-95 ${
                notesMode
                  ? 'bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200 text-indigo-900 shadow-xs'
                  : isCompleted
                  ? 'bg-slate-100 border-slate-200 text-slate-400 shadow-none'
                  : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-900 shadow-xs'
              }`}
            >
              {/* Digit display */}
              <span className="text-2xl sm:text-3xl leading-none">
                {num}
              </span>

              {/* Remaining count badge */}
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-0.5 leading-none flex items-center gap-0.5">
                {isCompleted ? (
                  <span className="text-emerald-600 font-bold">0 ✓</span>
                ) : (
                  `${remaining} zbývá`
                )}
              </span>

              {/* Notes mode tiny indicator dot */}
              {notesMode && (
                <span className="absolute top-1 right-1.5 text-[8px] text-indigo-600 font-mono font-bold leading-none">
                  P
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
