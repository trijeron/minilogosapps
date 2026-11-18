import React from 'react';
import { X, Check, Edit3, Lightbulb, RotateCcw, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Pravidla Mini Sudoku 6×6
            </h3>
            <p className="text-xs text-slate-500">
              Rychlý průvodce a nápověda ke hře
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
          {/* Rule 1 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Cíl hry
              </strong>
              Doplňte do mřížky 6×6 čísla <strong>1 až 6</strong> tak, aby se žádné číslo neopakovalo v žádném řádku, sloupci ani vyznačeném bloku.
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Bloky 2×3
              </strong>
              Hrací plocha je rozdělena na 6 obdélníkových bloků o velikosti <strong>2 řádky × 3 sloupce</strong> (ohraničené silnější černou linkou). Každý blok musí obsahovat čísla 1–6.
            </div>
          </div>

          {/* Feature 1: Real-time Check */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Kontrola správnosti v reálném čase
              </strong>
              Aplikace ihned červeně označí konflikty (duplikáty v řádku, sloupci či bloku). Kontrolu můžete kdykoliv zapnout nebo vypnout v záhlaví.
            </div>
          </div>

          {/* Feature 2: Notes */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Poznámky (tužka)
              </strong>
              Aktivujte tlačítko <em>Poznámky</em> a zapisujte si do prázdných buněk kandidátní čísla. Čísla se zobrazují v miniaturní mřížce.
            </div>
          </div>

          {/* Feature 3: Hints */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                3 Nápovědy na hru
              </strong>
              K dispozici máte přesně 3 nápovědy. Po kliknutí se do označené (nebo náhodné prázdné) buňky doplní správné číslo.
            </div>
          </div>

          {/* Feature 4: Reset keeps hints */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                Reset hřiště zachovává nápovědy
              </strong>
              Tlačítko <em>Reset</em> vymaže všechny vámi zadané tahy a vrátí hřiště do původního stavu. Použité nápovědy však zůstávají vyplněné a počet nápověd se neobnovuje.
            </div>
          </div>

        </div>

        {/* Bottom Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Rozumím, jdeme hrát</span>
        </button>
      </div>
    </div>
  );
};
