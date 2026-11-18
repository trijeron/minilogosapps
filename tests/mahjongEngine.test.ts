import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { MahjongLayoutId, MahjongTile } from '../src/types/mahjong';
import {
  MAHJONG_MAX_HINTS,
  findMatchingPairs,
  generateSolvableMahjongBoard,
  getFreeTiles,
  getLayoutSlots,
  isSlotFree,
  isTileFree,
  pickHintPair,
  reshuffleRemainingTiles,
  tilesMatch,
} from '../src/utils/mahjongEngine';

/**
 * Bounded DFS solver to prove a board has at least one complete clearing sequence.
 */
function canClearBoard(initialTiles: MahjongTile[], maxSteps = 50000): boolean {
  let steps = 0;
  const visited = new Set<string>();

  function dfs(tiles: MahjongTile[]): boolean {
    if (++steps > maxSteps) return false;
    const active = tiles.filter((t) => !t.removed);
    if (active.length === 0) return true;

    const sig = active.map((t) => t.uid).join(',');
    if (visited.has(sig)) return false;
    visited.add(sig);

    const pairs = findMatchingPairs(tiles);
    if (pairs.length === 0) return false;

    const groupCounts = new Map<string, number>();
    for (const t of active) {
      groupCounts.set(t.def.matchGroup, (groupCounts.get(t.def.matchGroup) ?? 0) + 1);
    }

    // Any free pair whose matchGroup only has 2 tiles left on the board is 100% safe to take immediately
    const safePair = pairs.find(([a]) => groupCounts.get(a.def.matchGroup) === 2);
    if (safePair) {
      const next = tiles.map((t) =>
        t.uid === safePair[0].uid || t.uid === safePair[1].uid ? { ...t, removed: true } : t
      );
      return dfs(next);
    }

    pairs.sort((a, b) => b[0].z + b[1].z - (a[0].z + a[1].z));

    for (const [a, b] of pairs) {
      const next = tiles.map((t) =>
        t.uid === a.uid || t.uid === b.uid ? { ...t, removed: true } : t
      );
      if (dfs(next)) return true;
    }
    return false;
  }

  return dfs(initialTiles);
}

test('MAHJONG_MAX_HINTS is 10 and all layouts have valid even unique slots', () => {
  assert.equal(MAHJONG_MAX_HINTS, 10);

  const expected: Record<MahjongLayoutId, number> = {
    pyramid: 72,
    bridge: 96,
    turtle: 144,
  };

  for (const layout of ['pyramid', 'bridge', 'turtle'] as MahjongLayoutId[]) {
    const slots = getLayoutSlots(layout);
    assert.equal(slots.length, expected[layout], `${layout} slot count mismatch`);
    assert.equal(slots.length % 2, 0);

    const keys = new Set(slots.map((s) => `${s.x},${s.y},${s.z}`));
    assert.equal(keys.size, slots.length, `${layout} has duplicate slot coordinates`);
  }
});

test('isSlotFree enforces top-cover and left+right blocking rules', () => {
  // Middle tile sandwiched left and right on z=0
  const row = [
    { uid: 1, x: 0, y: 0, z: 0 },
    { uid: 2, x: 2, y: 0, z: 0 },
    { uid: 3, x: 4, y: 0, z: 0 },
  ];
  assert.equal(isSlotFree(row[0], row), true);
  assert.equal(isSlotFree(row[1], row), false);
  assert.equal(isSlotFree(row[2], row), true);

  // Tile covered from above by half-grid cap
  const stacked = [
    { uid: 1, x: 2, y: 2, z: 0 },
    { uid: 2, x: 3, y: 3, z: 1 },
  ];
  assert.equal(isSlotFree(stacked[0], stacked), false);
  assert.equal(isSlotFree(stacked[1], stacked), true);

  // Turtle apex and wing tips
  const turtle = generateSolvableMahjongBoard('turtle');
  const apex = turtle.find((t) => t.z === 4);
  const leftWing = turtle.find((t) => t.x === 0 && t.y === 7 && t.z === 0);
  const rightWingInner = turtle.find((t) => t.x === 26 && t.y === 7 && t.z === 0);
  const rightWingTip = turtle.find((t) => t.x === 28 && t.y === 7 && t.z === 0);

  assert.ok(apex && leftWing && rightWingInner && rightWingTip);
  assert.equal(isTileFree(apex, turtle), true);
  assert.equal(isTileFree(leftWing, turtle), true);
  assert.equal(isTileFree(rightWingTip, turtle), true);
  assert.equal(isTileFree(rightWingInner, turtle), false);
});

test('flowers match flowers and seasons match seasons across distinct kinds', () => {
  const turtle = generateSolvableMahjongBoard('turtle');
  const flowers = turtle.filter((t) => t.def.suit === 'flowers');
  const seasons = turtle.filter((t) => t.def.suit === 'seasons');

  assert.equal(flowers.length, 4);
  assert.equal(seasons.length, 4);

  assert.equal(tilesMatch(flowers[0].def, flowers[1].def), true);
  assert.equal(tilesMatch(seasons[0].def, seasons[3].def), true);
  assert.equal(tilesMatch(flowers[0].def, seasons[0].def), false);
});

test('generateSolvableMahjongBoard generates 100% solvable boards across all 3 layouts', () => {
  for (const layout of ['pyramid', 'bridge', 'turtle'] as MahjongLayoutId[]) {
    for (let i = 0; i < 12; i++) {
      const board = generateSolvableMahjongBoard(layout);
      const counts = new Map<string, number>();
      for (const t of board) {
        counts.set(t.def.matchGroup, (counts.get(t.def.matchGroup) ?? 0) + 1);
      }
      for (const [group, cnt] of counts.entries()) {
        assert.equal(cnt % 2, 0, `${layout} #${i} group ${group} has odd count ${cnt}`);
      }

      assert.ok(getFreeTiles(board).length >= 2);
      const hint = pickHintPair(board);
      assert.ok(hint !== null, `${layout} #${i} must have an initial hint pair`);
      assert.equal(tilesMatch(hint[0].def, hint[1].def), true);
      assert.equal(isTileFree(hint[0], board), true);
      assert.equal(isTileFree(hint[1], board), true);

      assert.equal(
        canClearBoard(board),
        true,
        `${layout} board #${i} should be completely clearable`
      );
    }
  }
});

test('reshuffleRemainingTiles preserves active tiles and yields a solvable board', () => {
  const board = generateSolvableMahjongBoard('pyramid');
  // Remove 5 pairs using hint picks
  let current = board;
  for (let i = 0; i < 5; i++) {
    const pair = pickHintPair(current);
    assert.ok(pair);
    current = current.map((t) =>
      t.uid === pair[0].uid || t.uid === pair[1].uid ? { ...t, removed: true } : t
    );
  }

  const remainingBefore = current.filter((t) => !t.removed).length;
  assert.equal(remainingBefore, 62);

  const reshuffled = reshuffleRemainingTiles(current);
  const remainingAfter = reshuffled.filter((t) => !t.removed).length;
  assert.equal(remainingAfter, 62);
  assert.ok(findMatchingPairs(reshuffled).length > 0);
  assert.equal(canClearBoard(reshuffled), true);
});

test('standalone public/minisudoku.html Mahjong JS parses cleanly and generates solvable boards', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/minisudoku.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
  assert.ok(scriptMatch && scriptMatch.length > 0);
  for (const block of scriptMatch) {
    transformSync(block.replace(/^<script>/, '').replace(/<\/script>$/, ''), { loader: 'js' });
  }

  const mainScript = scriptMatch[scriptMatch.length - 1]
    .replace(/^<script>/, '')
    .replace(/<\/script>$/, '');
  const startMarker = '// --- MAHJONG SOLITAIRE ENGINE & UI ---';
  const endMarker = "document.getElementById('mj-board').addEventListener";
  const startIdx = mainScript.indexOf(startMarker);
  const endIdx = mainScript.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx);

  const mjSlice = mainScript.slice(startIdx, endIdx);
  const noopEl = () => ({
    textContent: '',
    innerHTML: '',
    disabled: false,
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
  });
  const sandbox: Record<string, unknown> = {
    Math,
    Array,
    Set,
    Map,
    activeTab: 'sudoku',
    realTimeCheck: true,
    formatTime: (s: number) => String(s),
    sound: { play() {}, playVictory() {} },
    setTimeout: () => 0,
    clearTimeout: () => {},
    document: { getElementById: noopEl, querySelectorAll: () => [] },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `${mjSlice}\nthis.__mj = { MJ_MAX_HINTS, mjSlots, mjIsFree, mjFindPairs, mjPickHintPair, mjGenerate, mjReshuffle };`,
    sandbox
  );

  const api = sandbox.__mj as {
    MJ_MAX_HINTS: number;
    mjSlots: (l: string) => { x: number; y: number; z: number }[];
    mjFindPairs: (tiles: MahjongTile[]) => [MahjongTile, MahjongTile][];
    mjPickHintPair: (tiles: MahjongTile[]) => [MahjongTile, MahjongTile] | null;
    mjGenerate: (l: string) => MahjongTile[];
    mjReshuffle: (tiles: MahjongTile[]) => MahjongTile[];
  };

  assert.equal(api.MJ_MAX_HINTS, 10);
  assert.equal(api.mjSlots('pyramid').length, 72);
  assert.equal(api.mjSlots('bridge').length, 96);
  assert.equal(api.mjSlots('turtle').length, 144);

  for (const layout of ['pyramid', 'bridge', 'turtle']) {
    const tiles = api.mjGenerate(layout);
    const hint = api.mjPickHintPair(tiles);
    assert.ok(hint !== null, `Offline minisudoku.html ${layout} must have valid hint`);
    assert.equal(hint[0].def.matchGroup, hint[1].def.matchGroup);
    assert.ok(api.mjFindPairs(tiles).length > 0);
  }
});
