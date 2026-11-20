import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Undo2, RotateCcw, Lightbulb } from 'lucide-react';
import { ZipBoardSize, ZipBestTimes, ZipMode } from '../types/zip';
import {
  generateZipPuzzle,
  getNextExpectedZipNumber,
  applyZipCellInteraction,
  isZipCompleted,
  getZipHint,
} from '../utils/zipEngine';
import { GameInfoBar } from './GameInfoBar';
import { ZipGrid } from './ZipGrid';
import { ZipRulesModal } from './ZipRulesModal';
import { ZipVictoryModal } from './ZipVictoryModal';
import { ConfirmModal } from './ConfirmModal';
import { sound } from '../utils/audio';
import {
  saveZipStateToStorage,
  loadZipStateFromStorage,
  clearZipSavedState,
  loadZipBestTimes,
  saveZipBestTime,
} from '../utils/storage';
import { GameTab } from './Header';

interface ZipGameProps {
  realTimeCheck: boolean;
  onGameCompleted?: () => void;
  onSelectGame?: (tab: GameTab) => void;
  externalPaused?: boolean;
}

export const ZipGame: React.FC<ZipGameProps> = ({
  realTimeCheck,
  onGameCompleted,
  onSelectGame,
  externalPaused = false,
}) => {
  const [boardSize, setBoardSize] = useState<ZipBoardSize>(6);
  const [mode, setMode] = useState<ZipMode>('classic');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [maxNumber, setMaxNumber] = useState<number>(2);
  const [horizontalWalls, setHorizontalWalls] = useState<boolean[]>([]);
  const [verticalWalls, setVerticalWalls] = useState<boolean[]>([]);
  const [solutionPath, setSolutionPath] = useState<number[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [history, setHistory] = useState<number[][]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // Visual hints & feedback
  const [hintTargetCell, setHintTargetCell] = useState<number | null>(null);
  const [hintBacktrackCell, setHintBacktrackCell] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [blockedFeedbackCell, setBlockedFeedbackCell] = useState<number | null>(null);

  // Modals & records
  const [bestTimes, setBestTimes] = useState<ZipBestTimes>(() => loadZipBestTimes('classic'));
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState<boolean>(false);
  const [pendingSize, setPendingSize] = useState<ZipBoardSize | null>(null);
  const [pendingMode, setPendingMode] = useState<ZipMode | null>(null);

  const dragSnapshotRef = useRef<number[] | null>(null);
  const dragChangedRef = useRef<boolean>(false);
  const victoryTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (victoryTimerRef.current !== null) {
      window.clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = null;
    }
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startNewGame = useCallback(
    (size: ZipBoardSize, targetMode: ZipMode = mode) => {
      clearTimers();
      const puzzle = generateZipPuzzle(size, targetMode);
      const startCell = puzzle.solutionPath[0];
      const initialPath = [startCell];

      setBoardSize(size);
      setMode(targetMode);
      setBestTimes(loadZipBestTimes(targetMode));
      setNumbers(puzzle.numbers);
      setMaxNumber(puzzle.maxNumber);
      setHorizontalWalls(puzzle.horizontalWalls);
      setVerticalWalls(puzzle.verticalWalls);
      setSolutionPath(puzzle.solutionPath);
      setPath(initialPath);
      setHistory([]);
      setElapsedSeconds(0);
      setIsPaused(false);
      setIsCompleted(false);
      setHintsUsed(0);
      setHintTargetCell(null);
      setHintBacktrackCell(null);
      setStatusNote(null);
      setBlockedFeedbackCell(null);
      setShowVictory(false);
      setIsNewBest(false);
      setPendingSize(null);
      setPendingMode(null);

      saveZipStateToStorage({
        size,
        mode: targetMode,
        numbers: puzzle.numbers,
        maxNumber: puzzle.maxNumber,
        horizontalWalls: puzzle.horizontalWalls,
        verticalWalls: puzzle.verticalWalls,
        solutionPath: puzzle.solutionPath,
        path: initialPath,
        elapsedSeconds: 0,
        isPaused: false,
        isCompleted: false,
        hintsUsed: 0,
      });
    },
    [clearTimers, mode]
  );

  // Initial load
  useEffect(() => {
    const saved = loadZipStateFromStorage();
    if (saved && !saved.isCompleted) {
      const savedMode: ZipMode = saved.mode === 'simple' ? 'simple' : 'classic';
      setBoardSize(saved.size);
      setMode(savedMode);
      setBestTimes(loadZipBestTimes(savedMode));
      setNumbers(saved.numbers);
      setMaxNumber(saved.maxNumber);
      setHorizontalWalls(saved.horizontalWalls);
      setVerticalWalls(saved.verticalWalls);
      setSolutionPath(saved.solutionPath);
      setPath(saved.path);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setIsPaused(saved.isPaused || false);
      setIsCompleted(false);
      setHintsUsed(saved.hintsUsed || 0);
    } else {
      startNewGame(6, 'classic');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave
  useEffect(() => {
    const total = boardSize * boardSize;
    if (numbers.length === total && solutionPath.length === total) {
      saveZipStateToStorage({
        size: boardSize,
        mode,
        numbers,
        maxNumber,
        horizontalWalls,
        verticalWalls,
        solutionPath,
        path,
        elapsedSeconds,
        isPaused,
        isCompleted,
        hintsUsed,
      });
    }
  }, [
    boardSize,
    mode,
    numbers,
    maxNumber,
    horizontalWalls,
    verticalWalls,
    solutionPath,
    path,
    elapsedSeconds,
    isPaused,
    isCompleted,
    hintsUsed,
  ]);

  // Stopwatch loop
  useEffect(() => {
    if (
      isPaused ||
      externalPaused ||
      showRules ||
      showNewGameConfirm ||
      isCompleted ||
      numbers.length === 0
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPaused, externalPaused, showRules, showNewGameConfirm, isCompleted, numbers.length]);

  const nextExpectedNumber = useMemo(
    () => getNextExpectedZipNumber(path, numbers),
    [path, numbers]
  );

  const totalCells = boardSize * boardSize;
  const reachedLastEarly = useMemo(() => {
    if (mode === 'simple') return false;
    if (path.length === 0 || path.length >= totalCells) return false;
    const head = path[path.length - 1];
    return numbers[head] === maxNumber;
  }, [mode, path, totalCells, numbers, maxNumber]);

  const showTransientFeedback = useCallback((msg: string, cellIdx: number) => {
    setStatusNote(msg);
    setBlockedFeedbackCell(cellIdx);
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setBlockedFeedbackCell(null);
    }, 350);
  }, []);

  const checkVictory = useCallback(
    (candidatePath: number[]) => {
      if (
        isZipCompleted(
          candidatePath,
          boardSize,
          numbers,
          maxNumber,
          horizontalWalls,
          verticalWalls,
          mode
        )
      ) {
        setIsCompleted(true);
        setHintTargetCell(null);
        setHintBacktrackCell(null);
        setStatusNote(null);
        clearZipSavedState();
        sound.playVictory();

        const prevBest = bestTimes[boardSize];
        const isRecord = prevBest === null || elapsedSeconds < prevBest;
        if (isRecord) {
          const updated = saveZipBestTime(boardSize, elapsedSeconds, mode);
          setBestTimes(updated);
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }

        // Brief pause so the smooth emerald tube win animation plays visibly first
        victoryTimerRef.current = window.setTimeout(() => {
          setShowVictory(true);
        }, 620);
        onGameCompleted?.();
      }
    },
    [
      boardSize,
      mode,
      numbers,
      maxNumber,
      horizontalWalls,
      verticalWalls,
      bestTimes,
      elapsedSeconds,
      onGameCompleted,
    ]
  );

  const commitPathUpdate = useCallback(
    (nextPath: number[], recordUndoImmediately = false) => {
      if (recordUndoImmediately) {
        setHistory((prev) => [...prev.slice(-40), path]);
      } else {
        dragChangedRef.current = true;
      }
      setPath(nextPath);
      setHintTargetCell(null);
      setHintBacktrackCell(null);
      setStatusNote(null);
      checkVictory(nextPath);
    },
    [path, checkVictory]
  );

  const handleStartAtCell = useCallback(
    (idx: number) => {
      if (isPaused || isCompleted) return;
      dragSnapshotRef.current = [...path];
      dragChangedRef.current = false;

      const res = applyZipCellInteraction(
        path,
        idx,
        'start',
        boardSize,
        numbers,
        horizontalWalls,
        verticalWalls
      );
      if (res.changed) {
        if (res.action === 'backtrack') {
          sound.playErase();
        } else {
          sound.playNote();
        }
        commitPathUpdate(res.path, false);
      } else if (res.action === 'blocked' && res.reason && realTimeCheck) {
        showTransientFeedback(res.reason, idx);
      }
    },
    [
      isPaused,
      isCompleted,
      path,
      boardSize,
      numbers,
      horizontalWalls,
      verticalWalls,
      commitPathUpdate,
      realTimeCheck,
      showTransientFeedback,
    ]
  );

  const handleMoveToCell = useCallback(
    (idx: number) => {
      if (isPaused || isCompleted) return;

      const res = applyZipCellInteraction(
        path,
        idx,
        'move',
        boardSize,
        numbers,
        horizontalWalls,
        verticalWalls
      );
      if (res.changed) {
        if (res.action === 'backtrack') {
          sound.playErase();
        } else {
          sound.playNote();
        }
        commitPathUpdate(res.path, false);
      } else if (res.action === 'blocked' && res.reason && realTimeCheck) {
        showTransientFeedback(res.reason, idx);
      }
    },
    [
      isPaused,
      isCompleted,
      path,
      numbers,
      boardSize,
      horizontalWalls,
      verticalWalls,
      commitPathUpdate,
      realTimeCheck,
      showTransientFeedback,
    ]
  );

  const handleEndDrag = useCallback(() => {
    if (dragChangedRef.current && dragSnapshotRef.current) {
      const snap = dragSnapshotRef.current;
      setHistory((prev) => [...prev.slice(-40), snap]);
    }
    dragSnapshotRef.current = null;
    dragChangedRef.current = false;
  }, []);

  const handleUndo = useCallback(() => {
    if (isPaused || isCompleted) return;
    if (history.length > 0) {
      const prevPath = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setPath(prevPath);
      setHintTargetCell(null);
      setHintBacktrackCell(null);
      setStatusNote(null);
      sound.playErase();
    } else if (path.length > 1) {
      setPath((prev) => prev.slice(0, -1));
      setHintTargetCell(null);
      setHintBacktrackCell(null);
      setStatusNote(null);
      sound.playErase();
    }
  }, [isPaused, isCompleted, history, path.length]);

  const handleReset = useCallback(() => {
    if (isPaused || isCompleted || path.length <= 1) return;
    const startCell = solutionPath[0] ?? path[0];
    setHistory((prev) => [...prev.slice(-40), path]);
    setPath([startCell]);
    setHintTargetCell(null);
    setHintBacktrackCell(null);
    setStatusNote('Cesta resetována na číslo 1.');
    sound.playErase();
  }, [isPaused, isCompleted, path, solutionPath]);

  const handleUseHint = useCallback(() => {
    if (isPaused || isCompleted) return;
    const hint = getZipHint(path, solutionPath, {
      mode,
      size: boardSize,
      numbers,
      maxNumber,
      horizontalWalls,
      verticalWalls,
    });
    if (!hint) return;

    setHintsUsed((prev) => prev + 1);
    sound.playHint();

    if (hint.type === 'next') {
      setHintTargetCell(hint.targetCell);
      setHintBacktrackCell(null);
      setStatusNote('Další správný krok je zvýrazněn oranžově.');
    } else {
      setHintTargetCell(null);
      setHintBacktrackCell(hint.backtrackCell);
      setStatusNote(
        mode === 'simple'
          ? 'Cesta k dalšímu číslu je zablokovaná — vraťte se na červeně označené políčko.'
          : 'Odbočili jste ze správného řešení — vraťte se na červeně označené políčko.'
      );
    }
  }, [
    isPaused,
    isCompleted,
    path,
    solutionPath,
    mode,
    boardSize,
    numbers,
    maxNumber,
    horizontalWalls,
    verticalWalls,
  ]);

  const handleSizeClick = (sz: ZipBoardSize) => {
    if (sz === boardSize) return;
    if (path.length > 1 && !isCompleted) {
      setPendingSize(sz);
      setPendingMode(mode);
      setShowNewGameConfirm(true);
    } else {
      startNewGame(sz, mode);
    }
  };

  const handleModeClick = (nextMode: ZipMode) => {
    if (nextMode === mode) return;
    if (path.length > 1 && !isCompleted) {
      setPendingSize(boardSize);
      setPendingMode(nextMode);
      setShowNewGameConfirm(true);
    } else {
      startNewGame(boardSize, nextMode);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showVictory || showRules || showNewGameConfirm) return;
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleUseHint();
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showVictory, showRules, showNewGameConfirm, handleUndo, handleUseHint]);

  const canUndo = history.length > 0 || path.length > 1;
  const activeAlert = reachedLastEarly
    ? `Poslední číslo ${maxNumber} musí být až na konci cesty — zbývá projít ${
        totalCells - path.length
      } políček.`
    : statusNote;

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Difficulty / Grid Size Selector + Rules + New Game */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1 flex-1">
          {([5, 6, 7] as ZipBoardSize[]).map((sz) => {
            const isActive = boardSize === sz;
            return (
              <button
                key={sz}
                onClick={() => handleSizeClick(sz)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sz}×{sz}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowRules(true)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs whitespace-nowrap shrink-0"
        >
          Pravidla
        </button>

        <button
          onClick={() => {
            if (path.length > 1 && !isCompleted) {
              setPendingSize(boardSize);
              setPendingMode(mode);
              setShowNewGameConfirm(true);
            } else {
              startNewGame(boardSize, mode);
            }
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
        >
          Nová hra
        </button>
      </div>

      {/* Mode Toggle: Classic (walls + all cells) vs Simple (connect numbers freely without walls) */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1" role="group" aria-label="Režim hry Zip">
        <button
          type="button"
          onClick={() => handleModeClick('classic')}
          className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            mode === 'classic'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Klasický (se zdmi)
        </button>
        <button
          type="button"
          onClick={() => handleModeClick('simple')}
          className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            mode === 'simple'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Jednoduché spojování
        </button>
      </div>

      {/* Stopwatch + Status + Record */}
      <GameInfoBar
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        bestTime={bestTimes[boardSize]}
        conflictCount={reachedLastEarly ? 1 : 0}
        errorCount={0}
        realTimeCheck={realTimeCheck}
      />

      {/* Clean unboxed progress metadata */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2 tabular-nums">
          {mode === 'classic' ? (
            <span>
              Políčka: <strong className="text-slate-900">{path.length}</strong>/{totalCells}
            </span>
          ) : (
            <span>
              Spojeno:{' '}
              <strong className="text-slate-900">
                {Math.min(maxNumber, nextExpectedNumber - 1)}
              </strong>
              /{maxNumber}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span>
            Další číslo:{' '}
            <strong className="text-orange-700">
              {nextExpectedNumber <= maxNumber ? nextExpectedNumber : 'Hotovo'}
            </strong>
          </span>
        </div>
        {hintsUsed > 0 && (
          <span className="text-[11px] text-slate-500 tabular-nums">Nápovědy: {hintsUsed}</span>
        )}
      </div>

      {/* Contextual Hint / Rule Tip Banner */}
      {activeAlert && (
        <div
          className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
            reachedLastEarly || hintBacktrackCell !== null
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : hintTargetCell !== null
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {activeAlert}
        </div>
      )}

      {/* Zip Interactive Board */}
      <div className="w-full my-0.5">
        <ZipGrid
          size={boardSize}
          numbers={numbers}
          maxNumber={maxNumber}
          horizontalWalls={horizontalWalls}
          verticalWalls={verticalWalls}
          path={path}
          nextExpectedNumber={nextExpectedNumber}
          hintTargetCell={hintTargetCell}
          hintBacktrackCell={hintBacktrackCell}
          blockedFeedbackCell={blockedFeedbackCell}
          isPaused={isPaused}
          isCompleted={isCompleted}
          onResume={() => setIsPaused(false)}
          onStartAtCell={handleStartAtCell}
          onMoveToCell={handleMoveToCell}
          onEndDrag={handleEndDrag}
        />
      </div>

      {/* Action Controls: Undo, Reset, Hint */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo || isPaused || isCompleted}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
        >
          <Undo2 className="w-4 h-4" />
          <span>Zpět</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={path.length <= 1 || isPaused || isCompleted}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={handleUseHint}
          disabled={isPaused || isCompleted}
          className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-45 disabled:pointer-events-none text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
        >
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>Nápověda</span>
        </button>
      </div>

      {/* Victory Modal */}
      <ZipVictoryModal
        isOpen={showVictory}
        size={boardSize}
        timeSeconds={elapsedSeconds}
        isNewBest={isNewBest}
        bestTime={bestTimes[boardSize]}
        onPlayAgain={() => startNewGame(boardSize, mode)}
        onNextSize={() => {
          const nextSize: ZipBoardSize = boardSize === 5 ? 6 : 7;
          startNewGame(nextSize, mode);
        }}
        onSelectGame={onSelectGame}
      />

      {/* New Game Confirm Modal */}
      <ConfirmModal
        isOpen={showNewGameConfirm}
        title="Spustit novou hru Zip?"
        description={
          (pendingMode || mode) === 'simple'
            ? `Vygeneruje se nová mřížka ${pendingSize || boardSize}×${
                pendingSize || boardSize
              } pro jednoduché spojování bez zdí.`
            : `Vygeneruje se nová mřížka ${pendingSize || boardSize}×${
                pendingSize || boardSize
              } s unikátním řešením.`
        }
        confirmLabel="Nová hra"
        confirmVariant="primary"
        onConfirm={() => {
          const target = pendingSize || boardSize;
          const targetMode = pendingMode || mode;
          setShowNewGameConfirm(false);
          startNewGame(target, targetMode);
        }}
        onCancel={() => {
          setShowNewGameConfirm(false);
          setPendingSize(null);
          setPendingMode(null);
        }}
      />

      {/* Rules Modal */}
      <ZipRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
