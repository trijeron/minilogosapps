import {
  Card,
  Contract,
  ContractLevel,
  Partnership,
  Rank,
  Seat,
  Suit,
  TrickCard,
  TrumpSuit,
} from '../types/minibridge';
import { Language } from '../i18n/LanguageContext';

// Visual alternating order (black, red, black, red) helps children tell suits apart easily
export const SUIT_ORDER: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
export const ALL_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const SEATS_CLOCKWISE: Seat[] = ['north', 'east', 'south', 'west'];

export const SUIT_INFO: Record<
  Suit,
  { symbol: string; labelCs: string; labelEn: string; isRed: boolean; shortCs: string; shortEn: string }
> = {
  spades: { symbol: '♠', labelCs: 'Piky', labelEn: 'Spades', shortCs: 'Piky', shortEn: 'Spades', isRed: false },
  hearts: { symbol: '♥', labelCs: 'Srdce', labelEn: 'Hearts', shortCs: 'Srdce', shortEn: 'Hearts', isRed: true },
  diamonds: { symbol: '♦', labelCs: 'Kára', labelEn: 'Diamonds', shortCs: 'Kára', shortEn: 'Diamonds', isRed: true },
  clubs: { symbol: '♣', labelCs: 'Trefy', labelEn: 'Clubs', shortCs: 'Trefy', shortEn: 'Clubs', isRed: false },
};

export const SEAT_LABELS: Record<Seat, string> = {
  north: 'Sever (Partner)',
  east: 'Východ (AI)',
  south: 'Jih (Ty)',
  west: 'Západ (AI)',
};

export const SEAT_LABELS_EN: Record<Seat, string> = {
  north: 'North (Partner)',
  east: 'East (AI)',
  south: 'South (You)',
  west: 'West (AI)',
};

export const SEAT_SHORT_LABELS: Record<Seat, string> = {
  north: 'Sever',
  east: 'Východ',
  south: 'Jih',
  west: 'Západ',
};

export const SEAT_SHORT_LABELS_EN: Record<Seat, string> = {
  north: 'North',
  east: 'East',
  south: 'South',
  west: 'West',
};

export function getSeatLabel(seat: Seat, lang: Language = 'cs'): string {
  return lang === 'en' ? SEAT_LABELS_EN[seat] : SEAT_LABELS[seat];
}

export function getSeatShortLabel(seat: Seat, lang: Language = 'cs'): string {
  return lang === 'en' ? SEAT_SHORT_LABELS_EN[seat] : SEAT_SHORT_LABELS[seat];
}

export function getSeatInitial(seat: Seat, lang: Language = 'cs'): string {
  if (lang === 'en') {
    return seat === 'north' ? 'N' : seat === 'east' ? 'E' : seat === 'south' ? 'S' : 'W';
  }
  return seat === 'north' ? 'S' : seat === 'east' ? 'V' : seat === 'south' ? 'J' : 'Z';
}

export function getSuitLabel(suit: Suit, lang: Language = 'cs'): string {
  return lang === 'en' ? SUIT_INFO[suit].labelEn : SUIT_INFO[suit].labelCs;
}

export function getRankLabel(rank: Rank): string {
  switch (rank) {
    case 14:
      return 'A';
    case 13:
      return 'K';
    case 12:
      return 'Q';
    case 11:
      return 'J';
    default:
      return String(rank);
  }
}

export function getCardHcp(card: Card): number {
  if (card.rank === 14) return 4;
  if (card.rank === 13) return 3;
  if (card.rank === 12) return 2;
  if (card.rank === 11) return 1;
  return 0;
}

export function calculateHandHcp(hand: Card[]): number {
  return hand.reduce((sum, card) => sum + getCardHcp(card), 0);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (let r = 2; r <= 14; r++) {
      const rank = r as Rank;
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return b.rank - a.rank;
  });
}

export function dealHands(): Record<Seat, Card[]> {
  const deck = shuffleDeck(createDeck());
  return {
    north: sortHand(deck.slice(0, 13)),
    east: sortHand(deck.slice(13, 26)),
    south: sortHand(deck.slice(26, 39)),
    west: sortHand(deck.slice(39, 52)),
  };
}

// Re-deal whenever NS or South lacks enough HCP so the human player (South) is always Declarer
export function dealHandsForPlayerDeclarer(): Record<Seat, Card[]> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const candidate = dealHands();
    const hcp: Record<Seat, number> = {
      north: calculateHandHcp(candidate.north),
      east: calculateHandHcp(candidate.east),
      south: calculateHandHcp(candidate.south),
      west: calculateHandHcp(candidate.west),
    };
    const info = determineDeclarerFromHcp(hcp);
    if (info.declarer === 'south') {
      return candidate;
    }
  }

  // Deterministic fallback from one final random deal by assigning the winning seat to South
  const fallback = dealHands();
  const hcp: Record<Seat, number> = {
    north: calculateHandHcp(fallback.north),
    east: calculateHandHcp(fallback.east),
    south: calculateHandHcp(fallback.south),
    west: calculateHandHcp(fallback.west),
  };
  const info = determineDeclarerFromHcp(hcp);
  if (info.declarer === 'south') return fallback;

  const winningDeclarer = info.declarer;
  const winningDummy = info.dummy;
  const [loseSeatA, loseSeatB]: [Seat, Seat] =
    info.partnership === 'NS' ? ['east', 'west'] : ['north', 'south'];

  return {
    south: fallback[winningDeclarer],
    north: fallback[winningDummy],
    east: fallback[loseSeatA],
    west: fallback[loseSeatB],
  };
}

export function getNextSeat(seat: Seat): Seat {
  const idx = SEATS_CLOCKWISE.indexOf(seat);
  return SEATS_CLOCKWISE[(idx + 1) % 4];
}

export function getPartner(seat: Seat): Seat {
  switch (seat) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

export function getPartnership(seat: Seat): Partnership {
  return seat === 'north' || seat === 'south' ? 'NS' : 'EW';
}

export function determineDeclarerFromHcp(
  hcpBySeat: Record<Seat, number>
): {
  partnership: Partnership;
  declarer: Seat;
  dummy: Seat;
  nsTotal: number;
  ewTotal: number;
  isTie20: boolean;
} {
  const nsTotal = hcpBySeat.north + hcpBySeat.south;
  const ewTotal = hcpBySeat.east + hcpBySeat.west;
  const isTie20 = nsTotal === 20 && ewTotal === 20;

  // Simplified child-friendly rule: NS wins 20-20 ties
  const partnership: Partnership = nsTotal >= ewTotal ? 'NS' : 'EW';

  let declarer: Seat;
  if (partnership === 'NS') {
    // South gets ties inside NS so the child gets to declare more often
    declarer = hcpBySeat.south >= hcpBySeat.north ? 'south' : 'north';
  } else {
    declarer = hcpBySeat.east >= hcpBySeat.west ? 'east' : 'west';
  }

  return {
    partnership,
    declarer,
    dummy: getPartner(declarer),
    nsTotal,
    ewTotal,
    isTie20,
  };
}

export function getRequiredTricks(trump: TrumpSuit, level: ContractLevel): number {
  if (level === 'part_score') return 7;
  if (trump === 'NT') return 9;
  if (trump === 'spades' || trump === 'hearts') return 10;
  return 11; // diamonds or clubs
}

export function getTrumpLabel(trump: TrumpSuit, lang: Language = 'cs'): string {
  if (trump === 'NT') return lang === 'en' ? 'No Trump (NT)' : 'Bez trumfů (NT)';
  return `${SUIT_INFO[trump].symbol} ${getSuitLabel(trump, lang)}`;
}

export function getTrumpShortLabel(trump: TrumpSuit, lang: Language = 'cs'): string {
  if (trump === 'NT') return 'NT';
  return `${SUIT_INFO[trump].symbol} ${getSuitLabel(trump, lang)}`;
}

export function getCombinedSuitCounts(handA: Card[], handB: Card[]): Record<Suit, number> {
  const counts: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };
  for (const c of handA) counts[c.suit]++;
  for (const c of handB) counts[c.suit]++;
  return counts;
}

export function recommendContract(
  declarerHand: Card[],
  dummyHand: Card[],
  combinedHcp: number
): { trump: TrumpSuit; level: ContractLevel; reasonCs: string; reasonEn: string } {
  const counts = getCombinedSuitCounts(declarerHand, dummyHand);
  // Prefer major suits (spades, hearts) then minors, picking the longest fit >= 8 cards
  const candidateOrder: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  let bestSuit: Suit | null = null;
  let bestCount = 7;

  for (const suit of candidateOrder) {
    if (counts[suit] > bestCount) {
      bestCount = counts[suit];
      bestSuit = suit;
    }
  }

  const trump: TrumpSuit = bestSuit ?? 'NT';
  const level: ContractLevel = combinedHcp >= 25 ? 'game' : 'part_score';

  const trumpText =
    bestSuit !== null
      ? `Společně máte ${bestCount} karet v barvě ${SUIT_INFO[bestSuit].symbol} ${SUIT_INFO[bestSuit].labelCs} (alespoň 8 = dobrý trumf).`
      : 'V žádné barvě nemáte alespoň 8 karet, proto je nejlepší hrát Bez trumfů.';
  const levelText =
    combinedHcp >= 25
      ? `Dohromady máte ${combinedHcp} bodů (25+), takže můžete hlásit Hru.`
      : `Dohromady máte ${combinedHcp} bodů (méně než 25), proto je bezpečnější Částečná hra.`;

  const trumpTextEn =
    bestSuit !== null
      ? `Together you hold ${bestCount} cards in ${SUIT_INFO[bestSuit].symbol} ${SUIT_INFO[bestSuit].labelEn} (8+ = a strong trump fit).`
      : 'You do not have an 8-card fit in any suit, so No Trump is best.';
  const levelTextEn =
    combinedHcp >= 25
      ? `With ${combinedHcp} combined points (25+), you can bid Game.`
      : `With ${combinedHcp} combined points (under 25), Part Score is safer.`;

  return {
    trump,
    level,
    reasonCs: `${trumpText} ${levelText}`,
    reasonEn: `${trumpTextEn} ${levelTextEn}`,
  };
}

export function createAiContract(
  declarer: Seat,
  declarerHand: Card[],
  dummyHand: Card[],
  combinedHcp: number
): Contract {
  const rec = recommendContract(declarerHand, dummyHand, combinedHcp);
  return {
    declarer,
    dummy: getPartner(declarer),
    partnership: getPartnership(declarer),
    trump: rec.trump,
    level: rec.level,
    targetTricks: getRequiredTricks(rec.trump, rec.level),
  };
}

export function getLegalCards(hand: Card[], currentTrick: TrickCard[]): Card[] {
  if (currentTrick.length === 0) return hand;
  const ledSuit = currentTrick[0].card.suit;
  const matching = hand.filter((c) => c.suit === ledSuit);
  return matching.length > 0 ? matching : hand;
}

export function isLegalMove(
  card: Card,
  hand: Card[],
  currentTrick: TrickCard[]
): boolean {
  const legal = getLegalCards(hand, currentTrick);
  return legal.some((c) => c.id === card.id);
}

export function evaluateTrickWinner(
  trick: TrickCard[],
  trump: TrumpSuit
): TrickCard {
  const ledSuit = trick[0].card.suit;
  let winner = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const contender = trick[i];
    const wCard = winner.card;
    const cCard = contender.card;

    const wIsTrump = trump !== 'NT' && wCard.suit === trump;
    const cIsTrump = trump !== 'NT' && cCard.suit === trump;

    if (cIsTrump && !wIsTrump) {
      winner = contender;
    } else if (cIsTrump && wIsTrump) {
      if (cCard.rank > wCard.rank) winner = contender;
    } else if (!wIsTrump && cCard.suit === ledSuit && wCard.suit === ledSuit) {
      if (cCard.rank > wCard.rank) winner = contender;
    }
  }

  return winner;
}

function compareCardStrength(
  a: Card,
  b: Card,
  ledSuit: Suit,
  trump: TrumpSuit
): number {
  const aTrump = trump !== 'NT' && a.suit === trump;
  const bTrump = trump !== 'NT' && b.suit === trump;
  if (aTrump !== bTrump) return aTrump ? 1 : -1;
  if (aTrump && bTrump) return a.rank - b.rank;

  const aLed = a.suit === ledSuit;
  const bLed = b.suit === ledSuit;
  if (aLed !== bLed) return aLed ? 1 : -1;
  if (aLed && bLed) return a.rank - b.rank;
  return 0;
}

export function chooseAiCard(
  seat: Seat,
  hand: Card[],
  currentTrick: TrickCard[],
  trump: TrumpSuit
): Card {
  const legal = getLegalCards(hand, currentTrick);
  if (legal.length === 1) return legal[0];

  // Leading a new trick
  if (currentTrick.length === 0) {
    // Prefer Aces or highest card of longest non-trump suit (or longest suit)
    const suitCounts: Record<Suit, number> = {
      spades: 0,
      hearts: 0,
      diamonds: 0,
      clubs: 0,
    };
    for (const c of legal) suitCounts[c.suit]++;

    const sortedLead = [...legal].sort((a, b) => {
      // Cash Aces outside trump if available
      if (a.rank === 14 && b.rank !== 14) return -1;
      if (b.rank === 14 && a.rank !== 14) return 1;
      const lenDiff = suitCounts[b.suit] - suitCounts[a.suit];
      if (lenDiff !== 0) return lenDiff;
      return b.rank - a.rank;
    });
    return sortedLead[0];
  }

  const ledSuit = currentTrick[0].card.suit;
  const currentWinner = evaluateTrickWinner(currentTrick, trump);
  const partnerIsWinning =
    getPartnership(currentWinner.seat) === getPartnership(seat);

  // Sort legal cards lowest rank first (non-trump preferred for low dumps)
  const lowestFirst = [...legal].sort((a, b) => {
    const aTrump = trump !== 'NT' && a.suit === trump ? 1 : 0;
    const bTrump = trump !== 'NT' && b.suit === trump ? 1 : 0;
    if (aTrump !== bTrump) return aTrump - bTrump;
    return a.rank - b.rank;
  });

  if (partnerIsWinning) {
    return lowestFirst[0];
  }

  // Find cards that currently beat the winning card
  const winningOptions = legal
    .filter((c) => compareCardStrength(c, currentWinner.card, ledSuit, trump) > 0)
    .sort((a, b) => compareCardStrength(a, b, ledSuit, trump));

  if (winningOptions.length > 0) {
    // Play cheapest winning card (save trumps if led-suit winner exists because compareCardStrength orders led-suit below trump)
    return winningOptions[0];
  }

  // Cannot win -> throw lowest card
  return lowestFirst[0];
}
