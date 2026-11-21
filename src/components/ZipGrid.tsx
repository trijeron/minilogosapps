import React, { useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { ZipBoardSize } from '../types/zip';
import { getZipHorizontalWallIndex, getZipVerticalWallIndex } from '../utils/zipEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface ZipGridProps {
  size: ZipBoardSize;
  numbers: number[];
  maxNumber: number;
  horizontalWalls: boolean[];
  verticalWalls: boolean[];
  path: number[];
  nextExpectedNumber: number;
  hintTargetCell: number | null;
  hintBacktrackCell: number | null;
  blockedFeedbackCell: number | null;
  isPaused: boolean;
  isCompleted: boolean;
  onResume: () => void;
  onStartAtCell: (idx: number) => void;
  onMoveToCell: (idx: number) => void;
  onEndDrag: () => void;
}

export const ZipGrid: React.FC<ZipGridProps> = ({
  size,
  numbers,
  horizontalWalls,
  verticalWalls,
  path,
  nextExpectedNumber,
  hintTargetCell,
  hintBacktrackCell,
  blockedFeedbackCell,
  isPaused,
  isCompleted,
  onResume,
  onStartAtCell,
  onMoveToCell,
  onEndDrag,
}) => {
  const { pick } = useLanguage();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const lastCellRef = useRef<number | null>(null);

  const total = size * size;
  const pathIndexMap = new Map<number, number>();
  for (let i = 0; i < path.length; i++) {
    pathIndexMap.set(path[i], i);
  }
  const headCell = path.length > 0 ? path[path.length - 1] : null;

  const getCellFromClientPoint = (clientX: number, clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    if (relX < 0 || relY < 0 || relX >= rect.width || relY >= rect.height) {
      return null;
    }
    const c = Math.min(size - 1, Math.max(0, Math.floor((relX / rect.width) * size)));
    const r = Math.min(size - 1, Math.max(0, Math.floor((relY / rect.height) * size)));
    return r * size + c;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPaused || isCompleted) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const cell = getCellFromClientPoint(e.clientX, e.clientY);
    if (cell === null) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture unsupported
    }
    setActivePointerId(e.pointerId);
    lastCellRef.current = cell;
    onStartAtCell(cell);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId !== e.pointerId || isPaused || isCompleted) return;
    const cell = getCellFromClientPoint(e.clientX, e.clientY);
    if (cell === null || cell === lastCellRef.current) return;
    lastCellRef.current = cell;
    onMoveToCell(cell);
  };

  const handlePointerFinish = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId !== e.pointerId) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    setActivePointerId(null);
    lastCellRef.current = null;
    onEndDrag();
  };

  // Build SVG tube polyline path
  const svgSize = size * 100;
  const centerOf = (idx: number) => ({
    x: (idx % size) * 100 + 50,
    y: Math.floor(idx / size) * 100 + 50,
  });

  const pathD =
    path.length >= 2
      ? path
          .map((cell, i) => {
            const pt = centerOf(cell);
            return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
          })
          .join(' ')
      : '';

  const headPt = headCell !== null ? centerOf(headCell) : null;
  const hintPt = hintTargetCell !== null ? centerOf(hintTargetCell) : null;

  const badgeSizeClass =
    size === 5
      ? 'w-9 h-9 text-sm'
      : size === 6
      ? 'w-8 h-8 text-xs sm:text-sm'
      : 'w-7 h-7 text-xs';

  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[400px] aspect-square mx-auto">
      <div
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerFinish}
        onPointerCancel={handlePointerFinish}
        className={`relative w-full h-full rounded-2xl bg-white border-2 ${
          isCompleted ? 'border-emerald-600 shadow-md shadow-emerald-100' : 'border-slate-800 shadow-sm'
        } overflow-hidden touch-none select-none cursor-crosshair transition-colors duration-200`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {/* Base Grid Cells */}
        {Array.from({ length: total }, (_, idx) => {
          const pathPos = pathIndexMap.get(idx);
          const isVisited = pathPos !== undefined;
          const isHead = idx === headCell;
          const num = numbers[idx] || 0;
          const isHintTarget = hintTargetCell === idx;
          const isHintBacktrack = hintBacktrackCell === idx;
          const isBlocked = blockedFeedbackCell === idx;
          const isNextNum = num > 0 && num === nextExpectedNumber && !isVisited;

          return (
            <div
              key={idx}
              className={`relative flex items-center justify-center border border-slate-200/80 transition-colors duration-150 ${
                isCompleted
                  ? 'bg-emerald-50/70'
                  : isBlocked
                  ? 'bg-rose-100/90'
                  : isHintTarget
                  ? 'bg-amber-50'
                  : isHintBacktrack
                  ? 'bg-rose-50'
                  : isVisited
                  ? 'bg-orange-50/45'
                  : 'bg-white'
              }`}
              style={
                isCompleted && pathPos !== undefined
                  ? {
                      transitionDelay: `${Math.min(pathPos * 14, 360)}ms`,
                    }
                  : undefined
              }
            >
              {/* Hint pulsing cell frame */}
              {isHintTarget && !isCompleted && (
                <div className="absolute inset-1 rounded-lg border-2 border-amber-500 animate-pulse pointer-events-none z-10" />
              )}
              {isHintBacktrack && !isCompleted && (
                <div className="absolute inset-1 rounded-lg border-2 border-rose-500 animate-pulse pointer-events-none z-10" />
              )}

              {/* Checkpoint Number Badge (renders above tube & walls) */}
              {num > 0 && (
                <span
                  className={`relative z-30 ${badgeSizeClass} rounded-full font-extrabold tabular-nums flex items-center justify-center transition-transform duration-150 pointer-events-none ${
                    isCompleted
                      ? 'bg-emerald-700 text-white ring-2 ring-white scale-105 shadow-xs'
                      : isVisited
                      ? 'bg-slate-900 text-white ring-2 ring-white shadow-xs'
                      : isNextNum
                      ? 'bg-orange-700 text-white ring-2 ring-orange-200 shadow-sm scale-105'
                      : 'bg-white text-slate-900 border-2 border-slate-800 shadow-2xs'
                  } ${isHead && !isCompleted ? 'scale-110' : ''}`}
                >
                  {num}
                </span>
              )}
            </div>
          );
        })}

        {/* Smooth Rounded Tube SVG Overlay */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="zipTubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="zipWinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="55%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Hint connector preview */}
          {headPt && hintPt && !isCompleted && (
            <>
              <line
                x1={headPt.x}
                y1={headPt.y}
                x2={hintPt.x}
                y2={hintPt.y}
                stroke="#f59e0b"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="12 10"
                opacity="0.85"
              />
              <circle
                cx={hintPt.x}
                cy={hintPt.y}
                r="18"
                fill="#fef3c7"
                stroke="#d97706"
                strokeWidth="5"
              />
            </>
          )}

          {/* Single-cell start node glow when only #1 is in path */}
          {path.length === 1 && headPt && (
            <circle
              cx={headPt.x}
              cy={headPt.y}
              r="24"
              fill={isCompleted ? '#10b981' : '#f97316'}
              opacity="0.22"
            />
          )}

          {/* Continuous Rounded Tube */}
          {path.length >= 2 && (
            <>
              {/* Soft outer casing */}
              <path
                d={pathD}
                fill="none"
                stroke={isCompleted ? '#a7f3d0' : '#fed7aa'}
                strokeWidth="44"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main tube */}
              <path
                d={pathD}
                fill="none"
                stroke={isCompleted ? 'url(#zipWinGradient)' : 'url(#zipTubeGradient)'}
                strokeWidth="34"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Subtle specular highlight */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Current active head tip indicator */}
          {headPt && !isCompleted && path.length > 0 && numbers[headCell!] === 0 && (
            <circle
              cx={headPt.x}
              cy={headPt.y}
              r="14"
              fill="#ffffff"
              stroke="#c2410c"
              strokeWidth="5"
            />
          )}
        </svg>

        {/* Strategic Walls Overlay */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
          aria-hidden="true"
        >
          {/* Horizontal-neighbor walls (vertical barrier bars between (r, c) and (r, c+1)) */}
          {Array.from({ length: size }, (_, r) =>
            Array.from({ length: size - 1 }, (_, c) => {
              const wIdx = getZipHorizontalWallIndex(r, c, size);
              if (!horizontalWalls[wIdx]) return null;
              const x = (c + 1) * 100;
              const y1 = r * 100 + 6;
              const y2 = (r + 1) * 100 - 6;
              return (
                <line
                  key={`hw-${r}-${c}`}
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke="#0f172a"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Vertical-neighbor walls (horizontal barrier bars between (r, c) and (r+1, c)) */}
          {Array.from({ length: size - 1 }, (_, r) =>
            Array.from({ length: size }, (_, c) => {
              const wIdx = getZipVerticalWallIndex(r, c, size);
              if (!verticalWalls[wIdx]) return null;
              const y = (r + 1) * 100;
              const x1 = c * 100 + 6;
              const x2 = (c + 1) * 100 - 6;
              return (
                <line
                  key={`vw-${r}-${c}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#0f172a"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Pause className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900">
                {pick('Hra je pozastavena', 'Game paused')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {pick(
                  'Klikněte pro pokračování v kreslení cesty',
                  'Tap to continue drawing your path'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onResume}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {pick('Pokračovat', 'Resume')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
