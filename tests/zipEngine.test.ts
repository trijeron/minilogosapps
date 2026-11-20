import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { ZipBoardSize } from '../src/types/zip';
import {
  areOrthogonalNeighbors,
  hasZipWallBetween,
  generateRandomHamiltonianPath,
  countZipSolutions,
  generateZipPuzzle,
  canStepZipPath,
  applyZipCellInteraction,
  isZipCompleted,
  getZipHint,
} from '../src/utils/zipEngine';

test('generateRandomHamiltonianPath covers every cell once with orthogonal moves for 5x5, 6x6, 7x7', () => {
  for (const size of [5, 6, 7] as ZipBoardSize[]) {
    for (let run = 0; run < 20; run++) {
      const p = generateRandomHamiltonianPath(size);
      assert.equal(p.length, size * size);
      assert.equal(new Set(p).size, size * size);
      for (let i = 1; i < p.length; i++) {
        assert.equal(
          areOrthogonalNeighbors(p[i - 1], p[i], size),
          true,
          `Step ${i - 1}->${i} on ${size}x${size} is not orthogonal`
        );
      }
    }
  }
});

test('generateZipPuzzle produces uniquely solvable puzzles with strategic non-path walls across 5x5, 6x6, 7x7', () => {
  const sizes: ZipBoardSize[] = [5, 6, 7];

  for (const size of sizes) {
    const rounds = size === 7 ? 8 : 12;
    for (let r = 0; r < rounds; r++) {
      const puzzle = generateZipPuzzle(size);
      const total = size * size;

      assert.equal(puzzle.solutionPath.length, total);
      assert.equal(new Set(puzzle.solutionPath).size, total);
      assert.equal(puzzle.numbers[puzzle.solutionPath[0]], 1);
      assert.equal(puzzle.numbers[puzzle.solutionPath[total - 1]], puzzle.maxNumber);

      // Solution must respect sequential checkpoint order and never cross a wall
      let expected = 2;
      for (let i = 1; i < total; i++) {
        const a = puzzle.solutionPath[i - 1];
        const b = puzzle.solutionPath[i];
        assert.equal(areOrthogonalNeighbors(a, b, size), true);
        assert.equal(
          hasZipWallBetween(a, b, size, puzzle.horizontalWalls, puzzle.verticalWalls),
          false
        );
        const nv = puzzle.numbers[b];
        if (nv > 0) {
          assert.equal(nv, expected);
          expected++;
        }
      }
      assert.equal(expected, puzzle.maxNumber + 1);

      // Must include strategic walls
      const totalWalls =
        puzzle.horizontalWalls.filter(Boolean).length +
        puzzle.verticalWalls.filter(Boolean).length;
      assert.ok(totalWalls >= 3, `${size}x${size} puzzle should have >= 3 strategic walls (got ${totalWalls})`);

      // Strictly unique solution
      const solCount = countZipSolutions(
        size,
        puzzle.numbers,
        puzzle.horizontalWalls,
        puzzle.verticalWalls,
        2
      );
      assert.equal(solCount, 1, `${size}x${size} puzzle #${r} must have unique solution (found ${solCount})`);

      // Solution passes completion check; initial [start] does not
      assert.equal(
        isZipCompleted(
          puzzle.solutionPath,
          size,
          puzzle.numbers,
          puzzle.maxNumber,
          puzzle.horizontalWalls,
          puzzle.verticalWalls
        ),
        true
      );
      assert.equal(
        isZipCompleted(
          [puzzle.solutionPath[0]],
          size,
          puzzle.numbers,
          puzzle.maxNumber,
          puzzle.horizontalWalls,
          puzzle.verticalWalls
        ),
        false
      );
    }
  }
});

test('canStepZipPath and getZipHint enforce walls, sequence order, and backtracking hints', () => {
  const puzzle = generateZipPuzzle(5);
  const sol = puzzle.solutionPath;

  // Next step along solution is valid
  const step1 = canStepZipPath(
    [sol[0]],
    sol[1],
    5,
    puzzle.numbers,
    puzzle.horizontalWalls,
    puzzle.verticalWalls
  );
  assert.equal(step1.ok, true);

  // Hint from [sol[0]] points to sol[1]
  const hint1 = getZipHint([sol[0]], sol);
  assert.deepEqual(hint1, { type: 'next', targetCell: sol[1] });

  // Stepping onto out-of-order checkpoint #3 directly is rejected
  const cell3 = puzzle.numbers.indexOf(3);
  if (!areOrthogonalNeighbors(sol[0], cell3, 5)) {
    // Test directly by finding an orthogonal cell with number != 2 on a synthetic 5x5
    const nums = new Array(25).fill(0);
    nums[0] = 1;
    nums[1] = 3;
    nums[24] = 2;
    const hW = new Array(20).fill(false);
    const vW = new Array(20).fill(false);
    const badOrder = canStepZipPath([0], 1, 5, nums, hW, vW);
    assert.equal(badOrder.ok, false);

    // Wall check
    hW[0] = true; // wall between 0 and 1
    nums[1] = 0;
    const wallBlocked = canStepZipPath([0], 1, 5, nums, hW, vW);
    assert.equal(wallBlocked.ok, false);
  }

  // Diverged path produces backtrack hint pointing to last matching cell
  const wrongCell = sol[1] === 1 ? 5 : 1;
  const backtrackHint = getZipHint([sol[0], wrongCell], sol);
  assert.deepEqual(backtrackHint, {
    type: 'backtrack',
    backtrackCell: sol[0],
    divergedIndex: 1,
  });
});

test('applyZipCellInteraction never cuts or resets path when touching earlier segments of the line', () => {
  const size = 5;
  const numbers = new Array(25).fill(0);
  numbers[0] = 1;
  numbers[4] = 2;
  numbers[24] = 3;
  const hWalls = new Array(20).fill(false);
  const vWalls = new Array(20).fill(false);

  // Drawn line: 0 -> 1 -> 2 -> 7 -> 6 -> 5 (head = 5, prev = 6, older cells = 0,1,2,7)
  const path = [0, 1, 2, 7, 6, 5];

  // Touching older cell 0 (start of line) during move MUST NOT reset path
  const touchStartMove = applyZipCellInteraction(path, 0, 'move', size, numbers, hWalls, vWalls);
  assert.equal(touchStartMove.changed, false);
  assert.equal(touchStartMove.action, 'blocked-line');
  assert.deepEqual(touchStartMove.path, path);

  // Touching older cell 1 on pointerdown MUST NOT trim path
  const touchOldStart = applyZipCellInteraction(path, 1, 'start', size, numbers, hWalls, vWalls);
  assert.equal(touchOldStart.changed, false);
  assert.equal(touchOldStart.action, 'blocked-line');
  assert.deepEqual(touchOldStart.path, path);

  // Sliding back exactly 1 cell onto path[length - 2] (cell 6) smoothly backtracks by 1
  const backtrackOne = applyZipCellInteraction(path, 6, 'move', size, numbers, hWalls, vWalls);
  assert.equal(backtrackOne.changed, true);
  assert.equal(backtrackOne.action, 'backtrack');
  assert.deepEqual(backtrackOne.path, [0, 1, 2, 7, 6]);

  // Stepping onto legal neighbor of head (cell 10) extends cleanly
  const stepForward = applyZipCellInteraction(path, 10, 'move', size, numbers, hWalls, vWalls);
  assert.equal(stepForward.changed, true);
  assert.equal(stepForward.action, 'step');
  assert.deepEqual(stepForward.path, [...path, 10]);

  // Wall blocks move and keeps path stopped at head without resetting
  vWalls[5] = true; // wall between 5 (r=1,c=0) and 10 (r=2,c=0)
  const wallBlocked = applyZipCellInteraction(path, 10, 'move', size, numbers, hWalls, vWalls);
  assert.equal(wallBlocked.changed, false);
  assert.equal(wallBlocked.action, 'blocked');
  assert.deepEqual(wallBlocked.path, path);
});

test('simple Zip mode generates wall-free puzzles, accepts partial-grid completion, and provides BFS hints', () => {
  for (const size of [5, 6, 7] as ZipBoardSize[]) {
    const puzzle = generateZipPuzzle(size, 'simple');
    assert.equal(puzzle.mode, 'simple');
    assert.equal(puzzle.horizontalWalls.some(Boolean), false, 'Simple mode must have zero horizontal walls');
    assert.equal(puzzle.verticalWalls.some(Boolean), false, 'Simple mode must have zero vertical walls');
    assert.equal(
      isZipCompleted(
        puzzle.solutionPath,
        size,
        puzzle.numbers,
        puzzle.maxNumber,
        puzzle.horizontalWalls,
        puzzle.verticalWalls,
        'simple'
      ),
      true
    );
  }

  // Synthetic 5x5 simple completion without visiting all 25 cells: 1 at 0, 2 at 2, 3 at 4
  const nums = new Array(25).fill(0);
  nums[0] = 1;
  nums[2] = 2;
  nums[4] = 3;
  const hW = new Array(20).fill(false);
  const vW = new Array(20).fill(false);

  // Short path [0,1,2,3,4] completes in 'simple' mode, but NOT in 'classic' mode
  assert.equal(isZipCompleted([0, 1, 2, 3, 4], 5, nums, 3, hW, vW, 'simple'), true);
  assert.equal(isZipCompleted([0, 1, 2, 3, 4], 5, nums, 3, hW, vW, 'classic'), false);

  // Out-of-order or incomplete path fails in 'simple' mode
  assert.equal(isZipCompleted([0, 1, 2], 5, nums, 3, hW, vW, 'simple'), false);

  // Simple mode BFS hint navigates cleanly toward #2 even if player diverged from solutionPath
  const hint = getZipHint([0, 5], [0, 1, 2, 3, 4], {
    mode: 'simple',
    size: 5,
    numbers: nums,
    maxNumber: 3,
    horizontalWalls: hW,
    verticalWalls: vW,
  });
  assert.ok(hint && hint.type === 'next', 'Expected a forward BFS hint in simple mode');
});

test('standalone public/minisudoku.html Zip JS parses cleanly and generates unique puzzles', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/minisudoku.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
  assert.ok(scriptMatch && scriptMatch.length > 0);
  const mainScript = scriptMatch[scriptMatch.length - 1]
    .replace(/^<script>/, '')
    .replace(/<\/script>$/, '');

  transformSync(mainScript, { loader: 'js' });

  const startMarker = '// --- ZIP ENGINE & UI ---';
  const endMarker = "const zipBoardEl = document.getElementById('zip-board')";
  const startIdx = mainScript.indexOf(startMarker);
  const endIdx = mainScript.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx, 'Could not locate Zip engine section in minisudoku.html');

  const zipSlice = mainScript.slice(startIdx, endIdx);
  const sandbox: Record<string, unknown> = { Math, Array, Set, Map, Int32Array, Uint8Array };
  vm.createContext(sandbox);
  vm.runInContext(
    `${zipSlice}\nthis.__exports = { generateZipPuzzle, findZipSolutions };`,
    sandbox
  );

  const api = sandbox.__exports as {
    generateZipPuzzle: (size: number) => {
      size: number;
      numbers: number[];
      maxNumber: number;
      horizontalWalls: boolean[];
      verticalWalls: boolean[];
      solutionPath: number[];
    };
    findZipSolutions: (
      size: number,
      numbers: number[],
      hWalls: boolean[],
      vWalls: boolean[],
      limit?: number
    ) => { count: number; aborted: boolean };
  };

  for (const sz of [5, 6, 7]) {
    for (let i = 0; i < 4; i++) {
      const p = api.generateZipPuzzle(sz);
      assert.equal(p.solutionPath.length, sz * sz);
      const res = api.findZipSolutions(sz, p.numbers, p.horizontalWalls, p.verticalWalls, 2);
      assert.equal(res.aborted, false);
      assert.equal(res.count, 1, `minisudoku.html ${sz}x${sz} Zip puzzle #${i} non-unique (count=${res.count})`);
    }
  }
});
