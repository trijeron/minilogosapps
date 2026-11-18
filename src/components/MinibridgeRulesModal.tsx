import React from 'react';
import { X } from 'lucide-react';

interface MinibridgeRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinibridgeRulesModal: React.FC<MinibridgeRulesModalProps> = ({
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
            Jak se hraje Minibridge
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
            <h3 className="font-bold text-slate-900 mb-1">
              1. Počítání bodů (HCP)
            </h3>
            <p>
              Každý hráč dostane 13 karet a spočítá své silné karty (celkem je v balíčku 40 bodů):
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-slate-900 bg-slate-100 rounded-lg px-3 py-1.5 tabular-nums">
              Eso (A) = 4 · Král (K) = 3 · Dáma (Q) = 2 · Kluk (J) = 1
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              2. Oznámení bodů a Vydražitel
            </h3>
            <p>
              Hrají proti sobě dvojice <strong>Sever + Jih (Ty)</strong> proti{' '}
              <strong>Východ + Západ</strong>. Aby sis vždy procvičil volbu trumfů i sehrávku s Tichým hráčem, hra automaticky rozdá takové karty, kde máš nejvíce bodů právě <strong>Ty (Jih)</strong> — jsi tedy vždy <strong>Vydražitel</strong> a Sever je <strong>Tichý hráč (Dummy)</strong>.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              3. Výběr trumfů a závazku
            </h3>
            <p>
              Vydražitel si prohlédne obě ruce své dvojice a vybere buď trumfovou barvu (ideálně když máte dohromady alespoň 8 karet), nebo <strong>Bez trumfů (NT)</strong>:
            </p>
            <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5 text-xs">
              <li>
                <strong>Částečná hra (méně než 25 bodů):</strong> musíte získat alespoň <strong>7 zdvihů</strong>.
              </li>
              <li>
                <strong>Hra (25+ bodů):</strong> cíl je <strong>9 zdvihů</strong> (Bez trumfů), <strong>10 zdvihů</strong> (♠ Piky / ♥ Srdce) nebo <strong>11 zdvihů</strong> (♦ Kára / ♣ Trefy).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              4. Sehrávka a ctění barvy
            </h3>
            <p>
              První vynáší hráč po levici Vydražitele. Všichni musí <strong>ctít vynesou barvu</strong> (hrát stejný znak, pokud ho mají). Kdo nemá vynesou barvu, může hrát trumf (který přebije i eso jiné barvy) nebo zahodit jinou kartu. Nejvyšší karta bere zdvih a vynáší do dalšího kola.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors"
        >
          Rozumím, jdu hrát
        </button>
      </div>
    </div>
  );
};
