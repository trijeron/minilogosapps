import React from 'react';
import { Card } from '../types/minibridge';
import { getCardHcp, getRankLabel, SUIT_INFO } from '../utils/minibridgeEngine';

interface MinibridgeCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'trick';
  isPlayable?: boolean;
  isDimmed?: boolean;
  isWinning?: boolean;
  isTrump?: boolean;
  showHcpBadge?: boolean;
  overlap?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}

export const MinibridgeCard: React.FC<MinibridgeCardProps> = ({
  card,
  faceDown = false,
  size = 'md',
  isPlayable = false,
  isDimmed = false,
  isWinning = false,
  isTrump = false,
  showHcpBadge = false,
  overlap = false,
  onClick,
  title,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-8 h-12 rounded-md text-[10px]',
    sm: 'w-11 h-[64px] sm:w-[52px] sm:h-[76px] rounded-xl text-xs',
    md: 'w-12 h-[74px] sm:w-14 sm:h-[86px] rounded-xl text-sm',
    trick: 'w-12 h-[70px] sm:w-14 sm:h-[82px] rounded-xl text-sm',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        aria-hidden="true"
        className={`${sizeClasses} bg-white p-0.5 shadow-sm border border-slate-300 select-none shrink-0 ${className}`}
      >
        <div className="w-full h-full rounded-[7px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 border border-amber-300/40 flex items-center justify-center">
          <div className="w-3/5 h-3/5 rounded-xs border border-amber-300/30 bg-emerald-950/50" />
        </div>
      </div>
    );
  }

  const info = SUIT_INFO[card.suit];
  const rankLabel = getRankLabel(card.rank);
  const hcp = getCardHcp(card);
  const isHonor = card.rank >= 11;
  const colorClass = info.isRed ? 'text-rose-600' : 'text-slate-900';

  const interactiveClasses = onClick
    ? isPlayable
      ? 'cursor-pointer -translate-y-1 hover:-translate-y-2.5 hover:z-30 focus-visible:z-30 active:scale-95 ring-2 ring-amber-300 shadow-[0_6px_14px_rgba(0,0,0,0.34)]'
      : isDimmed
        ? 'cursor-not-allowed opacity-45 saturate-50'
        : 'cursor-pointer hover:-translate-y-1.5 hover:z-30'
    : overlap
      ? 'hover:-translate-y-1 hover:z-20'
      : '';

  const winningClasses = isWinning
    ? 'ring-2 ring-amber-400 shadow-[0_8px_18px_rgba(251,191,36,0.38)] scale-[1.04] z-10'
    : '';

  const cardSurface = isHonor
    ? 'bg-gradient-to-b from-white via-amber-50/35 to-amber-50/70'
    : 'bg-gradient-to-b from-white to-slate-50';

  const borderClass = isTrump
    ? 'border-amber-400 shadow-[0_3px_10px_rgba(0,0,0,0.28)]'
    : 'border-slate-300/95 shadow-[0_3px_9px_rgba(0,0,0,0.24)]';

  const overlapMargin = overlap
    ? size === 'sm'
      ? '-ml-[22px] first:ml-0 sm:-ml-[18px] sm:first:ml-0'
      : '-ml-[24px] first:ml-0 sm:-ml-[18px] sm:first:ml-0'
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={title}
      aria-label={`${rankLabel} ${info.labelCs}${hcp > 0 ? ` (${hcp} HCP)` : ''}`}
      className={`relative ${sizeClasses} ${cardSurface} border ${borderClass} flex flex-col justify-between p-1 select-none transition-all duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${colorClass} ${interactiveClasses} ${winningClasses} ${overlapMargin} ${className}`}
    >
      {/* Subtle inner honor frame */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[3px] rounded-[7px] border ${
          isHonor
            ? info.isRed
              ? 'border-rose-200/70'
              : 'border-amber-300/45'
            : 'border-slate-200/45'
        }`}
      />

      {/* Top-left corner index: compact left column so overlapping never obscures rank or suit */}
      <div className="relative z-10 flex flex-col items-center leading-none self-start font-black tabular-nums w-[16px] sm:w-[18px] pt-0.5">
        <span
          className={
            size === 'xs'
              ? 'text-[10px] tracking-tighter'
              : size === 'sm'
                ? 'text-[12px] tracking-tighter'
                : 'text-[13px] sm:text-[15px] tracking-tighter'
          }
        >
          {rankLabel}
        </span>
        <span
          className={
            size === 'xs'
              ? 'text-[9px] mt-[1px]'
              : size === 'sm'
                ? 'text-[11px] mt-[1px]'
                : 'text-[12px] sm:text-[13px] mt-[1px]'
          }
        >
          {info.symbol}
        </span>
      </div>

      {/* Center pip (offset slightly right on wide viewports when overlapped, centered naturally on standalone) */}
      <div
        aria-hidden="true"
        className={`relative z-10 self-center leading-none flex items-center justify-center ${
          size === 'xs'
            ? 'text-sm'
            : size === 'sm'
              ? 'text-lg sm:text-xl'
              : 'text-xl sm:text-2xl'
        } ${isHonor ? 'drop-shadow-[0_1px_0_rgba(0,0,0,0.08)]' : 'opacity-90'}`}
      >
        {info.symbol}
      </div>

      {/* Bottom row: left-aligned HCP badge (visible even under overlap!) + right subtle rank */}
      <div className="relative z-10 w-full flex items-end justify-between leading-none pb-0.5">
        {showHcpBadge && hcp > 0 ? (
          <span
            className="w-[15px] h-[15px] sm:w-4 sm:h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] tabular-nums flex items-center justify-center shadow-xs border border-amber-700/20"
            title={`${hcp} HCP`}
          >
            {hcp}
          </span>
        ) : (
          <span />
        )}
        <span className="font-bold opacity-55 tabular-nums text-[9px] sm:text-[10px] pr-0.5">
          {rankLabel}
        </span>
      </div>

      {/* Subtle trump star mark in top-right (visible on front/top card or trick) */}
      {isTrump && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-1 text-[8px] font-black text-amber-500 leading-none"
        >
          ★
        </span>
      )}
    </button>
  );
};
