export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SudokuState {
  difficulty: Difficulty;
  puzzle: number[]; // 36 elements: 0 for empty, 1-6 for given clues
  solution: number[]; // 36 elements: solved 1-6
  board: number[]; // 36 elements: current state
  given: boolean[]; // 36 elements: true if initially given
  hintCells: number[]; // indices of cells filled using hints
  notes: number[][]; // 36 elements: list of active pencil marks (1-6)
  hintsLeft: number; // 0 to 3
  elapsedSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  realTimeCheck: boolean; // whether real-time conflict/error highlight is active
}

export interface BestTimes {
  easy: number | null;
  medium: number | null;
  hard: number | null;
}

export interface MoveRecord {
  board: number[];
  notes: number[][];
  selectedCell: number | null;
}
