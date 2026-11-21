export type MahjongLayoutId = 'pyramid' | 'bridge' | 'turtle';

export type MahjongTheme = 'comic' | 'fairytale' | 'classic';

export type MahjongSuit = 'dots' | 'bamboo' | 'chars' | 'winds' | 'dragons' | 'flowers' | 'seasons';

export interface MahjongTileDef {
  kindId: string;
  matchGroup: string; // identical kindId for normal tiles; 'flower' / 'season' for bonus tiles
  suit: MahjongSuit;
  rank: number; // 1..9 for numbered suits, 1..4 for winds/flowers/seasons, 1..3 for dragons
  labelCs: string;
  labelEn?: string;
  symbol: string;
  cornerText: string;
  cornerTextEn?: string;
}

export interface MahjongTile {
  uid: number;
  x: number; // half-tile grid units
  y: number; // half-tile grid units
  z: number; // layer 0..4
  def: MahjongTileDef;
  removed: boolean;
}

export interface MahjongMove {
  uidA: number;
  uidB: number;
}

export type MahjongBestTimes = Record<MahjongLayoutId, number | null>;

export interface MahjongState {
  layout: MahjongLayoutId;
  tiles: MahjongTile[];
  history: MahjongMove[];
  hintsLeft: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
}
