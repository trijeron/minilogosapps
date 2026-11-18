import React from 'react';
import { Undo2, Eraser, Lightbulb, RotateCcw, Sun, Moon } from 'lucide-react';
import { TangoSymbol } from '../types/tango';

interface TangoKeypadProps {
  onSymbolSelect: (symbol: TangoSymbol) => void;
  onErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hintsLeft: number;
  onUseHint: () => void;
  onResetBoard: () => void;
  remainingSuns: number;
  remainingMoons: number;
  disabled?: boolean;
}

export const TangoKeypad: React.FC<TangoKeypadProps> = ({
  onSymbolSelect,
  onErase,
  onUndo,
  canUndo,
  hintsLeft,
  onUseHint,
  onResetBoard,
  remainingSuns,
  remainingMoons,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2.5 max-w-[420px] mx-auto">
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

      {/* Symbol selection buttons: Sun & Moon */}
      <div className="grid grid-cols-2 gap-2">
        {/* Sun Button */}
        <button
          type="button"
          onClick={() => onSymbolSelect(1)}
          disabled={disabled}
          className="h-14 sm:h-16 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 flex items-center justify-center gap-3 font-bold transition-all shadow-xs active:scale-95"
        >
          <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 shadow-xs">
            <Sun className="w-6 h-6 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold leading-tight">Slunce</span>
            <span className="text-[11px] font-mono text-amber-800 font-semibold leading-tight">
              {remainingSuns === 0 ? 'Hotovo ✓' : `${remainingSuns} zbývá`}
            </span>
          </div>
        </button>

        {/* Moon Button */}
        <button
          type="button"
          onClick={() => onSymbolSelect(2)}
          disabled={disabled}
          className="h-14 sm:h-16 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 text-indigo-950 flex items-center justify-center gap-3 font-bold transition-all shadow-xs active:scale-95"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Moon className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold leading-tight">Měsíc</span>
            <span className="text-[11px] font-mono text-indigo-800 font-semibold leading-tight">
              {remainingMoons === 0 ? 'Hotovo ✓' : `${remainingMoons} zbývá`}
            </span>
          </div>
        </button>
      </div>

      <p className="text-[10px] text-center text-slate-600 font-medium -mt-1">
        Tip: Můžete také klikat přímo na políčka pro rychlé přepínání (☀️ → 🌙 → Prázdné).
      </p>
    </div>
  );
};
