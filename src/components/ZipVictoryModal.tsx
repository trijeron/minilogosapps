import React, { useEffect, useRef } from 'react';
import { Trophy, Clock, Star, RotateCcw, ArrowRight } from 'lucide-react';
import { ZipBoardSize } from '../types/zip';
import { formatTime } from '../utils/format';
import { GameTab } from './Header';
import { SwitchGameStrip } from './SwitchGameStrip';
import { useLanguage } from '../i18n/LanguageContext';

interface ZipVictoryModalProps {
  isOpen: boolean;
  size: ZipBoardSize;
  timeSeconds: number;
  isNewBest: boolean;
  bestTime: number | null;
  onPlayAgain: () => void;
  onNextSize: () => void;
  onSelectGame?: (tab: GameTab) => void;
}

export const ZipVictoryModal: React.FC<ZipVictoryModalProps> = ({
  isOpen,
  size,
  timeSeconds,
  isNewBest,
  bestTime,
  onPlayAgain,
  onNextSize,
  onSelectGame,
}) => {
  const { pick } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ea580c', '#f97316', '#10b981', '#f59e0b', '#0ea5e9', '#0f172a'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 50,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 4 - 2,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3,
    }));

    let animId = 0;
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
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();

        if (p.y > canvas.height + 20 && frames < 200) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      if (frames < 260) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeLabel =
    size === 5
      ? pick('5×5 Lehká', '5×5 Easy')
      : size === 6
        ? pick('6×6 Střední', '6×6 Medium')
        : pick('7×7 Těžká', '7×7 Hard');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          {pick('Cesta spojena!', 'Path Connected!')}
        </h2>
        <p className="text-xs text-slate-500 font-medium mb-4">
          {pick(`Úspěšně jste vyřešili Zip ${size}×${size}`, `You successfully solved Zip ${size}×${size}`)}
        </p>

        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{pick('Velikost', 'Grid size')}</span>
            <span className="font-bold text-slate-800">{sizeLabel}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> {pick('Váš čas', 'Your time')}
            </span>
            <span className="font-mono text-base font-extrabold text-orange-700 tabular-nums">
              {formatTime(timeSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" /> {pick('Osobní rekord', 'Personal best')}
            </span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              {bestTime !== null ? formatTime(bestTime) : formatTime(timeSeconds)}
            </span>
          </div>

          {isNewBest && (
            <div className="mt-1 py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{pick('Nový nejlepší čas!', 'New best time!')}</span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-xl bg-orange-700 hover:bg-orange-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{pick(`Hrát další (${size}×${size})`, `Play another (${size}×${size})`)}</span>
          </button>

          {size !== 7 && (
            <button
              onClick={onNextSize}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>
                {pick(
                  `Zkusit těžší mřížku (${size === 5 ? '6×6' : '7×7'})`,
                  `Try a harder grid (${size === 5 ? '6×6' : '7×7'})`
                )}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <SwitchGameStrip currentGame="zip" onSelectGame={onSelectGame} />
      </div>
    </div>
  );
};
