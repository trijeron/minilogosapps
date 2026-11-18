import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { Difficulty } from '../src/types/sudoku';
import { EdgeType, TangoSymbol } from '../src/types/tango';
import {
  TANGO_SIZE,
  TANGO_TOTAL,
  H_EDGE_COUNT,
  V_EDGE_COUNT,
  getHorizontalEdgeIndex,
  getVerticalEdgeIndex,
  isValidTangoBoard,
  generateTangoSolution,
  solveTangoDeductive,
  countTangoSolutions,
  isTangoHumanSolvable,
  generateTangoPuzzle,
  findTangoConflicts,
  isTangoCompleted,
} from '../src/utils/tangoEngine';

const EMPTY_H: EdgeType[] = new Array(H_EDGE_COUNT).fill('none');
const EMPTY_V: EdgeType[] = new Array(V_EDGE_COUNT).fill('none');

test('generateTangoSolution produces 50 valid 6x6 Tango boards', () => {
  for (let i = 0; i < 50; i++) {
    const sol = generateTangoSolution();
    assert.equal(sol.length, TANGO_TOTAL);
    assert.equal(isValidTangoBoard(sol), true, `Solution #${i} should be valid`);
  }
});

test('isValidTangoBoard rejects invalid boards and edge violations', () => {
  const valid = generateTangoSolution();
  assert.equal(isValidTangoBoard(valid), true);

  // Incomplete cell
  const incomplete = [...valid];
  incomplete[0] = 0;
  assert.equal(isValidTangoBoard(incomplete), false);

  // 3 in a row vertically in column 1 (the historical bug)
  const threeVertical: TangoSymbol[] = [
    1, 1, 2, 1, 2, 2,
    2, 1, 1, 2, 1, 2,
    1, 2, 2, 1, 2, 1,
    2, 2, 1, 2, 1, 1,
    1, 2, 1, 2, 2, 1,
    2, 1, 2, 1, 1, 2,
  ];
  assert.equal(isValidTangoBoard(threeVertical), false);

  // Edge contradiction
  const hEdges = [...EMPTY_H];
  hEdges[getHorizontalEdgeIndex(0, 0)] = valid[0] === valid[1] ? 'opposite' : 'equal';
  assert.equal(isValidTangoBoard(valid, hEdges, EMPTY_V), false);
});

test('solveTangoDeductive solves basic Rule-of-3, balance, and edge clues', () => {
  const sol = generateTangoSolution();
  const hEdges = [...EMPTY_H];
  const vEdges = [...EMPTY_V];
  // Construct puzzle solvable by edge + rule-of-3 + line balance
  // Row 0: sol[0] given, chain of edges across row 0
  for (let c = 0; c < TANGO_SIZE - 1; c++) {
    hEdges[getHorizontalEdgeIndex(0, c)] = sol[c] === sol[c + 1] ? 'equal' : 'opposite';
  }
  const board: TangoSymbol[] = new Array(TANGO_TOTAL).fill(0);
  board[0] = sol[0];

  const partial = solveTangoDeductive(board, hEdges, vEdges, false);
  for (let c = 0; c < TANGO_SIZE; c++) {
    assert.equal(partial.grid[c], sol[c]);
  }
});

test('solveTangoDeductive handles single-line X....X pattern and rejects guessing-only boards', () => {
  // Single-line pattern test: [1, 0, 0, 0, 0, 1] -> [1, 2, 0, 0, 2, 1]
  // Because placing 1 at pos 1 or 4 would force three 2s or break balance/rule-of-3?
  // Wait: in [1, x, a, b, y, 1], if x=1 then a=2,b=?, cannot finish without breaking 3-in-a-row or balance:
  // Specifically all valid 6-cell Tango lines starting and ending with 1:
  // Let's verify X....X actually forces index 1 and 4 to 2!
  const board: TangoSymbol[] = new Array(TANGO_TOTAL).fill(0);
  board[0] = 1;
  board[5] = 1;
  const res = solveTangoDeductive(board, EMPTY_H, EMPTY_V, true);
  // If any valid line starts & ends with 1, let's verify index 1 and 4 are deduced as 2:
  assert.equal(res.grid[1], 2, 'X . . . . X must deduce index 1 = Moon');
  assert.equal(res.grid[4], 2, 'X . . . . X must deduce index 4 = Moon');

  // Empty board cannot be solved without guessing
  const emptyRes = solveTangoDeductive(new Array(TANGO_TOTAL).fill(0), EMPTY_H, EMPTY_V, true);
  assert.equal(emptyRes.solved, false);

  // Contradictory board must fail cleanly
  const badBoard: TangoSymbol[] = new Array(TANGO_TOTAL).fill(0);
  badBoard[0] = 1;
  badBoard[1] = 1;
  badBoard[2] = 1;
  const badRes = solveTangoDeductive(badBoard, EMPTY_H, EMPTY_V, true);
  assert.equal(badRes.solved, false);
});

test('generateTangoPuzzle produces 100% valid, unique, human-solvable puzzles across all difficulties', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const maxAllowedGivens: Record<Difficulty, number> = {
    easy: 14,
    medium: 11,
    hard: 9,
  };

  for (const diff of difficulties) {
    let totalGivens = 0;

    for (let i = 0; i < 50; i++) {
      const p = generateTangoPuzzle(diff);

      // 1. Valid complete solution matching all edge constraints
      assert.equal(
        isValidTangoBoard(p.solution, p.horizontalEdges, p.verticalEdges),
        true,
        `${diff} puzzle #${i} has invalid solution`
      );

      // 2. Initial board matches solution on given cells & has 0 otherwise
      let givenCount = 0;
      for (let idx = 0; idx < TANGO_TOTAL; idx++) {
        if (p.given[idx]) {
          givenCount++;
          assert.equal(
            p.initialBoard[idx],
            p.solution[idx],
            `${diff} puzzle #${i} given cell ${idx} mismatches solution`
          );
        } else {
          assert.equal(p.initialBoard[idx], 0, `${diff} puzzle #${i} non-given cell ${idx} should be 0`);
        }
      }
      totalGivens += givenCount;

      assert.ok(
        givenCount <= maxAllowedGivens[diff],
        `${diff} puzzle #${i} has too many givens (${givenCount} > ${maxAllowedGivens[diff]})`
      );

      // 3. No initial rule conflicts
      const initialConflicts = findTangoConflicts(
        p.initialBoard,
        p.solution,
        p.horizontalEdges,
        p.verticalEdges
      );
      assert.equal(
        initialConflicts.violatingCells.size,
        0,
        `${diff} puzzle #${i} has initial conflicts`
      );

      // 4. Strictly unique solution
      const solCount = countTangoSolutions(
        [...p.initialBoard],
        p.horizontalEdges,
        p.verticalEdges,
        2
      );
      assert.equal(solCount, 1, `${diff} puzzle #${i} does not have unique solution (found ${solCount})`);

      // 5. Solvable by pure deduction without guessing
      const deductive = solveTangoDeductive(
        p.initialBoard,
        p.horizontalEdges,
        p.verticalEdges,
        true
      );
      assert.equal(
        deductive.solved,
        true,
        `${diff} puzzle #${i} is not deductively solvable`
      );
      assert.deepEqual(
        deductive.grid,
        p.solution,
        `${diff} puzzle #${i} deductive solution differs from stored solution`
      );
      assert.equal(
        isTangoHumanSolvable(p.initialBoard, p.horizontalEdges, p.verticalEdges),
        true
      );

      // Easy must be solvable using basic rules only (no line enumeration needed)
      if (diff === 'easy') {
        const basicOnly = solveTangoDeductive(
          p.initialBoard,
          p.horizontalEdges,
          p.verticalEdges,
          false
        );
        assert.equal(
          basicOnly.solved,
          true,
          `easy puzzle #${i} required advanced line enumeration`
        );
      }

      // 6. Win condition check
      assert.equal(
        isTangoCompleted(p.solution, p.solution, p.horizontalEdges, p.verticalEdges),
        true
      );
      assert.equal(
        isTangoCompleted(p.initialBoard, p.solution, p.horizontalEdges, p.verticalEdges),
        false
      );
    }

    const avg = totalGivens / 50;
    assert.ok(avg >= 3 && avg <= maxAllowedGivens[diff], `${diff} avg givens out of bounds: ${avg}`);
  }
});

test('standalone public/minisudoku.html has valid JS syntax and working Tango generator', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/minisudoku.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
  assert.ok(scriptMatch && scriptMatch.length > 0, 'Expected inline <script> in minisudoku.html');

  // Verify every inline <script> block parses cleanly with esbuild
  for (let i = 0; i < scriptMatch.length; i++) {
    const code = scriptMatch[i].replace(/^<script>/, '').replace(/<\/script>$/, '');
    transformSync(code, { loader: 'js' });
  }

  // Extract pure Tango engine functions from the main script
  const mainScript = scriptMatch[scriptMatch.length - 1]
    .replace(/^<script>/, '')
    .replace(/<\/script>$/, '');
  const startMarker = 'function isValidTangoPlacement(';
  const endMarker = 'function generateQueens(';
  const startIdx = mainScript.indexOf(startMarker);
  const endIdx = mainScript.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx, 'Could not locate Tango engine section in minisudoku.html');

  const tangoSlice = mainScript.slice(startIdx, endIdx);
  const sandbox: Record<string, unknown> = { Math, Array, Set, Map };
  vm.createContext(sandbox);
  vm.runInContext(
    `${tangoSlice}\nthis.__exports = { isValidTangoBoard, countTangoSolutions, solveTangoDeductive, isTangoHumanSolvable, generateTango };`,
    sandbox
  );

  const api = sandbox.__exports as {
    isValidTangoBoard: (grid: number[], hEdges?: string[], vEdges?: string[]) => boolean;
    countTangoSolutions: (grid: number[], hEdges: string[], vEdges: string[], limit?: number) => number;
    solveTangoDeductive: (
      initialBoard: number[],
      hEdges: string[],
      vEdges: string[],
      allowLineEnumeration?: boolean
    ) => { solved: boolean; grid: number[]; usedLineEnum: boolean };
    isTangoHumanSolvable: (initialBoard: number[], hEdges: string[], vEdges: string[]) => boolean;
    generateTango: (diff: string) => {
      puzzle: number[];
      solution: number[];
      hEdges: string[];
      vEdges: string[];
    };
  };

  for (const diff of ['easy', 'medium', 'hard']) {
    for (let i = 0; i < 30; i++) {
      const p = api.generateTango(diff);
      assert.equal(
        api.isValidTangoBoard(p.solution, p.hEdges, p.vEdges),
        true,
        `minisudoku.html ${diff} #${i} has invalid solution`
      );
      const count = api.countTangoSolutions([...p.puzzle], p.hEdges, p.vEdges, 2);
      assert.equal(
        count,
        1,
        `minisudoku.html ${diff} #${i} non-unique solution count=${count}`
      );
      assert.equal(
        api.isTangoHumanSolvable(p.puzzle, p.hEdges, p.vEdges),
        true,
        `minisudoku.html ${diff} #${i} not human-solvable`
      );
      const solved = api.solveTangoDeductive(p.puzzle, p.hEdges, p.vEdges, true);
      assert.deepEqual(Array.from(solved.grid), Array.from(p.solution));

      if (diff === 'easy') {
        const basicOnly = api.solveTangoDeductive(p.puzzle, p.hEdges, p.vEdges, false);
        assert.equal(
          basicOnly.solved,
          true,
          `minisudoku.html easy #${i} required advanced line enumeration`
        );
      }

      const givens = p.puzzle.filter((x) => x !== 0).length;
      assert.ok(givens <= 14, `minisudoku.html ${diff} #${i} has too many givens (${givens})`);
    }
  }
});
