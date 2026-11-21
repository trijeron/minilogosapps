import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MinibridgeRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinibridgeRulesModal: React.FC<MinibridgeRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isEn, pick } = useLanguage();
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
            {pick('Jak se hraje Minibridge', 'How to play Minibridge')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label={pick('Zavřít pravidla', 'Close rules')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              {pick('1. Počítání bodů (HCP)', '1. Counting High Card Points (HCP)')}
            </h3>
            <p>
              {pick(
                'Každý hráč dostane 13 karet a spočítá své silné karty (celkem je v balíčku 40 bodů):',
                'Each player receives 13 cards and counts their honor points (40 HCP total in the deck):'
              )}
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-slate-900 bg-slate-100 rounded-lg px-3 py-1.5 tabular-nums">
              {pick(
                'Eso (A) = 4 · Král (K) = 3 · Dáma (Q) = 2 · Kluk (J) = 1',
                'Ace (A) = 4 · King (K) = 3 · Queen (Q) = 2 · Jack (J) = 1'
              )}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              {pick('2. Oznámení bodů a Vydražitel', '2. Announcing HCP & Declarer')}
            </h3>
            <p>
              {isEn ? (
                <>
                  <strong>North + South (You)</strong> play against <strong>East + West</strong>. So you can always practice choosing trumps and playing with Dummy, deals are automatically set up so <strong>You (South)</strong> have the highest HCP — making you <strong>Declarer</strong> and North your <strong>Dummy</strong>.
                </>
              ) : (
                <>
                  Hrají proti sobě dvojice <strong>Sever + Jih (Ty)</strong> proti{' '}
                  <strong>Východ + Západ</strong>. Aby sis vždy procvičil volbu trumfů i sehrávku s Tichým hráčem, hra automaticky rozdá takové karty, kde máš nejvíce bodů právě <strong>Ty (Jih)</strong> — jsi tedy vždy <strong>Vydražitel</strong> a Sever je <strong>Tichý hráč (Dummy)</strong>.
                </>
              )}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              {pick('3. Výběr trumfů a závazku', '3. Choosing Trumps & Contract')}
            </h3>
            <p>
              {isEn ? (
                <>
                  Declarer inspects both partnership hands and picks either a trump suit (ideally with 8+ combined cards) or <strong>No Trump (NT)</strong>:
                </>
              ) : (
                <>
                  Vydražitel si prohlédne obě ruce své dvojice a vybere buď trumfovou barvu (ideálně když máte dohromady alespoň 8 karet), nebo <strong>Bez trumfů (NT)</strong>:
                </>
              )}
            </p>
            <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5 text-xs">
              {isEn ? (
                <>
                  <li>
                    <strong>Part-score (under 25 HCP):</strong> target is at least <strong>7 tricks</strong>.
                  </li>
                  <li>
                    <strong>Game (25+ HCP):</strong> target is <strong>9 tricks</strong> (No Trump), <strong>10 tricks</strong> (♠ Spades / ♥ Hearts), or <strong>11 tricks</strong> (♦ Diamonds / ♣ Clubs).
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <strong>Částečná hra (méně než 25 bodů):</strong> musíte získat alespoň <strong>7 zdvihů</strong>.
                  </li>
                  <li>
                    <strong>Hra (25+ bodů):</strong> cíl je <strong>9 zdvihů</strong> (Bez trumfů), <strong>10 zdvihů</strong> (♠ Piky / ♥ Srdce) nebo <strong>11 zdvihů</strong> (♦ Kára / ♣ Trefy).
                  </li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-1">
              {pick('4. Sehrávka a ctění barvy', '4. Trick Play & Following Suit')}
            </h3>
            <p>
              {isEn ? (
                <>
                  The player to Declarer’s left leads first. Everyone must <strong>follow the led suit</strong> if able. If void in that suit, you may ruff with a trump (which beats any non-trump card) or discard another card. The highest card wins the trick and leads next.
                </>
              ) : (
                <>
                  První vynáší hráč po levici Vydražitele. Všichni musí <strong>ctít vynesou barvu</strong> (hrát stejný znak, pokud ho mají). Kdo nemá vynesou barvu, může hrát trumf (který přebije i eso jiné barvy) nebo zahodit jinou kartu. Nejvyšší karta bere zdvih a vynáší do dalšího kola.
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors"
        >
          {pick('Rozumím, jdu hrát', 'Got it, let’s play')}
        </button>
      </div>
    </div>
  );
};
