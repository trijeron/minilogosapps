import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findConsistentQueensSolution,
  findQueensConflicts,
  isQueensCompleted,
} from '../src/utils/queensEngine';
import { QueensCellState } from '../src/types/queens';

// 6x6 board where horizontal rows form the 6 regions — admits multiple valid non-touching solutions
const HORIZONTAL_REGIONS_6 = Array.from({ length: 36 }, (_, idx) => Math.floor(idx / 6));

function boardFromQueenCols(size: number, colsByRow: number[]): QueensCellState[] {
  const board = new Array<QueensCellState>(size * size).fill(0);
  colsByRow.forEach((c, r) => {
    board[r * size + c] = 2;
  });
  return board;
}

test('isQueensCompleted accepts any valid rule-compliant solution even if it differs from solutionQueens', () => {
  const size = 6;
  const generatedSolution = [1, 3, 5, 0, 2, 4].map((c, r) => r * size + c);
  // Alternative valid solution (mirrored): [4, 2, 0, 5, 3, 1]
  const altCols = [4, 2, 0, 5, 3, 1];
  const altBoard = boardFromQueenCols(size, altCols);

  // Confirm it truly differs from the stored solutionQueens
  const altIndices = altCols.map((c, r) => r * size + c);
  assert.notDeepEqual(altIndices, generatedSolution);

  assert.equal(findQueensConflicts(altBoard, HORIZONTAL_REGIONS_6, size).allViolatingQueens.size, 0);
  assert.equal(
    isQueensCompleted(altBoard, HORIZONTAL_REGIONS_6, generatedSolution, size),
    true
  );
});

test('isQueensCompleted rejects incomplete boards or boards with rule violations', () => {
  const size = 6;
  const generatedSolution = [1, 3, 5, 0, 2, 4].map((c, r) => r * size + c);

  // Missing 1 queen (only 5 placed)
  const incompleteBoard = boardFromQueenCols(size, [1, 3, 5, 0, 2, 4]);
  incompleteBoard[5 * size + 4] = 0;
  assert.equal(
    isQueensCompleted(incompleteBoard, HORIZONTAL_REGIONS_6, generatedSolution, size),
    false
  );

  // Diagonal touch violation: (0,0) and (1,1) touch diagonally
  const touchingBoard = boardFromQueenCols(size, [0, 1, 3, 5, 2, 4]);
  assert.equal(
    isQueensCompleted(touchingBoard, HORIZONTAL_REGIONS_6, generatedSolution, size),
    false
  );

  // Region collision violation: put two queens in region 0 (using custom region map)
  const regionCollisionRegions = [...HORIZONTAL_REGIONS_6];
  regionCollisionRegions[1 * size + 3] = 0; // Same region as (0,1)
  const validShapeBoard = boardFromQueenCols(size, [1, 3, 5, 0, 2, 4]);
  assert.equal(
    isQueensCompleted(validShapeBoard, regionCollisionRegions, generatedSolution, size),
    false
  );
});

test('findConsistentQueensSolution completes a partially placed alternative solution without conflicts', () => {
  const size = 6;
  const partialBoard = new Array<QueensCellState>(36).fill(0);
  // Start placing the alternative solution [4, 2, 0, 5, 3, 1]
  partialBoard[0 * size + 4] = 2;
  partialBoard[1 * size + 2] = 2;

  const completed = findConsistentQueensSolution(partialBoard, HORIZONTAL_REGIONS_6, size);
  assert.ok(completed, 'Expected a consistent valid completion');
  assert.equal(completed!.length, size);
  assert.ok(completed!.includes(0 * size + 4));
  assert.ok(completed!.includes(1 * size + 2));

  const fullBoard = new Array<QueensCellState>(36).fill(0);
  completed!.forEach((idx) => {
    fullBoard[idx] = 2;
  });
  assert.equal(isQueensCompleted(fullBoard, HORIZONTAL_REGIONS_6, [], size), true);
});
