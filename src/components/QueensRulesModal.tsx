import React from 'react';
import { X, Check, Crown, Sparkles, Lightbulb } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface QueensRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueensRulesModal: React.FC<QueensRulesModalProps> = ({ isOpen, onClose }) => {
  const { isEn, pick } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>{pick('Pravidla LinkedIn Queens (Dámy)', 'LinkedIn Queens Rules')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {pick(
                'Logická hra s dámami/korunami na šachovnici 6×6 až 10×10',
                'Crown placement logic puzzle on 6×6 to 10×10 grids'
              )}
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
        <div className="flex flex-col gap-3 py-4 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800">
            {pick(
              'Cílem hry je rozmístit dámy (koruny) na barevnou šachovnici tak, aby byly splněny 4 podmínky:',
              'Place queens (crowns) on the colored grid so that all 4 rules are satisfied:'
            )}
          </p>

          {/* Rule 1 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('V každém řádku', 'Every row')}
              </strong>
              {isEn ? (
                <>Must contain <strong>exactly one queen</strong>.</>
              ) : (
                <>Musí být <strong>přesně jedna dáma (královna)</strong>.</>
              )}
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('V každém sloupci', 'Every column')}
              </strong>
              {isEn ? (
                <>Must contain <strong>exactly one queen</strong>.</>
              ) : (
                <>Musí být <strong>přesně jedna dáma</strong>.</>
              )}
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('V každé barevné oblasti', 'Every color region')}
              </strong>
              {isEn ? (
                <>Each color zone must contain <strong>exactly one queen</strong>.</>
              ) : (
                <>V každé z barevných zón smí být <strong>přesně jedna dáma</strong>.</>
              )}
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('Dámy se nesmí dotýkat', 'Queens cannot touch')}
              </strong>
              {isEn ? (
                <>No two queens may touch – <strong>horizontally, vertically, or diagonally</strong>!</>
              ) : (
                <>Žádné dvě dámy nesmí sousedit – <strong>ani vodorovně, svisle, ani diagonálně přes roh</strong>!</>
              )}
            </div>
          </div>

          {/* Controls description */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-950 flex flex-col gap-1.5">
            <strong className="flex items-center gap-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />{' '}
              {pick('Ovládání kliknutím:', 'Tap / Click controls:')}
            </strong>
            <ul className="list-disc list-inside space-y-1">
              {isEn ? (
                <>
                  <li><strong>1st tap</strong>: places a <strong>Queen (👑)</strong>.</li>
                  <li><strong>2nd tap</strong>: switches to a <strong>Cross (✕)</strong> to exclude the cell.</li>
                  <li><strong>3rd tap</strong>: clears the cell back to empty.</li>
                  <li>Or use the action buttons below the board.</li>
                </>
              ) : (
                <>
                  <li><strong>1. kliknutí</strong>: umístí <strong>Dámu (👑)</strong>.</li>
                  <li><strong>2. kliknutí</strong>: změní na <strong>Křížek (✕)</strong> pro vyloučení pole.</li>
                  <li><strong>3. kliknutí</strong>: pole vymaže na prázdné.</li>
                  <li>Případně použijte tlačítka na spodní liště.</li>
                </>
              )}
            </ul>
          </div>

          {/* Hints & Reset */}
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <div>
              <strong className="text-slate-900 block font-semibold mb-0.5">
                {pick('Velikosti plochy & Nápovědy', 'Board sizes & Hints')}
              </strong>
              {isEn ? (
                <>
                  Play on <strong>6×6</strong>, <strong>8×8</strong>, or <strong>10×10 with 10 queens</strong>. Any valid non-attacking placement wins, and used hints stay preserved on reset.
                </>
              ) : (
                <>
                  Můžete hrát na mřížce <strong>6×6</strong>, <strong>8×8</strong> i maximální <strong>10×10 s 10 dámami</strong>. Uzná se každé platné řešení a nápovědy (3 ks) zůstávají zachovány i při resetu.
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
          <span>{pick('Rozumím, jdeme hrát Queens', 'Got it, let’s play Queens')}</span>
        </button>
      </div>
    </div>
  );
};
