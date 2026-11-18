import React from 'react';
import { X } from 'lucide-react';

interface MahjongRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MahjongRulesModal: React.FC<MahjongRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 flex flex-col gap-3 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-base font-extrabold text-slate-900">
            Pravidla Mahjong Solitaire
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Zavřít pravidla"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">1. Cíl hry</h3>
            <p>
              Odeberte všechny kameny z hrací plochy hledáním stejných dvojic. Každé rozdání je zaručeně řešitelné a měří se vám čas na <strong>časomíře</strong>.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              2. Který kámen je volný?
            </h3>
            <p>
              Vybrat můžete pouze <strong>volný kámen</strong> — tedy takový, na kterém neleží žádný kámen shora a zároveň má volnou alespoň <strong>levou nebo pravou stranu</strong>. Zablokované kameny jsou tmavší.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              3. Které kameny k sobě patří?
            </h3>
            <ul className="list-disc pl-4 flex flex-col gap-0.5 text-xs">
              <li>
                <strong>Puntíky, Bambusy, Znaky, Větry a Draci:</strong> musí se přesně shodovat (např. Červený drak + Červený drak).
              </li>
              <li>
                <strong>Květiny (K) a Roční období (R) v rozložení Želva:</strong> libovolná květina pasuje ke kterékoliv jiné květině a stejně tak roční období k ročnímu období.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              4. 10 nápověd, míchání a styl kamenů
            </h3>
            <p>
              Pro každou hru máte <strong>10 nápověd</strong>, které vám zvýrazní platnou volnou dvojici. Pokud dojdou dostupné tahy, můžete použít <strong>Zpět</strong> nebo <strong>Zamíchat</strong> zbývající kameny. Vzhled kamenů lze kdykoli přepnout mezi <strong>Komiksovým</strong>, <strong>Pohádkovým</strong> a <strong>Klasickým</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors"
        >
          Rozumím, jdu hrát
        </button>
      </div>
    </div>
  );
};
