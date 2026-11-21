import React from 'react';
import { X, Check, Sun, Moon, Lightbulb } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TangoRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TangoRulesModal: React.FC<TangoRulesModalProps> = ({ isOpen, onClose }) => {
  const { isEn, pick } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{pick('Pravidla LinkedIn Tango (6×6)', 'LinkedIn Tango (6×6) Rules')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {pick('Binární logická hra se Sluncem a Měsícem', 'Binary logic puzzle with Suns and Moons')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-3.5 py-4 text-xs text-slate-600 leading-relaxed">
          {/* Rule 1: Balance */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4 fill-current" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('1. Rovnováha (3 slunce a 3 měsíce)', '1. Balance (3 suns & 3 moons)')}
              </strong>
              {isEn ? (
                <>
                  Every row and every column of the 6×6 grid must contain <strong>exactly 3 suns and 3 moons</strong>.
                </>
              ) : (
                <>
                  V každém řádku a v každém sloupci mřížky 6×6 musí být <strong>přesně 3 slunce a 3 měsíce</strong>.
                </>
              )}
            </div>
          </div>

          {/* Rule 2: No three in a row */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4 fill-current" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('2. Pravidlo tří (max. 2 stejné vedle sebe)', '2. Rule of three (max 2 adjacent)')}
              </strong>
              {isEn ? (
                <>
                  No <strong>more than two identical symbols</strong> may appear consecutively horizontally or vertically (no ☀️☀️☀️ or 🌙🌙🌙).
                </>
              ) : (
                <>
                  Vedle sebe ani pod sebou nesmí stát <strong>více než dva stejné symboly</strong>. Tři slunce ani tři měsíce za sebou (např. ☀️☀️☀️ nebo 🌙🌙🌙) nejsou povoleny!
                </>
              )}
            </div>
          </div>

          {/* Rule 3: Equal signs */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-300 font-bold flex items-center justify-center shrink-0 text-sm">
              =
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('3. Rovnítka (=)', '3. Equals signs (=)')}
              </strong>
              {isEn ? (
                <>
                  Connect two adjacent cells that <strong>must contain the same symbol</strong> (both ☀️ or both 🌙).
                </>
              ) : (
                <>
                  Spojují dvě sousední buňky, které <strong>musí mít stejný symbol</strong> (obě ☀️ nebo obě 🌙).
                </>
              )}
            </div>
          </div>

          {/* Rule 4: Cross signs */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-amber-300 font-bold flex items-center justify-center shrink-0 text-sm">
              ×
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('4. Křížky (×)', '4. Cross signs (×)')}
              </strong>
              {isEn ? (
                <>
                  Connect two adjacent cells that <strong>must contain opposite symbols</strong> (one ☀️ and one 🌙).
                </>
              ) : (
                <>
                  Spojují dvě sousední buňky, které <strong>musí mít rozdílné symboly</strong> (jedno ☀️ a druhé 🌙).
                </>
              )}
            </div>
          </div>

          {/* Strategy Tip */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex flex-col gap-1">
            <strong>{pick('Doporučená strategie:', 'Recommended strategy:')}</strong>
            <ul className="list-disc list-inside space-y-0.5">
              {isEn ? (
                <>
                  <li>Start with cells connected by <strong>=</strong> and <strong>×</strong> markers.</li>
                  <li>Whenever you see two identical symbols (☀️☀️), place 🌙 on both sides.</li>
                  <li>If there is a single gap between two matching symbols (☀️_☀️), the middle must be 🌙.</li>
                  <li>Once a row has 3 suns, fill the rest with moons!</li>
                </>
              ) : (
                <>
                  <li>Začněte buňkami se značkami <strong>=</strong> a <strong>×</strong>.</li>
                  <li>Pokud vidíte dvě stejná (☀️☀️), z obou stran doplňte 🌙.</li>
                  <li>Pokud je mezi dvěma stejnými mezera (☀️_☀️), uprostřed musí být 🌙.</li>
                  <li>Jakmile má řádek 3 slunce, zbytek doplňte měsíci!</li>
                </>
              )}
            </ul>
          </div>

          {/* Feature: Hints & Reset */}
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('3 Nápovědy & Reset se zachováním nápověd', '3 Hints & Reset preserves hints')}
              </strong>
              {isEn ? (
                <>
                  Using <em>Reset</em> keeps revealed hint cells filled, and your remaining hint count is not restored.
                </>
              ) : (
                <>
                  Při použití tlačítka <em>Reset</em> zůstávají nápovědy a odhalená políčka vyplněná, počet nápověd se neobnovuje.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>{pick('Rozumím, jdeme hrát Tango', 'Got it, let’s play Tango')}</span>
        </button>
      </div>
    </div>
  );
};
