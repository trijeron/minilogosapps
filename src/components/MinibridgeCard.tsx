import React from 'react';
import { Card } from '../types/minibridge';
import { getCardHcp, getRankLabel, getSuitLabel, SUIT_INFO } from '../utils/minibridgeEngine';
import { useLanguage } from '../i18n/LanguageContext';

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
  overlapMode?: 'none' | 'fan' | 'suits';
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
  overlapMode,
  onClick,
  title,
  className = '',
}) => {
  const { lang } = useLanguage();
  const effectiveOverlap = overlapMode ?? (overlap ? 'fan' : 'none');
  const isOverlapped = effectiveOverlap !== 'none';

  const sizeClasses = {
    xs: 'w-9 h-12 rounded-md text-[10px]',
    sm: 'w-[54px] h-[76px] sm:w-[60px] sm:h-[86px] rounded-xl text-xs',
    md: 'w-[58px] h-[82px] sm:w-[64px] sm:h-[92px] rounded-xl text-sm',
    trick: 'w-14 h-[78px] sm:w-[62px] sm:h-[88px] rounded-xl text-sm',
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

  // Never use opacity-* on the card element so overlapped cards behind never bleed through.
  const isMutedCard = Boolean(onClick && !isPlayable && isDimmed);
  const colorClass = isMutedCard
    ? info.isRed
      ? 'text-rose-400'
      : 'text-slate-400'
    : info.isRed
      ? 'text-rose-600'
      : 'text-slate-900';

  const interactiveClasses = onClick
    ? isPlayable
      ? 'cursor-pointer -translate-y-1.5 hover:-translate-y-3 hover:z-30 focus-visible:z-30 active:scale-95 ring-2 ring-inset ring-amber-400 border-amber-400 shadow-[-2px_5px_10px_rgba(0,0,0,0.3)]'
      : isDimmed
        ? 'cursor-not-allowed translate-y-0.5'
        : 'cursor-pointer hover:-translate-y-1.5 hover:z-30'
    : isOverlapped
      ? 'hover:-translate-y-1.5 hover:z-20'
      : '';

  const winningClasses = isWinning
    ? 'ring-2 ring-amber-400 shadow-[0_8px_18px_rgba(251,191,36,0.38)] scale-[1.04] z-10'
    : '';

  // 100% solid opaque card backgrounds — pure white for active/normal cards (including A, K, Q, J)
  const cardSurface = isMutedCard ? 'bg-slate-200' : 'bg-white';

  const borderClass = isMutedCard
    ? 'border-slate-400 shadow-[-2px_2px_5px_rgba(0,0,0,0.18)]'
    : isTrump
      ? 'border-amber-400 shadow-[-2px_3px_8px_rgba(0,0,0,0.24)]'
      : 'border-slate-300 shadow-[-2px_3px_7px_rgba(0,0,0,0.2)]';

  // Generous exposed left strip (36px–56px) so A, K, Q, J, 10 and HCP badges are never clipped
  const overlapMargin =
    effectiveOverlap === 'suits'
      ? size === 'sm'
        ? '-ml-[12px] first:ml-0 sm:-ml-[10px] sm:first:ml-0'
        : '-ml-[10px] first:ml-0 sm:-ml-[8px] sm:first:ml-0'
      : effectiveOverlap === 'fan'
        ? size === 'sm'
          ? '-ml-[18px] first:ml-0 sm:-ml-[16px] sm:first:ml-0'
          : '-ml-[18px] first:ml-0 sm:-ml-[16px] sm:first:ml-0'
        : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={title}
      aria-label={`${rankLabel} ${getSuitLabel(card.suit, lang)}${hcp > 0 ? ` (${hcp} HCP)` : ''}`}
      className={`relative ${sizeClasses} ${cardSurface} border ${borderClass} flex flex-col justify-between p-1.5 select-none transition-all duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${colorClass} ${interactiveClasses} ${winningClasses} ${overlapMargin} ${className}`}
    >
      {/* Subtle solid inner frame */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[3px] rounded-[8px] border ${
          isMutedCard
            ? 'border-slate-300'
            : isHonor
              ? info.isRed
                ? 'border-rose-200'
                : 'border-amber-200'
              : 'border-slate-100'
        }`}
      />

      {/* Top-left corner index: crisp left column well inside the uncovered strip */}
      <div className="relative z-10 flex flex-col items-center leading-none self-start font-black tabular-nums w-[20px] sm:w-[22px]">
        <span
          className={
            size === 'xs'
              ? 'text-[10px] tracking-tight'
              : size === 'sm'
                ? 'text-[13px] sm:text-[14px] tracking-tight'
                : 'text-[14px] sm:text-[16px] tracking-tight'
          }
        >
          {rankLabel}
        </span>
        <span
          className={
            size === 'xs'
              ? 'text-[10px] mt-0.5'
              : size === 'sm'
                ? 'text-[12px] sm:text-[13px] mt-0.5'
                : 'text-[13px] sm:text-[14px] mt-0.5'
          }
        >
          {info.symbol}
        </span>
      </div>

      {/* Center pip: offset slightly right when overlapped so it never collides with A/K/Q/J or HCP badge */}
      <div
        aria-hidden="true"
        className={`relative z-10 leading-none flex items-center justify-center ${
          isOverlapped ? 'self-end pr-0.5 -my-1' : 'self-center'
        } ${
          size === 'xs'
            ? 'text-sm'
            : size === 'sm'
              ? isOverlapped
                ? 'text-base sm:text-lg'
                : 'text-xl sm:text-2xl'
              : isOverlapped
                ? 'text-lg sm:text-xl'
                : 'text-2xl sm:text-[26px]'
        }`}
      >
        {info.symbol}
      </div>

      {/* Bottom row: left-aligned HCP badge inside uncovered strip + subtle bottom-right rank */}
      <div className="relative z-10 w-full flex items-end justify-between leading-none">
        {showHcpBadge && hcp > 0 ? (
          <span
            className={`w-4 h-4 rounded-full font-black text-[9px] tabular-nums flex items-center justify-center shadow-xs border ${
              isMutedCard
                ? 'bg-slate-300 text-slate-600 border-slate-400'
                : 'bg-amber-400 text-slate-950 border-amber-500'
            }`}
            title={`${hcp} HCP`}
          >
            {hcp}
          </span>
        ) : (
          <span />
        )}
        <span
          className={`font-bold tabular-nums text-[9px] sm:text-[10px] ${
            isMutedCard
              ? 'text-slate-400'
              : info.isRed
                ? 'text-rose-400'
                : 'text-slate-500'
          }`}
        >
          {rankLabel}
        </span>
      </div>

      {/* Subtle trump star mark in top-right */}
      {isTrump && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 text-[8px] font-black text-amber-500 leading-none"
        >
          ★
        </span>
      )}
    </button>
  );
};
