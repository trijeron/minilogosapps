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
import { useLanguage } from '../i18n/LanguageContext';

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

const GAME_GUIDES_CS: GameGuide[] = [
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
      'Nahoře můžete přepínat grafický styl (Komiks, Pohádky, Klasický), 3D/2D pohled i přiblížení (Zoom posuvník 75–250 %).',
    ],
    icon: <Layers className="w-4 h-4 text-teal-700" />,
  },
  {
    id: 'zip',
    label: 'Zip',
    goal: 'Nakreslete jedním souvislým tahem cestu od čísla 1 postupně přes všechna čísla až do posledního.',
    controls: [
      'V režimu Klasický musíte projít každým políčkem a vyhnout se tmavým stěnám; v režimu Jednoduchý stačí spojit všechna čísla v pořadí.',
      'Přejetím zpět o jedno políčko se tah zkrátí; dotykem starší části čáry se tah bezpečně zastaví.',
      'Obtížnost (velikost mřížky) lze přepínat na 5×5, 6×6 nebo 7×7.',
    ],
    icon: <Route className="w-4 h-4 text-orange-600" />,
  },
];

const GAME_GUIDES_EN: GameGuide[] = [
  {
    id: 'sudoku',
    label: 'Sudoku 6×6',
    goal: 'Fill the 6×6 grid with numbers 1 to 6 so no number repeats in any row, column, or 2×3 rectangular box.',
    controls: [
      'Tap an empty cell and pick a number 1–6 (or type on your keyboard).',
      'Notes mode (pencil) lets you jot down candidate numbers.',
      'You get 3 hints per game; Reset clears your moves while keeping used hints counted.',
    ],
    icon: <Grid className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'tango',
    label: 'Tango 6×6',
    goal: 'Fill the 6×6 grid with suns (☀️) and moons (🌙) following three simple balance rules.',
    controls: [
      'Every row and column must contain exactly 3 suns and 3 moons.',
      'No more than 2 identical symbols may sit side-by-side horizontally or vertically.',
      'Markers between cells: "=" means matching symbols, "×" means opposite symbols. Tap to cycle Sun → Moon → Empty.',
    ],
    icon: <Sun className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'queens',
    label: 'Queens',
    goal: 'Place exactly one crown (queen) in every row, column, and colored region on the board (6×6 to 10×10).',
    controls: [
      'No two queens may touch each other, not even diagonally.',
      '1st tap = cross (✕) to rule out a cell, 2nd tap = Queen (👑), 3rd tap = clear.',
      'Use the Cross / Queen mode toggle to quickly paint crosses by dragging.',
    ],
    icon: <Crown className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'minibridge',
    label: 'Minibridge',
    goal: 'Beginner-friendly card game: count your High Card Points (HCP), choose trumps, and win the target number of tricks.',
    controls: [
      'Points (HCP): Ace = 4, King = 3, Queen = 2, Jack = 1. South (you) is always Declarer and North (partner) lays down the Dummy hand.',
      'Pick a trump suit (ideally 8+ combined cards) or No Trump (NT), and a level (Part Score = 7 tricks, Game = 9/10/11 tricks).',
      'Always follow the led suit when you can. Toggle card layout (Fan / By Suit) in the top bar.',
    ],
    icon: <Spade className="w-4 h-4 text-emerald-700" />,
  },
  {
    id: 'mahjong',
    label: 'Mahjong',
    goal: 'Remove all matching pairs of tiles from the board until the table is clear.',
    controls: [
      'Only free tiles can be selected: nothing may rest on top, and at least one side (left or right) must be open.',
      'In the Turtle (144) layout, any two Flowers match each other, and any two Seasons match each other.',
      'Switch visual themes (Comic, Fairytale, Classic), 3D/2D view angle, layouts, and Zoom (75–250%) in the top bar.',
    ],
    icon: <Layers className="w-4 h-4 text-teal-700" />,
  },
  {
    id: 'zip',
    label: 'Zip',
    goal: 'Draw a single continuous path starting from 1 and visiting every numbered checkpoint in order.',
    controls: [
      'In Classic mode you must visit every single cell and avoid walls; in Simple mode just connect all numbers in order without crossing your path.',
      'Dragging back one step trims the last cell; touching an earlier part of the line safely stops instead of resetting.',
      'Switch grid size between 5×5, 6×6, and 7×7 anytime.',
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
  const { isEn, pick } = useLanguage();
  const [section, setSection] = useState<'games' | 'teacher'>('games');
  const [selectedGame, setSelectedGame] = useState<GameTab>(activeTab);

  useEffect(() => {
    if (isOpen) {
      setSelectedGame(activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const guides = isEn ? GAME_GUIDES_EN : GAME_GUIDES_CS;
  const currentGuide = guides.find((g) => g.id === selectedGame) || guides[0];

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
                {pick('Nápověda a učitelský mód', 'Help & Teacher Mode')}
              </h2>
              <p className="text-xs text-slate-500">
                {pick(
                  'Co dělat v jednotlivých hrách a jak nastavit učící úkoly',
                  'How to play each game and set up learning breaks'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={pick('Zavřít nápovědu', 'Close help')}
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
            <span>{pick('Co dělat ve hrách (6)', 'How to Play (6)')}</span>
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
            <span>{pick('Jak aktivovat učitelský mód', 'Enable Teacher Mode')}</span>
          </button>
        </div>

        {/* Content */}
        {section === 'games' ? (
          <div className="flex flex-col gap-3">
            {/* Game Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {guides.map((g) => (
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
              {pick(
                'Stav rozehraných her, nejlepší časy i nastavení se ukládají v ',
                'Game progress, best times, and settings are saved in '
              )}
              <strong className="text-slate-700">sessionStorage</strong>
              {pick(' po dobu aktuální relace prohlížeče.', ' for the current browser session.')}
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
                  {pick(
                    'Otevřete Nastavení (ozubené kolečko v hlavičce)',
                    'Open Settings (gear icon in the top bar)'
                  )}
                </strong>
                {pick(
                  'Zapněte přepínač „Aktivovat učící úkoly po limitu“.',
                  'Turn on the "Enable learning tasks after limit" switch.'
                )}
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  {pick('Nastavte limit her nebo minut', 'Set game or time limits')}
                </strong>
                {pick(
                  'Zvolte pomocí posuvníků (0–10), po kolika dohraných hrách nebo po kolika minutách hraní se zobrazí okno s úkolem. Nula znamená nikdy. Můžete zvolit i počet otázek (1–10) a náhodné střídání.',
                  'Use the sliders (0–10) to set how many completed games or minutes trigger a learning break (0 = never). You can also set how many questions (1–10) must be answered and enable random order.'
                )}
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  {pick(
                    'Vlastní úkoly (JSON, soubor, složka nebo web)',
                    'Custom tasks (JSON, device file/folder, or web URL)'
                  )}
                </strong>
                {pick(
                  'Podporovány jsou 3 typy úkolů: ',
                  'Supports 3 task types: '
                )}
                <code>match</code> {pick('(spojování slov)', '(matching pairs)')},{' '}
                <code>fill</code> {pick('(doplnění odpovědi)', '(fill-in-the-blank)')}{' '}
                {pick('a ', 'and ')}
                <code>choice</code> {pick('(výběr z N možností). ', '(multiple choice). ')}
                {pick(
                  'Úkoly můžete načíst z JSON souboru v telefonu, ze složky nebo z webové adresy.',
                  'You can load task sets from a JSON file/folder on your phone or directly from a web URL.'
                )}
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                4
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  {pick('Stažení offline verze', 'Download offline version')}
                </strong>
                {pick(
                  'Možnost stažení celé sady 6 her jako jednoho offline HTML souboru najdete přímo v okně Nastavení.',
                  'You can download all 6 games as a single standalone offline HTML file directly inside Settings.'
                )}
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
              <span>{pick('Otevřít nastavení učitelského módu', 'Open Teacher Mode Settings')}</span>
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
          <span>{pick('Rozumím', 'Got it')}</span>
        </button>
      </div>
    </div>
  );
};
