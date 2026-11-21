import React from 'react';
import { X, Route, ShieldAlert, Undo2, Lightbulb } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ZipRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipRulesModal: React.FC<ZipRulesModalProps> = ({ isOpen, onClose }) => {
  const { isEn, pick } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {pick('Pravidla hry Zip', 'Zip Rules')}
            </h2>
            <p className="text-xs text-slate-500">
              {pick('Jedna souvislá cesta přes celou mřížku', 'One continuous path across the grid')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={pick('Zavřít', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
            <Route className="w-4 h-4 text-orange-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">
                {pick('Spojte čísla od 1 do posledního', 'Connect numbers in order from 1 to the last')}
              </p>
              <p>
                {isEn ? (
                  <>
                    Drag horizontally or vertically to draw a continuous path starting at <strong>1</strong> and visiting every numbered checkpoint in ascending order.
                  </>
                ) : (
                  <>
                    Tažením myši nebo prstu veďte souvislou cestu vodorovně a svisle od čísla <strong>1</strong> postupně přes všechna další čísla až do nejvyššího čísla.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <ShieldAlert className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">{pick('Dva režimy hry', 'Two game modes')}</p>
              <p>
                {isEn ? (
                  <>
                    <strong>Classic (with walls):</strong> the path must visit <strong>every single cell once</strong> without crossing dark walls.
                  </>
                ) : (
                  <>
                    <strong>Klasický (se zdmi):</strong> cesta musí projít <strong>každým políčkem mřížky přesně jednou</strong> a nesmí překročit tmavé zdi.
                  </>
                )}
              </p>
              <p className="mt-1">
                {isEn ? (
                  <>
                    <strong>Simple connect:</strong> no walls — simply link the numbers from <strong>1</strong> to the last without crossing your own line (empty cells do not need to be filled).
                  </>
                ) : (
                  <>
                    <strong>Jednoduché spojování:</strong> bez zdí — stačí spojit čísla od <strong>1</strong> do posledního bez křížení vlastní čáry (prázdná políčka nemusíte vyplnit).
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <Undo2 className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">
                {pick('Bezpečné kreslení a návrat zpět', 'Safe drawing & backtracking')}
              </p>
              <p>
                {isEn ? (
                  <>
                    Accidentally touching an earlier part of your line will <strong>not reset</strong> it — your stroke simply stops at the last valid cell. Slide back onto the previous cell or tap <strong>Undo</strong> to step back.
                  </>
                ) : (
                  <>
                    Když se omylem dotknete dřívější části čáry, spojnice se <strong>neresetuje</strong> — tah se jen zastaví na posledním platném poli. Pro návrat o krok zpět přejeďte na bezprostředně předchozí políčko nebo použijte tlačítko <strong>Zpět</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">{pick('Nápověda', 'Hints')}</p>
              <p>
                {isEn ? (
                  <>
                    The <strong>Hint</strong> button highlights the next valid step (or marks where to backtrack if your path got blocked).
                  </>
                ) : (
                  <>
                    Tlačítko <strong>Nápověda</strong> zvýrazní další správný krok (nebo ukáže políčko, kam se vrátit, pokud jste zablokovali cestu).
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
        >
          {pick('Rozumím, jdu hrát', 'Got it, let’s play')}
        </button>
      </div>
    </div>
  );
};
