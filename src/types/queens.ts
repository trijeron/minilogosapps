import { Difficulty } from './sudoku';

export type QueensCellState = 0 | 1 | 2; // 0 = empty, 1 = cross (X), 2 = queen / crown (👑)
export type QueensBoardSize = 6 | 8 | 10;

export interface QueensPuzzle {
  size: QueensBoardSize; // 6, 8, or 10
  regions: number[]; // length size * size, values 0..(size - 1)
  queenPositions: number[]; // indices of the N queens in solution
}

export interface QueensState {
  difficulty: Difficulty;
  size: QueensBoardSize;
  regions: number[];
  solutionQueens: number[];
  board: QueensCellState[];
  hintCells: number[];
  hintsLeft: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  realTimeCheck: boolean;
  autoCross: boolean;
}

export interface QueensMoveRecord {
  board: QueensCellState[];
  selectedCell: number | null;
}
