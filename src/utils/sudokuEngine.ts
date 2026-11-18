import { Difficulty } from '../types/sudoku';

export const BOARD_SIZE = 6;
export const BLOCK_ROWS = 2;
export const BLOCK_COLS = 3;
export const TOTAL_CELLS = 36;

export function getBlockIndex(row: number, col: number): number {
  return Math.floor(row / BLOCK_ROWS) * 2 + Math.floor(col / BLOCK_COLS);
}

export function isValidPlacement(
  grid: number[],
  row: number,
  col: number,
  num: number
): boolean {
  if (num === 0) return true;

  // Check row
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c !== col && grid[row * BOARD_SIZE + c] === num) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (r !== row && grid[r * BOARD_SIZE + col] === num) {
      return false;
    }
  }

  // Check 2x3 block
  const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
  const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;

  for (let r = startRow; r < startRow + BLOCK_ROWS; r++) {
    for (let c = startCol; c < startCol + BLOCK_COLS; c++) {
      if ((r !== row || c !== col) && grid[r * BOARD_SIZE + c] === num) {
        return false;
      }
    }
  }

  return true;
}

// Find an empty cell with Minimum Remaining Values (MRV) for blazing fast solving
function findBestEmptyCell(grid: number[]): { index: number; candidates: number[] } | null {
  let minCandidates = 7;
  let bestCell: { index: number; candidates: number[] } | null = null;

  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (grid[i] === 0) {
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      const candidates: number[] = [];

      for (let num = 1; num <= 6; num++) {
        if (isValidPlacement(grid, row, col, num)) {
          candidates.push(num);
        }
      }

      if (candidates.length === 0) {
        return { index: i, candidates: [] }; // Dead end
      }

      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        bestCell = { index: i, candidates };
        if (minCandidates === 1) break;
      }
    }
  }

  return bestCell;
}

export function countSolutions(grid: number[], limit = 2): number {
  const best = findBestEmptyCell(grid);
  if (!best) return 1;
  if (best.candidates.length === 0) return 0;

  let solutions = 0;
  const row = Math.floor(best.index / BOARD_SIZE);
  const col = best.index % BOARD_SIZE;

  for (const num of best.candidates) {
    grid[best.index] = num;
    solutions += countSolutions(grid, limit - solutions);
    grid[best.index] = 0;

    if (solutions >= limit) {
      break;
    }
  }

  return solutions;
}

function solveBoardInternal(grid: number[], randomize = false): boolean {
  const best = findBestEmptyCell(grid);
  if (!best) return true; // All filled
  if (best.candidates.length === 0) return false;

  let candidates = [...best.candidates];
  if (randomize) {
    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
  }

  for (const num of candidates) {
    grid[best.index] = num;
    if (solveBoardInternal(grid, randomize)) {
      return true;
    }
    grid[best.index] = 0;
  }

  return false;
}

export function solveSudoku(grid: number[]): number[] | null {
  const copy = [...grid];
  if (solveBoardInternal(copy, false)) {
    return copy;
  }
  return null;
}

export function generateFullSolution(): number[] {
  const grid = new Array(TOTAL_CELLS).fill(0);
  solveBoardInternal(grid, true);
  return grid;
}

export interface GeneratedPuzzle {
  puzzle: number[];
  solution: number[];
  clueCount: number;
}

export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const targetClues = {
    easy: 21,    // 20-22 clues: very gentle, ideal for fast casual solving
    medium: 17,  // 16-18 clues: requires standard deduction
    hard: 13,    // 12-14 clues: challenging, pencil marks helpful
  }[difficulty];

  const solution = generateFullSolution();
  const puzzle = [...solution];

  // Randomize removal order
  const indices: number[] = Array.from({ length: TOTAL_CELLS }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  let currentClues = TOTAL_CELLS;

  for (const idx of indices) {
    if (currentClues <= targetClues) {
      break;
    }

    const backup = puzzle[idx];
    puzzle[idx] = 0;

    // Check if puzzle still has exactly 1 unique solution
    const testGrid = [...puzzle];
    const solutions = countSolutions(testGrid, 2);

    if (solutions !== 1) {
      // Revert if removal creates multiple solutions
      puzzle[idx] = backup;
    } else {
      currentClues--;
    }
  }

  return {
    puzzle,
    solution,
    clueCount: currentClues,
  };
}

// Find all cells that have direct duplicates in row, column, or block
export function findConflicts(grid: number[]): Set<number> {
  const conflicts = new Set<number>();

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const val = grid[i];
    if (val === 0) continue;

    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;

    // Check same row
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx2 = row * BOARD_SIZE + c;
      if (idx2 !== i && grid[idx2] === val) {
        conflicts.add(i);
        conflicts.add(idx2);
      }
    }

    // Check same col
    for (let r = 0; r < BOARD_SIZE; r++) {
      const idx2 = r * BOARD_SIZE + col;
      if (idx2 !== i && grid[idx2] === val) {
        conflicts.add(i);
        conflicts.add(idx2);
      }
    }

    // Check same 2x3 block
    const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;

    for (let r = startRow; r < startRow + BLOCK_ROWS; r++) {
      for (let c = startCol; c < startCol + BLOCK_COLS; c++) {
        const idx2 = r * BOARD_SIZE + c;
        if (idx2 !== i && grid[idx2] === val) {
          conflicts.add(i);
          conflicts.add(idx2);
        }
      }
    }
  }

  return conflicts;
}

// Check non-empty cells against actual solution
export function findIncorrectCells(grid: number[], solution: number[]): Set<number> {
  const errors = new Set<number>();
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (grid[i] !== 0 && grid[i] !== solution[i]) {
      errors.add(i);
    }
  }
  return errors;
}

// Count remaining digits available to be placed (from 6 of each digit)
export function getRemainingCounts(grid: number[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6 };
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const val = grid[i];
    if (val >= 1 && val <= 6) {
      counts[val] = Math.max(0, counts[val] - 1);
    }
  }
  return counts;
}

// Check if game is completely solved
export function isBoardCompleted(grid: number[], solution?: number[]): boolean {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (grid[i] === 0) return false;
  }
  if (solution && solution.length === TOTAL_CELLS) {
    let match = true;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (grid[i] !== solution[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return findConflicts(grid).size === 0;
}
