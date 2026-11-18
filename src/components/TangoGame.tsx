import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TangoGrid } from './TangoGrid';
import { TangoKeypad } from './TangoKeypad';
import { GameInfoBar } from './GameInfoBar';
import { VictoryModal } from './VictoryModal';
import { ConfirmModal } from './ConfirmModal';
import { TangoRulesModal } from './TangoRulesModal';
import { Difficulty } from '../types/sudoku';
import { EdgeType, TangoMoveRecord, TangoState, TangoSymbol } from '../types/tango';
import { ErrorAlertBanner } from './ErrorAlertBanner';
import {
  TANGO_SIZE,
  TANGO_TOTAL,
  generateTangoPuzzle,
  findTangoConflicts,
  isTangoCompleted,
  getTangoRemainingCounts,
} from '../utils/tangoEngine';
import { sound } from '../utils/audio';
import {
  saveTangoStateToStorage,
  loadTangoStateFromStorage,
  clearTangoSavedState,
  loadTangoBestTimes,
  saveTangoBestTime,
} from '../utils/storage';
import { getDifficultyLabel } from '../utils/format';
import { GameTab } from './Header';

interface TangoGameProps {
  onRulesClick: () => void;
  realTimeCheck: boolean;
  onToggleRealTimeCheck: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onGameCompleted?: () => void;
  onSelectGame?: (tab: GameTab) => void;
  externalPaused?: boolean;
}

export const TangoGame: React.FC<TangoGameProps> = ({
  realTimeCheck,
  onToggleRealTimeCheck,
  isMuted,
  onToggleSound,
  onGameCompleted,
  onSelectGame,
  externalPaused = false,
}) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<TangoSymbol[]>([]);
  const [solution, setSolution] = useState<TangoSymbol[]>([]);
  const [board, setBoard] = useState<TangoSymbol[]>([]);
  const [given, setGiven] = useState<boolean[]>([]);
  const [hintCells, setHintCells] = useState<number[]>([]);
  const [horizontalEdges, setHorizontalEdges] = useState<EdgeType[]>([]);
  const [verticalEdges, setVerticalEdges] = useState<EdgeType[]>([]);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // History & Storage
  const [history, setHistory] = useState<TangoMoveRecord[]>([]);
  const [bestTimes, setBestTimes] = useState(loadTangoBestTimes());

  // Modals
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState<boolean>(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);

  // Initialize a fresh Tango puzzle
  const startNewGame = useCallback((newDiff: Difficulty) => {
    const p = generateTangoPuzzle(newDiff);
    setDifficulty(newDiff);
    setPuzzle(p.initialBoard);
    setSolution(p.solution);
    setBoard([...p.initialBoard]);
    setGiven(p.given);
    setHintCells([]);
    setHorizontalEdges(p.horizontalEdges);
    setVerticalEdges(p.verticalEdges);
    setHintsLeft(3);
    setSelectedCell(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
    setHistory([]);
    setShowVictory(false);
    setIsNewBest(false);

    saveTangoStateToStorage({
      difficulty: newDiff,
      puzzle: p.initialBoard,
      solution: p.solution,
      board: [...p.initialBoard],
      given: p.given,
      hintCells: [],
      horizontalEdges: p.horizontalEdges,
      verticalEdges: p.verticalEdges,
      hintsLeft: 3,
      elapsedSeconds: 0,
      isPaused: false,
      isCompleted: false,
      realTimeCheck: true,
    });
  }, []);

  // Initial load from storage
  useEffect(() => {
    const saved = loadTangoStateFromStorage();
    if (saved && !saved.isCompleted) {
      setDifficulty(saved.difficulty);
      setPuzzle(saved.puzzle);
      setSolution(saved.solution);
      setBoard(saved.board);
      setGiven(saved.given);
      setHintCells(saved.hintCells || []);
      setHorizontalEdges(saved.horizontalEdges || []);
      setVerticalEdges(saved.verticalEdges || []);
      setHintsLeft(typeof saved.hintsLeft === 'number' ? saved.hintsLeft : 3);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setIsPaused(saved.isPaused || false);
      setIsCompleted(false);
    } else {
      startNewGame('easy');
    }
  }, [startNewGame]);

  // Autosave whenever relevant state changes
  useEffect(() => {
    if (board.length === TANGO_TOTAL && solution.length === TANGO_TOTAL) {
      saveTangoStateToStorage({
        difficulty,
        puzzle,
        solution,
        board,
        given,
        hintCells,
        horizontalEdges,
        verticalEdges,
        hintsLeft,
        elapsedSeconds,
        isPaused,
        isCompleted,
        realTimeCheck,
      });
    }
  }, [
    difficulty,
    puzzle,
    solution,
    board,
    given,
    hintCells,
    horizontalEdges,
    verticalEdges,
    hintsLeft,
    elapsedSeconds,
    isPaused,
    isCompleted,
    realTimeCheck,
  ]);

  // Timer loop
  useEffect(() => {
    if (
      isPaused ||
      externalPaused ||
      showRules ||
      showResetConfirm ||
      showNewGameConfirm ||
      isCompleted ||
      board.length === 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isPaused,
    externalPaused,
    showRules,
    showResetConfirm,
    showNewGameConfirm,
    isCompleted,
    board.length,
  ]);

  // Conflicts calculation
  const rawConflicts = useMemo(() => {
    if (board.length === 0 || solution.length === 0) {
      return {
        threeInARowCells: new Set<number>(),
        overflowRows: new Set<number>(),
        overflowCols: new Set<number>(),
        edgeViolationH: new Set<number>(),
        edgeViolationV: new Set<number>(),
        violatingCells: new Set<number>(),
        incorrectCells: new Set<number>(),
      };
    }
    return findTangoConflicts(board, solution, horizontalEdges, verticalEdges);
  }, [board, solution, horizontalEdges, verticalEdges]);

  const emptyConflicts = useMemo(() => ({
    threeInARowCells: new Set<number>(),
    overflowRows: new Set<number>(),
    overflowCols: new Set<number>(),
    edgeViolationH: new Set<number>(),
    edgeViolationV: new Set<number>(),
    violatingCells: new Set<number>(),
    incorrectCells: new Set<number>(),
  }), []);

  // Delayed error checking (1000ms debounce as requested: "u vsech her to chce zpozdeni kontroly o 1 vterinu")
  const [delayedConflicts, setDelayedConflicts] = useState(emptyConflicts);

  useEffect(() => {
    const hasError = realTimeCheck && rawConflicts.violatingCells.size > 0;
    if (!hasError) {
      setDelayedConflicts(emptyConflicts);
      return;
    }

    const timer = setTimeout(() => {
      setDelayedConflicts(rawConflicts);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawConflicts, realTimeCheck, emptyConflicts]);

  // Remaining counts
  const { suns: remainingSuns, moons: remainingMoons } = useMemo(() => {
    return getTangoRemainingCounts(board);
  }, [board]);

  const tangoError = useMemo(() => {
    if (!realTimeCheck) return null;
    if (delayedConflicts.threeInARowCells.size > 0) {
      return {
        message: 'Více než 2 stejné symboly v řadě!',
        detail: 'Pravidlo tří: Vedle sebe ani pod sebou nesmí stát 3 stejná slunce nebo 3 měsíce.',
      };
    }
    if (delayedConflicts.overflowRows.size > 0 || delayedConflicts.overflowCols.size > 0) {
      return {
        message: 'Příliš mnoho stejných symbolů v linii!',
        detail: 'Rovnováha: V každém řádku a sloupci musí být přesně 3 slunce a 3 měsíce.',
      };
    }
    if (delayedConflicts.edgeViolationH.size > 0 || delayedConflicts.edgeViolationV.size > 0) {
      return {
        message: 'Porušeno rovnítko (=) nebo křížek (×)!',
        detail: 'Rovnítko vyžaduje stejné symboly, křížek vyžaduje opačné symboly.',
      };
    }
    if (delayedConflicts.violatingCells.size > 0) {
      return {
        message: 'Zjištěn konflikt pravidel hry Tango.',
        detail: 'Zkontrolujte pravidla tří, rovnováhu a značky sousedství.',
      };
    }
    return null;
  }, [realTimeCheck, delayedConflicts]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30),
      {
        board: [...board],
        selectedCell,
      },
    ]);
  }, [board, selectedCell]);

  // Handle cell selection
  const handleSelectCell = (index: number) => {
    if (isPaused) setIsPaused(false);
    setSelectedCell(index);
  };

  // Direct toggle cell: Empty -> Sun ☀️ -> Moon 🌙 -> Empty
  const handleCycleCell = useCallback(
    (index: number) => {
      if (isPaused || isCompleted) return;
      if (given[index] || hintCells.includes(index)) return;

      pushHistory();
      const current = board[index];
      const next: TangoSymbol = current === 0 ? 1 : current === 1 ? 2 : 0;

      const newBoard = [...board];
      newBoard[index] = next;
      setBoard(newBoard);

      if (next === 1) {
        sound.playPlace(4);
      } else if (next === 2) {
        sound.playPlace(1);
      } else {
        sound.playErase();
      }

      // Check win condition
      if (isTangoCompleted(newBoard, solution, horizontalEdges, verticalEdges)) {
        setIsCompleted(true);
        clearTangoSavedState();
        sound.playVictory();

        const prevBest = bestTimes[difficulty];
        const isRecord = prevBest === null || elapsedSeconds < prevBest;
        if (isRecord) {
          const updated = saveTangoBestTime(difficulty, elapsedSeconds);
          setBestTimes(updated);
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }
        setShowVictory(true);
        onGameCompleted?.();
      }
    },
    [isPaused, isCompleted, given, hintCells, pushHistory, board, solution, horizontalEdges, verticalEdges, bestTimes, difficulty, elapsedSeconds, onGameCompleted]
  );

  // Symbol input from keypad (1 = sun, 2 = moon)
  const handleSymbolSelect = useCallback(
    (symbol: TangoSymbol) => {
      if (selectedCell === null || isPaused || isCompleted) return;
      if (given[selectedCell] || hintCells.includes(selectedCell)) return;

      pushHistory();
      const current = board[selectedCell];
      const next: TangoSymbol = current === symbol ? 0 : symbol;

      const newBoard = [...board];
      newBoard[selectedCell] = next;
      setBoard(newBoard);

      if (next === 1) sound.playPlace(4);
      else if (next === 2) sound.playPlace(1);
      else sound.playErase();

      if (isTangoCompleted(newBoard, solution, horizontalEdges, verticalEdges)) {
        setIsCompleted(true);
        clearTangoSavedState();
        sound.playVictory();

        const prevBest = bestTimes[difficulty];
        const isRecord = prevBest === null || elapsedSeconds < prevBest;
        if (isRecord) {
          const updated = saveTangoBestTime(difficulty, elapsedSeconds);
          setBestTimes(updated);
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }
        setShowVictory(true);
        onGameCompleted?.();
      }
    },
    [selectedCell, isPaused, isCompleted, given, hintCells, pushHistory, board, solution, horizontalEdges, verticalEdges, bestTimes, difficulty, elapsedSeconds, onGameCompleted]
  );

  // Erase cell
  const handleErase = useCallback(() => {
    if (selectedCell === null || isPaused || isCompleted) return;
    if (given[selectedCell] || hintCells.includes(selectedCell)) return;

    if (board[selectedCell] !== 0) {
      pushHistory();
      const newBoard = [...board];
      newBoard[selectedCell] = 0;
      setBoard(newBoard);
      sound.playErase();
    }
  }, [selectedCell, isPaused, isCompleted, given, hintCells, board, pushHistory]);

  // Undo move
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isPaused || isCompleted) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(last.board);
    if (last.selectedCell !== null) setSelectedCell(last.selectedCell);
    sound.playErase();
  }, [history, isPaused, isCompleted]);

  // Use hint (Max 3, preserved on reset)
  const handleUseHint = useCallback(() => {
    if (hintsLeft <= 0 || isPaused || isCompleted) return;

    let targetIdx: number | null = null;
    if (
      selectedCell !== null &&
      !given[selectedCell] &&
      board[selectedCell] !== solution[selectedCell]
    ) {
      targetIdx = selectedCell;
    } else {
      for (let i = 0; i < TANGO_TOTAL; i++) {
        if (!given[i] && board[i] !== solution[i]) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx === null) return;

    pushHistory();
    const correctVal = solution[targetIdx];
    const newBoard = [...board];
    newBoard[targetIdx] = correctVal;
    setBoard(newBoard);
    setSelectedCell(targetIdx);

    setHintCells((prev) => (prev.includes(targetIdx!) ? prev : [...prev, targetIdx!]));
    setHintsLeft((prev) => Math.max(0, prev - 1));

    sound.playHint();

    if (isTangoCompleted(newBoard, solution, horizontalEdges, verticalEdges)) {
      setIsCompleted(true);
      clearTangoSavedState();
      sound.playVictory();

      const prevBest = bestTimes[difficulty];
      const isRecord = prevBest === null || elapsedSeconds < prevBest;
      if (isRecord) {
        const updated = saveTangoBestTime(difficulty, elapsedSeconds);
        setBestTimes(updated);
        setIsNewBest(true);
      }
      setShowVictory(true);
      onGameCompleted?.();
    }
  }, [hintsLeft, isPaused, isCompleted, selectedCell, given, board, solution, horizontalEdges, verticalEdges, pushHistory, bestTimes, difficulty, elapsedSeconds, onGameCompleted]);

  // Reset board (Preserves hints and hint cells: "Pri resetu napovedy zustavajji")
  const handleResetBoard = useCallback(() => {
    const resetBoard = puzzle.map((clue, idx) => {
      if (clue !== 0) return clue;
      if (hintCells.includes(idx)) return solution[idx];
      return 0 as TangoSymbol;
    });

    setBoard(resetBoard);
    setHistory([]);
    setShowResetConfirm(false);
    sound.playErase();
  }, [puzzle, hintCells, solution]);

  const handleDifficultyClick = (newDiff: Difficulty) => {
    if (newDiff === difficulty) return;
    const hasMoves = board.some((val, idx) => !given[idx] && val !== 0);
    if (hasMoves) {
      setPendingDifficulty(newDiff);
      setShowNewGameConfirm(true);
    } else {
      startNewGame(newDiff);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showVictory || showRules || showResetConfirm || showNewGameConfirm) return;

      if (e.key === '1' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSymbolSelect(1);
      } else if (e.key === '2' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleSymbolSelect(2);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleUseHint();
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (prev === null) return 0;
          const r = Math.floor(prev / TANGO_SIZE);
          const c = prev % TANGO_SIZE;
          if (e.key === 'ArrowUp') return ((r - 1 + TANGO_SIZE) % TANGO_SIZE) * TANGO_SIZE + c;
          if (e.key === 'ArrowDown') return ((r + 1) % TANGO_SIZE) * TANGO_SIZE + c;
          if (e.key === 'ArrowLeft') return r * TANGO_SIZE + ((c - 1 + TANGO_SIZE) % TANGO_SIZE);
          if (e.key === 'ArrowRight') return r * TANGO_SIZE + ((c + 1) % TANGO_SIZE);
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSymbolSelect,
    handleErase,
    handleUndo,
    handleUseHint,
    showVictory,
    showRules,
    showResetConfirm,
    showNewGameConfirm,
  ]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Tango Difficulty Selector */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1 flex-1">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => {
            const isActive = difficulty === level;
            return (
              <button
                key={level}
                onClick={() => handleDifficultyClick(level)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getDifficultyLabel(level)}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowRules(true)}
          className="ml-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
          title="Pravidla Tango"
        >
          <span>Pravidla</span>
        </button>

        <button
          onClick={() => {
            setPendingDifficulty(difficulty);
            setShowNewGameConfirm(true);
          }}
          className="ml-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs active:scale-95"
        >
          Nová hra
        </button>
      </div>

      {/* Info Bar */}
      <GameInfoBar
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        bestTime={bestTimes[difficulty]}
        conflictCount={delayedConflicts.violatingCells.size}
        errorCount={0}
        realTimeCheck={realTimeCheck}
      />

      {/* Prominent Warning Banner if Error/Conflict detected */}
      {tangoError && (
        <ErrorAlertBanner
          hasError={true}
          message={tangoError.message}
          detail={tangoError.detail}
        />
      )}

      {/* Tango 6x6 Grid */}
      <div className="w-full flex items-center justify-center my-0.5">
        <TangoGrid
          board={board}
          given={given}
          hintCells={hintCells}
          horizontalEdges={horizontalEdges}
          verticalEdges={verticalEdges}
          selectedCell={selectedCell}
          onSelectCell={handleSelectCell}
          onCycleCell={handleCycleCell}
          conflicts={delayedConflicts}
          realTimeCheck={realTimeCheck}
          isPaused={isPaused}
          onResume={() => setIsPaused(false)}
        />
      </div>

      {/* Keypad */}
      <TangoKeypad
        onSymbolSelect={handleSymbolSelect}
        onErase={handleErase}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        hintsLeft={hintsLeft}
        onUseHint={handleUseHint}
        onResetBoard={() => setShowResetConfirm(true)}
        remainingSuns={remainingSuns}
        remainingMoons={remainingMoons}
        disabled={isPaused || isCompleted}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        timeSeconds={elapsedSeconds}
        difficulty={difficulty}
        isNewBest={isNewBest}
        bestTime={bestTimes[difficulty]}
        onPlayAgain={() => startNewGame(difficulty)}
        onNextDifficulty={() => {
          const nextDiff = difficulty === 'easy' ? 'medium' : 'hard';
          startNewGame(nextDiff);
        }}
        currentGame="tango"
        gameLabel="LinkedIn Tango (6×6)"
        onSelectGame={onSelectGame}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Resetovat hřiště Tango do původního stavu?"
        description="Všechny vaše zadané symboly budou vymazány. Nápovědy zůstávají zachovány a jejich počet se neobnovuje."
        confirmLabel="Resetovat hřiště"
        confirmVariant="danger"
        onConfirm={handleResetBoard}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* New Game Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewGameConfirm}
        title="Spustit novou hru Tango?"
        description="Aktuální rozpracovaná hra bude ukončena a vygeneruje se nová hrací plocha s obnovenými 3 nápovědami."
        confirmLabel="Spustit novou hru"
        confirmVariant="primary"
        onConfirm={() => {
          setShowNewGameConfirm(false);
          startNewGame(pendingDifficulty || difficulty);
        }}
        onCancel={() => {
          setShowNewGameConfirm(false);
          setPendingDifficulty(null);
        }}
      />

      {/* Rules Modal */}
      <TangoRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
