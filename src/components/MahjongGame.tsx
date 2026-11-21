import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Undo2,
  Lightbulb,
  Shuffle,
  HelpCircle,
  RotateCcw,
  Pause,
  Play,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Star,
  Clock,
  ZoomIn,
  ZoomOut,
  X,
  Layers,
} from 'lucide-react';
import {
  MahjongLayoutId,
  MahjongMove,
  MahjongTheme,
  MahjongTile as MahjongTileModel,
} from '../types/mahjong';
import {
  MAHJONG_MAX_HINTS,
  findMatchingPairs,
  generateSolvableMahjongBoard,
  getFreeTiles,
  getLayoutSlots,
  getMahjongLayoutLabel,
  getMahjongTileLabel,
  isTileFree,
  pickHintPair,
  reshuffleRemainingTiles,
  tilesMatch,
} from '../utils/mahjongEngine';
import { MahjongTile } from './MahjongTile';
import { MahjongRulesModal } from './MahjongRulesModal';
import { formatTime } from '../utils/format';
import { sound } from '../utils/audio';
import {
  MahjongViewAngle,
  clearMahjongSavedState,
  loadMahjongBestTimes,
  loadMahjongStateFromStorage,
  loadMahjongTheme,
  loadMahjongViewAngle,
  loadMahjongZoom,
  saveMahjongBestTime,
  saveMahjongStateToStorage,
  saveMahjongTheme,
  saveMahjongViewAngle,
  saveMahjongZoom,
} from '../utils/storage';
import { GameTab } from './Header';
import { SwitchGameStrip } from './SwitchGameStrip';
import { useLanguage } from '../i18n/LanguageContext';

const ZOOM_MIN = 75;
const ZOOM_MAX = 250;
const ZOOM_STEP = 15;

interface MahjongGameProps {
  realTimeCheck: boolean;
  onGameCompleted?: () => void;
  onSelectGame?: (tab: GameTab) => void;
  externalPaused?: boolean;
}

export const MahjongGame: React.FC<MahjongGameProps> = ({
  realTimeCheck,
  onGameCompleted,
  onSelectGame,
  externalPaused = false,
}) => {
  const { lang, isEn, pick } = useLanguage();
  const [layout, setLayout] = useState<MahjongLayoutId>('pyramid');
  const [tiles, setTiles] = useState<MahjongTileModel[]>([]);
  const [history, setHistory] = useState<MahjongMove[]>([]);
  const [hintsLeft, setHintsLeft] = useState<number>(MAHJONG_MAX_HINTS);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [hintUids, setHintUids] = useState<number[]>([]);
  const [blockedUid, setBlockedUid] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const [bestTimes, setBestTimes] = useState(loadMahjongBestTimes);
  const [theme, setTheme] = useState<MahjongTheme>(loadMahjongTheme);
  const [viewAngle, setViewAngle] = useState<MahjongViewAngle>(loadMahjongViewAngle);
  const [zoomPct, setZoomPct] = useState<number>(loadMahjongZoom);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  const noteTimerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const centerBoardScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    window.requestAnimationFrame(() => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = Math.round((el.scrollWidth - el.clientWidth) / 2);
      }
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = Math.round((el.scrollHeight - el.clientHeight) / 2);
      }
    });
  }, []);

  const handleZoomChange = (nextPct: number) => {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(nextPct)));
    setZoomPct(clamped);
    saveMahjongZoom(clamped);
  };

  const handleToggleViewAngle = () => {
    const next: MahjongViewAngle = viewAngle === '3d' ? 'flat' : '3d';
    setViewAngle(next);
    saveMahjongViewAngle(next);
  };

  const showTempNote = useCallback((msg: string) => {
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    setStatusNote(msg);
    noteTimerRef.current = window.setTimeout(() => {
      setStatusNote(null);
      noteTimerRef.current = null;
    }, 1800);
  }, []);

  const startNewGame = useCallback((targetLayout: MahjongLayoutId) => {
    const freshTiles = generateSolvableMahjongBoard(targetLayout);
    setLayout(targetLayout);
    setTiles(freshTiles);
    setHistory([]);
    setHintsLeft(MAHJONG_MAX_HINTS);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
    setSelectedUid(null);
    setHintUids([]);
    setBlockedUid(null);
    setStatusNote(null);
    setShowVictory(false);
    setIsNewBest(false);

    saveMahjongStateToStorage({
      layout: targetLayout,
      tiles: freshTiles,
      history: [],
      hintsLeft: MAHJONG_MAX_HINTS,
      elapsedSeconds: 0,
      isPaused: false,
      isCompleted: false,
    });
  }, []);

  // Load saved game or start fresh
  useEffect(() => {
    const saved = loadMahjongStateFromStorage();
    if (saved && !saved.isCompleted) {
      setLayout(saved.layout);
      setTiles(saved.tiles);
      setHistory(saved.history || []);
      setHintsLeft(
        typeof saved.hintsLeft === 'number' ? saved.hintsLeft : MAHJONG_MAX_HINTS
      );
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setIsPaused(saved.isPaused || false);
      setIsCompleted(false);
    } else {
      startNewGame('pyramid');
    }
  }, [startNewGame]);

  // Autosave
  useEffect(() => {
    if (tiles.length === 0) return;
    saveMahjongStateToStorage({
      layout,
      tiles,
      history,
      hintsLeft,
      elapsedSeconds,
      isPaused,
      isCompleted,
    });
  }, [layout, tiles, history, hintsLeft, elapsedSeconds, isPaused, isCompleted]);

  // Timer (časomíra)
  useEffect(() => {
    if (isPaused || externalPaused || showRules || isCompleted || tiles.length === 0) return;
    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPaused, externalPaused, showRules, isCompleted, tiles.length]);

  useEffect(() => {
    return () => {
      if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    };
  }, []);

  const freeUids = useMemo(() => {
    return new Set(getFreeTiles(tiles).map((t) => t.uid));
  }, [tiles]);

  const selectedTile = useMemo(
    () =>
      selectedUid !== null
        ? tiles.find((t) => t.uid === selectedUid && !t.removed) ?? null
        : null,
    [tiles, selectedUid]
  );

  const remainingCount = useMemo(
    () => tiles.filter((t) => !t.removed).length,
    [tiles]
  );

  const availablePairs = useMemo(() => findMatchingPairs(tiles), [tiles]);
  const isDeadlocked = remainingCount > 0 && availablePairs.length === 0;

  // Center scrollable mat when switching layouts or starting zoomed on mobile
  useEffect(() => {
    if (tiles.length === 0) return;
    centerBoardScroll();
  }, [layout, centerBoardScroll, tiles.length > 0]);

  // Board geometry bounds with side-angled 3D layer projection
  const boardMetrics = useMemo(() => {
    const slots = getLayoutSlots(layout);
    let maxX = 0;
    let maxY = 0;
    let maxZ = 0;
    for (const s of slots) {
      if (s.x + 2 > maxX) maxX = s.x + 2;
      if (s.y + 2 > maxY) maxY = s.y + 2;
      if (s.z > maxZ) maxZ = s.z;
    }
    const zShiftUnitsX = viewAngle === '3d' ? 0.30 : 0.10;
    const zShiftUnitsY = viewAngle === '3d' ? 0.38 : 0.10;
    const padLeft = 0.85 + maxZ * zShiftUnitsX;
    const padTop = 0.85 + maxZ * zShiftUnitsY;
    const padRight = viewAngle === '3d' ? 1.45 : 1.1;
    const padBottom = viewAngle === '3d' ? 1.65 : 1.1;
    const totalW = maxX + padLeft + padRight;
    const totalH = maxY + padTop + padBottom;
    // Authentic upright Mahjong tile proportion (~1 : 1.24), making mobile boards taller and easier to tap
    const tileRatioY = viewAngle === '3d' ? 1.24 : 1.14;
    const aspectRatio = totalW / (totalH * tileRatioY);
    return {
      padLeft,
      padTop,
      totalW,
      totalH,
      zShiftUnitsX,
      zShiftUnitsY,
      aspectRatio,
    };
  }, [layout, viewAngle]);

  const handleTileClick = (tile: MahjongTileModel) => {
    if (isPaused || isCompleted || tile.removed) return;

    if (!isTileFree(tile, tiles)) {
      setBlockedUid(tile.uid);
      window.setTimeout(() => setBlockedUid((prev) => (prev === tile.uid ? null : prev)), 350);
      sound.playError();
      showTempNote(
        pick(
          'Tento kámen je zablokovaný shora nebo z obou stran.',
          'This tile is blocked from above or on both sides.'
        )
      );
      return;
    }

    if (selectedUid === null) {
      setSelectedUid(tile.uid);
      sound.playPlace(2);
      return;
    }

    if (selectedUid === tile.uid) {
      setSelectedUid(null);
      sound.playErase();
      return;
    }

    const first = tiles.find((t) => t.uid === selectedUid && !t.removed);
    if (!first) {
      setSelectedUid(tile.uid);
      return;
    }

    if (tilesMatch(first.def, tile.def)) {
      const updated = tiles.map((t) =>
        t.uid === first.uid || t.uid === tile.uid ? { ...t, removed: true } : t
      );
      setTiles(updated);
      setHistory((prev) => [...prev, { uidA: first.uid, uidB: tile.uid }]);
      setSelectedUid(null);
      setHintUids([]);
      setStatusNote(null);
      sound.playPlace(6);

      const left = updated.filter((t) => !t.removed).length;
      if (left === 0) {
        setIsCompleted(true);
        clearMahjongSavedState();
        sound.playVictory();
        const prevBest = bestTimes[layout];
        const isRecord = prevBest === null || elapsedSeconds < prevBest;
        if (isRecord) {
          setBestTimes(saveMahjongBestTime(layout, elapsedSeconds));
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }
        setShowVictory(true);
        onGameCompleted?.();
      }
    } else {
      // Switch selection cleanly to newly clicked tile
      setSelectedUid(tile.uid);
      sound.playNote();
      if (realTimeCheck) {
        showTempNote(
          pick(
            `${getMahjongTileLabel(first.def, lang)} a ${getMahjongTileLabel(tile.def, lang)} netvoří pár.`,
            `${getMahjongTileLabel(first.def, lang)} and ${getMahjongTileLabel(tile.def, lang)} do not match.`
          )
        );
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || isPaused || isCompleted) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setTiles((prev) =>
      prev.map((t) =>
        t.uid === last.uidA || t.uid === last.uidB ? { ...t, removed: false } : t
      )
    );
    setSelectedUid(null);
    setHintUids([]);
    sound.playErase();
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || isPaused || isCompleted) return;
    if (hintUids.length === 2) {
      const stillValid = hintUids.every((uid) => {
        const t = tiles.find((x) => x.uid === uid);
        return t && !t.removed && freeUids.has(uid);
      });
      if (stillValid) {
        sound.playHint();
        return;
      }
    }

    const pair = pickHintPair(tiles);
    if (!pair) {
      sound.playError();
      showTempNote(
        pick(
          'Žádná volná dvojice k nápovědě — zkuste Zamíchat.',
          'No free matching pairs — try Shuffle.'
        )
      );
      return;
    }

    setSelectedUid(null);
    setHintUids([pair[0].uid, pair[1].uid]);
    setHintsLeft((prev) => Math.max(0, prev - 1));
    sound.playHint();
  };

  const handleShuffle = () => {
    if (isPaused || isCompleted || remainingCount < 2) return;
    setTiles((prev) => reshuffleRemainingTiles(prev));
    setSelectedUid(null);
    setHintUids([]);
    sound.playHint();
    showTempNote(
      pick(
        'Zbývající kameny byly znovu promíchány.',
        'Remaining tiles have been reshuffled.'
      )
    );
  };

  // Render tiles sorted bottom-to-top so upper layers draw cleanly above lower ones
  const orderedTiles = useMemo(() => {
    return [...tiles].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }, [tiles]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Layout & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1 flex-1 min-w-[240px]">
          {(['pyramid', 'bridge', 'turtle'] as MahjongLayoutId[]).map((id) => {
            const active = layout === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => startNewGame(id)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getMahjongLayoutLabel(id, lang)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <div
            className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1"
            role="group"
            aria-label={pick('Styl kamenů', 'Tile theme')}
          >
            {(['comic', 'fairytale', 'classic'] as MahjongTheme[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setTheme(mode);
                  saveMahjongTheme(mode);
                }}
                className={`py-1 px-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  theme === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'comic'
                  ? pick('Komiksový', 'Comic')
                  : mode === 'fairytale'
                    ? pick('Pohádkový', 'Fairytale')
                    : pick('Klasický', 'Classic')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{pick('Pravidla', 'Rules')}</span>
          </button>

          <button
            type="button"
            onClick={() => startNewGame(layout)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{pick('Nová hra', 'New game')}</span>
          </button>
        </div>
      </div>

      {/* Info Bar with Časomíra (Timer + Pause), Available Pairs, and Best Time */}
      <div className="w-full flex items-center justify-between py-1.5 px-3 bg-white rounded-xl border border-slate-200/80 shadow-xs text-xs font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            title={
              isPaused
                ? pick('Pokračovat', 'Resume')
                : pick('Pozastavit časomíru', 'Pause timer')
            }
            className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
              isPaused
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium leading-none">
              {pick('Časomíra', 'Timer')}
            </span>
            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 tabular-nums">
          {isDeadlocked ? (
            <span className="flex items-center gap-1 text-rose-700 font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pick('0 volných dvojic', '0 free pairs')}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isEn ? (
                  <>
                    <strong>{remainingCount}</strong> tiles left ·{' '}
                    <strong>{availablePairs.length}</strong>{' '}
                    {availablePairs.length === 1 ? 'move' : 'moves'}
                  </>
                ) : (
                  <>
                    Zbývá <strong>{remainingCount}</strong> kamenů ·{' '}
                    <strong>{availablePairs.length}</strong>{' '}
                    {availablePairs.length === 1
                      ? 'tah'
                      : availablePairs.length < 5
                        ? 'tahy'
                        : 'tahů'}
                  </>
                )}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-medium leading-none">
              {pick('Rekord', 'Best')}
            </span>
            <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
              {bestTimes[layout] !== null ? formatTime(bestTimes[layout]!) : '--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Warning / Deadlock / Feedback Banner */}
      {(isDeadlocked || statusNote) && (
        <div
          className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            isDeadlocked
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <span>
            {isDeadlocked
              ? pick(
                  'Nezbývají žádné volné dvojice! Použijte Zpět nebo Zamíchat kameny.',
                  'No free matching pairs left! Use Undo or Shuffle tiles.'
                )
              : statusNote}
          </span>
          {isDeadlocked && (
            <button
              type="button"
              onClick={handleShuffle}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0"
            >
              {pick('Zamíchat', 'Shuffle')}
            </button>
          )}
        </div>
      )}

      {/* Top Zoom & 3D Angle Bar */}
      <div className="w-full flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl">
        <button
          type="button"
          onClick={() => handleZoomChange(zoomPct - ZOOM_STEP)}
          disabled={zoomPct <= ZOOM_MIN}
          title={pick('Zmenšit desku', 'Zoom out')}
          aria-label={pick('Zmenšit desku', 'Zoom out')}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 active:scale-95 transition-all shrink-0"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={5}
          value={zoomPct}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          aria-label={pick('Přiblížení desky', 'Board zoom')}
          className="flex-1 min-w-[60px] h-2 bg-slate-200 rounded-lg accent-emerald-700 cursor-pointer"
        />

        <button
          type="button"
          onClick={() => handleZoomChange(zoomPct + ZOOM_STEP)}
          disabled={zoomPct >= ZOOM_MAX}
          title={pick('Zvětšit desku', 'Zoom in')}
          aria-label={pick('Zvětšit desku', 'Zoom in')}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 active:scale-95 transition-all shrink-0"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoomChange(zoomPct === 100 ? 150 : 100)}
          title={pick('Přepnout velikost 100 % / 150 %', 'Toggle 100% / 150% zoom')}
          className="px-2 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 tabular-nums min-w-[46px] shrink-0"
        >
          {zoomPct}%
        </button>

        <button
          type="button"
          onClick={handleToggleViewAngle}
          title={
            viewAngle === '3d'
              ? pick('Přepnout na plochý pohled shora', 'Switch to flat top-down view')
              : pick('Přepnout na 3D šikmý pohled vrstev', 'Switch to 3D angled layer view')
          }
          className={`px-2.5 h-8 rounded-lg border text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0 ${
            viewAngle === '3d'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-2xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{viewAngle === '3d' ? '3D' : '2D'}</span>
        </button>
      </div>

      {/* Selected Tile Sticky Reminder (super helpful when zoomed on mobile) */}
      {selectedTile && !isPaused && !isCompleted && (
        <div className="w-full px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center justify-between gap-2">
          <span>
            {pick('Vybráno:', 'Selected:')}{' '}
            <strong>{getMahjongTileLabel(selectedTile.def, lang)}</strong> —{' '}
            {pick('klepněte na druhý stejný kámen', 'tap a matching tile')}
          </span>
          <button
            type="button"
            onClick={() => setSelectedUid(null)}
            className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" />
            <span>{pick('Zrušit', 'Cancel')}</span>
          </button>
        </div>
      )}

      {/* Layered Mahjong Felt Mat (with Side-Angled 3D Stacks, Zoom & Pan) */}
      <div
        className={`relative z-0 isolate w-full rounded-2xl border-4 shadow-inner overflow-hidden ${
          theme === 'comic'
            ? 'border-slate-950'
            : theme === 'fairytale'
              ? 'border-amber-900'
              : 'border-[#17332a]'
        }`}
        style={{
          backgroundColor:
            theme === 'comic'
              ? '#0f766e'
              : theme === 'fairytale'
                ? '#2e1a47'
                : '#214d3d',
          backgroundImage:
            theme === 'comic'
              ? 'radial-gradient(rgba(15, 23, 42, 0.22) 1.5px, transparent 1.5px), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.22) 100%)'
              : theme === 'fairytale'
                ? 'radial-gradient(rgba(253, 230, 138, 0.22) 1.2px, transparent 1.2px), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(10,4,25,0.3) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.25) 100%)',
          backgroundSize:
            theme === 'comic'
              ? '14px 14px, 100% 100%'
              : theme === 'fairytale'
                ? '18px 18px, 100% 100%'
                : '100% 100%',
        }}
      >
        <div
          ref={scrollContainerRef}
          className="w-full overflow-auto max-h-[68vh] sm:max-h-[75vh] touch-pan-x touch-pan-y"
        >
          <div
            className={`relative ${zoomPct <= 100 ? 'mx-auto' : ''}`}
            style={{
              width: `${zoomPct}%`,
              aspectRatio: `${boardMetrics.aspectRatio.toFixed(4)}`,
            }}
          >
            {orderedTiles.map((tile) => {
              const leftPct =
                ((tile.x + boardMetrics.padLeft - tile.z * boardMetrics.zShiftUnitsX) /
                  boardMetrics.totalW) *
                100;
              const topPct =
                ((tile.y + boardMetrics.padTop - tile.z * boardMetrics.zShiftUnitsY) /
                  boardMetrics.totalH) *
                100;
              const widthPct = (1.92 / boardMetrics.totalW) * 100;
              const heightPct = (1.92 / boardMetrics.totalH) * 100;

              return (
                <MahjongTile
                  key={tile.uid}
                  tile={tile}
                  theme={theme}
                  viewAngle={viewAngle}
                  isFree={freeUids.has(tile.uid)}
                  isSelected={selectedUid === tile.uid}
                  isHinted={hintUids.includes(tile.uid)}
                  isBlockedShake={blockedUid === tile.uid}
                  leftPct={leftPct}
                  topPct={topPct}
                  widthPct={widthPct}
                  heightPct={heightPct}
                  compact={layout === 'turtle' && zoomPct < 135}
                  onClick={() => handleTileClick(tile)}
                />
              );
            })}
          </div>
        </div>

        {/* Frosted Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-[4000] bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
            <h3 className="text-base font-bold mb-1">
              {pick('Časomíra pozastavena', 'Timer paused')}
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">
              {pick('Kameny jsou během pauzy skryté.', 'Tiles are hidden while paused.')}
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95"
            >
              {pick('Pokračovat ve hře', 'Resume game')}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls: Undo, 10 Hints, Shuffle */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0 || isPaused || isCompleted}
          className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Undo2 className="w-4 h-4" />
          <span>{pick('Zpět', 'Undo')}</span>
        </button>

        <button
          type="button"
          onClick={handleHint}
          disabled={hintsLeft <= 0 || isPaused || isCompleted || remainingCount === 0}
          className="py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all tabular-nums"
        >
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>{pick(`Nápověda (${hintsLeft})`, `Hint (${hintsLeft})`)}</span>
        </button>

        <button
          type="button"
          onClick={handleShuffle}
          disabled={isPaused || isCompleted || remainingCount < 2}
          className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Shuffle className="w-4 h-4" />
          <span>{pick('Zamíchat', 'Shuffle')}</span>
        </button>
      </div>

      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
              <Trophy className="w-8 h-8 fill-amber-500 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {pick('Vyčištěno!', 'Board cleared!')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-4">
              {pick(
                `Úspěšně jste složili ${getMahjongLayoutLabel(layout, lang)}`,
                `You successfully cleared ${getMahjongLayoutLabel(layout, lang)}`
              )}
            </p>

            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4 flex flex-col gap-2.5 text-xs tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {pick('Časomíra', 'Time')}
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-700">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{pick('Použité nápovědy', 'Hints used')}</span>
                <span className="font-bold text-slate-800">
                  {MAHJONG_MAX_HINTS - hintsLeft} / {MAHJONG_MAX_HINTS}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> {pick('Osobní rekord', 'Personal best')}
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {bestTimes[layout] !== null
                    ? formatTime(bestTimes[layout]!)
                    : formatTime(elapsedSeconds)}
                </span>
              </div>
              {isNewBest && (
                <div className="mt-1 py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  {pick('Nový nejlepší čas!', 'New personal best!')}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => startNewGame(layout)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{pick('Hrát další hru', 'Play again')}</span>
            </button>

            <SwitchGameStrip currentGame="mahjong" onSelectGame={onSelectGame} />
          </div>
        </div>
      )}

      <MahjongRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
