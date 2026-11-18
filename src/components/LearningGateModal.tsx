import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle2, ArrowRight, Lightbulb, X, AlertCircle } from 'lucide-react';
import { LearningTask, MatchLearningTask, FillLearningTask, ChoiceLearningTask } from '../types/learningGate';
import { isFillAnswerCorrect } from '../utils/learningTasks';
import { sound } from '../utils/audio';

interface LearningGateModalProps {
  isOpen: boolean;
  tasks: LearningTask[];
  triggerReason: 'games' | 'minutes' | 'preview';
  isPreview?: boolean;
  onComplete: () => void;
  onClosePreview?: () => void;
}

function shuffleWithIndices(len: number): number[] {
  const arr = Array.from({ length: len }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure right column isn't strictly identical to left when len >= 2
  if (len >= 2 && arr.every((v, idx) => v === idx)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export const LearningGateModal: React.FC<LearningGateModalProps> = ({
  isOpen,
  tasks,
  triggerReason,
  isPreview = false,
  onComplete,
  onClosePreview,
}) => {
  const [taskIdx, setTaskIdx] = useState(0);
  const [taskSolved, setTaskSolved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Match state
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedLeftIndices, setMatchedLeftIndices] = useState<Set<number>>(new Set());

  // Fill state
  const [fillInput, setFillInput] = useState('');
  const [showFillHint, setShowFillHint] = useState(false);

  // Choice state
  const [wrongChoiceIndices, setWrongChoiceIndices] = useState<Set<number>>(new Set());
  const [selectedCorrectChoice, setSelectedCorrectChoice] = useState<number | null>(null);

  const currentTask = tasks[taskIdx] || tasks[0];

  // Reset per-modal open
  useEffect(() => {
    if (!isOpen) return;
    setTaskIdx(0);
    setTaskSolved(false);
    setErrorMsg(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedLeftIndices(new Set());
    setFillInput('');
    setShowFillHint(false);
    setWrongChoiceIndices(new Set());
    setSelectedCorrectChoice(null);
  }, [isOpen, tasks]);

  // Reset per-task transition
  useEffect(() => {
    setTaskSolved(false);
    setErrorMsg(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedLeftIndices(new Set());
    setFillInput('');
    setShowFillHint(false);
    setWrongChoiceIndices(new Set());
    setSelectedCorrectChoice(null);
  }, [taskIdx]);

  // Shuffled right-side order for current match task
  const rightOrder = useMemo(() => {
    if (!currentTask || currentTask.type !== 'match') return [];
    return shuffleWithIndices(currentTask.pairs.length);
  }, [currentTask, taskIdx, isOpen]);

  if (!isOpen || !currentTask) return null;

  const isLastTask = taskIdx >= tasks.length - 1;

  const taskTypeLabel =
    currentTask.type === 'match'
      ? 'Spojování dvojic'
      : currentTask.type === 'fill'
      ? 'Doplnění odpovědi'
      : 'Výběr z možností';

  const triggerText =
    triggerReason === 'preview'
      ? 'Náhled úkolu'
      : triggerReason === 'minutes'
      ? 'Časový limit dosažen'
      : 'Limit her dosažen';

  const handleAdvance = () => {
    if (!taskSolved) return;
    if (!isLastTask) {
      setTaskIdx((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  // --- Match Handlers ---
  const evaluateMatchAttempt = (leftIdx: number, rightPairIdx: number, task: MatchLearningTask) => {
    if (leftIdx === rightPairIdx) {
      const next = new Set(matchedLeftIndices);
      next.add(leftIdx);
      setMatchedLeftIndices(next);
      setSelectedLeft(null);
      setSelectedRight(null);
      setErrorMsg(null);
      sound.playPlace(Math.min(6, next.size + 1));

      if (next.size === task.pairs.length) {
        setTaskSolved(true);
        if (isLastTask) sound.playVictory();
      }
    } else {
      setErrorMsg('Tato dvojice k sobě nepatří — zkus jinou.');
      setSelectedLeft(null);
      setSelectedRight(null);
      sound.playErase();
    }
  };

  const handlePickLeft = (idx: number, task: MatchLearningTask) => {
    if (taskSolved || matchedLeftIndices.has(idx)) return;
    setErrorMsg(null);
    if (selectedRight !== null) {
      evaluateMatchAttempt(idx, selectedRight, task);
    } else {
      setSelectedLeft(selectedLeft === idx ? null : idx);
      sound.playNote();
    }
  };

  const handlePickRight = (pairIdx: number, task: MatchLearningTask) => {
    if (taskSolved || matchedLeftIndices.has(pairIdx)) return;
    setErrorMsg(null);
    if (selectedLeft !== null) {
      evaluateMatchAttempt(selectedLeft, pairIdx, task);
    } else {
      setSelectedRight(selectedRight === pairIdx ? null : pairIdx);
      sound.playNote();
    }
  };

  // --- Fill Handler ---
  const handleFillSubmit = (e: React.FormEvent, task: FillLearningTask) => {
    e.preventDefault();
    if (taskSolved) {
      handleAdvance();
      return;
    }
    if (isFillAnswerCorrect(task, fillInput)) {
      setTaskSolved(true);
      setErrorMsg(null);
      if (isLastTask) sound.playVictory();
      else sound.playHint();
    } else {
      setErrorMsg('Zkus to ještě jednou — zkontroluj překlep.');
      sound.playErase();
    }
  };

  // --- Choice Handler ---
  const handlePickChoice = (optIdx: number, task: ChoiceLearningTask) => {
    if (taskSolved || wrongChoiceIndices.has(optIdx)) return;
    if (optIdx === task.correctIndex) {
      setSelectedCorrectChoice(optIdx);
      setTaskSolved(true);
      setErrorMsg(null);
      if (isLastTask) sound.playVictory();
      else sound.playHint();
    } else {
      const next = new Set(wrongChoiceIndices);
      next.add(optIdx);
      setWrongChoiceIndices(next);
      setErrorMsg('To není správná odpověď, zkus jinou možnost.');
      sound.playErase();
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Učící přestávka
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {triggerText} · {taskTypeLabel}
                {tasks.length > 1 ? ` · ${taskIdx + 1}/${tasks.length}` : ''}
              </p>
            </div>
          </div>

          {isPreview && onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Zavřít náhled"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Prompt */}
        <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {currentTask.prompt}
        </div>

        {/* Error banner */}
        {errorMsg && !taskSolved && (
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TYPE 1: MATCH PAIRS */}
        {currentTask.type === 'match' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">
              Klikni na slovo vlevo a poté na odpovídající slovo vpravo ({matchedLeftIndices.size}/
              {currentTask.pairs.length}).
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Left Column */}
              <div className="flex flex-col gap-2">
                {currentTask.pairs.map((pair, idx) => {
                  const isMatched = matchedLeftIndices.has(idx);
                  const isSelected = selectedLeft === idx;
                  return (
                    <button
                      key={`l-${idx}`}
                      type="button"
                      disabled={isMatched || taskSolved}
                      onClick={() => handlePickLeft(idx, currentTask)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between gap-1.5 ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <span className="truncate">{pair.left}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Right Column (shuffled) */}
              <div className="flex flex-col gap-2">
                {rightOrder.map((pairIdx) => {
                  const pair = currentTask.pairs[pairIdx];
                  const isMatched = matchedLeftIndices.has(pairIdx);
                  const isSelected = selectedRight === pairIdx;
                  return (
                    <button
                      key={`r-${pairIdx}`}
                      type="button"
                      disabled={isMatched || taskSolved}
                      onClick={() => handlePickRight(pairIdx, currentTask)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between gap-1.5 ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40'
                      }`}
                    >
                      <span className="truncate">{pair.right}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TYPE 2: FILL IN THE BLANK */}
        {currentTask.type === 'fill' && (
          <form onSubmit={(e) => handleFillSubmit(e, currentTask)} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fillInput}
                onChange={(e) => {
                  setFillInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={taskSolved}
                autoFocus
                placeholder="Napiš odpověď..."
                className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-emerald-50 disabled:border-emerald-400 disabled:text-emerald-900"
              />
              {!taskSolved && (
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Zkontrolovat
                </button>
              )}
            </div>

            {currentTask.hint && !taskSolved && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowFillHint((prev) => !prev)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showFillHint ? 'Skrýt nápovědu' : 'Ukázat nápovědu'}</span>
                </button>
                {showFillHint && (
                  <p className="mt-1.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    {currentTask.hint}
                  </p>
                )}
              </div>
            )}
          </form>
        )}

        {/* TYPE 3: MULTIPLE CHOICE (1 of N) */}
        {currentTask.type === 'choice' && (
          <div className="flex flex-col gap-2">
            {currentTask.options.map((opt, idx) => {
              const isWrong = wrongChoiceIndices.has(idx);
              const isRight = selectedCorrectChoice === idx;
              const letter = String.fromCharCode(65 + idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={taskSolved || isWrong}
                  onClick={() => handlePickChoice(idx, currentTask)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between gap-2 ${
                    isRight
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                      : isWrong
                      ? 'bg-rose-50 border-rose-200 text-rose-400 line-through'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                        isRight
                          ? 'bg-emerald-600 text-white'
                          : isWrong
                          ? 'bg-rose-200 text-rose-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {letter}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isRight && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Solved feedback & Continue CTA */}
        {taskSolved && (
          <div className="pt-1 flex flex-col gap-2.5">
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isLastTask
                  ? 'Výborně! Úkol je splněný, můžeš pokračovat ve hraní.'
                  : 'Správně! Pokračuj na další úkol.'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdvance}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>
                {isLastTask ? (isPreview ? 'Dokončit náhled' : 'Pokračovat ve hře') : 'Další úkol'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
