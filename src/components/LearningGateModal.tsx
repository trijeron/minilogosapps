import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, CheckCircle2, ArrowRight, Lightbulb, X, AlertCircle, RotateCcw, SkipForward, Delete } from 'lucide-react';
import { LearningTask, MatchLearningTask, FillLearningTask, ChoiceLearningTask } from '../types/learningGate';
import { buildFillKeyboardKeys, isFillAnswerCorrect } from '../utils/learningTasks';
import { sound } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { pick } = useLanguage();
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
  const [fillWrongAttempts, setFillWrongAttempts] = useState(0);
  const [taskSkipped, setTaskSkipped] = useState(false);
  const fillInputRef = useRef<HTMLInputElement | null>(null);

  // Choice state
  const [wrongChoiceIndices, setWrongChoiceIndices] = useState<Set<number>>(new Set());
  const [selectedCorrectChoice, setSelectedCorrectChoice] = useState<number | null>(null);

  const currentTask = tasks[taskIdx] || tasks[0];

  // Reset per-modal open
  useEffect(() => {
    if (!isOpen) return;
    setTaskIdx(0);
    setTaskSolved(false);
    setTaskSkipped(false);
    setErrorMsg(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedLeftIndices(new Set());
    setFillInput('');
    setShowFillHint(false);
    setFillWrongAttempts(0);
    setWrongChoiceIndices(new Set());
    setSelectedCorrectChoice(null);
  }, [isOpen, tasks]);

  // Reset per-task transition
  useEffect(() => {
    setTaskSolved(false);
    setTaskSkipped(false);
    setErrorMsg(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedLeftIndices(new Set());
    setFillInput('');
    setShowFillHint(false);
    setFillWrongAttempts(0);
    setWrongChoiceIndices(new Set());
    setSelectedCorrectChoice(null);
  }, [taskIdx]);

  // Shuffled right-side order for current match task
  const rightOrder = useMemo(() => {
    if (!currentTask || currentTask.type !== 'match') return [];
    return shuffleWithIndices(currentTask.pairs.length);
  }, [currentTask, taskIdx, isOpen]);

  // Shuffled on-screen keyboard (all letters of the answer + 1–2 distractors) for fill tasks
  const fillKeyboard = useMemo(() => {
    if (!currentTask || currentTask.type !== 'fill') {
      return { keys: [] as string[], hasSpace: false };
    }
    return buildFillKeyboardKeys(currentTask);
  }, [currentTask, taskIdx, isOpen]);

  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(pointer: coarse)').matches);

  useEffect(() => {
    if (isOpen && currentTask?.type === 'fill' && !isTouchDevice()) {
      fillInputRef.current?.focus();
    }
  }, [isOpen, taskIdx, currentTask]);

  if (!isOpen || !currentTask) return null;

  const isLastTask = taskIdx >= tasks.length - 1;

  const taskTypeLabel =
    currentTask.type === 'match'
      ? pick('Spojování dvojic', 'Match pairs')
      : currentTask.type === 'fill'
      ? pick('Doplnění odpovědi', 'Fill in the blank')
      : pick('Výběr z možností', 'Multiple choice');

  const triggerText =
    triggerReason === 'preview'
      ? pick('Náhled úkolu', 'Task preview')
      : triggerReason === 'minutes'
      ? pick('Časový limit dosažen', 'Time limit reached')
      : pick('Limit her dosažen', 'Game limit reached');

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
      setErrorMsg(
        pick('Tato dvojice k sobě nepatří — zkus jinou.', 'That pair does not match — try another.')
      );
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

  // --- Fill Handlers ---
  const formatCorrectFillAnswers = (task: FillLearningTask): string => {
    const raw = [task.answer, ...(task.answers ?? [])];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of raw) {
      const trimmed = item.trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        unique.push(trimmed);
      }
    }
    return unique.join(' / ');
  };

  const handleResetFillWord = () => {
    setFillInput('');
    setErrorMsg(null);
    sound.playErase();
    if (!isTouchDevice()) {
      fillInputRef.current?.focus();
    }
  };

  const handleVirtualKeyPress = (char: string) => {
    if (taskSolved) return;
    setFillInput((prev) => prev + char);
    if (errorMsg) setErrorMsg(null);
    sound.playNote();
  };

  const handleVirtualBackspace = () => {
    if (taskSolved || fillInput.length === 0) return;
    setFillInput((prev) => prev.slice(0, -1));
    if (errorMsg) setErrorMsg(null);
    sound.playErase();
  };

  const handleSkipFill = (task: FillLearningTask) => {
    if (taskSolved || fillWrongAttempts < 2) return;
    setFillInput(task.answer);
    setTaskSkipped(true);
    setTaskSolved(true);
    setErrorMsg(null);
    sound.playHint();
  };

  const handleFillSubmit = (e: React.FormEvent, task: FillLearningTask) => {
    e.preventDefault();
    if (taskSolved) {
      handleAdvance();
      return;
    }
    if (fillInput.trim().length === 0) {
      setErrorMsg(pick('Nejprve napiš odpověď.', 'Please type an answer first.'));
      if (!isTouchDevice()) {
        fillInputRef.current?.focus();
      }
      return;
    }
    if (isFillAnswerCorrect(task, fillInput)) {
      setTaskSolved(true);
      setTaskSkipped(false);
      setErrorMsg(null);
      if (isLastTask) sound.playVictory();
      else sound.playHint();
    } else {
      const nextAttempts = fillWrongAttempts + 1;
      setFillWrongAttempts(nextAttempts);
      setErrorMsg(
        nextAttempts >= 2
          ? pick(
              `Zkus to ještě jednou, nebo úkol přeskoč a zobraz si správnou odpověď (pokusy: ${nextAttempts}).`,
              `Try again, or skip the task to reveal the correct answer (attempts: ${nextAttempts}).`
            )
          : pick(
              'Zkus to ještě jednou — zkontroluj překlep (1. pokus).',
              'Try again — check your spelling (attempt 1).'
            )
      );
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
      setErrorMsg(
        pick('To není správná odpověď, zkus jinou možnost.', 'Not quite right — try another option.')
      );
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
                {pick('Učící přestávka', 'Learning Break')}
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
              aria-label={pick('Zavřít náhled', 'Close preview')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Multi-question progress bar */}
        {tasks.length > 1 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>
                {pick(
                  `Otázka ${taskIdx + 1} z ${tasks.length} pro pokračování`,
                  `Question ${taskIdx + 1} of ${tasks.length} to continue`
                )}
              </span>
              <span className="tabular-nums text-indigo-700">
                {Math.round(((taskIdx + (taskSolved ? 1 : 0)) / tasks.length) * 100)} %
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(((taskIdx + (taskSolved ? 1 : 0)) / tasks.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

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
              {pick(
                'Klikni na slovo vlevo a poté na odpovídající slovo vpravo',
                'Tap an item on the left, then its match on the right'
              )}{' '}
              ({matchedLeftIndices.size}/{currentTask.pairs.length}).
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
          <form onSubmit={(e) => handleFillSubmit(e, currentTask)} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={fillInputRef}
                  type="text"
                  value={fillInput}
                  onChange={(e) => {
                    setFillInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  disabled={taskSolved}
                  placeholder={pick('Napiš nebo naklikej odpověď...', 'Type or tap letters...')}
                  className={`w-full min-h-[44px] pl-3.5 ${
                    !taskSolved && fillInput.length > 0 ? 'pr-9' : 'pr-3.5'
                  } py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    taskSkipped
                      ? 'disabled:bg-amber-50 disabled:border-amber-400 disabled:text-amber-950'
                      : 'disabled:bg-emerald-50 disabled:border-emerald-400 disabled:text-emerald-900'
                  }`}
                />
                {!taskSolved && fillInput.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFillWord}
                    title={pick('Smazat zadané slovo', 'Clear entered word')}
                    aria-label={pick('Smazat zadané slovo', 'Clear entered word')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!taskSolved && (
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors active:scale-95"
                >
                  {pick('Zkontrolovat', 'Check')}
                </button>
              )}
            </div>

            {/* On-screen letter keyboard (answer letters + 1-2 extra) for comfortable phone input */}
            {!taskSolved && fillKeyboard.keys.length > 0 && (
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {fillKeyboard.keys.map((char, idx) => (
                    <button
                      key={`${char}-${idx}`}
                      type="button"
                      onClick={() => handleVirtualKeyPress(char)}
                      aria-label={char}
                      className="min-w-[44px] h-11 px-3 rounded-xl bg-white border border-slate-200 border-b-2 border-b-slate-300 shadow-2xs text-base font-extrabold text-slate-900 hover:bg-indigo-50 hover:border-indigo-300 active:translate-y-[1px] active:bg-indigo-100 transition-all select-none flex items-center justify-center"
                    >
                      {char}
                    </button>
                  ))}

                  {fillKeyboard.hasSpace && (
                    <button
                      type="button"
                      onClick={() => handleVirtualKeyPress(' ')}
                      className="min-w-[82px] h-11 px-3 rounded-xl bg-white border border-slate-200 border-b-2 border-b-slate-300 shadow-2xs text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 active:translate-y-[1px] active:bg-indigo-100 transition-all select-none flex items-center justify-center"
                    >
                      {pick('Mezera', 'Space')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleVirtualBackspace}
                    disabled={fillInput.length === 0}
                    title={pick('Smazat poslední znak', 'Delete last character')}
                    aria-label={pick('Smazat poslední znak', 'Delete last character')}
                    className="min-w-[48px] h-11 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 disabled:opacity-40 border border-slate-300 border-b-2 border-b-slate-400/70 text-slate-800 active:translate-y-[1px] transition-all select-none flex items-center justify-center"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Reset word & Skip after 2 wrong attempts toolbar */}
            {!taskSolved && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetFillWord}
                  disabled={fillInput.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{pick('Resetovat slovo', 'Reset word')}</span>
                </button>

                {fillWrongAttempts >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleSkipFill(currentTask)}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>
                      {pick('Přeskočit a ukázat správnou odpověď', 'Skip & show answer')}
                    </span>
                  </button>
                )}
              </div>
            )}

            {currentTask.hint && !taskSolved && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowFillHint((prev) => !prev)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>
                    {showFillHint
                      ? pick('Skrýt nápovědu', 'Hide hint')
                      : pick('Ukázat nápovědu', 'Show hint')}
                  </span>
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

        {/* Solved or Skipped feedback & Continue CTA */}
        {taskSolved && (
          <div className="pt-1 flex flex-col gap-2.5">
            {taskSkipped && currentTask.type === 'fill' ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col gap-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <SkipForward className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{pick('Úkol přeskočen — správná varianta:', 'Task skipped — correct answer:')}</span>
                </div>
                <div className="text-sm font-black text-slate-900 bg-white border border-amber-200 rounded-lg px-3 py-1.5">
                  {formatCorrectFillAnswers(currentTask)}
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isLastTask
                    ? pick(
                        'Výborně! Úkol je splněný, můžeš pokračovat ve hraní.',
                        'Great job! Task complete — you can continue playing.'
                      )
                    : pick('Správně! Pokračuj na další úkol.', 'Correct! Move on to the next task.')}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAdvance}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>
                {isLastTask
                  ? isPreview
                    ? pick('Dokončit náhled', 'Finish preview')
                    : pick('Pokračovat ve hře', 'Continue playing')
                  : pick('Další úkol', 'Next task')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
