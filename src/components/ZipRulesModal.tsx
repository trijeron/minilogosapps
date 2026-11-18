import React from 'react';
import { X, Route, ShieldAlert, Undo2, Lightbulb } from 'lucide-react';

interface ZipRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipRulesModal: React.FC<ZipRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Pravidla hry Zip</h2>
            <p className="text-xs text-slate-500">Jedna souvislá cesta přes celou mřížku</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
            <Route className="w-4 h-4 text-orange-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Spojte čísla od 1 do posledního</p>
              <p>
                Tažením myši nebo prstu veďte souvislou cestu vodorovně a svisle od čísla <strong>1</strong> postupně přes všechna další čísla až do nejvyššího čísla.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <ShieldAlert className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Všechna políčka a žádné zdi</p>
              <p>
                Cesta musí projít <strong>každým políčkem mřížky přesně jednou</strong> (bez křížení) a nesmí překročit tmavé zdi mezi políčky.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <Undo2 className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Rychlý návrat zpět</p>
              <p>
                Přejetím zpět na předchozí políčko cestu plynule zkrátíte. Kliknutím na libovolné dřívější políčko cesty ji zkrátíte až k němu, nebo použijte tlačítko <strong>Zpět</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Nápověda</p>
              <p>
                Tlačítko <strong>Nápověda</strong> zvýrazní další správný krok (nebo ukáže políčko, kam se vrátit, pokud jste odbočili).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
        >
          Rozumím, jdu hrát
        </button>
      </div>
    </div>
  );
};
