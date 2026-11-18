import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  GraduationCap,
  Gamepad2,
  Settings,
  Check,
  Grid,
  Sun,
  Crown,
  Spade,
  Layers,
  Route,
} from 'lucide-react';
import { GameTab } from './Header';

interface HelpModalProps {
  isOpen: boolean;
  activeTab: GameTab;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface GameGuide {
  id: GameTab;
  label: string;
  goal: string;
  controls: string[];
  icon: React.ReactNode;
}

const GAME_GUIDES: GameGuide[] = [
  {
    id: 'sudoku',
    label: 'Sudoku 6×6',
    goal: 'Doplňte do mřížky 6×6 čísla 1 až 6 tak, aby se žádné číslo neopakovalo v řádku, sloupci ani v obdélníkovém bloku 2×3.',
    controls: [
      'Klikněte na prázdné políčko a zvolte číslo 1–6 (nebo pište na klávesnici).',
      'Režim Poznámky (tužka) umožňuje zapisovat kandidátní čísla.',
      'K dispozici máte 3 nápovědy na hru; Reset smaže vaše tahy, ale použité nápovědy zachová.',
    ],
    icon: <Grid className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'tango',
    label: 'Tango 6×6',
    goal: 'Vyplňte mřížku 6×6 slunci (☀️) a měsíci (🌙) podle tří pravidel logické rovnováhy.',
    controls: [
      'V každém řádku a sloupci musí být přesně 3 slunce a 3 měsíce.',
      'Nikde nesmí stát více než 2 stejné symboly vedle sebe ani pod sebou.',
      'Značky mezi políčky: „=“ znamená stejné symboly, „×“ znamená opačné symboly. Klikáním střídáte Slunce → Měsíc → Prázdné.',
    ],
    icon: <Sun className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'queens',
    label: 'Queens (Dámy)',
    goal: 'Umístěte na šachovnici (6×6 až 10×10) přesně jednu korunu (dámu) do každého řádku, sloupce a barevné oblasti.',
    controls: [
      'Žádné dvě dámy se nesmí dotýkat ani šikmo (diagonálně) přes roh.',
      '1. kliknutí na pole = křížek (✕) pro označení prázdného místa, 2. kliknutí = Dáma (👑), 3. kliknutí = smazat.',
      'Tlačítko Křížek / Dáma umožňuje rychle kreslit křížky tažením prstu či myši.',
    ],
    icon: <Crown className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'minibridge',
    label: 'Minibridge',
    goal: 'Karetní hra pro děti a začátečníky: spočítejte body (HCP), určete trumfy a uhrajte potřebný počet zdvihů.',
    controls: [
      'Body (HCP): Eso = 4, Král = 3, Dáma = 2, Kluk = 1. Hráč Jih (vy) je vždy Vydražitel a Sever (partner) vyloží karty jako Tichý hráč.',
      'Zvolte trumfovou barvu (ideálně 8+ společných karet) nebo Bez trumfů (NT) a úroveň závazku (Částečná hra = 7 zdvihů, Hra = 9/10/11 zdvihů).',
      'Při sehrávce ctěte vynesenou barvu. V horní liště stolu můžete přepínat zobrazení karet (Vějíř / Podle barev).',
    ],
    icon: <Spade className="w-4 h-4 text-emerald-700" />,
  },
  {
    id: 'mahjong',
    label: 'Mahjong',
    goal: 'Odstraňte z hrací plochy všechny dvojice shodných kamenů, dokud nezůstane stůl prázdný.',
    controls: [
      'Vybrat lze pouze volný kámen: na něm nesmí ležet jiný kámen a alespoň z jedné strany (vlevo nebo vpravo) musí být volný.',
      'V rozložení Želva (144) lze spárovat jakékoli dvě Květiny nebo jakákoli dvě Roční období.',
      'Nahoře můžete přepínat grafický styl (Komiks, Pohádky, Klasický), měnit rozložení i přiblížení (Zoom posuvník 75–250 %).',
    ],
    icon: <Layers className="w-4 h-4 text-teal-700" />,
  },
  {
    id: 'zip',
    label: 'Zip',
    goal: 'Nakreslete jedním souvislým tahem cestu od čísla 1 postupně přes všechna čísla až do posledního tak, aby prošla každým políčkem mřížky.',
    controls: [
      'Táhněte myší nebo prstem od čísla 1 sousedními políčky (vodorovně/svisle) a vyhněte se tmavým stěnám.',
      'Přejetím zpět na předchozí políčko cesty se cesta automaticky zkrátí. Použít lze také tlačítka Zpět, Reset a Nápověda.',
      'Obtížnost (velikost mřížky) lze přepínat na 5×5, 6×6 nebo 7×7.',
    ],
    icon: <Route className="w-4 h-4 text-orange-600" />,
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onOpenSettings,
}) => {
  const [section, setSection] = useState<'games' | 'teacher'>('games');
  const [selectedGame, setSelectedGame] = useState<GameTab>(activeTab);

  useEffect(() => {
    if (isOpen) {
      setSelectedGame(activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentGuide =
    GAME_GUIDES.find((g) => g.id === selectedGame) || GAME_GUIDES[0];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Nápověda a učitelský mód
              </h2>
              <p className="text-xs text-slate-500">
                Co dělat v jednotlivých hrách a jak nastavit učící úkoly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Zavřít nápovědu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setSection('games')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              section === 'games'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Co dělat ve hrách (6)</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('teacher')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              section === 'teacher'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Jak aktivovat učitelský mód</span>
          </button>
        </div>

        {/* Content */}
        {section === 'games' ? (
          <div className="flex flex-col gap-3">
            {/* Game Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {GAME_GUIDES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGame(g.id)}
                  className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                    selectedGame === g.id
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{g.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Selected Game Guide */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  {currentGuide.icon}
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {currentGuide.label}
                </h3>
              </div>

              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentGuide.goal}
              </p>

              <ul className="flex flex-col gap-1.5 text-xs text-slate-600 leading-relaxed list-disc pl-4">
                {currentGuide.controls.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed px-1">
              Stav rozehraných her, nejlepší časy i nastavení se ukládají v{' '}
              <strong className="text-slate-700">sessionStorage</strong> po dobu aktuální relace prohlížeče.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-xs text-slate-600 leading-relaxed">
            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Otevřete Nastavení (ozubené kolečko v hlavičce)
                </strong>
                Zapněte přepínač <em>„Aktivovat učící úkoly po limitu“</em>.
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Nastavte limit her nebo minut
                </strong>
                Zvolte, po kolika <strong>dohraných hrách</strong> (např. po 3 hrách) nebo po kolika <strong>minutách</strong> hraní se zobrazí okno s úkolem. Můžete vybrat i počet úkolů na jednu přestávku (1–3).
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Zadání vlastních úkolů JSONem a historie
                </strong>
                Editor podporuje 3 typy úkolů: <code>match</code> (spojování slov), <code>fill</code> (doplnění odpovědi) a <code>choice</code> (výběr z N možností). Každou uloženou sadu si aplikace pamatuje v <strong>sessionStorage</strong>, takže se k dřívějším úkolům můžete jedním kliknutím vrátit.
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Stažení offline verze
                </strong>
                Možnost stažení celé sady 6 her jako jednoho offline HTML souboru najdete přímo v okně <strong>Nastavení</strong>.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="mt-1 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Otevřít nastavení učitelského módu</span>
            </button>
          </div>
        )}

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Rozumím</span>
        </button>
      </div>
    </div>
  );
};
