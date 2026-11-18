import React from 'react';
import { Volume2, VolumeX, ShieldCheck, ShieldAlert, Grid, Sun, Moon, Crown, Spade, Layers, Route } from 'lucide-react';

export type GameTab = 'sudoku' | 'tango' | 'queens' | 'minibridge' | 'mahjong' | 'zip';

interface HeaderProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  realTimeCheck: boolean;
  onToggleRealTimeCheck: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isMuted,
  onToggleSound,
  realTimeCheck,
  onToggleRealTimeCheck,
}) => {
  return (
    <header className="w-full flex flex-col gap-2 pb-1">
      {/* Top Bar: Brand + Utilities */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs">
            6v1
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
              Logické Hry
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Sudoku · Tango · Queens · Bridge · Mahjong · Zip
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-1.5">
          {/* Real-time check toggle */}
          <button
            onClick={onToggleRealTimeCheck}
            title={realTimeCheck ? 'Kontrola v reálném čase: Zapnuta' : 'Kontrola v reálném čase: Vypnuta'}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
              realTimeCheck
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {realTimeCheck ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            title={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
              !isMuted
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Download standalone HTML */}
          <a
            href="/minisudoku.html"
            download="logicke_hry_6v1.html"
            title="Stáhnout všech 6 her jako offline HTML soubor"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>

      {/* Primary Game Tabs (6 Tabs) */}
      <div className="grid grid-cols-6 p-1 bg-slate-100 rounded-xl gap-1">
        {/* Tab 1: Mini Sudoku */}
        <button
          onClick={() => onTabChange('sudoku')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'sudoku'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span>Sudoku</span>
        </button>

        {/* Tab 2: Tango */}
        <button
          onClick={() => onTabChange('tango')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'tango'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="hidden sm:flex items-center -space-x-1 shrink-0">
            <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
            <Moon className="w-2.5 h-2.5 text-indigo-600 fill-indigo-600" />
          </div>
          <span>Tango</span>
        </button>

        {/* Tab 3: Queens */}
        <button
          onClick={() => onTabChange('queens')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'queens'
              ? 'bg-white text-amber-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 hidden sm:block" />
          <span>Queens</span>
        </button>

        {/* Tab 4: Minibridge */}
        <button
          onClick={() => onTabChange('minibridge')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'minibridge'
              ? 'bg-[#2d5a27] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Spade className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span>Bridge</span>
        </button>

        {/* Tab 5: Mahjong */}
        <button
          onClick={() => onTabChange('mahjong')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'mahjong'
              ? 'bg-[#214d3d] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span>Mahjong</span>
        </button>

        {/* Tab 6: Zip */}
        <button
          onClick={() => onTabChange('zip')}
          className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
            activeTab === 'zip'
              ? 'bg-orange-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Route className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span>Zip</span>
        </button>
      </div>
    </header>
  );
};

