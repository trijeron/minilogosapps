export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

// Numeric rank 2..14 where 11=J, 12=Q, 13=K, 14=A
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Seat = 'north' | 'east' | 'south' | 'west';
export type Partnership = 'NS' | 'EW';
export type TrumpSuit = Suit | 'NT';
export type ContractLevel = 'part_score' | 'game';

export type BridgePhase =
  | 'ANNOUNCING_HCP'
  | 'CHOOSING_CONTRACT'
  | 'PLAYING'
  | 'TRICK_RESOLVE'
  | 'FINISHED';

export interface Contract {
  declarer: Seat;
  dummy: Seat;
  partnership: Partnership;
  trump: TrumpSuit;
  level: ContractLevel;
  targetTricks: number;
}

export interface TrickCard {
  seat: Seat;
  card: Card;
}

export interface HcpAnnouncement {
  seat: Seat;
  hcp: number;
}

export type MinibridgeViewMode = 'fan' | 'suits';

