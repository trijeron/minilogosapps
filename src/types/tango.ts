import { Difficulty } from './sudoku';

export type TangoSymbol = 0 | 1 | 2; // 0 = empty, 1 = sun (☀️), 2 = moon (🌙)
export type EdgeType = 'none' | 'equal' | 'opposite'; // '=' or 'x'

export interface EdgeClue {
  index1: number;
  index2: number;
  type: 'equal' | 'opposite';
}

export interface TangoPuzzle {
  solution: TangoSymbol[]; // length 36 (only 1 or 2)
  initialBoard: TangoSymbol[]; // length 36 (0, 1, or 2)
  horizontalEdges: EdgeType[]; // length 30 (6 rows * 5 horizontal gaps)
  verticalEdges: EdgeType[]; // length 30 (5 vertical gaps * 6 columns)
  given: boolean[]; // length 36
}

export interface TangoState {
  difficulty: Difficulty;
  puzzle: TangoSymbol[];
  solution: TangoSymbol[];
  board: TangoSymbol[];
  given: boolean[];
  hintCells: number[];
  horizontalEdges: EdgeType[];
  verticalEdges: EdgeType[];
  hintsLeft: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  realTimeCheck: boolean;
}

export interface TangoMoveRecord {
  board: TangoSymbol[];
  selectedCell: number | null;
}
