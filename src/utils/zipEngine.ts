import { ZipBoardSize, ZipMode, ZipPuzzle } from '../types/zip';

export function getZipHorizontalWallIndex(r: number, c: number, size: number): number {
  return r * (size - 1) + c;
}

export function getZipVerticalWallIndex(r: number, c: number, size: number): number {
  return r * size + c;
}

export function hasZipWallBetween(
  a: number,
  b: number,
  size: number,
  horizontalWalls: boolean[],
  verticalWalls: boolean[]
): boolean {
  const r1 = Math.floor(a / size);
  const c1 = a % size;
  const r2 = Math.floor(b / size);
  const c2 = b % size;

  if (r1 === r2 && Math.abs(c1 - c2) === 1) {
    const minC = Math.min(c1, c2);
    return Boolean(horizontalWalls[getZipHorizontalWallIndex(r1, minC, size)]);
  }
  if (c1 === c2 && Math.abs(r1 - r2) === 1) {
    const minR = Math.min(r1, r2);
    return Boolean(verticalWalls[getZipVerticalWallIndex(minR, c1, size)]);
  }
  return true;
}

export function setZipWallBetween(
  a: number,
  b: number,
  size: number,
  horizontalWalls: boolean[],
  verticalWalls: boolean[],
  value: boolean
): void {
  const r1 = Math.floor(a / size);
  const c1 = a % size;
  const r2 = Math.floor(b / size);
  const c2 = b % size;

  if (r1 === r2 && Math.abs(c1 - c2) === 1) {
    const minC = Math.min(c1, c2);
    horizontalWalls[getZipHorizontalWallIndex(r1, minC, size)] = value;
  } else if (c1 === c2 && Math.abs(r1 - r2) === 1) {
    const minR = Math.min(r1, r2);
    verticalWalls[getZipVerticalWallIndex(minR, c1, size)] = value;
  }
}

export function areOrthogonalNeighbors(a: number, b: number, size: number): boolean {
  const r1 = Math.floor(a / size);
  const c1 = a % size;
  const r2 = Math.floor(b / size);
  const c2 = b % size;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function getGridNeighbors(idx: number, size: number): number[] {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const list: number[] = [];
  if (r > 0) list.push(idx - size);
  if (r < size - 1) list.push(idx + size);
  if (c > 0) list.push(idx - 1);
  if (c < size - 1) list.push(idx + 1);
  return list;
}

/**
 * Generates a diverse random Hamiltonian path across an N×N grid
 * using serpentine initialization + Backbite MCMC path reversals + random symmetry.
 */
export function generateRandomHamiltonianPath(size: number): number[] {
  const total = size * size;
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) path.push(r * size + c);
    } else {
      for (let c = size - 1; c >= 0; c--) path.push(r * size + c);
    }
  }

  const posInPath = new Int32Array(total);
  for (let i = 0; i < total; i++) {
    posInPath[path[i]] = i;
  }

  const iterations = total * 16;
  for (let iter = 0; iter < iterations; iter++) {
    // 50% chance to flip path so we bite from both ends
    if (Math.random() < 0.5) {
      path.reverse();
      for (let i = 0; i < total; i++) {
        posInPath[path[i]] = i;
      }
    }

    const tail = path[total - 1];
    const prev = path[total - 2];
    const nbs = getGridNeighbors(tail, size).filter((nb) => nb !== prev);
    if (nbs.length === 0) continue;

    const chosen = nbs[Math.floor(Math.random() * nbs.length)];
    const idx = posInPath[chosen];

    // Reverse suffix path[idx + 1 .. total - 1]
    let l = idx + 1;
    let r = total - 1;
    while (l < r) {
      const tmp = path[l];
      path[l] = path[r];
      path[r] = tmp;
      posInPath[path[l]] = l;
      posInPath[path[r]] = r;
      l++;
      r--;
    }
  }

  // Apply random dihedral symmetry (rotate 0/90/180/270 + optional horizontal flip)
  const rot = Math.floor(Math.random() * 4);
  const flip = Math.random() < 0.5;
  const transformed = path.map((cell) => {
    let r = Math.floor(cell / size);
    let c = cell % size;
    if (flip) c = size - 1 - c;
    for (let k = 0; k < rot; k++) {
      const nr = c;
      const nc = size - 1 - r;
      r = nr;
      c = nc;
    }
    return r * size + c;
  });

  if (Math.random() < 0.5) transformed.reverse();
  return transformed;
}

export interface ZipSolveResult {
  count: number;
  solutions: number[][];
  aborted: boolean;
}

/**
 * Exact solver for Zip puzzles with connectivity, degree, and checkpoint-order pruning.
 * Counts up to `limit` valid Hamiltonian paths matching numbers and walls.
 */
export function findZipSolutions(
  size: number,
  numbers: number[],
  horizontalWalls: boolean[],
  verticalWalls: boolean[],
  limit = 2,
  maxNodes = 200000,
  avoidEdgeAfter?: number[]
): ZipSolveResult {
  const total = size * size;
  let maxNumber = 0;
  const numPos = new Map<number, number>();
  for (let i = 0; i < total; i++) {
    const v = numbers[i];
    if (v > 0) {
      numPos.set(v, i);
      if (v > maxNumber) maxNumber = v;
    }
  }

  const startCell = numPos.get(1);
  const endCell = numPos.get(maxNumber);
  if (startCell === undefined || endCell === undefined || maxNumber < 2) {
    return { count: 0, solutions: [], aborted: false };
  }

  // Precompute legal adjacency lists
  const adj: number[][] = Array.from({ length: total }, (_, u) => {
    const nbs = getGridNeighbors(u, size).filter(
      (v) => !hasZipWallBetween(u, v, size, horizontalWalls, verticalWalls)
    );
    return nbs;
  });

  // Optional ordering hint to discover alternative paths faster during generation
  const avoidNext = new Int32Array(total).fill(-1);
  if (avoidEdgeAfter && avoidEdgeAfter.length === total) {
    for (let i = 0; i < total - 1; i++) {
      avoidNext[avoidEdgeAfter[i]] = avoidEdgeAfter[i + 1];
    }
  }

  const visited = new Uint8Array(total);
  const path = new Int32Array(total);
  const queue = new Int32Array(total);
  const seen = new Int32Array(total);
  let seenStamp = 1;

  const solutions: number[][] = [];
  let nodes = 0;
  let aborted = false;

  const isReachableCheck = (curr: number, step: number, nextNum: number): boolean => {
    const remaining = total - (step + 1);
    if (remaining === 0) return true;

    seenStamp++;
    const stamp = seenStamp;
    let head = 0;
    let tail = 0;
    queue[tail++] = curr;
    seen[curr] = stamp;

    let reachedUnvisited = 0;
    let reachedNextCheckpoint = false;
    const nextTargetCell = numPos.get(nextNum)!;

    while (head < tail) {
      const u = queue[head++];
      const nbs = adj[u];
      for (let i = 0; i < nbs.length; i++) {
        const w = nbs[i];
        if (visited[w] || seen[w] === stamp) continue;
        seen[w] = stamp;
        reachedUnvisited++;
        if (w === nextTargetCell) {
          reachedNextCheckpoint = true;
        }
        // endCell cannot be crossed as an intermediate cell
        if (w !== endCell) {
          queue[tail++] = w;
        }
      }
    }

    if (reachedUnvisited !== remaining) return false;
    if (!reachedNextCheckpoint) return false;

    // Also verify nextTargetCell is reachable without stepping on future checkpoints (> nextNum)
    if (nextNum < maxNumber) {
      seenStamp++;
      const stamp2 = seenStamp;
      head = 0;
      tail = 0;
      queue[tail++] = curr;
      seen[curr] = stamp2;
      let foundTarget = false;
      while (head < tail) {
        const u = queue[head++];
        const nbs = adj[u];
        for (let i = 0; i < nbs.length; i++) {
          const w = nbs[i];
          if (visited[w] || seen[w] === stamp2) continue;
          const nw = numbers[w];
          if (nw > 0 && nw !== nextNum) continue;
          if (w === nextTargetCell) {
            foundTarget = true;
            break;
          }
          seen[w] = stamp2;
          queue[tail++] = w;
        }
        if (foundTarget) break;
      }
      if (!foundTarget) return false;
    }

    return true;
  };

  const dfs = (curr: number, step: number, nextNum: number): void => {
    if (solutions.length >= limit || aborted) return;
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return;
    }

    if (step === total - 1) {
      if (curr === endCell && nextNum > maxNumber) {
        solutions.push(Array.from(path));
      }
      return;
    }

    // Collect valid candidate neighbors of curr
    const nbs = adj[curr];
    const candidates: number[] = [];
    for (let i = 0; i < nbs.length; i++) {
      const v = nbs[i];
      if (visited[v]) continue;
      const nv = numbers[v];
      if (nv > 0 && nv !== nextNum) continue;
      if (v === endCell && step < total - 2) continue;
      candidates.push(v);
    }

    if (candidates.length === 0) return;

    // Degree check for all unvisited cells & forced dead-end neighbor detection
    let forcedNeighbor: number | null = null;
    let forcedCount = 0;

    for (let u = 0; u < total; u++) {
      if (visited[u]) continue;
      const nbsU = adj[u];
      let freeDeg = 0;
      let adjToCurr = false;
      for (let i = 0; i < nbsU.length; i++) {
        const w = nbsU[i];
        if (w === curr) adjToCurr = true;
        else if (!visited[w]) freeDeg++;
      }

      if (u === endCell) {
        if (step < total - 2 && freeDeg === 0) return;
        continue;
      }

      if (adjToCurr) {
        if (freeDeg === 0) return; // entering u traps us unless u === endCell (checked above)
        if (freeDeg === 1) {
          forcedCount++;
          forcedNeighbor = u;
          if (forcedCount > 1) return; // two dead-end neighbors of curr -> impossible
        }
      } else {
        if (freeDeg < 2) return; // unreachable to both enter and exit u
      }
    }

    // If a forced dead-end neighbor exists, verify it is a legal candidate and explore only it
    let orderedCandidates = candidates;
    if (forcedNeighbor !== null) {
      if (!candidates.includes(forcedNeighbor)) return;
      orderedCandidates = [forcedNeighbor];
    } else if (candidates.length > 1) {
      // Connectivity + checkpoint reachability pruning before branching
      if (!isReachableCheck(curr, step, nextNum)) return;

      // Sort candidates: prefer avoiding intended edge if searching for counterexamples, or Warnsdorff heuristic
      if (avoidEdgeAfter) {
        const av = avoidNext[curr];
        orderedCandidates.sort((a, b) => (a === av ? 1 : b === av ? -1 : 0));
      } else {
        // Warnsdorff: lowest unvisited degree first for speed
        orderedCandidates.sort((a, b) => {
          let da = 0;
          let db = 0;
          for (const w of adj[a]) if (!visited[w]) da++;
          for (const w of adj[b]) if (!visited[w]) db++;
          return da - db;
        });
      }
    }

    for (let i = 0; i < orderedCandidates.length; i++) {
      const nextCell = orderedCandidates[i];
      const nv = numbers[nextCell];
      const updatedNextNum = nv === nextNum ? nextNum + 1 : nextNum;

      visited[nextCell] = 1;
      path[step + 1] = nextCell;
      dfs(nextCell, step + 1, updatedNextNum);
      visited[nextCell] = 0;

      if (solutions.length >= limit || aborted) return;
    }
  };

  visited[startCell] = 1;
  path[0] = startCell;
  dfs(startCell, 0, 2);

  return {
    count: solutions.length,
    solutions,
    aborted,
  };
}

export function countZipSolutions(
  size: number,
  numbers: number[],
  horizontalWalls: boolean[],
  verticalWalls: boolean[],
  limit = 2
): number {
  const res = findZipSolutions(size, numbers, horizontalWalls, verticalWalls, limit, 250000);
  return res.count;
}

function chooseCheckpointsAlongPath(path: number[], size: ZipBoardSize): number[] {
  const total = size * size;
  const targetCount = size === 5 ? 7 : size === 6 ? 9 : 11;

  // Score interior indices: turns in the path make great visual anchor checkpoints
  const selected = new Set<number>([0, total - 1]);
  const idealStep = (total - 1) / (targetCount - 1);

  for (let k = 1; k < targetCount - 1; k++) {
    const center = Math.round(k * idealStep);
    const minIdx = Math.max(1, center - 1);
    const maxIdx = Math.min(total - 2, center + 1);
    const candidates: number[] = [];
    for (let idx = minIdx; idx <= maxIdx; idx++) {
      if (!selected.has(idx) && !selected.has(idx - 1) && !selected.has(idx + 1)) {
        candidates.push(idx);
      }
    }
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      selected.add(picked);
    } else if (!selected.has(center)) {
      selected.add(center);
    }
  }

  const orderedIndices = Array.from(selected).sort((a, b) => a - b);
  const numbers = new Array(total).fill(0);
  orderedIndices.forEach((pathIdx, i) => {
    numbers[path[pathIdx]] = i + 1;
  });

  return numbers;
}

/**
 * Generates a solvable Zip puzzle:
 * - 'classic': strictly unique Hamiltonian solution with strategic walls (must visit every cell).
 * - 'simple': open wall-free grid where the player simply connects 1..K in order without crossing their own line.
 */
export function generateZipPuzzle(size: ZipBoardSize = 6, mode: ZipMode = 'classic'): ZipPuzzle {
  const total = size * size;
  const hLen = size * (size - 1);
  const vLen = (size - 1) * size;

  if (mode === 'simple') {
    const solutionPath = generateRandomHamiltonianPath(size);
    const numbers = chooseCheckpointsAlongPath(solutionPath, size);
    const horizontalWalls = new Array(hLen).fill(false);
    const verticalWalls = new Array(vLen).fill(false);
    return {
      size,
      mode: 'simple',
      numbers,
      maxNumber: Math.max(...numbers),
      horizontalWalls,
      verticalWalls,
      solutionPath,
    };
  }

  const maxAllowedWalls = size === 5 ? 10 : size === 6 ? 13 : 16;

  for (let attempt = 0; attempt < 40; attempt++) {
    const solutionPath = generateRandomHamiltonianPath(size);
    const numbers = chooseCheckpointsAlongPath(solutionPath, size);
    const horizontalWalls = new Array(hLen).fill(false);
    const verticalWalls = new Array(vLen).fill(false);

    // Precompute non-path edges
    const pathEdgeKeys = new Set<string>();
    for (let i = 0; i < total - 1; i++) {
      const a = solutionPath[i];
      const b = solutionPath[i + 1];
      pathEdgeKeys.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    }

    const nonPathEdges: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const u = r * size + c;
        if (c + 1 < size) {
          const v = u + 1;
          if (!pathEdgeKeys.has(`${u}-${v}`)) nonPathEdges.push([u, v]);
        }
        if (r + 1 < size) {
          const v = u + size;
          if (!pathEdgeKeys.has(`${u}-${v}`)) nonPathEdges.push([u, v]);
        }
      }
    }

    // Add a couple of initial non-path strategic walls to focus the search tree
    const shuffledEdges = [...nonPathEdges].sort(() => Math.random() - 0.5);
    let wallCount = 0;
    const seedWalls = Math.min(size - 2, shuffledEdges.length);
    for (let i = 0; i < seedWalls; i++) {
      const [u, v] = shuffledEdges[i];
      setZipWallBetween(u, v, size, horizontalWalls, verticalWalls, true);
      wallCount++;
    }

    let unique = false;
    for (let round = 0; round < 24; round++) {
      const res = findZipSolutions(
        size,
        numbers,
        horizontalWalls,
        verticalWalls,
        2,
        45000,
        solutionPath
      );

      if (!res.aborted && res.count === 1) {
        // Double-check exact uniqueness without ordering hint
        const exact = findZipSolutions(
          size,
          numbers,
          horizontalWalls,
          verticalWalls,
          2,
          250000
        );
        if (!exact.aborted && exact.count === 1) {
          unique = true;
          break;
        }
        if (exact.solutions.length >= 2) {
          res.solutions = exact.solutions;
        }
      }

      if (wallCount >= maxAllowedWalls) break;

      // Pick counterexample path != solutionPath and block a diverging edge
      const alt = res.solutions.find(
        (sol) => sol.some((cell, idx) => cell !== solutionPath[idx])
      );

      let placedWall = false;
      if (alt) {
        const diffEdges: [number, number][] = [];
        for (let i = 0; i < total - 1; i++) {
          const a = alt[i];
          const b = alt[i + 1];
          const key = a < b ? `${a}-${b}` : `${b}-${a}`;
          if (!pathEdgeKeys.has(key) && !hasZipWallBetween(a, b, size, horizontalWalls, verticalWalls)) {
            diffEdges.push([a, b]);
          }
        }
        if (diffEdges.length > 0) {
          // Prefer earliest forks (index 1..3 when possible) so branches prune fast
          const pool = diffEdges.slice(0, Math.min(3, diffEdges.length));
          const [u, v] = pool[Math.floor(Math.random() * pool.length)];
          setZipWallBetween(u, v, size, horizontalWalls, verticalWalls, true);
          wallCount++;
          placedWall = true;
        }
      }

      if (!placedWall) {
        // Search hit node budget without hitting 2 solutions yet; add a random unplaced non-path wall
        const avail = shuffledEdges.filter(
          ([u, v]) => !hasZipWallBetween(u, v, size, horizontalWalls, verticalWalls)
        );
        if (avail.length === 0) break;
        const [u, v] = avail[0];
        setZipWallBetween(u, v, size, horizontalWalls, verticalWalls, true);
        wallCount++;
      }
    }

    if (unique) {
      // Minimize excess redundant walls while keeping at least 3 strategic walls
      const activeWalls: [number, number][] = [];
      for (const [u, v] of nonPathEdges) {
        if (hasZipWallBetween(u, v, size, horizontalWalls, verticalWalls)) {
          activeWalls.push([u, v]);
        }
      }
      activeWalls.sort(() => Math.random() - 0.5);
      const minWallsToKeep = size === 5 ? 3 : size === 6 ? 4 : 5;
      for (const [u, v] of activeWalls) {
        if (wallCount <= minWallsToKeep) break;
        setZipWallBetween(u, v, size, horizontalWalls, verticalWalls, false);
        const check = findZipSolutions(size, numbers, horizontalWalls, verticalWalls, 2, 80000);
        if (!check.aborted && check.count === 1) {
          wallCount--;
        } else {
          setZipWallBetween(u, v, size, horizontalWalls, verticalWalls, true);
        }
      }

      const maxNumber = Math.max(...numbers);
      return {
        size,
        mode: 'classic',
        numbers,
        maxNumber,
        horizontalWalls,
        verticalWalls,
        solutionPath,
      };
    }
  }

  // Deterministic fallback (should virtually never trigger)
  const fallbackPath = generateRandomHamiltonianPath(size);
  const numbers = chooseCheckpointsAlongPath(fallbackPath, size);
  const horizontalWalls = new Array(hLen).fill(false);
  const verticalWalls = new Array(vLen).fill(false);
  const pathEdgeKeys = new Set<string>();
  for (let i = 0; i < total - 1; i++) {
    const a = fallbackPath[i];
    const b = fallbackPath[i + 1];
    pathEdgeKeys.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const u = r * size + c;
      if (c + 1 < size && !pathEdgeKeys.has(`${u}-${u + 1}`)) {
        setZipWallBetween(u, u + 1, size, horizontalWalls, verticalWalls, true);
      }
      if (r + 1 < size && !pathEdgeKeys.has(`${u}-${u + size}`)) {
        setZipWallBetween(u, u + size, size, horizontalWalls, verticalWalls, true);
      }
    }
  }
  return {
    size,
    mode: 'classic',
    numbers,
    maxNumber: Math.max(...numbers),
    horizontalWalls,
    verticalWalls,
    solutionPath: fallbackPath,
  };
}

/**
 * Returns the next expected checkpoint number given the current path.
 */
export function getNextExpectedZipNumber(path: number[], numbers: number[]): number {
  let maxSeen = 0;
  for (const cell of path) {
    const v = numbers[cell];
    if (v > maxSeen) maxSeen = v;
  }
  return maxSeen + 1;
}

export type ZipBlockedReasonCode = 'start_on_one' | 'wall' | 'wrong_order';

export function formatZipReason(
  reasonCode: ZipBlockedReasonCode | undefined,
  expectedNum: number | undefined,
  lang: 'cs' | 'en' = 'cs',
  fallbackReason?: string
): string | undefined {
  if (!reasonCode) return fallbackReason;
  if (reasonCode === 'start_on_one') {
    return lang === 'en' ? 'Start on number 1.' : 'Začněte na čísle 1.';
  }
  if (reasonCode === 'wall') {
    return lang === 'en' ? 'You cannot pass through a wall.' : 'Přes zeď nelze projít.';
  }
  if (reasonCode === 'wrong_order') {
    const num = expectedNum ?? 1;
    return lang === 'en' ? `Next in order is number ${num}.` : `Další v pořadí je číslo ${num}.`;
  }
  return fallbackReason;
}

/**
 * Validates whether stepping from `path[path.length - 1]` to `nextCell` is legal.
 */
export function canStepZipPath(
  path: number[],
  nextCell: number,
  size: number,
  numbers: number[],
  horizontalWalls: boolean[],
  verticalWalls: boolean[]
): { ok: boolean; reason?: string; reasonCode?: ZipBlockedReasonCode; expectedNum?: number } {
  if (path.length === 0) {
    if (numbers[nextCell] === 1) return { ok: true };
    return { ok: false, reason: 'Začněte na čísle 1.', reasonCode: 'start_on_one' };
  }

  const head = path[path.length - 1];
  if (nextCell === head) return { ok: false };
  if (path.includes(nextCell)) return { ok: false };
  if (!areOrthogonalNeighbors(head, nextCell, size)) return { ok: false };
  if (hasZipWallBetween(head, nextCell, size, horizontalWalls, verticalWalls)) {
    return { ok: false, reason: 'Přes zeď nelze projít.', reasonCode: 'wall' };
  }

  const expectedNum = getNextExpectedZipNumber(path, numbers);
  const cellNum = numbers[nextCell];
  if (cellNum > 0 && cellNum !== expectedNum) {
    return {
      ok: false,
      reason: `Další v pořadí je číslo ${expectedNum}.`,
      reasonCode: 'wrong_order',
      expectedNum,
    };
  }

  return { ok: true };
}

export interface ZipInteractionResult {
  changed: boolean;
  path: number[];
  action: 'step' | 'backtrack' | 'head' | 'blocked-line' | 'blocked' | 'noop';
  reason?: string;
  reasonCode?: ZipBlockedReasonCode;
  expectedNum?: number;
}

/**
 * Resolves pointer start/move interaction without ever cutting or resetting older segments
 * of the drawn path when the player accidentally touches an earlier part of the line.
 * - Stepping onto the immediately preceding cell (`path.length - 2`) cleanly backtracks 1 cell.
 * - Touching any older cell in `path` (`< path.length - 2`) stops safely at the last valid cell.
 */
export function applyZipCellInteraction(
  path: number[],
  targetCell: number,
  interactionType: 'start' | 'move',
  size: number,
  numbers: number[],
  horizontalWalls: boolean[],
  verticalWalls: boolean[]
): ZipInteractionResult {
  if (path.length === 0) {
    if (numbers[targetCell] === 1) {
      return { changed: true, path: [targetCell], action: 'step' };
    }
    return {
      changed: false,
      path,
      action: 'blocked',
      reason: 'Začněte na čísle 1.',
      reasonCode: 'start_on_one',
    };
  }

  const existingIdx = path.indexOf(targetCell);
  if (existingIdx !== -1) {
    if (existingIdx === path.length - 1) {
      return { changed: false, path, action: 'head' };
    }
    if (existingIdx === path.length - 2) {
      return { changed: true, path: path.slice(0, -1), action: 'backtrack' };
    }
    // Never trim/reset older segments of the line — simply stay stopped at the last valid cell
    return { changed: false, path, action: 'blocked-line' };
  }

  const head = path[path.length - 1];
  if (areOrthogonalNeighbors(head, targetCell, size)) {
    const check = canStepZipPath(path, targetCell, size, numbers, horizontalWalls, verticalWalls);
    if (check.ok) {
      return { changed: true, path: [...path, targetCell], action: 'step' };
    }
    return {
      changed: false,
      path,
      action: 'blocked',
      reason: check.reason,
      reasonCode: check.reasonCode,
      expectedNum: check.expectedNum,
    };
  }

  // Fast pointer sweep across 2 steps: bridge only if unambiguous single legal intermediate cell exists
  if (interactionType === 'move') {
    const r1 = Math.floor(head / size);
    const c1 = head % size;
    const r2 = Math.floor(targetCell / size);
    const c2 = targetCell % size;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 2) {
      const candidates: number[] = [];
      if (r1 === r2) {
        candidates.push(r1 * size + (c1 + c2) / 2);
      } else if (c1 === c2) {
        candidates.push(((r1 + r2) / 2) * size + c1);
      } else {
        candidates.push(r1 * size + c2);
        candidates.push(r2 * size + c1);
      }

      const validBridges: number[] = [];
      for (const mid of candidates) {
        const step1 = canStepZipPath(path, mid, size, numbers, horizontalWalls, verticalWalls);
        if (!step1.ok) continue;
        const step2 = canStepZipPath(
          [...path, mid],
          targetCell,
          size,
          numbers,
          horizontalWalls,
          verticalWalls
        );
        if (step2.ok) validBridges.push(mid);
      }

      if (validBridges.length === 1) {
        return { changed: true, path: [...path, validBridges[0], targetCell], action: 'step' };
      }
    }
  }

  return { changed: false, path, action: 'noop' };
}

/**
 * Checks if a drawn path completes the Zip puzzle cleanly.
 * - 'classic': visits every single cell once, respects walls, connects 1..maxNumber in order.
 * - 'simple': connects 1..maxNumber in order without crossing its own line (empty cells may remain).
 */
export function isZipCompleted(
  path: number[],
  size: number,
  numbers: number[],
  maxNumber: number,
  horizontalWalls: boolean[],
  verticalWalls: boolean[],
  mode: ZipMode = 'classic'
): boolean {
  const total = size * size;
  if (mode === 'classic') {
    if (path.length !== total) return false;
  } else {
    if (path.length < maxNumber || path.length > total) return false;
  }

  const seen = new Set(path);
  if (seen.size !== path.length) return false;

  if (numbers[path[0]] !== 1) return false;
  if (numbers[path[path.length - 1]] !== maxNumber) return false;

  let nextExpected = 2;
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (i > 0) {
      const prev = path[i - 1];
      if (!areOrthogonalNeighbors(prev, cell, size)) return false;
      if (hasZipWallBetween(prev, cell, size, horizontalWalls, verticalWalls)) return false;
    }
    if (i > 0 && numbers[cell] > 0) {
      if (numbers[cell] !== nextExpected) return false;
      nextExpected++;
    }
  }

  return nextExpected === maxNumber + 1;
}

function findShortestSimpleStep(
  path: number[],
  size: number,
  numbers: number[],
  maxNumber: number,
  horizontalWalls: boolean[],
  verticalWalls: boolean[]
): number | null {
  if (path.length === 0) {
    const startIdx = numbers.indexOf(1);
    return startIdx !== -1 ? startIdx : null;
  }
  const nextNum = getNextExpectedZipNumber(path, numbers);
  if (nextNum > maxNumber) return null;
  const targetIdx = numbers.indexOf(nextNum);
  if (targetIdx === -1) return null;

  const head = path[path.length - 1];
  const blocked = new Set(path);
  const queue: number[] = [head];
  const parent = new Map<number, number>();
  parent.set(head, -1);

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === targetIdx) {
      let cur = u;
      while (parent.get(cur) !== head && parent.get(cur) !== -1) {
        cur = parent.get(cur)!;
      }
      return cur;
    }
    for (const v of getGridNeighbors(u, size)) {
      if (parent.has(v)) continue;
      if (blocked.has(v)) continue;
      if (hasZipWallBetween(u, v, size, horizontalWalls, verticalWalls)) continue;
      const nv = numbers[v];
      if (nv > 0 && nv !== nextNum) continue;
      parent.set(v, u);
      queue.push(v);
    }
  }
  return null;
}

export interface ZipHintOptions {
  mode?: ZipMode;
  size?: number;
  numbers?: number[];
  maxNumber?: number;
  horizontalWalls?: boolean[];
  verticalWalls?: boolean[];
}

/**
 * Computes hint action:
 * - In 'classic' mode: follows unique solutionPath (returns next cell or backtrackCell if diverged).
 * - In 'simple' mode: finds shortest legal step to next checkpoint via BFS, or backtracks only if trapped.
 */
export function getZipHint(
  path: number[],
  solutionPath: number[],
  options?: ZipHintOptions
): { type: 'next'; targetCell: number } | { type: 'backtrack'; backtrackCell: number; divergedIndex: number } | null {
  if (
    options?.mode === 'simple' &&
    options.size &&
    options.numbers &&
    options.maxNumber &&
    options.horizontalWalls &&
    options.verticalWalls
  ) {
    const nextStep = findShortestSimpleStep(
      path,
      options.size,
      options.numbers,
      options.maxNumber,
      options.horizontalWalls,
      options.verticalWalls
    );
    if (nextStep !== null) {
      return { type: 'next', targetCell: nextStep };
    }
    // Trapped: find latest prefix from which next number is reachable
    for (let len = path.length - 1; len >= 1; len--) {
      const prefix = path.slice(0, len);
      const step = findShortestSimpleStep(
        prefix,
        options.size,
        options.numbers,
        options.maxNumber,
        options.horizontalWalls,
        options.verticalWalls
      );
      if (step !== null) {
        return {
          type: 'backtrack',
          backtrackCell: prefix[prefix.length - 1],
          divergedIndex: len,
        };
      }
    }
    return path.length > 0 ? { type: 'backtrack', backtrackCell: path[0], divergedIndex: 1 } : null;
  }

  if (solutionPath.length === 0) return null;
  if (path.length === 0) return { type: 'next', targetCell: solutionPath[0] };

  for (let i = 0; i < path.length; i++) {
    if (path[i] !== solutionPath[i]) {
      return {
        type: 'backtrack',
        backtrackCell: solutionPath[Math.max(0, i - 1)],
        divergedIndex: i,
      };
    }
  }

  if (path.length < solutionPath.length) {
    return { type: 'next', targetCell: solutionPath[path.length] };
  }

  return null;
}
