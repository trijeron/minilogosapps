import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameInfoBar } from './GameInfoBar';
import { SudokuGrid } from './SudokuGrid';
import { Keypad } from './Keypad';
import { VictoryModal } from './VictoryModal';
import { ConfirmModal } from './ConfirmModal';
import { RulesModal } from './RulesModal';
import { Difficulty, MoveRecord, SudokuState } from '../types/sudoku';
import {
  BOARD_SIZE,
  TOTAL_CELLS,
  generatePuzzle,
  findConflicts,
  findIncorrectCells,
  getRemainingCounts,
  isBoardCompleted,
} from '../utils/sudokuEngine';
import { sound } from '../utils/audio';
import {
  saveGameStateToStorage,
  loadGameStateFromStorage,
  clearSavedGameState,
  loadBestTimes,
  saveBestTime,
} from '../utils/storage';
import { getDifficultyLabel } from '../utils/format';

interface SudokuGameProps {
  realTimeCheck: boolean;
  onToggleRealTimeCheck: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({
  realTimeCheck,
}) => {
  // Game Core State
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [given, setGiven] = useState<boolean[]>([]);
  const [hintCells, setHintCells] = useState<number[]>([]);
  const [notes, setNotes] = useState<number[][]>([]);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // History & Storage
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [bestTimes, setBestTimes] = useState(loadBestTimes());

  // Modals & Dialogs
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState<boolean>(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);

  // Initialize a new game
  const startNewGame = useCallback((newDiff: Difficulty) => {
    const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(newDiff);
    const newGiven = newPuzzle.map((v) => v !== 0);
    const newBoard = [...newPuzzle];
    const newNotes: number[][] = Array.from({ length: TOTAL_CELLS }, () => []);

    setDifficulty(newDiff);
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setBoard(newBoard);
    setGiven(newGiven);
    setHintCells([]);
    setNotes(newNotes);
    setHintsLeft(3);
    setSelectedCell(null);
    setNotesMode(false);
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsCompleted(false);
    setHistory([]);
    setShowVictory(false);
    setIsNewBest(false);

    saveGameStateToStorage({
      difficulty: newDiff,
      puzzle: newPuzzle,
      solution: newSolution,
      board: newBoard,
      given: newGiven,
      hintCells: [],
      notes: newNotes,
      hintsLeft: 3,
      elapsedSeconds: 0,
      isPaused: false,
      isCompleted: false,
      realTimeCheck: true,
    });
  }, []);

  // Initial mount: load saved game or generate fresh
  useEffect(() => {
    const saved = loadGameStateFromStorage();
    if (saved && !saved.isCompleted) {
      setDifficulty(saved.difficulty);
      setPuzzle(saved.puzzle);
      setSolution(saved.solution);
      setBoard(saved.board);
      setGiven(saved.given);
      setHintCells(saved.hintCells || []);
      setNotes(saved.notes || Array.from({ length: TOTAL_CELLS }, () => []));
      setHintsLeft(typeof saved.hintsLeft === 'number' ? saved.hintsLeft : 3);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setIsPaused(saved.isPaused || false);
      setIsCompleted(false);
    } else {
      startNewGame('easy');
    }
  }, [startNewGame]);

  // Autosave game state whenever relevant parts change
  useEffect(() => {
    if (board.length === TOTAL_CELLS && solution.length === TOTAL_CELLS) {
      const stateToSave: SudokuState = {
        difficulty,
        puzzle,
        solution,
        board,
        given,
        hintCells,
        notes,
        hintsLeft,
        elapsedSeconds,
        isPaused,
        isCompleted,
        realTimeCheck,
      };
      saveGameStateToStorage(stateToSave);
    }
  }, [
    difficulty,
    puzzle,
    solution,
    board,
    given,
    hintCells,
    notes,
    hintsLeft,
    elapsedSeconds,
    isPaused,
    isCompleted,
    realTimeCheck,
  ]);

  // Timer loop
  useEffect(() => {
    if (isPaused || isCompleted || board.length === 0) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isCompleted, board.length]);

  // Calculate real-time conflicts and errors
  const rawConflictingCells = useMemo(() => {
    return findConflicts(board);
  }, [board]);

  const rawIncorrectCells = useMemo(() => {
    if (!realTimeCheck || board.length === 0 || solution.length === 0) {
      return new Set<number>();
    }
    return findIncorrectCells(board, solution);
  }, [board, solution, realTimeCheck]);

  // Delayed error checking (1000ms debounce as requested: "u vsech her to chce zpozdeni kontroly o 1 vterinu")
  const [delayedConflicts, setDelayedConflicts] = useState<Set<number>>(new Set());
  const [delayedIncorrect, setDelayedIncorrect] = useState<Set<number>>(new Set());

  useEffect(() => {
    const hasErrors = realTimeCheck && (rawConflictingCells.size > 0 || rawIncorrectCells.size > 0);
    if (!hasErrors) {
      setDelayedConflicts(new Set());
      setDelayedIncorrect(new Set());
      return;
    }

    const timer = setTimeout(() => {
      setDelayedConflicts(rawConflictingCells);
      setDelayedIncorrect(rawIncorrectCells);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawConflictingCells, rawIncorrectCells, realTimeCheck]);

  // Remaining count for digits 1-6
  const remainingCounts = useMemo(() => {
    return getRemainingCounts(board);
  }, [board]);

  // Record a move to history before making a mutation
  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30),
      {
        board: [...board],
        notes: notes.map((arr) => [...arr]),
        selectedCell,
      },
    ]);
  }, [board, notes, selectedCell]);

  // Handle cell selection
  const handleSelectCell = (index: number) => {
    if (isPaused) {
      setIsPaused(false);
    }
    setSelectedCell(index);
  };

  // Handle number input (from keypad or physical keyboard)
  const handleNumberInput = useCallback(
    (num: number) => {
      if (selectedCell === null || isPaused || isCompleted) return;

      if (given[selectedCell] || hintCells.includes(selectedCell)) {
        return;
      }

      if (notesMode) {
        pushHistory();
        setNotes((prevNotes) => {
          const next = prevNotes.map((arr) => [...arr]);
          const currentNotes = next[selectedCell] || [];
          if (currentNotes.includes(num)) {
            next[selectedCell] = currentNotes.filter((n) => n !== num);
          } else {
            next[selectedCell] = [...currentNotes, num].sort((a, b) => a - b);
          }
          return next;
        });
        sound.playNote();
      } else {
        pushHistory();
        const currentVal = board[selectedCell];
        const nextVal = currentVal === num ? 0 : num;

        const newBoard = [...board];
        newBoard[selectedCell] = nextVal;
        setBoard(newBoard);

        setNotes((prevNotes) => {
          const next = prevNotes.map((arr) => [...arr]);
          next[selectedCell] = [];
          return next;
        });

        if (nextVal !== 0) {
          sound.playPlace(num);

          if (isBoardCompleted(newBoard, solution)) {
            setIsCompleted(true);
            clearSavedGameState();
            sound.playVictory();

            const prevBest = bestTimes[difficulty];
            const isRecord = prevBest === null || elapsedSeconds < prevBest;
            if (isRecord) {
              const updated = saveBestTime(difficulty, elapsedSeconds);
              setBestTimes(updated);
              setIsNewBest(true);
            } else {
              setIsNewBest(false);
            }

            setShowVictory(true);
          }
        } else {
          sound.playErase();
        }
      }
    },
    [
      selectedCell,
      isPaused,
      isCompleted,
      given,
      hintCells,
      notesMode,
      pushHistory,
      board,
      solution,
      difficulty,
      elapsedSeconds,
      bestTimes,
    ]
  );

  // Handle erase cell
  const handleErase = useCallback(() => {
    if (selectedCell === null || isPaused || isCompleted) return;
    if (given[selectedCell] || hintCells.includes(selectedCell)) return;

    if (board[selectedCell] !== 0 || (notes[selectedCell] && notes[selectedCell].length > 0)) {
      pushHistory();

      setBoard((prev) => {
        const next = [...prev];
        next[selectedCell] = 0;
        return next;
      });

      setNotes((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[selectedCell] = [];
        return next;
      });

      sound.playErase();
    }
  }, [selectedCell, isPaused, isCompleted, given, hintCells, board, notes, pushHistory]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isPaused || isCompleted) return;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(last.board);
    setNotes(last.notes);
    if (last.selectedCell !== null) {
      setSelectedCell(last.selectedCell);
    }
    sound.playErase();
  }, [history, isPaused, isCompleted]);

  // Handle Hint (max 3 per game)
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
      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (!given[i] && board[i] !== solution[i]) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx === null) return;

    pushHistory();
    const correctNum = solution[targetIdx];

    const newBoard = [...board];
    newBoard[targetIdx] = correctNum;
    setBoard(newBoard);
    setSelectedCell(targetIdx);

    setNotes((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[targetIdx!] = [];
      return next;
    });

    setHintCells((prev) => (prev.includes(targetIdx!) ? prev : [...prev, targetIdx!]));
    setHintsLeft((prev) => Math.max(0, prev - 1));

    sound.playHint();

    if (isBoardCompleted(newBoard, solution)) {
      setIsCompleted(true);
      clearSavedGameState();
      sound.playVictory();
      const prevBest = bestTimes[difficulty];
      const isRecord = prevBest === null || elapsedSeconds < prevBest;
      if (isRecord) {
        const updated = saveBestTime(difficulty, elapsedSeconds);
        setBestTimes(updated);
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
      setShowVictory(true);
    }
  }, [
    hintsLeft,
    isPaused,
    isCompleted,
    selectedCell,
    given,
    board,
    solution,
    pushHistory,
    bestTimes,
    difficulty,
    elapsedSeconds,
  ]);

  // Handle Board Reset:
  // "Pri resetu napovedy zustavajji" -> Preserves hint cells and hintsLeft count!
  const handleResetBoard = useCallback(() => {
    const resetBoard = puzzle.map((clue, idx) => {
      if (clue !== 0) return clue;
      if (hintCells.includes(idx)) return solution[idx];
      return 0;
    });

    const resetNotes: number[][] = Array.from({ length: TOTAL_CELLS }, () => []);

    setBoard(resetBoard);
    setNotes(resetNotes);
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

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showVictory || showRules || showResetConfirm || showNewGameConfirm) return;

      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setNotesMode((prev) => !prev);
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
          const r = Math.floor(prev / BOARD_SIZE);
          const c = prev % BOARD_SIZE;
          if (e.key === 'ArrowUp') return ((r - 1 + BOARD_SIZE) % BOARD_SIZE) * BOARD_SIZE + c;
          if (e.key === 'ArrowDown') return ((r + 1) % BOARD_SIZE) * BOARD_SIZE + c;
          if (e.key === 'ArrowLeft') return r * BOARD_SIZE + ((c - 1 + BOARD_SIZE) % BOARD_SIZE);
          if (e.key === 'ArrowRight') return r * BOARD_SIZE + ((c + 1) % BOARD_SIZE);
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNumberInput,
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
      {/* Sudoku Difficulty Selector + Rules + New Game */}
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
          title="Pravidla Minisudoku"
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
        conflictCount={delayedConflicts.size}
        errorCount={delayedIncorrect.size}
        realTimeCheck={realTimeCheck}
      />

      {/* Prominent Warning Banner if Error/Conflict detected (after 1s delay) */}
      {realTimeCheck && (delayedConflicts.size > 0 || delayedIncorrect.size > 0) && (
        <div className="w-full bg-rose-50 border-2 border-rose-400 rounded-xl p-2.5 flex items-start gap-2.5 text-rose-900 shadow-sm animate-in fade-in duration-150">
          <div className="w-6 h-6 rounded-lg bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            ⚠️
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-bold leading-tight text-rose-800">
              Varování: Zjištěn konflikt v Sudoku!
            </span>
            <span className="text-[11px] text-rose-700 font-medium leading-tight mt-0.5">
              {delayedConflicts.size > 0
                ? 'Stejné číslo se opakuje v témže řádku, sloupci nebo bloku 2×3.'
                : 'Některé zadané číslo neodpovídá správnému řešení.'}
            </span>
          </div>
        </div>
      )}

      {/* 6x6 Grid */}
      <div className="w-full flex items-center justify-center my-0.5">
        <SudokuGrid
          board={board}
          given={given}
          hintCells={hintCells}
          notes={notes}
          selectedCell={selectedCell}
          onSelectCell={handleSelectCell}
          conflictingCells={delayedConflicts}
          incorrectCells={delayedIncorrect}
          realTimeCheck={realTimeCheck}
          isPaused={isPaused}
          onResume={() => setIsPaused(false)}
        />
      </div>

      {/* Keypad */}
      <Keypad
        onNumberSelect={handleNumberInput}
        onErase={handleErase}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        notesMode={notesMode}
        onToggleNotesMode={() => setNotesMode((prev) => !prev)}
        hintsLeft={hintsLeft}
        onUseHint={handleUseHint}
        onResetBoard={() => setShowResetConfirm(true)}
        remainingCounts={remainingCounts}
        disabled={isPaused || isCompleted}
      />

      {/* Victory Celebration Modal */}
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
      />

      {/* Reset Board Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Resetovat hřiště do původního stavu?"
        description="Všechna vaše zadaná čísla budou vymazána. Dle pravidel zůstávají použité nápovědy zachovány a jejich zbývající počet se neobnovuje."
        confirmLabel="Resetovat hřiště"
        confirmVariant="danger"
        onConfirm={handleResetBoard}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* New Game Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewGameConfirm}
        title="Spustit novou hru?"
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

      {/* Rules & Help Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
