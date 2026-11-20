export type ZipBoardSize = 5 | 6 | 7;
export type ZipMode = 'classic' | 'simple';

export interface ZipPuzzle {
  size: ZipBoardSize;
  mode?: ZipMode;
  /** 0 = empty cell, 1..maxNumber = checkpoint numbers */
  numbers: number[];
  maxNumber: number;
  /** Walls between (r, c) and (r, c + 1): length size * (size - 1) */
  horizontalWalls: boolean[];
  /** Walls between (r, c) and (r + 1, c): length (size - 1) * size */
  verticalWalls: boolean[];
  /** Guaranteed valid solution path (Hamiltonian in classic mode) */
  solutionPath: number[];
}

export interface ZipState {
  size: ZipBoardSize;
  mode?: ZipMode;
  numbers: number[];
  maxNumber: number;
  horizontalWalls: boolean[];
  verticalWalls: boolean[];
  solutionPath: number[];
  /** Current player path starting at cell of #1 */
  path: number[];
  elapsedSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  hintsUsed: number;
}

export interface ZipBestTimes {
  5: number | null;
  6: number | null;
  7: number | null;
}
