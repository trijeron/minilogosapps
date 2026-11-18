import React from 'react';
import { Play, Pause, Trophy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatTime } from '../utils/format';

interface GameInfoBarProps {
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  bestTime: number | null;
  conflictCount: number;
  errorCount: number;
  realTimeCheck: boolean;
}

export const GameInfoBar: React.FC<GameInfoBarProps> = ({
  elapsedSeconds,
  isPaused,
  onTogglePause,
  bestTime,
  conflictCount,
  errorCount,
  realTimeCheck,
}) => {
  return (
    <div className="w-full flex items-center justify-between py-1.5 px-3 bg-white rounded-xl border border-slate-200/80 shadow-xs text-xs font-medium text-slate-700">
      {/* Left: Timer + Pause Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Pokračovat ve hře' : 'Pozastavit hru'}
          className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
            isPaused
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-600 font-medium leading-none">Čas</span>
          <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Middle: Real-time Check Status */}
      <div className="flex items-center gap-1.5">
        {realTimeCheck ? (
          conflictCount > 0 || errorCount > 0 ? (
            <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              <span>
                {conflictCount > 0 ? `${conflictCount} ${conflictCount === 1 ? 'konflikt' : conflictCount < 5 ? 'konflikty' : 'konfliktů'}` : 'Chybný tah'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Správně</span>
            </div>
          )
        ) : (
          <span className="text-[11px] text-slate-600">Režim bez kontroly</span>
        )}
      </div>

      {/* Right: Best Time */}
      <div className="flex items-center gap-1.5 text-right">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-600 font-medium leading-none">Rekord</span>
          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
            {bestTime !== null ? formatTime(bestTime) : '--:--'}
          </span>
        </div>
      </div>
    </div>
  );
};
