import React from 'react';
import { Volume2, VolumeX, ShieldCheck, ShieldAlert, Grid, Sun, Moon, Crown, Spade, Layers, Route, Settings, HelpCircle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useLanguage } from '../i18n/LanguageContext';

export type GameTab = 'sudoku' | 'tango' | 'queens' | 'minibridge' | 'mahjong' | 'zip';

interface HeaderProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  isMuted: boolean;
  onToggleSound: () => void;
  realTimeCheck: boolean;
  onToggleRealTimeCheck: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isMuted,
  onToggleSound,
  realTimeCheck,
  onToggleRealTimeCheck,
  onOpenSettings,
  onOpenHelp,
}) => {
  const { lang, toggleLang, pick } = useLanguage();

  return (
    <header className="w-full flex flex-col gap-2 pb-1">
      {/* Top Bar: Brand + Utilities */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            {pick('6v1', '6in1')}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
              {pick('Logické Hry', 'Logic Games')}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Sudoku · Tango · Queens · Bridge · Mahjong · Zip
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Language Switcher (CZ / EN) */}
          <button
            type="button"
            onClick={toggleLang}
            title={pick('Přepnout do angličtiny (EN)', 'Switch to Czech (CZ)')}
            aria-label={pick('Přepnout jazyk na angličtinu', 'Switch language to Czech')}
            className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-black tracking-wide text-slate-700 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors flex items-center justify-center shadow-2xs"
          >
            <span className={lang === 'cs' ? 'text-indigo-700' : 'text-slate-400'}>CZ</span>
            <span className="mx-0.5 text-slate-300">/</span>
            <span className={lang === 'en' ? 'text-indigo-700' : 'text-slate-400'}>EN</span>
          </button>

          {/* Install as Mobile App (PWA) when supported */}
          <PWAInstallButton variant="header" />

          {/* Real-time check toggle */}
          <button
            onClick={onToggleRealTimeCheck}
            title={
              realTimeCheck
                ? pick('Kontrola v reálném čase: Zapnuta', 'Real-time check: On')
                : pick('Kontrola v reálném čase: Vypnuta', 'Real-time check: Off')
            }
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
            title={isMuted ? pick('Zapnout zvuky', 'Unmute sounds') : pick('Ztlumit zvuky', 'Mute sounds')}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
              !isMuted
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings (Learning gate & JSON tasks) */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={pick('Nastavení limitu her, minut a úkolů', 'Settings: game limits, minutes & tasks')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-2xs"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Teacher Mode Guide */}
          <button
            type="button"
            onClick={onOpenHelp}
            title={pick('Nápověda ke hrám a jak aktivovat učitelský mód', 'Game help & how to enable Teacher Mode')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-2xs"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
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

