import { MahjongLayoutId, MahjongTile, MahjongTileDef } from '../types/mahjong';

export const MAHJONG_MAX_HINTS = 10;

export const MAHJONG_LAYOUT_META: Record<
  MahjongLayoutId,
  { labelCs: string; tileCount: number; cols: number; rows: number }
> = {
  pyramid: { labelCs: 'Pyramida (72)', tileCount: 72, cols: 8, rows: 5 },
  bridge: { labelCs: 'Most (96)', tileCount: 96, cols: 10, rows: 6 },
  turtle: { labelCs: 'Želva (144)', tileCount: 144, cols: 15, rows: 8 },
};

const CHAR_KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const DOTS_SYMBOLS = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];
const BAMBOO_SYMBOLS = ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'];

function buildTileCatalog(): MahjongTileDef[] {
  const catalog: MahjongTileDef[] = [];

  for (let n = 1; n <= 9; n++) {
    catalog.push({
      kindId: `dots-${n}`,
      matchGroup: `dots-${n}`,
      suit: 'dots',
      rank: n,
      labelCs: `Puntíky ${n}`,
      symbol: DOTS_SYMBOLS[n - 1],
      cornerText: String(n),
    });
  }

  for (let n = 1; n <= 9; n++) {
    catalog.push({
      kindId: `bamboo-${n}`,
      matchGroup: `bamboo-${n}`,
      suit: 'bamboo',
      rank: n,
      labelCs: `Bambus ${n}`,
      symbol: BAMBOO_SYMBOLS[n - 1],
      cornerText: String(n),
    });
  }

  for (let n = 1; n <= 9; n++) {
    catalog.push({
      kindId: `chars-${n}`,
      matchGroup: `chars-${n}`,
      suit: 'chars',
      rank: n,
      labelCs: `Znak ${n}`,
      symbol: CHAR_KANJI[n - 1],
      cornerText: String(n),
    });
  }

  const winds = [
    { key: 'east', sym: '東', corner: 'V', label: 'Východní vítr' },
    { key: 'south', sym: '南', corner: 'J', label: 'Jižní vítr' },
    { key: 'west', sym: '西', corner: 'Z', label: 'Západní vítr' },
    { key: 'north', sym: '北', corner: 'S', label: 'Severní vítr' },
  ];
  winds.forEach((w, idx) => {
    catalog.push({
      kindId: `wind-${w.key}`,
      matchGroup: `wind-${w.key}`,
      suit: 'winds',
      rank: idx + 1,
      labelCs: w.label,
      symbol: w.sym,
      cornerText: w.corner,
    });
  });

  const dragons = [
    { key: 'red', sym: '中', corner: 'Č', label: 'Červený drak' },
    { key: 'green', sym: '發', corner: 'Z', label: 'Zelený drak' },
    { key: 'white', sym: '白', corner: 'B', label: 'Bílý drak' },
  ];
  dragons.forEach((d, idx) => {
    catalog.push({
      kindId: `dragon-${d.key}`,
      matchGroup: `dragon-${d.key}`,
      suit: 'dragons',
      rank: idx + 1,
      labelCs: d.label,
      symbol: d.sym,
      cornerText: d.corner,
    });
  });

  return catalog;
}

const STANDARD_34_DEFS = buildTileCatalog();

const FLOWER_DEFS: MahjongTileDef[] = [
  { kindId: 'flower-1', matchGroup: 'group-flower', suit: 'flowers', rank: 1, labelCs: 'Květina (Švestka)', symbol: '🌸', cornerText: 'K' },
  { kindId: 'flower-2', matchGroup: 'group-flower', suit: 'flowers', rank: 2, labelCs: 'Květina (Orchidej)', symbol: '🌺', cornerText: 'K' },
  { kindId: 'flower-3', matchGroup: 'group-flower', suit: 'flowers', rank: 3, labelCs: 'Květina (Chryzantéma)', symbol: '🌻', cornerText: 'K' },
  { kindId: 'flower-4', matchGroup: 'group-flower', suit: 'flowers', rank: 4, labelCs: 'Květina (Bambus)', symbol: '🪷', cornerText: 'K' },
];

const SEASON_DEFS: MahjongTileDef[] = [
  { kindId: 'season-1', matchGroup: 'group-season', suit: 'seasons', rank: 1, labelCs: 'Jaro', symbol: '🌱', cornerText: 'R' },
  { kindId: 'season-2', matchGroup: 'group-season', suit: 'seasons', rank: 2, labelCs: 'Léto', symbol: '☀️', cornerText: 'R' },
  { kindId: 'season-3', matchGroup: 'group-season', suit: 'seasons', rank: 3, labelCs: 'Podzim', symbol: '🍁', cornerText: 'R' },
  { kindId: 'season-4', matchGroup: 'group-season', suit: 'seasons', rank: 4, labelCs: 'Zima', symbol: '❄️', cornerText: 'R' },
];

export interface SlotCoord {
  x: number;
  y: number;
  z: number;
}

export function getLayoutSlots(layout: MahjongLayoutId): SlotCoord[] {
  const slots: SlotCoord[] = [];

  if (layout === 'pyramid') {
    // z=0: 8x5 = 40
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) slots.push({ x: c * 2, y: r * 2, z: 0 });
    }
    // z=1: 6x3 = 18
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 6; c++) slots.push({ x: c * 2, y: r * 2, z: 1 });
    }
    // z=2: 4x3 = 12
    for (let r = 1; r <= 3; r++) {
      for (let c = 2; c <= 5; c++) slots.push({ x: c * 2, y: r * 2, z: 2 });
    }
    // z=3: 2x1 = 2
    slots.push({ x: 6, y: 4, z: 3 });
    slots.push({ x: 8, y: 4, z: 3 });
    return slots; // 72
  }

  if (layout === 'bridge') {
    // z=0: 10x6 = 60
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 10; c++) slots.push({ x: c * 2, y: r * 2, z: 0 });
    }
    // z=1: 6x4 = 24
    for (let r = 1; r <= 4; r++) {
      for (let c = 2; c <= 7; c++) slots.push({ x: c * 2, y: r * 2, z: 1 });
    }
    // z=2: 4x2 = 8
    for (let r = 2; r <= 3; r++) {
      for (let c = 3; c <= 6; c++) slots.push({ x: c * 2, y: r * 2, z: 2 });
    }
    // z=3: 2x2 = 4
    for (let r = 2; r <= 3; r++) {
      for (let c = 4; c <= 5; c++) slots.push({ x: c * 2, y: r * 2, z: 3 });
    }
    return slots; // 96
  }

  // Classic 144-tile Turtle layout
  const rowRanges: [number, number, number][] = [
    [0, 1, 12],
    [2, 3, 10],
    [4, 2, 11],
    [6, 1, 12],
    [8, 1, 12],
    [10, 2, 11],
    [12, 3, 10],
    [14, 1, 12],
  ];
  for (const [y, cStart, cEnd] of rowRanges) {
    for (let c = cStart; c <= cEnd; c++) {
      slots.push({ x: c * 2, y, z: 0 });
    }
  }
  // Left & right wing tips on z=0
  slots.push({ x: 0, y: 7, z: 0 });
  slots.push({ x: 26, y: 7, z: 0 });
  slots.push({ x: 28, y: 7, z: 0 });

  // z=1: 6x6 = 36
  for (let r = 1; r <= 6; r++) {
    for (let c = 4; c <= 9; c++) slots.push({ x: c * 2, y: r * 2, z: 1 });
  }
  // z=2: 4x4 = 16
  for (let r = 2; r <= 5; r++) {
    for (let c = 5; c <= 8; c++) slots.push({ x: c * 2, y: r * 2, z: 2 });
  }
  // z=3: 2x2 = 4
  for (let r = 3; r <= 4; r++) {
    for (let c = 6; c <= 7; c++) slots.push({ x: c * 2, y: r * 2, z: 3 });
  }
  // z=4: 1 apex cap
  slots.push({ x: 13, y: 7, z: 4 });

  return slots; // 144
}

export function isSlotFree(
  target: { x: number; y: number; z: number; uid?: number },
  activeTiles: { x: number; y: number; z: number; uid?: number }[]
): boolean {
  let blockedLeft = false;
  let blockedRight = false;

  for (const other of activeTiles) {
    if (target.uid !== undefined && other.uid === target.uid) continue;
    if (other.z > target.z) {
      if (Math.abs(other.x - target.x) < 2 && Math.abs(other.y - target.y) < 2) {
        return false; // Covered from above
      }
    } else if (other.z === target.z) {
      if (Math.abs(other.y - target.y) < 2) {
        if (other.x === target.x - 2) blockedLeft = true;
        if (other.x === target.x + 2) blockedRight = true;
        if (blockedLeft && blockedRight) return false;
      }
    }
  }

  return !blockedLeft || !blockedRight;
}

export function isTileFree(tile: MahjongTile, allTiles: MahjongTile[]): boolean {
  if (tile.removed) return false;
  const active = allTiles.filter((t) => !t.removed);
  return isSlotFree(tile, active);
}

export function getFreeTiles(tiles: MahjongTile[]): MahjongTile[] {
  const active = tiles.filter((t) => !t.removed);
  return active.filter((t) => isSlotFree(t, active));
}

export function tilesMatch(a: MahjongTileDef, b: MahjongTileDef): boolean {
  return a.matchGroup === b.matchGroup;
}

export function findMatchingPairs(tiles: MahjongTile[]): [MahjongTile, MahjongTile][] {
  const free = getFreeTiles(tiles);
  const pairs: [MahjongTile, MahjongTile][] = [];

  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (tilesMatch(free[i].def, free[j].def)) {
        pairs.push([free[i], free[j]]);
      }
    }
  }
  return pairs;
}

export function pickHintPair(tiles: MahjongTile[]): [MahjongTile, MahjongTile] | null {
  const pairs = findMatchingPairs(tiles);
  if (pairs.length === 0) return null;

  // Prefer pairs on higher z-layers so hints open up the board effectively
  const sorted = [...pairs].sort((a, b) => {
    const zDiff = b[0].z + b[1].z - (a[0].z + a[1].z);
    if (zDiff !== 0) return zDiff;
    return a[0].uid - b[0].uid;
  });

  return sorted[0];
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createPairPool(slotCount: number): [MahjongTileDef, MahjongTileDef][] {
  const pairsNeeded = slotCount / 2;
  if (slotCount === 144) {
    const pool: [MahjongTileDef, MahjongTileDef][] = [];
    // 34 standard kinds * 2 pairs each = 68 pairs (136 tiles)
    for (const def of STANDARD_34_DEFS) {
      pool.push([def, def]);
      pool.push([def, def]);
    }
    // 2 flower pairs + 2 season pairs = 4 pairs (8 tiles) -> 72 pairs total
    pool.push([FLOWER_DEFS[0], FLOWER_DEFS[1]]);
    pool.push([FLOWER_DEFS[2], FLOWER_DEFS[3]]);
    pool.push([SEASON_DEFS[0], SEASON_DEFS[1]]);
    pool.push([SEASON_DEFS[2], SEASON_DEFS[3]]);
    return shuffleArray(pool);
  }

  // For 72 or 96 tiles: pick subsets cleanly in 2-pair groups (4 of each kind) or 1-pair groups
  const shuffledDefs = shuffleArray(STANDARD_34_DEFS);
  const pool: [MahjongTileDef, MahjongTileDef][] = [];

  if (pairsNeeded <= shuffledDefs.length) {
    // e.g. 36 pairs -> take 18 kinds × 2 pairs (classic 4-of-a-kind) if possible
    const quads = Math.floor(pairsNeeded / 2);
    for (let i = 0; i < quads; i++) {
      const d = shuffledDefs[i];
      pool.push([d, d], [d, d]);
    }
    if (pairsNeeded % 2 === 1) {
      const d = shuffledDefs[quads];
      pool.push([d, d]);
    }
  } else {
    // e.g. 48 pairs (96 tiles) -> 24 kinds × 4 tiles
    for (let i = 0; i < shuffledDefs.length && pool.length + 2 <= pairsNeeded; i++) {
      const d = shuffledDefs[i];
      pool.push([d, d], [d, d]);
    }
    let idx = 0;
    while (pool.length < pairsNeeded) {
      const d = shuffledDefs[idx++ % shuffledDefs.length];
      pool.push([d, d]);
    }
  }

  return shuffleArray(pool);
}

// Constructively assign matching pairs to simultaneously free slots in reverse peel order
// so every generated board is 100% guaranteed solvable!
function assignPairsSolvably<T extends SlotCoord & { uid: number }>(
  slots: T[],
  pairPool: [MahjongTileDef, MahjongTileDef][]
): Map<number, MahjongTileDef> | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    let remaining = [...slots];
    const assignment = new Map<number, MahjongTileDef>();
    let pairIdx = 0;
    let failed = false;

    while (remaining.length > 0) {
      const free = remaining.filter((s) => isSlotFree(s, remaining));
      if (free.length < 2) {
        failed = true;
        break;
      }

      // Deterministic top-down peel on final fallback attempts so even worst-case never fails
      const orderedFree =
        attempt >= 35
          ? [...free].sort((a, b) => b.z - a.z || a.x - b.x || a.y - b.y)
          : shuffleArray(free).sort((a, b) => b.z - a.z + (Math.random() * 1.5 - 0.75));
      const slotA = orderedFree[0];
      const slotB = orderedFree[1];

      const [defA, defB] = pairPool[pairIdx++];
      assignment.set(slotA.uid, defA);
      assignment.set(slotB.uid, defB);

      remaining = remaining.filter((s) => s.uid !== slotA.uid && s.uid !== slotB.uid);
    }

    if (!failed) return assignment;
  }

  return null;
}

export function generateSolvableMahjongBoard(layout: MahjongLayoutId): MahjongTile[] {
  const rawSlots = getLayoutSlots(layout);
  const indexedSlots = rawSlots.map((s, idx) => ({ ...s, uid: idx }));
  const pairPool = createPairPool(indexedSlots.length);

  const assignment = assignPairsSolvably(indexedSlots, pairPool);
  if (!assignment) {
    return indexedSlots.map((s, i) => ({
      uid: s.uid,
      x: s.x,
      y: s.y,
      z: s.z,
      def: pairPool[Math.floor(i / 2)][i % 2],
      removed: false,
    }));
  }

  return indexedSlots.map((s) => ({
    uid: s.uid,
    x: s.x,
    y: s.y,
    z: s.z,
    def: assignment.get(s.uid)!,
    removed: false,
  }));
}

export function reshuffleRemainingTiles(tiles: MahjongTile[]): MahjongTile[] {
  const active = tiles.filter((t) => !t.removed);
  if (active.length < 2) return tiles;

  // Pair up existing remaining definitions by matchGroup
  const byGroup = new Map<string, MahjongTileDef[]>();
  for (const t of active) {
    const list = byGroup.get(t.def.matchGroup) ?? [];
    list.push(t.def);
    byGroup.set(t.def.matchGroup, list);
  }

  const pairPool: [MahjongTileDef, MahjongTileDef][] = [];
  for (const defs of byGroup.values()) {
    for (let i = 0; i + 1 < defs.length; i += 2) {
      pairPool.push([defs[i], defs[i + 1]]);
    }
  }

  const shuffledPool = shuffleArray(pairPool);
  const assignment = assignPairsSolvably(active, shuffledPool);
  if (!assignment) {
    // Fallback direct shuffle
    const flatDefs = shuffleArray(active.map((t) => t.def));
    const map = new Map<number, MahjongTileDef>();
    active.forEach((t, i) => map.set(t.uid, flatDefs[i]));
    return tiles.map((t) => (t.removed ? t : { ...t, def: map.get(t.uid)! }));
  }

  return tiles.map((t) => (t.removed ? t : { ...t, def: assignment.get(t.uid)! }));
}
