import { Difficulty } from '../types/sudoku';
import { QueensBoardSize, QueensCellState, QueensPuzzle } from '../types/queens';

export const REGION_COLORS = [
  { bg: 'bg-indigo-100/95', border: 'border-indigo-400', hex: '#e0e7ff', name: 'Modrá' },
  { bg: 'bg-emerald-100/95', border: 'border-emerald-400', hex: '#d1fae5', name: 'Zelená' },
  { bg: 'bg-amber-100/95', border: 'border-amber-400', hex: '#fef3c7', name: 'Žlutá' },
  { bg: 'bg-rose-100/95', border: 'border-rose-400', hex: '#ffe4e6', name: 'Růžová' },
  { bg: 'bg-purple-100/95', border: 'border-purple-400', hex: '#ede9fe', name: 'Fialová' },
  { bg: 'bg-cyan-100/95', border: 'border-cyan-400', hex: '#cffafe', name: 'Tyrkysová' },
  { bg: 'bg-teal-100/95', border: 'border-teal-400', hex: '#ccfbf1', name: 'Mátová' },
  { bg: 'bg-orange-100/95', border: 'border-orange-400', hex: '#ffedd5', name: 'Broskvová' },
  { bg: 'bg-lime-100/95', border: 'border-lime-400', hex: '#ecfccb', name: 'Limetková' },
  { bg: 'bg-pink-100/95', border: 'border-pink-400', hex: '#fce7f3', name: 'Malinová' },
];

// Find a valid non-touching permutation of size N
function findValidQueensPlacement(size: number): number[] | null {
  const perm: number[] = [];
  const used = new Array(size).fill(false);

  function backtrack(row: number): boolean {
    if (row === size) return true;

    // Shuffle columns for randomness
    const cols = Array.from({ length: size }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (const c of cols) {
      if (used[c]) continue;
      // Must not touch queen in previous row (horizontally, vertically, or diagonally)
      if (row > 0 && Math.abs(c - perm[row - 1]) <= 1) continue;

      used[c] = true;
      perm.push(c);

      if (backtrack(row + 1)) return true;

      perm.pop();
      used[c] = false;
    }

    return false;
  }

  if (backtrack(0)) return perm;
  return null;
}

// Generate connected color regions around queen seeds
function generateRegions(size: number, queenIndices: number[]): number[] {
  const total = size * size;
  const regions = new Array(total).fill(-1);

  // Set the N queen seeds
  for (let rId = 0; rId < size; rId++) {
    regions[queenIndices[rId]] = rId;
  }

  let unassigned = total - size;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let iterations = 0;
  while (unassigned > 0 && iterations < 500) {
    iterations++;
    const frontier: { cell: number; regId: number }[] = [];

    for (let i = 0; i < total; i++) {
      if (regions[i] !== -1) continue;

      const r = Math.floor(i / size);
      const c = i % size;

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighborIdx = nr * size + nc;
          const reg = regions[neighborIdx];
          if (reg !== -1) {
            frontier.push({ cell: i, regId: reg });
          }
        }
      }
    }

    if (frontier.length === 0) break;

    // Pick random cells from frontier to expand
    // Pick several at once for efficiency
    const pickedCount = Math.min(frontier.length, Math.max(1, Math.floor(size / 2)));
    for (let p = 0; p < pickedCount; p++) {
      const choice = frontier[Math.floor(Math.random() * frontier.length)];
      if (regions[choice.cell] === -1) {
        regions[choice.cell] = choice.regId;
        unassigned--;
      }
    }
  }

  // Fill any remaining isolated cells with neighbor's region
  for (let i = 0; i < total; i++) {
    if (regions[i] === -1) {
      const r = Math.floor(i / size);
      const c = i % size;
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr * size + nc] !== -1) {
          regions[i] = regions[nr * size + nc];
          break;
        }
      }
      if (regions[i] === -1) regions[i] = i % size;
    }
  }

  return regions;
}

export function generateQueensPuzzle(difficulty: Difficulty, size: QueensBoardSize = 6): QueensPuzzle {
  const perm = findValidQueensPlacement(size) || (size === 6 ? [1, 3, 5, 0, 2, 4] : size === 8 ? [1, 3, 5, 7, 0, 2, 4, 6] : [1, 3, 5, 7, 9, 0, 2, 4, 6, 8]);
  const queenPositions = perm.map((c, r) => r * size + c);
  const regions = generateRegions(size, queenPositions);

  return {
    size,
    regions,
    queenPositions,
  };
}

export interface QueensConflicts {
  rowConflicts: Set<number>;
  colConflicts: Set<number>;
  regionConflicts: Set<number>;
  touchingConflicts: Set<number>;
  allViolatingQueens: Set<number>;
}

export function findQueensConflicts(
  board: QueensCellState[],
  regions: number[],
  size: number
): QueensConflicts {
  const rowConflicts = new Set<number>();
  const colConflicts = new Set<number>();
  const regionConflicts = new Set<number>();
  const touchingConflicts = new Set<number>();
  const allViolatingQueens = new Set<number>();

  const queens: { index: number; r: number; c: number; reg: number }[] = [];
  const total = size * size;

  for (let i = 0; i < total; i++) {
    if (board[i] === 2) {
      const r = Math.floor(i / size);
      const c = i % size;
      queens.push({ index: i, r, c, reg: regions[i] });
    }
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const q1 = queens[i];
      const q2 = queens[j];

      // Same row
      if (q1.r === q2.r) {
        rowConflicts.add(q1.index);
        rowConflicts.add(q2.index);
        allViolatingQueens.add(q1.index);
        allViolatingQueens.add(q2.index);
      }

      // Same col
      if (q1.c === q2.c) {
        colConflicts.add(q1.index);
        colConflicts.add(q2.index);
        allViolatingQueens.add(q1.index);
        allViolatingQueens.add(q2.index);
      }

      // Same region
      if (q1.reg === q2.reg) {
        regionConflicts.add(q1.index);
        regionConflicts.add(q2.index);
        allViolatingQueens.add(q1.index);
        allViolatingQueens.add(q2.index);
      }

      // Touching (orthogonal or diagonal: max(|dr|, |dc|) <= 1)
      if (Math.abs(q1.r - q2.r) <= 1 && Math.abs(q1.c - q2.c) <= 1) {
        touchingConflicts.add(q1.index);
        touchingConflicts.add(q2.index);
        allViolatingQueens.add(q1.index);
        allViolatingQueens.add(q2.index);
      }
    }
  }

  return {
    rowConflicts,
    colConflicts,
    regionConflicts,
    touchingConflicts,
    allViolatingQueens,
  };
}

export function isQueensCompleted(
  board: QueensCellState[],
  regions: number[],
  solutionQueens: number[],
  size: number
): boolean {
  let queenCount = 0;
  const total = size * size;
  for (let i = 0; i < total; i++) {
    if (board[i] === 2) {
      queenCount++;
      if (!solutionQueens.includes(i)) return false;
    }
  }
  return queenCount === size;
}
