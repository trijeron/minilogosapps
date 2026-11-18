import React from 'react';
import { Grid, Sun, Crown, Spade, Layers, Route } from 'lucide-react';
import { GameTab } from './Header';

interface SwitchGameStripProps {
  currentGame: GameTab;
  onSelectGame?: (tab: GameTab) => void;
}

const GAME_OPTIONS: { id: GameTab; label: string; icon: React.ReactNode }[] = [
  { id: 'sudoku', label: 'Sudoku', icon: <Grid className="w-3.5 h-3.5 text-indigo-600" /> },
  { id: 'tango', label: 'Tango', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'queens', label: 'Queens', icon: <Crown className="w-3.5 h-3.5 text-amber-600" /> },
  { id: 'minibridge', label: 'Bridge', icon: <Spade className="w-3.5 h-3.5 text-emerald-700" /> },
  { id: 'mahjong', label: 'Mahjong', icon: <Layers className="w-3.5 h-3.5 text-teal-700" /> },
  { id: 'zip', label: 'Zip', icon: <Route className="w-3.5 h-3.5 text-orange-600" /> },
];

export const SwitchGameStrip: React.FC<SwitchGameStripProps> = ({
  currentGame,
  onSelectGame,
}) => {
  if (!onSelectGame) return null;
  const others = GAME_OPTIONS.filter((g) => g.id !== currentGame);

  return (
    <div className="w-full pt-3 mt-3 border-t border-slate-200/80 flex flex-col gap-2">
      <p className="text-[11px] font-bold text-slate-500 text-center">
        Přejít na jinou hru
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {others.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelectGame(g.id)}
            className="py-2 px-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
          >
            {g.icon}
            <span className="truncate">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
