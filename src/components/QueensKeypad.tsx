import React from 'react';
import { Undo2, Eraser, Lightbulb, RotateCcw, Crown, X, Sparkles } from 'lucide-react';
import { QueensCellState } from '../types/queens';

interface QueensKeypadProps {
  onMarkSelect: (mark: QueensCellState) => void;
  onErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hintsLeft: number;
  onUseHint: () => void;
  onResetBoard: () => void;
  placedQueens: number;
  maxQueens: number;
  autoCross: boolean;
  onToggleAutoCross: () => void;
  disabled?: boolean;
}

export const QueensKeypad: React.FC<QueensKeypadProps> = ({
  onMarkSelect,
  onErase,
  onUndo,
  canUndo,
  hintsLeft,
  onUseHint,
  onResetBoard,
  placedQueens,
  maxQueens,
  autoCross,
  onToggleAutoCross,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 max-w-[420px] mx-auto">
      {/* Action Tools Row */}
      <div className="grid grid-cols-4 gap-2">
        {/* Undo */}
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

        {/* Erase */}
        <button
          type="button"
          onClick={onErase}
          disabled={disabled}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs transition-all text-xs font-semibold"
          title="Smazat políčko"
        >
          <Eraser className="w-4 h-4 mb-0.5 text-slate-600" />
          <span className="text-[10px] tracking-tight">Smazat</span>
        </button>

        {/* Hint (Max 3) */}
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

        {/* Reset Field */}
        <button
          type="button"
          onClick={onResetBoard}
          disabled={disabled}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-95 shadow-2xs transition-all text-xs font-semibold"
          title="Resetovat hřiště (nápovědy zůstávají)"
        >
          <RotateCcw className="w-4 h-4 mb-0.5 text-slate-600" />
          <span className="text-[10px] tracking-tight">Reset</span>
        </button>
      </div>

      {/* Main Placement Buttons: Queen 👑 & Cross ✕ */}
      <div className="grid grid-cols-2 gap-2">
        {/* Place Queen Button */}
        <button
          type="button"
          onClick={() => onMarkSelect(2)}
          disabled={disabled}
          className="h-14 sm:h-16 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 flex items-center justify-center gap-3 font-bold transition-all shadow-xs active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
            <Crown className="w-6 h-6 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold leading-tight">Dáma (Koruna)</span>
            <span className="text-[11px] font-mono text-amber-800 font-semibold leading-tight">
              {placedQueens} / {maxQueens} umístěno
            </span>
          </div>
        </button>

        {/* Place Cross Button */}
        <button
          type="button"
          onClick={() => onMarkSelect(1)}
          disabled={disabled}
          className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 flex items-center justify-center gap-3 font-bold transition-all shadow-xs active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-600 flex items-center justify-center shadow-xs">
            <X className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold leading-tight">Křížek (✕)</span>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">
              Vyloučené pole
            </span>
          </div>
        </button>
      </div>

      {/* Auto-cross Option + Helper info */}
      <div className="flex items-center justify-between py-1 px-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <button
          type="button"
          onClick={onToggleAutoCross}
          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
              autoCross
                ? 'bg-indigo-600 border-indigo-700 text-white'
                : 'bg-white border-slate-300 text-transparent'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5 fill-current" />
          </div>
          <span className="text-[11px]">Auto-křížky okolo dámy</span>
        </button>

        <span className="text-[10px] text-slate-600 font-medium">
          1. klik = 👑 Dáma · 2. klik = ✕ Křížek
        </span>
      </div>
    </div>
  );
};
