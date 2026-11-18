import React, { useEffect, useRef } from 'react';
import { Trophy, Clock, Star, RotateCcw, ArrowRight } from 'lucide-react';
import { Difficulty } from '../types/sudoku';
import { formatTime, getDifficultyLabel } from '../utils/format';
import { GameTab } from './Header';
import { SwitchGameStrip } from './SwitchGameStrip';

interface VictoryModalProps {
  isOpen: boolean;
  timeSeconds: number;
  difficulty: Difficulty;
  isNewBest: boolean;
  bestTime: number | null;
  onPlayAgain: () => void;
  onNextDifficulty: () => void;
  currentGame?: GameTab;
  gameLabel?: string;
  onSelectGame?: (tab: GameTab) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeSeconds,
  difficulty,
  isNewBest,
  bestTime,
  onPlayAgain,
  onNextDifficulty,
  currentGame = 'sudoku',
  gameLabel = 'Mini Sudoku 6×6',
  onSelectGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Confetti particles
    const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 50,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 4 - 2,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3,
    }));

    let animId: number;
    let frames = 0;

    const render = () => {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();

        if (p.y > canvas.height + 20 && frames < 220) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      if (frames < 280) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center">
        {/* Trophy emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-inner">
          <Trophy className="w-8 h-8 fill-amber-500 text-amber-600" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Gratulujeme!
        </h2>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Úspěšně jste vyřešili {gameLabel}
        </p>

        {/* Stats card */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Obtížnost</span>
            <span className="font-bold text-slate-800">
              {getDifficultyLabel(difficulty)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Váš čas
            </span>
            <span className="font-mono text-base font-extrabold text-indigo-600 tabular-nums">
              {formatTime(timeSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" /> Osobní rekord
            </span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              {bestTime !== null ? formatTime(bestTime) : formatTime(timeSeconds)}
            </span>
          </div>

          {isNewBest && (
            <div className="mt-1 py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>Nový nejlepší čas!</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Hrát další hru ({getDifficultyLabel(difficulty)})</span>
          </button>

          {difficulty !== 'hard' && (
            <button
              onClick={onNextDifficulty}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>
                Zkusit vyšší obtížnost ({difficulty === 'easy' ? 'Střední' : 'Těžká'})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <SwitchGameStrip currentGame={currentGame} onSelectGame={onSelectGame} />
      </div>
    </div>
  );
};
