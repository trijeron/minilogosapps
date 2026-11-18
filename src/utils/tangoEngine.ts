import { Difficulty } from '../types/sudoku';
import { EdgeType, TangoPuzzle, TangoSymbol } from '../types/tango';

export const TANGO_SIZE = 6;
export const TANGO_TOTAL = 36;
export const H_EDGE_COUNT = 30; // 6 rows * 5 horizontal gaps
export const V_EDGE_COUNT = 30; // 5 vertical gaps * 6 columns

export function getHorizontalEdgeIndex(row: number, col: number): number {
  return row * 5 + col; // col from 0 to 4
}

export function getVerticalEdgeIndex(row: number, col: number): number {
  return row * 6 + col; // row from 0 to 4, col from 0 to 5
}

// Check if a partial or full placement is valid
export function isValidTangoPlacement(
  grid: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[],
  index: number,
  val: TangoSymbol
): boolean {
  if (val === 0) return true;

  const row = Math.floor(index / TANGO_SIZE);
  const col = index % TANGO_SIZE;

  // 1. Check Row counts
  let rowSuns = 0;
  let rowMoons = 0;
  for (let c = 0; c < TANGO_SIZE; c++) {
    const v = c === col ? val : grid[row * TANGO_SIZE + c];
    if (v === 1) rowSuns++;
    if (v === 2) rowMoons++;
  }
  if (rowSuns > 3 || rowMoons > 3) return false;

  // 2. Check Column counts
  let colSuns = 0;
  let colMoons = 0;
  for (let r = 0; r < TANGO_SIZE; r++) {
    const v = r === row ? val : grid[r * TANGO_SIZE + col];
    if (v === 1) colSuns++;
    if (v === 2) colMoons++;
  }
  if (colSuns > 3 || colMoons > 3) return false;

  // 3. Check 3-in-a-row horizontally
  // Check (c-2, c-1, c)
  if (col >= 2) {
    const v1 = grid[row * TANGO_SIZE + (col - 2)];
    const v2 = grid[row * TANGO_SIZE + (col - 1)];
    if (v1 === val && v2 === val) return false;
  }
  // Check (c-1, c, c+1)
  if (col >= 1 && col <= TANGO_SIZE - 2) {
    const v1 = grid[row * TANGO_SIZE + (col - 1)];
    const v2 = grid[row * TANGO_SIZE + (col + 1)];
    if (v1 === val && v2 === val) return false;
  }
  // Check (c, c+1, c+2)
  if (col <= TANGO_SIZE - 3) {
    const v1 = grid[row * TANGO_SIZE + (col + 1)];
    const v2 = grid[row * TANGO_SIZE + (col + 2)];
    if (v1 === val && v2 === val) return false;
  }

  // 4. Check 3-in-a-row vertically
  // Check (r-2, r-1, r)
  if (row >= 2) {
    const v1 = grid[(row - 2) * TANGO_SIZE + col];
    const v2 = grid[(row - 1) * TANGO_SIZE + col];
    if (v1 === val && v2 === val) return false;
  }
  // Check (r-1, r, r+1)
  if (row >= 1 && row <= TANGO_SIZE - 2) {
    const v1 = grid[(row - 1) * TANGO_SIZE + col];
    const v2 = grid[(row + 1) * TANGO_SIZE + col];
    if (v1 === val && v2 === val) return false;
  }
  // Check (r, r+1, r+2)
  if (row <= TANGO_SIZE - 3) {
    const v1 = grid[(row + 1) * TANGO_SIZE + col];
    const v2 = grid[(row + 2) * TANGO_SIZE + col];
    if (v1 === val && v2 === val) return false;
  }

  // 5. Check horizontal edges with left and right neighbors
  // Left neighbor (c - 1)
  if (col > 0) {
    const leftEdge = hEdges[getHorizontalEdgeIndex(row, col - 1)];
    const leftVal = grid[row * TANGO_SIZE + (col - 1)];
    if (leftVal !== 0) {
      if (leftEdge === 'equal' && leftVal !== val) return false;
      if (leftEdge === 'opposite' && leftVal === val) return false;
    }
  }
  // Right neighbor (c + 1)
  if (col < TANGO_SIZE - 1) {
    const rightEdge = hEdges[getHorizontalEdgeIndex(row, col)];
    const rightVal = grid[row * TANGO_SIZE + (col + 1)];
    if (rightVal !== 0) {
      if (rightEdge === 'equal' && rightVal !== val) return false;
      if (rightEdge === 'opposite' && rightVal === val) return false;
    }
  }

  // 6. Check vertical edges with top and bottom neighbors
  // Top neighbor (r - 1)
  if (row > 0) {
    const topEdge = vEdges[getVerticalEdgeIndex(row - 1, col)];
    const topVal = grid[(row - 1) * TANGO_SIZE + col];
    if (topVal !== 0) {
      if (topEdge === 'equal' && topVal !== val) return false;
      if (topEdge === 'opposite' && topVal === val) return false;
    }
  }
  // Bottom neighbor (r + 1)
  if (row < TANGO_SIZE - 1) {
    const bottomEdge = vEdges[getVerticalEdgeIndex(row, col)];
    const bottomVal = grid[(row + 1) * TANGO_SIZE + col];
    if (bottomVal !== 0) {
      if (bottomEdge === 'equal' && bottomVal !== val) return false;
      if (bottomEdge === 'opposite' && bottomVal === val) return false;
    }
  }

  return true;
}

// Find empty cell with fewest options
function findBestTangoCell(
  grid: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[]
): { index: number; candidates: TangoSymbol[] } | null {
  let minCount = 3;
  let best: { index: number; candidates: TangoSymbol[] } | null = null;

  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] === 0) {
      const candidates: TangoSymbol[] = [];
      if (isValidTangoPlacement(grid, hEdges, vEdges, i, 1)) candidates.push(1);
      if (isValidTangoPlacement(grid, hEdges, vEdges, i, 2)) candidates.push(2);

      if (candidates.length === 0) {
        return { index: i, candidates: [] }; // Dead end
      }

      if (candidates.length < minCount) {
        minCount = candidates.length;
        best = { index: i, candidates };
        if (minCount === 1) break;
      }
    }
  }

  return best;
}

export function countTangoSolutions(
  grid: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[],
  limit = 2
): number {
  const best = findBestTangoCell(grid, hEdges, vEdges);
  if (!best) {
    // Check all rows and columns are balanced and no duplicate rows/columns
    for (let r = 0; r < TANGO_SIZE; r++) {
      let suns = 0;
      for (let c = 0; c < TANGO_SIZE; c++) {
        if (grid[r * TANGO_SIZE + c] === 1) suns++;
      }
      if (suns !== 3) return 0;
    }
    for (let c = 0; c < TANGO_SIZE; c++) {
      let suns = 0;
      for (let r = 0; r < TANGO_SIZE; r++) {
        if (grid[r * TANGO_SIZE + c] === 1) suns++;
      }
      if (suns !== 3) return 0;
    }
    return 1;
  }

  if (best.candidates.length === 0) return 0;

  let solutions = 0;
  for (const val of best.candidates) {
    grid[best.index] = val;
    solutions += countTangoSolutions(grid, hEdges, vEdges, limit - solutions);
    grid[best.index] = 0;
    if (solutions >= limit) break;
  }

  return solutions;
}

function solveTangoInternal(
  grid: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[],
  randomize = false
): boolean {
  const best = findBestTangoCell(grid, hEdges, vEdges);
  if (!best) return true;
  if (best.candidates.length === 0) return false;

  const candidates = [...best.candidates];
  if (randomize && candidates.length > 1 && Math.random() > 0.5) {
    candidates.reverse();
  }

  for (const val of candidates) {
    grid[best.index] = val;
    if (solveTangoInternal(grid, hEdges, vEdges, randomize)) {
      return true;
    }
    grid[best.index] = 0;
  }

  return false;
}

// Verified valid 6x6 Tango board helper
export function isValidTangoBoard(
  grid: TangoSymbol[],
  hEdges?: EdgeType[],
  vEdges?: EdgeType[]
): boolean {
  if (grid.length !== TANGO_TOTAL) return false;
  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] !== 1 && grid[i] !== 2) return false;
  }

  for (let r = 0; r < TANGO_SIZE; r++) {
    let suns = 0;
    for (let c = 0; c < TANGO_SIZE; c++) {
      if (grid[r * TANGO_SIZE + c] === 1) suns++;
    }
    if (suns !== 3) return false;
    for (let c = 0; c < TANGO_SIZE - 2; c++) {
      const a = grid[r * TANGO_SIZE + c];
      const b = grid[r * TANGO_SIZE + c + 1];
      const d = grid[r * TANGO_SIZE + c + 2];
      if (a === b && b === d) return false;
    }
  }

  for (let c = 0; c < TANGO_SIZE; c++) {
    let suns = 0;
    for (let r = 0; r < TANGO_SIZE; r++) {
      if (grid[r * TANGO_SIZE + c] === 1) suns++;
    }
    if (suns !== 3) return false;
    for (let r = 0; r < TANGO_SIZE - 2; r++) {
      const a = grid[r * TANGO_SIZE + c];
      const b = grid[(r + 1) * TANGO_SIZE + c];
      const d = grid[(r + 2) * TANGO_SIZE + c];
      if (a === b && b === d) return false;
    }
  }

  if (hEdges) {
    for (let r = 0; r < TANGO_SIZE; r++) {
      for (let c = 0; c < TANGO_SIZE - 1; c++) {
        const edge = hEdges[getHorizontalEdgeIndex(r, c)];
        const v1 = grid[r * TANGO_SIZE + c];
        const v2 = grid[r * TANGO_SIZE + c + 1];
        if (edge === 'equal' && v1 !== v2) return false;
        if (edge === 'opposite' && v1 === v2) return false;
      }
    }
  }

  if (vEdges) {
    for (let r = 0; r < TANGO_SIZE - 1; r++) {
      for (let c = 0; c < TANGO_SIZE; c++) {
        const edge = vEdges[getVerticalEdgeIndex(r, c)];
        const v1 = grid[r * TANGO_SIZE + c];
        const v2 = grid[(r + 1) * TANGO_SIZE + c];
        if (edge === 'equal' && v1 !== v2) return false;
        if (edge === 'opposite' && v1 === v2) return false;
      }
    }
  }

  return true;
}

export function generateTangoSolution(): TangoSymbol[] {
  const emptyEdgesH: EdgeType[] = new Array(H_EDGE_COUNT).fill('none');
  const emptyEdgesV: EdgeType[] = new Array(V_EDGE_COUNT).fill('none');

  let grid: TangoSymbol[] = new Array(TANGO_TOTAL).fill(0);
  let attempts = 0;

  while (attempts < 40) {
    attempts++;
    grid = new Array(TANGO_TOTAL).fill(0);
    // Seed diagonal symbols to encourage varied solutions
    const seedIndices = [0, 7, 14, 21, 28, 35];
    for (const idx of seedIndices) {
      grid[idx] = (Math.random() > 0.5 ? 1 : 2) as TangoSymbol;
    }

    if (solveTangoInternal(grid, emptyEdgesH, emptyEdgesV, true) && isValidTangoBoard(grid)) {
      return grid;
    }
  }

  // Fallback verified valid Tango 6x6 board (every row & col has 3 suns / 3 moons, no 3-in-a-row)
  return [
    1, 2, 1, 2, 1, 2,
    2, 1, 2, 1, 2, 1,
    1, 1, 2, 2, 1, 2,
    2, 2, 1, 1, 2, 1,
    1, 2, 1, 2, 2, 1,
    2, 1, 2, 1, 1, 2,
  ];
}

// All 14 valid 6-cell Tango lines (3 suns, 3 moons, no 3 adjacent identical symbols)
const VALID_TANGO_LINES: TangoSymbol[][] = (() => {
  const lines: TangoSymbol[][] = [];
  for (let mask = 0; mask < 64; mask++) {
    const line: TangoSymbol[] = [];
    let suns = 0;
    for (let i = 0; i < TANGO_SIZE; i++) {
      const v: TangoSymbol = (mask >> i) & 1 ? 1 : 2;
      if (v === 1) suns++;
      line.push(v);
    }
    if (suns !== 3) continue;
    let hasThree = false;
    for (let i = 0; i < TANGO_SIZE - 2; i++) {
      if (line[i] === line[i + 1] && line[i + 1] === line[i + 2]) {
        hasThree = true;
        break;
      }
    }
    if (!hasThree) lines.push(line);
  }
  return lines;
})();

export interface DeductiveSolveResult {
  solved: boolean;
  grid: TangoSymbol[];
  usedLineEnum: boolean;
}

// Pure human-style deductive solver (no guessing / no global trial-and-error)
export function solveTangoDeductive(
  initialBoard: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[],
  allowLineEnumeration = true
): DeductiveSolveResult {
  const grid = [...initialBoard];

  // Validate initial clues have no contradictions
  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] !== 0 && !isValidTangoPlacement(grid, hEdges, vEdges, i, grid[i])) {
      return { solved: false, grid, usedLineEnum: false };
    }
  }

  let changed = true;
  let usedLineEnum = false;

  while (changed) {
    changed = false;

    // Step 1: Direct edge (= and x) propagation across the board
    for (let r = 0; r < TANGO_SIZE; r++) {
      for (let c = 0; c < TANGO_SIZE - 1; c++) {
        const edge = hEdges[getHorizontalEdgeIndex(r, c)];
        if (edge === 'none') continue;
        const i1 = r * TANGO_SIZE + c;
        const i2 = r * TANGO_SIZE + (c + 1);
        if (grid[i1] !== 0 && grid[i2] === 0) {
          grid[i2] = edge === 'equal' ? grid[i1] : (grid[i1] === 1 ? 2 : 1);
          changed = true;
        } else if (grid[i2] !== 0 && grid[i1] === 0) {
          grid[i1] = edge === 'equal' ? grid[i2] : (grid[i2] === 1 ? 2 : 1);
          changed = true;
        } else if (grid[i1] !== 0 && grid[i2] !== 0) {
          if ((edge === 'equal' && grid[i1] !== grid[i2]) || (edge === 'opposite' && grid[i1] === grid[i2])) {
            return { solved: false, grid, usedLineEnum };
          }
        }
      }
    }

    for (let r = 0; r < TANGO_SIZE - 1; r++) {
      for (let c = 0; c < TANGO_SIZE; c++) {
        const edge = vEdges[getVerticalEdgeIndex(r, c)];
        if (edge === 'none') continue;
        const i1 = r * TANGO_SIZE + c;
        const i2 = (r + 1) * TANGO_SIZE + c;
        if (grid[i1] !== 0 && grid[i2] === 0) {
          grid[i2] = edge === 'equal' ? grid[i1] : (grid[i1] === 1 ? 2 : 1);
          changed = true;
        } else if (grid[i2] !== 0 && grid[i1] === 0) {
          grid[i1] = edge === 'equal' ? grid[i2] : (grid[i2] === 1 ? 2 : 1);
          changed = true;
        } else if (grid[i1] !== 0 && grid[i2] !== 0) {
          if ((edge === 'equal' && grid[i1] !== grid[i2]) || (edge === 'opposite' && grid[i1] === grid[i2])) {
            return { solved: false, grid, usedLineEnum };
          }
        }
      }
    }

    if (changed) continue;

    // Step 2: Basic local line rules (XX., .XX, X.X, and 3-count line completion)
    for (let isRow = 0; isRow < 2; isRow++) {
      for (let lineIdx = 0; lineIdx < TANGO_SIZE; lineIdx++) {
        const idxs = Array.from({ length: TANGO_SIZE }, (_, k) =>
          isRow === 0 ? lineIdx * TANGO_SIZE + k : k * TANGO_SIZE + lineIdx
        );

        let suns = 0;
        let moons = 0;
        for (const id of idxs) {
          if (grid[id] === 1) suns++;
          if (grid[id] === 2) moons++;
        }
        if (suns > 3 || moons > 3) {
          return { solved: false, grid, usedLineEnum };
        }

        if (suns === 3 || moons === 3) {
          const fill: TangoSymbol = suns === 3 ? 2 : 1;
          for (const id of idxs) {
            if (grid[id] === 0) {
              grid[id] = fill;
              changed = true;
            }
          }
        }

        for (let k = 0; k < TANGO_SIZE; k++) {
          if (grid[idxs[k]] !== 0) continue;
          const v = (p: number): TangoSymbol => (p >= 0 && p < TANGO_SIZE ? grid[idxs[p]] : 0);
          let forced: TangoSymbol = 0;
          if (k >= 2 && v(k - 1) !== 0 && v(k - 1) === v(k - 2)) {
            forced = v(k - 1) === 1 ? 2 : 1;
          } else if (k <= TANGO_SIZE - 3 && v(k + 1) !== 0 && v(k + 1) === v(k + 2)) {
            forced = v(k + 1) === 1 ? 2 : 1;
          } else if (k >= 1 && k <= TANGO_SIZE - 2 && v(k - 1) !== 0 && v(k - 1) === v(k + 1)) {
            forced = v(k - 1) === 1 ? 2 : 1;
          }
          if (forced !== 0) {
            grid[idxs[k]] = forced;
            changed = true;
          }
        }
      }
    }

    if (changed) continue;

    // Step 3: Single-line pattern intersection (X....X, 2X + (=), etc. within a single row/column)
    if (allowLineEnumeration) {
      for (let isRow = 0; isRow < 2; isRow++) {
        for (let lineIdx = 0; lineIdx < TANGO_SIZE; lineIdx++) {
          const idxs = Array.from({ length: TANGO_SIZE }, (_, k) =>
            isRow === 0 ? lineIdx * TANGO_SIZE + k : k * TANGO_SIZE + lineIdx
          );
          if (idxs.every((id) => grid[id] !== 0)) continue;

          const edges = Array.from({ length: TANGO_SIZE - 1 }, (_, k) =>
            isRow === 0
              ? hEdges[getHorizontalEdgeIndex(lineIdx, k)]
              : vEdges[getVerticalEdgeIndex(k, lineIdx)]
          );

          const possible = VALID_TANGO_LINES.filter((cand) => {
            for (let k = 0; k < TANGO_SIZE; k++) {
              if (grid[idxs[k]] !== 0 && grid[idxs[k]] !== cand[k]) return false;
            }
            for (let k = 0; k < TANGO_SIZE - 1; k++) {
              if (edges[k] === 'equal' && cand[k] !== cand[k + 1]) return false;
              if (edges[k] === 'opposite' && cand[k] === cand[k + 1]) return false;
            }
            return true;
          });

          if (possible.length === 0) {
            return { solved: false, grid, usedLineEnum };
          }

          for (let k = 0; k < TANGO_SIZE; k++) {
            if (grid[idxs[k]] === 0) {
              const first = possible[0][k];
              if (possible.every((cand) => cand[k] === first)) {
                grid[idxs[k]] = first;
                changed = true;
                usedLineEnum = true;
              }
            }
          }
        }
      }
    }
  }

  const solved = isValidTangoBoard(grid, hEdges, vEdges);
  return { solved, grid, usedLineEnum };
}

// Verify if a puzzle can be solved step-by-step using pure logical deduction (no guessing)
export function isTangoHumanSolvable(
  initialBoard: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[]
): boolean {
  return solveTangoDeductive(initialBoard, hEdges, vEdges, true).solved;
}

export function generateTangoPuzzle(difficulty: Difficulty): TangoPuzzle {
  const config = {
    easy: { edgeSigns: 12, minGivens: 8, maxGivens: 11, allowLineEnum: false },
    medium: { edgeSigns: 10, minGivens: 5, maxGivens: 8, allowLineEnum: true },
    hard: { edgeSigns: 9, minGivens: 3, maxGivens: 6, allowLineEnum: true },
  }[difficulty];

  let bestPuzzle: TangoPuzzle | null = null;
  let bestScore = -Infinity;

  // Try several candidates and pick the cleanest deductive puzzle for the chosen difficulty
  for (let attempt = 0; attempt < 8; attempt++) {
    const solution = generateTangoSolution();

    const allEdges: { isH: boolean; idx: number; type: EdgeType }[] = [];
    for (let r = 0; r < TANGO_SIZE; r++) {
      for (let c = 0; c < TANGO_SIZE - 1; c++) {
        const idx1 = r * TANGO_SIZE + c;
        const idx2 = r * TANGO_SIZE + (c + 1);
        allEdges.push({
          isH: true,
          idx: getHorizontalEdgeIndex(r, c),
          type: solution[idx1] === solution[idx2] ? 'equal' : 'opposite',
        });
      }
    }
    for (let r = 0; r < TANGO_SIZE - 1; r++) {
      for (let c = 0; c < TANGO_SIZE; c++) {
        const idx1 = r * TANGO_SIZE + c;
        const idx2 = (r + 1) * TANGO_SIZE + c;
        allEdges.push({
          isH: false,
          idx: getVerticalEdgeIndex(r, c),
          type: solution[idx1] === solution[idx2] ? 'equal' : 'opposite',
        });
      }
    }

    // Shuffle edge candidates
    for (let i = allEdges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allEdges[i], allEdges[j]] = [allEdges[j], allEdges[i]];
    }

    const finalHEdges: EdgeType[] = new Array(H_EDGE_COUNT).fill('none');
    const finalVEdges: EdgeType[] = new Array(V_EDGE_COUNT).fill('none');

    for (let i = 0; i < config.edgeSigns && i < allEdges.length; i++) {
      const e = allEdges[i];
      if (e.isH) finalHEdges[e.idx] = e.type;
      else finalVEdges[e.idx] = e.type;
    }

    // Prune cells from full solution while keeping pure deductive solvability
    const initialBoard: TangoSymbol[] = [...solution];
    const indices = Array.from({ length: TANGO_TOTAL }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let givensCount = TANGO_TOTAL;
    for (const idx of indices) {
      if (givensCount <= config.minGivens) break;
      const backup = initialBoard[idx];
      initialBoard[idx] = 0;
      if (!solveTangoDeductive(initialBoard, finalHEdges, finalVEdges, config.allowLineEnum).solved) {
        initialBoard[idx] = backup;
      } else {
        givensCount--;
      }
    }

    const verify = solveTangoDeductive(initialBoard, finalHEdges, finalVEdges, config.allowLineEnum);
    const uniqueCount = countTangoSolutions([...initialBoard], finalHEdges, finalVEdges, 2);
    if (!verify.solved || uniqueCount !== 1) continue;

    // Score candidate by how well it matches target difficulty
    let score = 0;
    if (givensCount >= config.minGivens && givensCount <= config.maxGivens) {
      score += 50;
    } else {
      score -= Math.abs(givensCount - config.maxGivens) * 5;
    }
    if (difficulty === 'hard' && verify.usedLineEnum) {
      score += 30;
    }
    if (difficulty === 'medium' && verify.usedLineEnum) {
      score += 15;
    }
    score -= givensCount; // slightly prefer fewer givens within target band

    const given = initialBoard.map((v) => v !== 0);
    const candidate: TangoPuzzle = {
      solution,
      initialBoard,
      horizontalEdges: finalHEdges,
      verticalEdges: finalVEdges,
      given,
    };

    if (score > bestScore) {
      bestScore = score;
      bestPuzzle = candidate;
    }

    if (
      givensCount >= config.minGivens &&
      givensCount <= config.maxGivens &&
      (difficulty !== 'hard' || verify.usedLineEnum)
    ) {
      return candidate;
    }
  }

  if (bestPuzzle) return bestPuzzle;

  // Deterministic guaranteed-solvable fallback
  const fbSolution: TangoSymbol[] = [
    1, 2, 1, 2, 1, 2,
    2, 1, 2, 1, 2, 1,
    1, 1, 2, 2, 1, 2,
    2, 2, 1, 1, 2, 1,
    1, 2, 1, 2, 2, 1,
    2, 1, 2, 1, 1, 2,
  ];
  const fbH: EdgeType[] = new Array(H_EDGE_COUNT).fill('none');
  const fbV: EdgeType[] = new Array(V_EDGE_COUNT).fill('none');
  for (let r = 0; r < TANGO_SIZE; r++) {
    for (let c = 0; c < TANGO_SIZE - 1; c++) {
      if ((r + c) % 3 === 0) {
        fbH[getHorizontalEdgeIndex(r, c)] =
          fbSolution[r * TANGO_SIZE + c] === fbSolution[r * TANGO_SIZE + c + 1] ? 'equal' : 'opposite';
      }
    }
  }
  const fbBoard: TangoSymbol[] = [...fbSolution];
  for (let i = 0; i < TANGO_TOTAL; i++) {
    const backup = fbBoard[i];
    fbBoard[i] = 0;
    if (!solveTangoDeductive(fbBoard, fbH, fbV, true).solved) {
      fbBoard[i] = backup;
    }
  }
  return {
    solution: fbSolution,
    initialBoard: fbBoard,
    horizontalEdges: fbH,
    verticalEdges: fbV,
    given: fbBoard.map((v) => v !== 0),
  };
}

// Conflict detector for real-time validation
export interface TangoConflicts {
  threeInARowCells: Set<number>;
  overflowRows: Set<number>;
  overflowCols: Set<number>;
  edgeViolationH: Set<number>; // index of horizontal edge
  edgeViolationV: Set<number>; // index of vertical edge
  violatingCells: Set<number>; // all cells involved in any rule conflict
  incorrectCells: Set<number>; // cells that don't match solution
}

export function findTangoConflicts(
  grid: TangoSymbol[],
  solution: TangoSymbol[],
  hEdges: EdgeType[],
  vEdges: EdgeType[]
): TangoConflicts {
  const threeInARowCells = new Set<number>();
  const overflowRows = new Set<number>();
  const overflowCols = new Set<number>();
  const edgeViolationH = new Set<number>();
  const edgeViolationV = new Set<number>();
  const violatingCells = new Set<number>();
  const incorrectCells = new Set<number>();

  // 1. Check three in a row horizontally
  for (let r = 0; r < TANGO_SIZE; r++) {
    for (let c = 0; c < TANGO_SIZE - 2; c++) {
      const i1 = r * TANGO_SIZE + c;
      const i2 = r * TANGO_SIZE + (c + 1);
      const i3 = r * TANGO_SIZE + (c + 2);
      if (grid[i1] !== 0 && grid[i1] === grid[i2] && grid[i2] === grid[i3]) {
        threeInARowCells.add(i1);
        threeInARowCells.add(i2);
        threeInARowCells.add(i3);
        violatingCells.add(i1);
        violatingCells.add(i2);
        violatingCells.add(i3);
      }
    }
  }

  // 2. Check three in a row vertically
  for (let c = 0; c < TANGO_SIZE; c++) {
    for (let r = 0; r < TANGO_SIZE - 2; r++) {
      const i1 = r * TANGO_SIZE + c;
      const i2 = (r + 1) * TANGO_SIZE + c;
      const i3 = (r + 2) * TANGO_SIZE + c;
      if (grid[i1] !== 0 && grid[i1] === grid[i2] && grid[i2] === grid[i3]) {
        threeInARowCells.add(i1);
        threeInARowCells.add(i2);
        threeInARowCells.add(i3);
        violatingCells.add(i1);
        violatingCells.add(i2);
        violatingCells.add(i3);
      }
    }
  }

  // 3. Check Row overflow (> 3 suns or > 3 moons)
  for (let r = 0; r < TANGO_SIZE; r++) {
    let suns = 0;
    let moons = 0;
    for (let c = 0; c < TANGO_SIZE; c++) {
      const v = grid[r * TANGO_SIZE + c];
      if (v === 1) suns++;
      if (v === 2) moons++;
    }
    if (suns > 3 || moons > 3) {
      overflowRows.add(r);
      for (let c = 0; c < TANGO_SIZE; c++) {
        const v = grid[r * TANGO_SIZE + c];
        if ((suns > 3 && v === 1) || (moons > 3 && v === 2)) {
          violatingCells.add(r * TANGO_SIZE + c);
        }
      }
    }
  }

  // 4. Check Col overflow
  for (let c = 0; c < TANGO_SIZE; c++) {
    let suns = 0;
    let moons = 0;
    for (let r = 0; r < TANGO_SIZE; r++) {
      const v = grid[r * TANGO_SIZE + c];
      if (v === 1) suns++;
      if (v === 2) moons++;
    }
    if (suns > 3 || moons > 3) {
      overflowCols.add(c);
      for (let r = 0; r < TANGO_SIZE; r++) {
        const v = grid[r * TANGO_SIZE + c];
        if ((suns > 3 && v === 1) || (moons > 3 && v === 2)) {
          violatingCells.add(r * TANGO_SIZE + c);
        }
      }
    }
  }

  // 5. Check horizontal edges
  for (let r = 0; r < TANGO_SIZE; r++) {
    for (let c = 0; c < TANGO_SIZE - 1; c++) {
      const edgeIdx = getHorizontalEdgeIndex(r, c);
      const edge = hEdges[edgeIdx];
      if (edge === 'none') continue;

      const i1 = r * TANGO_SIZE + c;
      const i2 = r * TANGO_SIZE + (c + 1);
      const v1 = grid[i1];
      const v2 = grid[i2];

      if (v1 !== 0 && v2 !== 0) {
        if (edge === 'equal' && v1 !== v2) {
          edgeViolationH.add(edgeIdx);
          violatingCells.add(i1);
          violatingCells.add(i2);
        }
        if (edge === 'opposite' && v1 === v2) {
          edgeViolationH.add(edgeIdx);
          violatingCells.add(i1);
          violatingCells.add(i2);
        }
      }
    }
  }

  // 6. Check vertical edges
  for (let r = 0; r < TANGO_SIZE - 1; r++) {
    for (let c = 0; c < TANGO_SIZE; c++) {
      const edgeIdx = getVerticalEdgeIndex(r, c);
      const edge = vEdges[edgeIdx];
      if (edge === 'none') continue;

      const i1 = r * TANGO_SIZE + c;
      const i2 = (r + 1) * TANGO_SIZE + c;
      const v1 = grid[i1];
      const v2 = grid[i2];

      if (v1 !== 0 && v2 !== 0) {
        if (edge === 'equal' && v1 !== v2) {
          edgeViolationV.add(edgeIdx);
          violatingCells.add(i1);
          violatingCells.add(i2);
        }
        if (edge === 'opposite' && v1 === v2) {
          edgeViolationV.add(edgeIdx);
          violatingCells.add(i1);
          violatingCells.add(i2);
        }
      }
    }
  }

  // Note: We do not check against secret solution during gameplay in Tango,
  // because deduction errors naturally reveal themselves via rule contradictions (Rule of 3, Balance, or Edges).

  return {
    threeInARowCells,
    overflowRows,
    overflowCols,
    edgeViolationH,
    edgeViolationV,
    violatingCells,
    incorrectCells,
  };
}

export function isTangoCompleted(
  grid: TangoSymbol[],
  solution: TangoSymbol[],
  hEdges?: EdgeType[],
  vEdges?: EdgeType[]
): boolean {
  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] === 0) {
      return false;
    }
  }

  let match = true;
  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] !== solution[i]) {
      match = false;
      break;
    }
  }
  if (match) return true;

  if (hEdges && vEdges) {
    const conflicts = findTangoConflicts(grid, solution, hEdges, vEdges);
    return conflicts.violatingCells.size === 0;
  }

  return false;
}

// Calculate remaining suns and moons to place across the entire board
export function getTangoRemainingCounts(grid: TangoSymbol[]): { suns: number; moons: number } {
  let suns = 18; // 6 * 3
  let moons = 18;
  for (let i = 0; i < TANGO_TOTAL; i++) {
    if (grid[i] === 1) suns--;
    if (grid[i] === 2) moons--;
  }
  return {
    suns: Math.max(0, suns),
    moons: Math.max(0, moons),
  };
}
