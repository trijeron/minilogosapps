import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueensGrid } from './QueensGrid';
import { QueensKeypad } from './QueensKeypad';
import { GameInfoBar } from './GameInfoBar';
import { VictoryModal } from './VictoryModal';
import { ConfirmModal } from './ConfirmModal';
import { QueensRulesModal } from './QueensRulesModal';
import { Difficulty } from '../types/sudoku';
import { QueensBoardSize, QueensCellState, QueensMoveRecord } from '../types/queens';
import { ErrorAlertBanner } from './ErrorAlertBanner';
import {
  generateQueensPuzzle,
  findQueensConflicts,
  isQueensCompleted,
  findConsistentQueensSolution,
} from '../utils/queensEngine';
import { sound } from '../utils/audio';
import {
  saveQueensStateToStorage,
  loadQueensStateFromStorage,
  clearQueensSavedState,
  loadQueensBestTimes,
  saveQueensBestTime,
} from '../utils/storage';
import { GameTab } from './Header';
import { useLanguage } from '../i18n/LanguageContext';

interface QueensGameProps {
  realTimeCheck: boolean;
  onToggleRealTimeCheck: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onGameCompleted?: () => void;
  onSelectGame?: (tab: GameTab) => void;
  externalPaused?: boolean;
}

export const QueensGame: React.FC<QueensGameProps> = ({
  realTimeCheck,
  onGameCompleted,
  onSelectGame,
  externalPaused = false,
}) => {
  const { pick } = useLanguage();
  const [boardSize, setBoardSize] = useState<QueensBoardSize>(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [regions, setRegions] = useState<number[]>([]);
  const [solutionQueens, setSolutionQueens] = useState<number[]>([]);
  const [board, setBoard] = useState<QueensCellState[]>([]);
  const [hintCells, setHintCells] = useState<number[]>([]);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [autoCross, setAutoCross] = useState<boolean>(true);

  // History & Storage
  const [history, setHistory] = useState<QueensMoveRecord[]>([]);
  const [bestTimes, setBestTimes] = useState(loadQueensBestTimes());

  // Modals
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState<boolean>(false);
  const [pendingSize, setPendingSize] = useState<QueensBoardSize | null>(null);

  // Initialize fresh puzzle
  const startNewGame = useCallback((size: QueensBoardSize) => {
    const diffMap: Record<QueensBoardSize, Difficulty> = { 6: 'easy', 8: 'medium', 10: 'hard' };
    const diff = diffMap[size];
    const p = generateQueensPuzzle(diff, size);
    const total = size * size;
    const newBoard = new Array(total).fill(0) as QueensCellState[];

    setBoardSize(size);
    setDifficulty(diff);
    setRegions(p.regions);
    setSolutionQueens(p.queenPositions);
    setBoard(newBoard);
    setHintCells([]);
    setHintsLeft(3);
    setSelectedCell(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
    setHistory([]);
    setShowVictory(false);
    setIsNewBest(false);

    saveQueensStateToStorage({
      difficulty: diff,
      size,
      regions: p.regions,
      solutionQueens: p.queenPositions,
      board: newBoard,
      hintCells: [],
      hintsLeft: 3,
      elapsedSeconds: 0,
      isPaused: false,
      isCompleted: false,
      realTimeCheck: true,
      autoCross: true,
    });
  }, []);

  // Initial load
  useEffect(() => {
    const saved = loadQueensStateFromStorage();
    if (saved && !saved.isCompleted && [6, 8, 10].includes(saved.size)) {
      setBoardSize(saved.size);
      setDifficulty(saved.difficulty);
      setRegions(saved.regions);
      setSolutionQueens(saved.solutionQueens);
      setBoard(saved.board);
      setHintCells(saved.hintCells || []);
      setHintsLeft(typeof saved.hintsLeft === 'number' ? saved.hintsLeft : 3);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setIsPaused(saved.isPaused || false);
      setIsCompleted(false);
      setAutoCross(saved.autoCross !== undefined ? saved.autoCross : true);
    } else {
      startNewGame(6);
    }
  }, [startNewGame]);

  // Autosave
  useEffect(() => {
    const total = boardSize * boardSize;
    if (board.length === total && regions.length === total) {
      saveQueensStateToStorage({
        difficulty,
        size: boardSize,
        regions,
        solutionQueens,
        board,
        hintCells,
        hintsLeft,
        elapsedSeconds,
        isPaused,
        isCompleted,
        realTimeCheck,
        autoCross,
      });
    }
  }, [
    difficulty,
    boardSize,
    regions,
    solutionQueens,
    board,
    hintCells,
    hintsLeft,
    elapsedSeconds,
    isPaused,
    isCompleted,
    realTimeCheck,
    autoCross,
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
    if (board.length === 0 || regions.length === 0) {
      return {
        rowConflicts: new Set<number>(),
        colConflicts: new Set<number>(),
        regionConflicts: new Set<number>(),
        touchingConflicts: new Set<number>(),
        allViolatingQueens: new Set<number>(),
      };
    }
    return findQueensConflicts(board, regions, boardSize);
  }, [board, regions, boardSize]);

  const emptyConflicts = useMemo(() => ({
    rowConflicts: new Set<number>(),
    colConflicts: new Set<number>(),
    regionConflicts: new Set<number>(),
    touchingConflicts: new Set<number>(),
    allViolatingQueens: new Set<number>(),
  }), []);

  // Delayed error checking (1000ms debounce as requested: "u vsech her to chce zpozdeni kontroly o 1 vterinu")
  const [delayedConflicts, setDelayedConflicts] = useState(emptyConflicts);

  useEffect(() => {
    const hasError = realTimeCheck && rawConflicts.allViolatingQueens.size > 0;
    if (!hasError) {
      setDelayedConflicts(emptyConflicts);
      return;
    }

    const timer = setTimeout(() => {
      setDelayedConflicts(rawConflicts);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawConflicts, realTimeCheck, emptyConflicts]);

  // Placed queens count
  const placedQueens = useMemo(() => {
    return board.filter((v) => v === 2).length;
  }, [board]);

  const queensError = useMemo(() => {
    if (!realTimeCheck) return null;
    if (delayedConflicts.touchingConflicts.size > 0) {
      return {
        message: pick('Dámy se nesmí vzájemně dotýkat!', 'Queens cannot touch each other!'),
        detail: pick(
          'Žádné dvě koruny nesmí sousedit vodorovně, svisle ani diagonálně.',
          'No two crowns may be adjacent horizontally, vertically, or diagonally.'
        ),
      };
    }
    if (delayedConflicts.rowConflicts.size > 0) {
      return {
        message: pick('Více dam ve stejném řádku!', 'Multiple queens in the same row!'),
        detail: pick(
          'V každém vodorovném řádku smí být umístěna přesně jedna dáma.',
          'Each horizontal row may contain only one queen.'
        ),
      };
    }
    if (delayedConflicts.colConflicts.size > 0) {
      return {
        message: pick('Více dam ve stejném sloupci!', 'Multiple queens in the same column!'),
        detail: pick(
          'V každém svislém sloupci smí být umístěna přesně jedna dáma.',
          'Each vertical column may contain only one queen.'
        ),
      };
    }
    if (delayedConflicts.regionConflicts.size > 0) {
      return {
        message: pick('Více dam ve stejné barevné oblasti!', 'Multiple queens in the same color region!'),
        detail: pick(
          'Každá barevná zóna smí obsahovat pouze jedinou dámu.',
          'Each color zone may contain only a single queen.'
        ),
      };
    }
    if (delayedConflicts.allViolatingQueens.size > 0) {
      return {
        message: pick('Zjištěn konflikt v pravidlech dam!', 'Queens rule conflict detected!'),
        detail: pick(
          'Zkontrolujte řádky, sloupce, barevné oblasti a diagonální dotyky.',
          'Check rows, columns, color regions, and diagonal neighbors.'
        ),
      };
    }
    return null;
  }, [realTimeCheck, delayedConflicts, pick]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30),
      {
        board: [...board],
        selectedCell,
      },
    ]);
  }, [board, selectedCell]);

  // Apply auto-cross around placed queen
  const applyAutoCross = useCallback(
    (grid: QueensCellState[], queenIdx: number): QueensCellState[] => {
      const next = [...grid];
      const qRow = Math.floor(queenIdx / boardSize);
      const qCol = queenIdx % boardSize;

      // Row & Col
      for (let c = 0; c < boardSize; c++) {
        const idx = qRow * boardSize + c;
        if (idx !== queenIdx && next[idx] === 0) next[idx] = 1;
      }
      for (let r = 0; r < boardSize; r++) {
        const idx = r * boardSize + qCol;
        if (idx !== queenIdx && next[idx] === 0) next[idx] = 1;
      }

      // 8 neighboring cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = qRow + dr;
          const nc = qCol + dc;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
            const idx = nr * boardSize + nc;
            if (idx !== queenIdx && next[idx] === 0) next[idx] = 1;
          }
        }
      }

      return next;
    },
    [boardSize]
  );

  // Check win condition
  const verifyWin = useCallback(
    (newBoard: QueensCellState[]) => {
      if (isQueensCompleted(newBoard, regions, solutionQueens, boardSize)) {
        setIsCompleted(true);
        clearQueensSavedState();
        sound.playVictory();

        const prevBest = bestTimes[difficulty];
        const isRecord = prevBest === null || elapsedSeconds < prevBest;
        if (isRecord) {
          const updated = saveQueensBestTime(difficulty, elapsedSeconds);
          setBestTimes(updated);
          setIsNewBest(true);
        } else {
          setIsNewBest(false);
        }
        setShowVictory(true);
        onGameCompleted?.();
      }
    },
    [regions, solutionQueens, boardSize, bestTimes, difficulty, elapsedSeconds, onGameCompleted]
  );

  // Requirement: "u quens na prvni klinuti dama na druhz krizek"
  // Cycle order: 0 (empty) -> 2 (Queen 👑) -> 1 (Cross ✕) -> 0 (empty)
  const handleCellClick = useCallback(
    (idx: number) => {
      if (isPaused || isCompleted) return;
      if (hintCells.includes(idx)) return;

      pushHistory();
      const current = board[idx];
      let newBoard = [...board];

      if (current === 0) {
        // 1st click = Queen (👑 Dáma)
        newBoard[idx] = 2;
        sound.playPlace(6);
        if (autoCross) {
          newBoard = applyAutoCross(newBoard, idx);
        }
      } else if (current === 2) {
        // 2nd click = Cross (✕ Křížek)
        newBoard[idx] = 1;
        sound.playNote();
      } else {
        // 3rd click = Clear (0 Prázdné)
        newBoard[idx] = 0;
        sound.playErase();
      }

      setBoard(newBoard);
      verifyWin(newBoard);
    },
    [isPaused, isCompleted, hintCells, pushHistory, board, autoCross, applyAutoCross, verifyWin]
  );

  // Select mark from bottom keypad buttons directly
  const handleMarkSelect = useCallback(
    (mark: QueensCellState) => {
      if (selectedCell === null || isPaused || isCompleted) return;
      if (hintCells.includes(selectedCell)) return;

      pushHistory();
      const current = board[selectedCell];
      let newBoard = [...board];

      if (current === mark) {
        newBoard[selectedCell] = 0;
        sound.playErase();
      } else {
        newBoard[selectedCell] = mark;
        if (mark === 2) {
          sound.playPlace(6);
          if (autoCross) {
            newBoard = applyAutoCross(newBoard, selectedCell);
          }
        } else {
          sound.playNote();
        }
      }

      setBoard(newBoard);
      verifyWin(newBoard);
    },
    [selectedCell, isPaused, isCompleted, hintCells, pushHistory, board, autoCross, applyAutoCross, verifyWin]
  );

  // Erase
  const handleErase = useCallback(() => {
    if (selectedCell === null || isPaused || isCompleted) return;
    if (hintCells.includes(selectedCell)) return;

    if (board[selectedCell] !== 0) {
      pushHistory();
      const newBoard = [...board];
      newBoard[selectedCell] = 0;
      setBoard(newBoard);
      sound.playErase();
    }
  }, [selectedCell, isPaused, isCompleted, hintCells, board, pushHistory]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isPaused || isCompleted) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(last.board);
    if (last.selectedCell !== null) setSelectedCell(last.selectedCell);
    sound.playErase();
  }, [history, isPaused, isCompleted]);

  // Use hint
  const handleUseHint = useCallback(() => {
    if (hintsLeft <= 0 || isPaused || isCompleted) return;

    const targetSolution =
      findConsistentQueensSolution(board, regions, boardSize) ?? solutionQueens;

    let targetQueenIdx: number | null = null;
    for (const qIdx of targetSolution) {
      if (board[qIdx] !== 2) {
        targetQueenIdx = qIdx;
        break;
      }
    }

    if (targetQueenIdx === null) return;

    pushHistory();
    let newBoard = [...board];
    newBoard[targetQueenIdx] = 2; // place queen
    if (autoCross) {
      newBoard = applyAutoCross(newBoard, targetQueenIdx);
    }

    setBoard(newBoard);
    setSelectedCell(targetQueenIdx);
    setHintCells((prev) => (prev.includes(targetQueenIdx!) ? prev : [...prev, targetQueenIdx!]));
    setHintsLeft((prev) => Math.max(0, prev - 1));

    sound.playHint();
    verifyWin(newBoard);
  }, [hintsLeft, isPaused, isCompleted, board, regions, boardSize, solutionQueens, pushHistory, autoCross, applyAutoCross, verifyWin]);

  // Reset board
  const handleResetBoard = useCallback(() => {
    const total = boardSize * boardSize;
    const resetBoard = new Array(total).fill(0) as QueensCellState[];
    for (const idx of hintCells) {
      resetBoard[idx] = 2;
    }

    setBoard(resetBoard);
    setHistory([]);
    setShowResetConfirm(false);
    sound.playErase();
  }, [boardSize, hintCells]);

  const handleSizeClick = (newSize: QueensBoardSize) => {
    if (newSize === boardSize) return;
    const hasMoves = board.some((val) => val !== 0);
    if (hasMoves) {
      setPendingSize(newSize);
      setShowNewGameConfirm(true);
    } else {
      startNewGame(newSize);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showVictory || showRules || showResetConfirm || showNewGameConfirm) return;

      if (e.key === 'q' || e.key === 'Q' || e.key === '2') {
        e.preventDefault();
        handleMarkSelect(2);
      } else if (e.key === 'x' || e.key === 'X' || e.key === '1') {
        e.preventDefault();
        handleMarkSelect(1);
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
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (prev === null) return 0;
          const r = Math.floor(prev / boardSize);
          const c = prev % boardSize;
          if (e.key === 'ArrowUp') return ((r - 1 + boardSize) % boardSize) * boardSize + c;
          if (e.key === 'ArrowDown') return ((r + 1) % boardSize) * boardSize + c;
          if (e.key === 'ArrowLeft') return r * boardSize + ((c - 1 + boardSize) % boardSize);
          if (e.key === 'ArrowRight') return r * boardSize + ((c + 1) % boardSize);
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleMarkSelect,
    handleErase,
    handleUndo,
    handleUseHint,
    boardSize,
    showVictory,
    showRules,
    showResetConfirm,
    showNewGameConfirm,
  ]);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Board Size Selector (6x6, 8x8, 10x10) + Rules + New Game */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1 flex-1">
          {([6, 8, 10] as QueensBoardSize[]).map((sz) => {
            const isActive = boardSize === sz;
            return (
              <button
                key={sz}
                onClick={() => handleSizeClick(sz)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pick(`${sz}×${sz} (${sz} dam)`, `${sz}×${sz} (${sz} Q)`)}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowRules(true)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
          title={pick('Pravidla Queens', 'Queens Rules')}
        >
          <span>{pick('Pravidla', 'Rules')}</span>
        </button>

        <button
          onClick={() => {
            setPendingSize(boardSize);
            setShowNewGameConfirm(true);
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs active:scale-95"
        >
          {pick('Nová hra', 'New game')}
        </button>
      </div>

      {/* Info Bar */}
      <GameInfoBar
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        bestTime={bestTimes[difficulty]}
        conflictCount={delayedConflicts.allViolatingQueens.size}
        errorCount={0}
        realTimeCheck={realTimeCheck}
      />

      {/* Queens Grid */}
      <div className="w-full flex items-center justify-center my-0.5">
        <QueensGrid
          board={board}
          regions={regions}
          size={boardSize}
          hintCells={hintCells}
          selectedCell={selectedCell}
          onSelectCell={(idx) => {
            if (isPaused) setIsPaused(false);
            setSelectedCell(idx);
          }}
          onCellClick={handleCellClick}
          conflicts={delayedConflicts}
          realTimeCheck={realTimeCheck}
          isPaused={isPaused}
          onResume={() => setIsPaused(false)}
        />
      </div>

      {/* Keypad */}
      <QueensKeypad
        onMarkSelect={handleMarkSelect}
        onErase={handleErase}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        hintsLeft={hintsLeft}
        onUseHint={handleUseHint}
        onResetBoard={() => setShowResetConfirm(true)}
        placedQueens={placedQueens}
        maxQueens={boardSize}
        autoCross={autoCross}
        onToggleAutoCross={() => setAutoCross((prev) => !prev)}
        disabled={isPaused || isCompleted}
      />

      {/* Prominent Warning Banner below playing area (no layout shift on board) */}
      {queensError && (
        <ErrorAlertBanner
          hasError={true}
          message={queensError.message}
          detail={queensError.detail}
        />
      )}

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={showVictory}
        timeSeconds={elapsedSeconds}
        difficulty={difficulty}
        isNewBest={isNewBest}
        bestTime={bestTimes[difficulty]}
        onPlayAgain={() => startNewGame(boardSize)}
        onNextDifficulty={() => {
          const nextSize: QueensBoardSize = boardSize === 6 ? 8 : 10;
          startNewGame(nextSize);
        }}
        currentGame="queens"
        gameLabel="LinkedIn Queens"
        onSelectGame={onSelectGame}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={pick('Resetovat hřiště do původního stavu?', 'Reset board to initial state?')}
        description={pick(
          'Všechny vaše zadané dámy a křížky budou vymazány. Nápovědy zůstávají zachovány a jejich počet se neobnovuje.',
          'All your placed queens and crosses will be cleared. Used hints remain filled and your hint count is not restored.'
        )}
        confirmLabel={pick('Resetovat hřiště', 'Reset board')}
        confirmVariant="danger"
        onConfirm={handleResetBoard}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* New Game Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewGameConfirm}
        title={pick('Spustit novou hru?', 'Start a new game?')}
        description={pick(
          `Vygeneruje se nová šachovnice velikosti ${pendingSize || boardSize}×${pendingSize || boardSize} s obnovenými 3 nápovědami.`,
          `A fresh ${pendingSize || boardSize}×${pendingSize || boardSize} board will be generated with 3 hints.`
        )}
        confirmLabel={pick('Spustit hru', 'Start game')}
        confirmVariant="primary"
        onConfirm={() => {
          setShowNewGameConfirm(false);
          startNewGame(pendingSize || boardSize);
        }}
        onCancel={() => {
          setShowNewGameConfirm(false);
          setPendingSize(null);
        }}
      />

      {/* Rules Modal */}
      <QueensRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
