import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  HelpCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import {
  BridgePhase,
  Card,
  Contract,
  ContractLevel,
  MinibridgeViewMode,
  Partnership,
  Seat,
  TrickCard,
  TrumpSuit,
} from '../types/minibridge';
import {
  ALL_SUITS,
  SUIT_INFO,
  SUIT_ORDER,
  calculateHandHcp,
  chooseAiCard,
  createAiContract,
  dealHandsForPlayerDeclarer,
  determineDeclarerFromHcp,
  evaluateTrickWinner,
  getCombinedSuitCounts,
  getLegalCards,
  getNextSeat,
  getPartnership,
  getRequiredTricks,
  getSeatInitial,
  getSeatLabel,
  getSeatShortLabel,
  getSuitLabel,
  getTrumpLabel,
  isLegalMove,
  recommendContract,
} from '../utils/minibridgeEngine';
import { loadMinibridgeViewMode, saveMinibridgeViewMode } from '../utils/storage';
import { MinibridgeCard } from './MinibridgeCard';
import { MinibridgeRulesModal } from './MinibridgeRulesModal';
import { sound } from '../utils/audio';
import { GameTab } from './Header';
import { SwitchGameStrip } from './SwitchGameStrip';
import { useLanguage } from '../i18n/LanguageContext';

interface MinibridgeGameProps {
  realTimeCheck: boolean;
  onGameCompleted?: () => void;
  onSelectGame?: (tab: GameTab) => void;
}

export const MinibridgeGame: React.FC<MinibridgeGameProps> = ({ realTimeCheck, onGameCompleted, onSelectGame }) => {
  const { lang, isEn, pick } = useLanguage();
  const [dealer, setDealer] = useState<Seat>('north');
  const [hands, setHands] = useState<Record<Seat, Card[]>>(() =>
    dealHandsForPlayerDeclarer()
  );
  const [phase, setPhase] = useState<BridgePhase>('ANNOUNCING_HCP');

  // Phase 1: HCP announcements
  const [announcedSeats, setAnnouncedSeats] = useState<Seat[]>([]);
  const [declarerInfo, setDeclarerInfo] = useState<{
    partnership: Partnership;
    declarer: Seat;
    dummy: Seat;
    nsTotal: number;
    ewTotal: number;
    isTie20: boolean;
  } | null>(null);

  // Phase 2: Contract selection
  const [selectedTrump, setSelectedTrump] = useState<TrumpSuit>('NT');
  const [selectedLevel, setSelectedLevel] = useState<ContractLevel>('part_score');
  const [contract, setContract] = useState<Contract | null>(null);
  const [aiContractReason, setAiContractReason] = useState<string>('');

  // Phase 3: Trick play
  const [currentTurn, setCurrentTurn] = useState<Seat>('west');
  const [currentTrick, setCurrentTrick] = useState<TrickCard[]>([]);
  const [tricksWon, setTricksWon] = useState<{ NS: number; EW: number }>({ NS: 0, EW: 0 });
  const [lastTrickWinner, setLastTrickWinner] = useState<Seat | null>(null);
  const [ruleWarning, setRuleWarning] = useState<string | null>(null);

  // Display mode, educational helpers & modals
  const [viewMode, setViewMode] = useState<MinibridgeViewMode>(() => loadMinibridgeViewMode());
  const [showHcpBadges, setShowHcpBadges] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);

  const warningTimerRef = useRef<number | null>(null);

  const handleViewModeChange = (mode: MinibridgeViewMode) => {
    setViewMode(mode);
    saveMinibridgeViewMode(mode);
  };

  const hcpBySeat = useMemo<Record<Seat, number>>(
    () => ({
      north: calculateHandHcp(hands.north),
      east: calculateHandHcp(hands.east),
      south: calculateHandHcp(hands.south),
      west: calculateHandHcp(hands.west),
    }),
    [hands]
  );

  // Deal a fresh hand
  const startNewDeal = useCallback(
    (nextDealer?: Seat) => {
      if (warningTimerRef.current) {
        window.clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      const d = nextDealer ?? getNextSeat(dealer);
      setDealer(d);
      setHands(dealHandsForPlayerDeclarer());
      setPhase('ANNOUNCING_HCP');
      setAnnouncedSeats([]);
      setDeclarerInfo(null);
      setContract(null);
      setAiContractReason('');
      setCurrentTrick([]);
      setTricksWon({ NS: 0, EW: 0 });
      setLastTrickWinner(null);
      setRuleWarning(null);
    },
    [dealer]
  );

  // Phase 1 loop: step-by-step HCP announcements starting from dealer
  useEffect(() => {
    if (phase !== 'ANNOUNCING_HCP') return;

    if (announcedSeats.length < 4) {
      const nextSeatIndex = announcedSeats.length;
      let targetSeat = dealer;
      for (let i = 0; i < nextSeatIndex; i++) {
        targetSeat = getNextSeat(targetSeat);
      }

      const timer = window.setTimeout(() => {
        setAnnouncedSeats((prev) => [...prev, targetSeat]);
        sound.playNote();
      }, 450);
      return () => window.clearTimeout(timer);
    }

    // All 4 announced -> compute declarer & transition to choosing contract
    const info = determineDeclarerFromHcp(hcpBySeat);
    setDeclarerInfo(info);

    const timer = window.setTimeout(() => {
      if (info.declarer === 'south') {
        const rec = recommendContract(hands.south, hands.north, info.nsTotal);
        setSelectedTrump(rec.trump);
        setSelectedLevel(rec.level);
      }
      setPhase('CHOOSING_CONTRACT');
    }, 900);

    return () => window.clearTimeout(timer);
  }, [phase, announcedSeats, dealer, hcpBySeat, hands]);

  // Phase 2: If AI is declarer, auto-pick contract cleanly
  useEffect(() => {
    if (phase !== 'CHOOSING_CONTRACT' || !declarerInfo) return;
    if (declarerInfo.declarer === 'south') return;

    const dec = declarerInfo.declarer;
    const dum = declarerInfo.dummy;
    const totalHcp =
      declarerInfo.partnership === 'NS' ? declarerInfo.nsTotal : declarerInfo.ewTotal;
    const rec = recommendContract(hands[dec], hands[dum], totalHcp);
    const aiContract = createAiContract(dec, hands[dec], hands[dum], totalHcp);

    setAiContractReason(isEn ? rec.reasonEn : rec.reasonCs);
    const timer = window.setTimeout(() => {
      setContract(aiContract);
      setCurrentTurn(getNextSeat(dec));
      setPhase('PLAYING');
      sound.playHint();
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [phase, declarerInfo, hands, isEn]);

  // Helper to show a brief warning on illegal click
  const triggerRuleWarning = useCallback((msg: string) => {
    if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
    setRuleWarning(msg);
    sound.playError();
    warningTimerRef.current = window.setTimeout(() => {
      setRuleWarning(null);
      warningTimerRef.current = null;
    }, 2200);
  }, []);

  // Execute a card play for any seat
  const playCard = useCallback(
    (seat: Seat, card: Card) => {
      if (phase !== 'PLAYING' || seat !== currentTurn || !contract) return;

      const seatHand = hands[seat];
      if (!isLegalMove(card, seatHand, currentTrick)) {
        const ledSuit = currentTrick[0].card.suit;
        const suitText = `${SUIT_INFO[ledSuit].symbol} ${getSuitLabel(ledSuit, lang)}`;
        triggerRuleWarning(
          pick(
            `Musíš ctít vynesou barvu: ${suitText}!`,
            `You must follow the led suit: ${suitText}!`
          )
        );
        return;
      }

      setRuleWarning(null);
      const updatedHand = seatHand.filter((c) => c.id !== card.id);
      const nextTrick = [...currentTrick, { seat, card }];

      setHands((prev) => ({ ...prev, [seat]: updatedHand }));
      setCurrentTrick(nextTrick);
      sound.playPlace(card.rank > 10 ? 5 : 2);

      if (nextTrick.length === 4) {
        const winner = evaluateTrickWinner(nextTrick, contract.trump);
        setLastTrickWinner(winner.seat);
        setPhase('TRICK_RESOLVE');
      } else {
        setCurrentTurn(getNextSeat(seat));
      }
    },
    [phase, currentTurn, contract, hands, currentTrick, triggerRuleWarning, lang, pick]
  );

  // Resolve completed 4-card trick after brief pause
  useEffect(() => {
    if (phase !== 'TRICK_RESOLVE' || !contract || currentTrick.length !== 4) return;

    const winner = evaluateTrickWinner(currentTrick, contract.trump);
    const winningSide = getPartnership(winner.seat);

    const timer = window.setTimeout(() => {
      const nextNS = tricksWon.NS + (winningSide === 'NS' ? 1 : 0);
      const nextEW = tricksWon.EW + (winningSide === 'EW' ? 1 : 0);
      setTricksWon({ NS: nextNS, EW: nextEW });
      setCurrentTrick([]);
      setLastTrickWinner(null);

      if (nextNS + nextEW >= 13) {
        setPhase('FINISHED');
        const declarerTricks = contract.partnership === 'NS' ? nextNS : nextEW;
        if (declarerTricks >= contract.targetTricks) {
          sound.playVictory();
        }
        onGameCompleted?.();
      } else {
        setCurrentTurn(winner.seat);
        setPhase('PLAYING');
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [phase, contract, currentTrick, tricksWon, onGameCompleted]);

  // Determine whether human player controls the current seat on turn
  const isHumanTurn = useMemo(() => {
    if (phase !== 'PLAYING' || !contract) return false;
    if (currentTurn === 'south' && contract.dummy !== 'south') return true;
    if (currentTurn === 'north' && contract.declarer === 'south') return true;
    return false;
  }, [phase, contract, currentTurn]);

  // AI auto-play loop when currentTurn is AI-controlled
  useEffect(() => {
    if (phase !== 'PLAYING' || !contract || isHumanTurn) return;

    const hand = hands[currentTurn];
    if (hand.length === 0) return;

    const timer = window.setTimeout(() => {
      const chosen = chooseAiCard(currentTurn, hand, currentTrick, contract.trump);
      playCard(currentTurn, chosen);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [phase, contract, isHumanTurn, currentTurn, hands, currentTrick, playCard]);

  // Clean up warning timer on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Confirm South's contract selection
  const handleConfirmSouthContract = () => {
    if (!declarerInfo || declarerInfo.declarer !== 'south') return;
    const newContract: Contract = {
      declarer: 'south',
      dummy: 'north',
      partnership: 'NS',
      trump: selectedTrump,
      level: selectedLevel,
      targetTricks: getRequiredTricks(selectedTrump, selectedLevel),
    };
    setContract(newContract);
    setCurrentTurn(getNextSeat('south'));
    setPhase('PLAYING');
    sound.playHint();
  };

  // Visibility of each hand
  const dummySeat = declarerInfo?.dummy ?? contract?.dummy ?? null;
  const showDummyOpen = phase !== 'ANNOUNCING_HCP';
  const isNorthOpen = showDummyOpen && dummySeat === 'north';

  // Recommendation helper for South when choosing contract
  const southRecommendation = useMemo(() => {
    if (!declarerInfo || declarerInfo.declarer !== 'south') return null;
    return recommendContract(hands.south, hands.north, declarerInfo.nsTotal);
  }, [declarerInfo, hands]);

  const nsSuitCounts = useMemo(
    () => getCombinedSuitCounts(hands.south, hands.north),
    [hands]
  );

  // Legal card IDs for the currently active human-controlled hand
  const activeHumanLegalIds = useMemo(() => {
    if (!isHumanTurn) return new Set<string>();
    return new Set(getLegalCards(hands[currentTurn], currentTrick).map((c) => c.id));
  }, [isHumanTurn, hands, currentTurn, currentTrick]);

  // Winning trick card currently in center
  const leadingTrickSeat = useMemo(() => {
    if (!contract || currentTrick.length === 0) return null;
    return evaluateTrickWinner(currentTrick, contract.trump).seat;
  }, [contract, currentTrick]);

  // Educational guide message for the child
  const guideText = useMemo(() => {
    if (phase === 'ANNOUNCING_HCP') {
      if (announcedSeats.length < 4) {
        return pick(
          'Hráči postupně počítají a hlásí body za silné karty (Eso = 4, Král = 3, Dáma = 2, Kluk = 1).',
          'Players count and announce their high card points (Ace = 4, King = 3, Queen = 2, Jack = 1).'
        );
      }
      if (declarerInfo) {
        const pairLabel =
          declarerInfo.partnership === 'NS'
            ? pick('Sever + Jih (Vy)', 'North + South (You)')
            : pick('Východ + Západ', 'East + West');
        const decName = getSeatShortLabel(declarerInfo.declarer, lang);
        const dumName = getSeatShortLabel(declarerInfo.dummy, lang);
        return pick(
          `${declarerInfo.isTie20 ? 'Remíza 20–20! ' : ''}Větší sílu má ${pairLabel}. Vydražitelem je ${decName} a ${dumName} vykládá karty jako Tichý hráč.`,
          `${declarerInfo.isTie20 ? '20–20 tie! ' : ''}${pairLabel} hold more points. ${decName} is Declarer and ${dumName} lays down cards as Dummy.`
        );
      }
    }
    if (phase === 'CHOOSING_CONTRACT' && declarerInfo) {
      if (declarerInfo.declarer === 'south') {
        return pick(
          'Prohlédni si své karty i vyložené karty partnera Severa. Vyber trumfovou barvu (ideálně 8+ karet dohromady) a závazek.',
          'Review your hand and North’s exposed Dummy cards. Pick a trump suit (ideally 8+ combined cards) and contract level.'
        );
      }
      return pick(
        `${getSeatShortLabel(declarerInfo.declarer, lang)} si prohlíží karty Tichého hráče a vybírá trumfy a cíl zdvihů…`,
        `${getSeatShortLabel(declarerInfo.declarer, lang)} is reviewing Dummy’s hand and choosing trumps and contract…`
      );
    }
    if (phase === 'PLAYING' && contract) {
      if (currentTurn === 'south' && contract.dummy !== 'south') {
        if (currentTrick.length === 0) {
          return pick(
            'Jsi na výnosu! Klikni na kteroukoli svou kartu pro zahájení nového zdvihu.',
            'Your lead! Tap any card in your hand to start a new trick.'
          );
        }
        const ledSuit = currentTrick[0].card.suit;
        const ledText = `${SUIT_INFO[ledSuit].symbol} ${getSuitLabel(ledSuit, lang)}`;
        const hasLed = hands.south.some((c) => c.suit === ledSuit);
        return hasLed
          ? pick(
              `Na tahu jsi Ty (Jih). Musíš ctít vynesou barvu ${ledText}.`,
              `Your turn (South). You must follow suit: ${ledText}.`
            )
          : pick(
              `Na tahu jsi Ty (Jih). Nemáš ${ledText} — můžeš přebít trumfem nebo zahodit jinou kartu.`,
              `Your turn (South). Void in ${ledText} — you may ruff with trump or discard.`
            );
      }
      if (currentTurn === 'north' && contract.declarer === 'south') {
        if (currentTrick.length === 0) {
          return pick(
            'Vynáší Tichý hráč (Sever) — klikni na zvýrazněnou kartu nahoře u partnera.',
            'Dummy (North) leads — tap a highlighted card in North’s hand above.'
          );
        }
        const ledSuit = currentTrick[0].card.suit;
        const ledText = `${SUIT_INFO[ledSuit].symbol} ${getSuitLabel(ledSuit, lang)}`;
        const hasLed = hands.north.some((c) => c.suit === ledSuit);
        return hasLed
          ? pick(
              `Na tahu je tvůj Dummy (Sever). Musíš za něj zahrát kartu v barvě ${ledText}.`,
              `Dummy’s turn (North). Play a ${ledText} card from North’s hand.`
            )
          : pick(
              `Na tahu je tvůj Dummy (Sever). Nemá ${ledText} — vyber mu trumf nebo odhoz.`,
              `Dummy’s turn (North). Void in ${ledText} — choose a trump or discard.`
            );
      }
      if (currentTurn === 'south' && contract.dummy === 'south') {
        return pick(
          'Tvůj partner Sever je Vydražitel a vede teď i tvé karty Tichého hráče.',
          'Your partner North is Declarer and is currently playing your Dummy hand.'
        );
      }
      return pick(
        `Přemýšlí a hraje ${getSeatShortLabel(currentTurn, lang)}…`,
        `${getSeatShortLabel(currentTurn, lang)} is thinking and playing…`
      );
    }
    if (phase === 'TRICK_RESOLVE' && lastTrickWinner) {
      return pick(
        `Zdvih získal ${getSeatShortLabel(lastTrickWinner, lang)}!`,
        `${getSeatShortLabel(lastTrickWinner, lang)} wins the trick!`
      );
    }
    if (phase === 'FINISHED' && contract) {
      const won = contract.partnership === 'NS' ? tricksWon.NS : tricksWon.EW;
      const made = won >= contract.targetTricks;
      const pairName =
        contract.partnership === 'NS'
          ? pick('Sever + Jih', 'North + South')
          : pick('Východ + Západ', 'East + West');
      return made
        ? pick(
            `Výborně! Hrající strana (${pairName}) splnila závazek (${won} z ${contract.targetTricks} zdvihů).`,
            `Well done! Declaring side (${pairName}) made the contract (${won} of ${contract.targetTricks} tricks).`
          )
        : pick(
            `Tentokrát to nevyšlo (${won} z ${contract.targetTricks} zdvihů). Zkus další rozdání!`,
            `Contract went down (${won} of ${contract.targetTricks} tricks). Try the next deal!`
          );
    }
    return '';
  }, [phase, announcedSeats, declarerInfo, contract, currentTurn, currentTrick, hands, lastTrickWinner, tricksWon, lang, pick]);

  // Center trick card lookup by seat
  const trickCardBySeat = useMemo(() => {
    const map: Partial<Record<Seat, Card>> = {};
    for (const item of currentTrick) {
      map[item.seat] = item.card;
    }
    return map;
  }, [currentTrick]);

  // Render overlapping open hand either as 1 continuous fan OR 4 suit-grouped overlapping clusters
  const renderOpenCards = (
    seat: Seat,
    size: 'sm' | 'md',
    isInteractive: boolean
  ) => {
    const cards = hands[seat];
    if (cards.length === 0) {
      return (
        <div className="py-2 text-[11px] font-semibold text-emerald-100/60">
          {pick('Všechny karty odehrány', 'All cards played')}
        </div>
      );
    }

    const renderSingleCard = (card: Card) => {
      const isPlayable = isInteractive && activeHumanLegalIds.has(card.id);
      const isDimmed =
        isInteractive && realTimeCheck && !activeHumanLegalIds.has(card.id);
      const isTrump =
        contract !== null && contract.trump !== 'NT' && card.suit === contract.trump;

      return (
        <MinibridgeCard
          key={card.id}
          card={card}
          size={size}
          overlapMode={viewMode}
          isPlayable={isPlayable}
          isDimmed={isDimmed}
          isTrump={isTrump}
          showHcpBadge={showHcpBadges}
          onClick={isInteractive ? () => playCard(seat, card) : undefined}
        />
      );
    };

    if (viewMode === 'fan') {
      return (
        <div className="w-full overflow-x-auto pb-1.5 pt-3 px-1.5">
          <div className="mx-auto w-fit flex items-center">
            {cards.map(renderSingleCard)}
          </div>
        </div>
      );
    }

    // Mode 2: Suit-grouped overlapping fans with suit counters (♠ ♥ ♣ ♦)
    return (
      <div className="w-full flex flex-wrap items-end justify-center gap-x-3 gap-y-2 pt-1 pb-0.5">
        {SUIT_ORDER.map((suit) => {
          const suitCards = cards.filter((c) => c.suit === suit);
          if (suitCards.length === 0) return null;
          const info = SUIT_INFO[suit];
          const isTrumpSuit = contract !== null && contract.trump === suit;

          return (
            <div key={suit} className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums flex items-center gap-1 border ${
                  isTrumpSuit
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-black/35 text-white border-white/15'
                }`}
              >
                <span className={info.isRed && !isTrumpSuit ? 'text-rose-300' : ''}>
                  {info.symbol}
                </span>
                <span>{suitCards.length}</span>
              </div>
              <div className="flex items-center pt-1">
                {suitCards.map(renderSingleCard)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Compact Opponent Badge (NO hidden face-down cards!)
  const renderOpponentBadge = (seat: Seat, compactHorizontal = false) => {
    const cardsCount = hands[seat].length;
    const hasAnnounced = announcedSeats.includes(seat);
    const isActiveTurn = phase === 'PLAYING' && currentTurn === seat;
    const isDec = (declarerInfo?.declarer ?? contract?.declarer) === seat;
    const isDum = dummySeat === seat;
    const isWinner = lastTrickWinner === seat;

    return (
      <div
        className={`flex ${
          compactHorizontal
            ? 'flex-row items-center justify-between gap-2 px-3 py-2'
            : 'flex-col items-center text-center gap-1.5 px-3 py-3'
        } rounded-xl transition-all ${
          isActiveTurn
            ? 'bg-emerald-950/90 ring-2 ring-amber-400 shadow-md'
            : isWinner
              ? 'bg-emerald-900/90 ring-1 ring-emerald-300'
              : 'bg-black/25 border border-white/15'
        }`}
      >
        <div className={compactHorizontal ? 'flex items-center gap-2 min-w-0' : 'flex flex-col items-center gap-0.5'}>
          <span
            className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
              isActiveTurn
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/15 text-emerald-100'
            }`}
          >
            {getSeatInitial(seat, lang)}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white flex items-center gap-1 whitespace-nowrap">
              <span>{getSeatShortLabel(seat, lang)}</span>
              {isActiveTurn && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase leading-none">
                  {pick('Hraje', 'Turn')}
                </span>
              )}
            </div>
            {(isDec || isDum) && (
              <div className="text-[10px] font-semibold text-amber-200">
                {isDec ? pick('Vydražitel', 'Declarer') : 'Dummy'}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold tabular-nums shrink-0">
          {hasAnnounced && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/40 text-amber-200">
              {hcpBySeat[seat]} {pick('b.', 'pt')}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-100">
            {cardsCount} {pick('k.', 'c.')}
          </span>
        </div>
      </div>
    );
  };

  const declarerSeat = contract?.declarer ?? declarerInfo?.declarer ?? null;
  const isNorthTurnByHuman =
    phase === 'PLAYING' && currentTurn === 'north' && contract?.declarer === 'south';
  const isSouthTurnByHuman =
    phase === 'PLAYING' && currentTurn === 'south' && contract?.dummy !== 'south';

  const declarerTricksWon = contract
    ? contract.partnership === 'NS'
      ? tricksWon.NS
      : tricksWon.EW
    : 0;
  const contractMade = contract ? declarerTricksWon >= contract.targetTricks : false;

  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-3">
      {/* Top Info & Mode/Action Panel */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 font-medium tabular-nums">
          <span>
            {pick('Na tahu:', 'Turn:')}{' '}
            <strong className="text-slate-900">
              {phase === 'ANNOUNCING_HCP'
                ? pick('Hlášení bodů', 'Counting HCP')
                : phase === 'CHOOSING_CONTRACT'
                  ? declarerSeat
                    ? getSeatShortLabel(declarerSeat, lang)
                    : '—'
                  : phase === 'FINISHED'
                    ? pick('Konec hry', 'Deal over')
                    : getSeatShortLabel(currentTurn, lang)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>
            {pick('Trumf:', 'Trump:')}{' '}
            <strong
              className={
                contract &&
                (contract.trump === 'hearts' || contract.trump === 'diamonds')
                  ? 'text-rose-600'
                  : 'text-slate-900'
              }
            >
              {contract
                ? `${getTrumpLabel(contract.trump, lang)} (${pick('cíl', 'target')} ${contract.targetTricks})`
                : '—'}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>
            {pick('Zdvihy S+J / V+Z:', 'Tricks N+S / E+W:')}{' '}
            <strong className="text-slate-900">
              {tricksWon.NS} : {tricksWon.EW}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* 2 Display Modes Toggle */}
          <div
            className="grid grid-cols-2 p-0.5 bg-slate-200/80 rounded-lg gap-0.5"
            role="group"
            aria-label={pick('Režim zobrazení stolu', 'Table display mode')}
          >
            <button
              type="button"
              onClick={() => handleViewModeChange('fan')}
              title={pick(
                'Kompaktní překrývající se vějíř karet – ideální pro mobil',
                'Compact overlapping card fan — great for mobile'
              )}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'fan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{pick('Vějíř', 'Fan')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('suits')}
              title={pick(
                'Karty rozdělené po barvách s počítadlem karet v barvě',
                'Cards grouped by suit with suit counts'
              )}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'suits'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{pick('Po barvách', 'By suit')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowHcpBadges((prev) => !prev)}
            title={pick(
              'Zobrazit nebo skrýt nápovědu bodů (A=4, K=3, Q=2, J=1) na kartách',
              'Show or hide HCP badges (A=4, K=3, Q=2, J=1) on cards'
            )}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              showHcpBadges
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {showHcpBadges ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{pick('Body na kartách', 'HCP badges')}</span>
            <span className="sm:hidden">HCP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{pick('Pravidla', 'Rules')}</span>
          </button>

          <button
            type="button"
            onClick={() => startNewDeal()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-transform whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{pick('Nová hra', 'New deal')}</span>
          </button>
        </div>
      </div>

      {/* Green Felt Card Table (#2d5a27 radial felt) */}
      <div
        className="w-full rounded-2xl border-4 border-[#183515] shadow-xl p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 ring-1 ring-inset ring-amber-200/15"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, #377030 0%, #2a5724 62%, #1d3f19 100%)',
        }}
      >
        {/* NORTH (Partner / Dummy) */}
        <div
          className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl transition-all ${
            phase === 'PLAYING' && currentTurn === 'north'
              ? 'bg-black/35 ring-2 ring-amber-400 shadow-lg'
              : 'bg-black/20 border border-white/10'
          }`}
        >
          <div className="w-full flex flex-wrap items-center justify-center gap-1.5 text-xs text-white font-bold">
            <span>{getSeatLabel('north', lang)}</span>
            {announcedSeats.includes('north') && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-300/35 text-amber-200 text-[11px] font-mono tabular-nums">
                {hcpBySeat.north} HCP
              </span>
            )}
            {dummySeat === 'north' && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-100 text-[10px] font-semibold">
                {pick('Tichý hráč (Dummy)', 'Dummy')}
              </span>
            )}
            {isNorthTurnByHuman && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wide">
                {pick('Vyber kartu Dummyho!', 'Pick Dummy’s card!')}
              </span>
            )}
          </div>

          {isNorthOpen ? (
            renderOpenCards('north', 'sm', isNorthTurnByHuman)
          ) : (
            <div className="py-2 px-3 rounded-lg bg-black/20 border border-white/10 text-[11px] font-semibold text-emerald-100/85 tabular-nums">
              {pick(
                `${hands.north.length} karet připraveno k vyložení po hlášení bodů`,
                `${hands.north.length} cards ready to expose after HCP count`
              )}
            </div>
          )}
        </div>

        {/* OPPONENTS (Compact strip in Fan mode OR mobile; flanking columns in Suits desktop mode) */}
        {viewMode === 'fan' && (
          <div className="grid grid-cols-2 gap-2">
            {renderOpponentBadge('west', true)}
            {renderOpponentBadge('east', true)}
          </div>
        )}

        {/* MIDDLE AREA */}
        <div
          className={
            viewMode === 'suits'
              ? 'grid grid-cols-1 md:grid-cols-[140px_1fr_140px] gap-2.5 items-center'
              : 'w-full'
          }
        >
          {/* WEST in Suits mode (Desktop left column, Mobile top 2-col bar) */}
          {viewMode === 'suits' && (
            <>
              <div className="grid grid-cols-2 gap-2 md:hidden">
                {renderOpponentBadge('west', true)}
                {renderOpponentBadge('east', true)}
              </div>
              <div className="hidden md:block">
                {renderOpponentBadge('west', false)}
              </div>
            </>
          )}

          {/* CENTER FELT ARENA */}
          <div className="min-h-[205px] sm:min-h-[230px] rounded-2xl bg-black/25 border border-white/15 ring-1 ring-inset ring-white/5 p-2.5 sm:p-3 flex flex-col items-center justify-center relative">
            {/* Phase 1: HCP Bidding Summary */}
            {phase === 'ANNOUNCING_HCP' && (
              <div className="w-full max-w-sm flex flex-col items-center gap-2.5 text-white text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {pick('Fáze 1 · Oznámení bodů (HCP)', 'Phase 1 · High Card Points (HCP)')}
                </div>
                <div className="grid grid-cols-2 gap-2 w-full text-xs tabular-nums">
                  {(['north', 'east', 'south', 'west'] as Seat[]).map((s) => {
                    const shown = announcedSeats.includes(s);
                    return (
                      <div
                        key={s}
                        className={`px-2.5 py-2 rounded-lg border ${
                          shown
                            ? 'bg-white/15 border-amber-300/60 text-white'
                            : 'bg-black/20 border-white/10 text-white/50'
                        }`}
                      >
                        <div className="font-semibold">{getSeatShortLabel(s, lang)}</div>
                        <div className="text-sm font-extrabold text-amber-300">
                          {shown ? `${hcpBySeat[s]} ${pick('b.', 'HCP')}` : '…'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {declarerInfo && (
                  <div className="text-xs font-semibold text-emerald-100 tabular-nums">
                    {pick('Sever + Jih:', 'North + South:')} <strong>{declarerInfo.nsTotal}</strong> ·{' '}
                    {pick('Východ + Západ:', 'East + West:')} <strong>{declarerInfo.ewTotal}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Phase 2: Contract Selection */}
            {phase === 'CHOOSING_CONTRACT' && declarerInfo && (
              <div className="w-full max-w-md flex flex-col items-center gap-2.5 text-white">
                {declarerInfo.declarer === 'south' ? (
                  <>
                    <div className="text-center">
                      <div className="text-xs font-bold text-amber-300">
                        {pick(
                          'Fáze 2 · Jsi Vydražitel! Vyber trumfy a závazek',
                          'Phase 2 · You are Declarer! Pick trumps & contract'
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-100 mt-0.5 tabular-nums">
                        {pick('Společné body Sever + Jih:', 'Combined North + South:')}{' '}
                        <strong>{declarerInfo.nsTotal} HCP</strong> · {pick('Počet karet:', 'Suit counts:')}{' '}
                        ♠ {nsSuitCounts.spades} · ♥ {nsSuitCounts.hearts} · ♦ {nsSuitCounts.diamonds} · ♣ {nsSuitCounts.clubs}
                      </div>
                    </div>

                    {/* Suit Picker */}
                    <div className="grid grid-cols-5 gap-1.5 w-full">
                      {ALL_SUITS.map((suit) => {
                        const info = SUIT_INFO[suit];
                        const active = selectedTrump === suit;
                        return (
                          <button
                            key={suit}
                            type="button"
                            onClick={() => setSelectedTrump(suit)}
                            className={`py-2 px-1 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center transition-all ${
                              active
                                ? 'bg-white border-amber-400 ring-2 ring-amber-400 shadow-md scale-[1.03]'
                                : 'bg-white/90 border-white/50 hover:bg-white'
                            } ${info.isRed ? 'text-rose-600' : 'text-slate-900'}`}
                          >
                            <span className="text-base leading-none">{info.symbol}</span>
                            <span className="text-[10px] mt-0.5">{getSuitLabel(suit, lang)}</span>
                            <span className="text-[10px] text-slate-500 tabular-nums">
                              ({nsSuitCounts[suit]})
                            </span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedTrump('NT')}
                        className={`py-2 px-1 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center transition-all ${
                          selectedTrump === 'NT'
                            ? 'bg-white border-amber-400 ring-2 ring-amber-400 shadow-md scale-[1.03] text-slate-900'
                            : 'bg-white/90 border-white/50 hover:bg-white text-slate-800'
                        }`}
                      >
                        <span className="text-sm font-black leading-none">NT</span>
                        <span className="text-[10px] mt-0.5">{pick('Bez trumfů', 'No Trump')}</span>
                        <span className="text-[10px] text-slate-500">—</span>
                      </button>
                    </div>

                    {/* Level Picker */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedLevel('part_score')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all tabular-nums ${
                          selectedLevel === 'part_score'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : 'bg-emerald-950/60 text-white border-white/20 hover:bg-emerald-950/80'
                        }`}
                      >
                        {pick('Částečná hra (7 zdvihů)', 'Part-score (7 tricks)')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLevel('game')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all tabular-nums ${
                          selectedLevel === 'game'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : 'bg-emerald-950/60 text-white border-white/20 hover:bg-emerald-950/80'
                        }`}
                      >
                        {pick(
                          `Hra (${getRequiredTricks(selectedTrump, 'game')} zdvihů)`,
                          `Game (${getRequiredTricks(selectedTrump, 'game')} tricks)`
                        )}
                      </button>
                    </div>

                    {southRecommendation && (
                      <p className="text-[11px] text-amber-200 text-center leading-snug">
                        {pick('Rada trenéra:', 'Coach tip:')}{' '}
                        {isEn ? southRecommendation.reasonEn : southRecommendation.reasonCs}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleConfirmSouthContract}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-transform"
                    >
                      {pick('Potvrdit závazek a začít hrát', 'Confirm contract & start play')}
                    </button>
                  </>
                ) : (
                  <div className="text-center flex flex-col gap-2 py-4">
                    <div className="text-xs font-bold text-amber-300">
                      {pick(
                        `Fáze 2 · ${getSeatShortLabel(declarerInfo.declarer, lang)} volí závazek…`,
                        `Phase 2 · ${getSeatShortLabel(declarerInfo.declarer, lang)} is choosing a contract…`
                      )}
                    </div>
                    <p className="text-xs text-emerald-100 leading-relaxed max-w-xs">
                      {aiContractReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Phase 3: Active 4-card Trick Cross */}
            {(phase === 'PLAYING' || phase === 'TRICK_RESOLVE') && (
              <div className="w-full max-w-[260px] grid grid-cols-3 grid-rows-3 gap-1.5 items-center justify-items-center py-0.5">
                {/* North trick slot */}
                <div className="col-start-2 row-start-1 min-h-[72px] sm:min-h-[84px] flex items-center justify-center">
                  {trickCardBySeat.north ? (
                    <MinibridgeCard
                      card={trickCardBySeat.north}
                      size="trick"
                      isTrump={
                        contract !== null &&
                        contract.trump !== 'NT' &&
                        trickCardBySeat.north.suit === contract.trump
                      }
                      isWinning={leadingTrickSeat === 'north'}
                    />
                  ) : (
                    <div className="w-12 h-[70px] sm:w-14 sm:h-[82px] rounded-xl border border-dashed border-white/25 bg-black/15 flex items-center justify-center text-[11px] text-white/45 font-bold">
                      {getSeatInitial('north', lang)}
                    </div>
                  )}
                </div>

                {/* West trick slot */}
                <div className="col-start-1 row-start-2 min-h-[72px] sm:min-h-[84px] flex items-center justify-center">
                  {trickCardBySeat.west ? (
                    <MinibridgeCard
                      card={trickCardBySeat.west}
                      size="trick"
                      isTrump={
                        contract !== null &&
                        contract.trump !== 'NT' &&
                        trickCardBySeat.west.suit === contract.trump
                      }
                      isWinning={leadingTrickSeat === 'west'}
                    />
                  ) : (
                    <div className="w-12 h-[70px] sm:w-14 sm:h-[82px] rounded-xl border border-dashed border-white/25 bg-black/15 flex items-center justify-center text-[11px] text-white/45 font-bold">
                      {getSeatInitial('west', lang)}
                    </div>
                  )}
                </div>

                {/* Center trick & trump hub */}
                <div className="col-start-2 row-start-2 flex flex-col items-center justify-center text-center px-2 py-1.5 rounded-xl bg-black/30 border border-white/15">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-100/75 font-bold">
                    {pick('Zdvih', 'Trick')}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums leading-tight">
                    {tricksWon.NS + tricksWon.EW + 1}/13
                  </span>
                  {contract && (
                    <span className="text-[10px] font-bold text-white/90 mt-0.5 leading-none">
                      {contract.trump === 'NT'
                        ? 'NT'
                        : SUIT_INFO[contract.trump].symbol}
                    </span>
                  )}
                </div>

                {/* East trick slot */}
                <div className="col-start-3 row-start-2 min-h-[72px] sm:min-h-[84px] flex items-center justify-center">
                  {trickCardBySeat.east ? (
                    <MinibridgeCard
                      card={trickCardBySeat.east}
                      size="trick"
                      isTrump={
                        contract !== null &&
                        contract.trump !== 'NT' &&
                        trickCardBySeat.east.suit === contract.trump
                      }
                      isWinning={leadingTrickSeat === 'east'}
                    />
                  ) : (
                    <div className="w-12 h-[70px] sm:w-14 sm:h-[82px] rounded-xl border border-dashed border-white/25 bg-black/15 flex items-center justify-center text-[11px] text-white/45 font-bold">
                      {getSeatInitial('east', lang)}
                    </div>
                  )}
                </div>

                {/* South trick slot */}
                <div className="col-start-2 row-start-3 min-h-[72px] sm:min-h-[84px] flex items-center justify-center">
                  {trickCardBySeat.south ? (
                    <MinibridgeCard
                      card={trickCardBySeat.south}
                      size="trick"
                      isTrump={
                        contract !== null &&
                        contract.trump !== 'NT' &&
                        trickCardBySeat.south.suit === contract.trump
                      }
                      isWinning={leadingTrickSeat === 'south'}
                    />
                  ) : (
                    <div className="w-12 h-[70px] sm:w-14 sm:h-[82px] rounded-xl border border-dashed border-white/25 bg-black/15 flex items-center justify-center text-[11px] text-white/45 font-bold">
                      {getSeatInitial('south', lang)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase 4: Final Evaluation */}
            {phase === 'FINISHED' && contract && (
              <div className="w-full max-w-sm bg-white text-slate-900 rounded-2xl p-4 shadow-xl text-center flex flex-col items-center gap-2.5">
                <div
                  className={`flex items-center gap-1.5 text-base font-extrabold ${
                    contractMade ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {contractMade ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>
                    {contractMade ? pick('Splněno!', 'Contract made!') : pick('Nesplněno', 'Contract down')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed tabular-nums">
                  {isEn ? (
                    <>
                      Declarer <strong>{getSeatShortLabel(contract.declarer, lang)}</strong> (
                      {contract.partnership === 'NS' ? 'North + South' : 'East + West'}) played{' '}
                      <strong>{getTrumpLabel(contract.trump, lang)}</strong> and won{' '}
                      <strong>{declarerTricksWon}</strong> of{' '}
                      <strong>{contract.targetTricks}</strong> required tricks.
                    </>
                  ) : (
                    <>
                      Vydražitel <strong>{getSeatShortLabel(contract.declarer, lang)}</strong> (
                      {contract.partnership === 'NS' ? 'Sever + Jih' : 'Východ + Západ'}) hrál{' '}
                      <strong>{getTrumpLabel(contract.trump, lang)}</strong> a získal{' '}
                      <strong>{declarerTricksWon}</strong> ze{' '}
                      <strong>{contract.targetTricks}</strong> potřebných zdvihů.
                    </>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-800 bg-slate-100 rounded-lg px-3 py-1.5 tabular-nums">
                  {pick(
                    `Celkové zdvihy · Sever + Jih: ${tricksWon.NS} · Východ + Západ: ${tricksWon.EW}`,
                    `Total tricks · North + South: ${tricksWon.NS} · East + West: ${tricksWon.EW}`
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startNewDeal()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2d5a27] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-colors active:scale-95"
                >
                  {pick('Nová hra', 'New deal')}
                </button>

                <SwitchGameStrip currentGame="minibridge" onSelectGame={onSelectGame} />
              </div>
            )}
          </div>

          {/* EAST in Suits desktop mode */}
          {viewMode === 'suits' && (
            <div className="hidden md:block">
              {renderOpponentBadge('east', false)}
            </div>
          )}
        </div>

        {/* SOUTH (Human Player) */}
        <div
          className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all ${
            isSouthTurnByHuman
              ? 'bg-black/40 ring-2 ring-amber-400 shadow-lg'
              : 'bg-black/25 border border-white/10'
          }`}
        >
          <div className="w-full flex flex-wrap items-center justify-center gap-1.5 text-xs text-white font-bold">
            <span>{getSeatLabel('south', lang)}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-300/35 text-amber-200 text-[11px] font-mono tabular-nums">
              {hcpBySeat.south} HCP
            </span>
            {declarerSeat === 'south' && (
              <span className="px-1.5 py-0.5 rounded bg-white/15 text-amber-200 text-[10px] font-semibold">
                {pick('Vydražitel', 'Declarer')}
              </span>
            )}
            {isSouthTurnByHuman && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wide">
                {pick('Jsi na tahu!', 'Your turn!')}
              </span>
            )}
          </div>

          {renderOpenCards('south', 'md', isSouthTurnByHuman)}
        </div>
      </div>

      {/* Rule Warning & Teaching Prompt below card table (no layout shift on table) */}
      {ruleWarning && (
        <div
          role="alert"
          className="w-full px-3 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{ruleWarning}</span>
        </div>
      )}

      <div className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>{guideText}</span>
      </div>

      <MinibridgeRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
