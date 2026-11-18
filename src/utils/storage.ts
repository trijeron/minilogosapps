import { BestTimes, Difficulty, SudokuState } from '../types/sudoku';
import { TangoState } from '../types/tango';
import { QueensState } from '../types/queens';
import {
  MahjongBestTimes,
  MahjongLayoutId,
  MahjongState,
  MahjongTheme,
} from '../types/mahjong';
import { MinibridgeViewMode } from '../types/minibridge';
import { ZipBestTimes, ZipState } from '../types/zip';
import { isValidTangoBoard, isTangoHumanSolvable } from './tangoEngine';

const GAME_STATE_KEY = 'minisudoku_saved_game_v1';
const BEST_TIMES_KEY = 'minisudoku_best_times_v1';

export function saveGameStateToStorage(state: SudokuState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Sudoku state:', err);
  }
}

export function loadGameStateFromStorage(): SudokuState | null {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Validate structural integrity of loaded state
    if (
      Array.isArray(parsed.board) &&
      parsed.board.length === 36 &&
      Array.isArray(parsed.solution) &&
      parsed.solution.length === 36 &&
      typeof parsed.difficulty === 'string'
    ) {
      return parsed as SudokuState;
    }
  } catch (err) {
    console.error('Failed to load Sudoku state:', err);
  }
  return null;
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear saved Sudoku state:', err);
  }
}

export function loadBestTimes(): BestTimes {
  const defaults: BestTimes = {
    easy: null,
    medium: null,
    hard: null,
  };
  try {
    const raw = localStorage.getItem(BEST_TIMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      easy: typeof parsed.easy === 'number' ? parsed.easy : null,
      medium: typeof parsed.medium === 'number' ? parsed.medium : null,
      hard: typeof parsed.hard === 'number' ? parsed.hard : null,
    };
  } catch {
    return defaults;
  }
}

export function saveBestTime(difficulty: Difficulty, seconds: number): BestTimes {
  const current = loadBestTimes();
  const prev = current[difficulty];
  if (prev === null || seconds < prev) {
    current[difficulty] = seconds;
    try {
      localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

// --- Tango Storage ---
const TANGO_STATE_KEY = 'tango_saved_game_v1';
const TANGO_BEST_TIMES_KEY = 'tango_best_times_v1';

export function saveTangoStateToStorage(state: TangoState): void {
  try {
    localStorage.setItem(TANGO_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Tango state:', err);
  }
}

export function loadTangoStateFromStorage(): TangoState | null {
  try {
    const raw = localStorage.getItem(TANGO_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.board) &&
      parsed.board.length === 36 &&
      Array.isArray(parsed.puzzle) &&
      parsed.puzzle.length === 36 &&
      Array.isArray(parsed.solution) &&
      parsed.solution.length === 36 &&
      Array.isArray(parsed.horizontalEdges) &&
      parsed.horizontalEdges.length === 30 &&
      Array.isArray(parsed.verticalEdges) &&
      parsed.verticalEdges.length === 30 &&
      typeof parsed.difficulty === 'string'
    ) {
      const valid =
        isValidTangoBoard(parsed.solution, parsed.horizontalEdges, parsed.verticalEdges) &&
        isTangoHumanSolvable(parsed.puzzle, parsed.horizontalEdges, parsed.verticalEdges);
      if (valid) {
        return parsed as TangoState;
      }
      localStorage.removeItem(TANGO_STATE_KEY);
    }
  } catch (err) {
    console.error('Failed to load Tango state:', err);
  }
  return null;
}

export function clearTangoSavedState(): void {
  try {
    localStorage.removeItem(TANGO_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Tango state:', err);
  }
}

export function loadTangoBestTimes(): BestTimes {
  const defaults: BestTimes = { easy: null, medium: null, hard: null };
  try {
    const raw = localStorage.getItem(TANGO_BEST_TIMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      easy: typeof parsed.easy === 'number' ? parsed.easy : null,
      medium: typeof parsed.medium === 'number' ? parsed.medium : null,
      hard: typeof parsed.hard === 'number' ? parsed.hard : null,
    };
  } catch {
    return defaults;
  }
}

export function saveTangoBestTime(difficulty: Difficulty, seconds: number): BestTimes {
  const current = loadTangoBestTimes();
  const prev = current[difficulty];
  if (prev === null || seconds < prev) {
    current[difficulty] = seconds;
    try {
      localStorage.setItem(TANGO_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

// --- Queens Storage ---
const QUEENS_STATE_KEY = 'queens_saved_game_v1';
const QUEENS_BEST_TIMES_KEY = 'queens_best_times_v1';

export function saveQueensStateToStorage(state: QueensState): void {
  try {
    localStorage.setItem(QUEENS_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Queens state:', err);
  }
}

export function loadQueensStateFromStorage(): QueensState | null {
  try {
    const raw = localStorage.getItem(QUEENS_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.board) &&
      parsed.board.length === 36 &&
      Array.isArray(parsed.regions) &&
      parsed.regions.length === 36 &&
      typeof parsed.difficulty === 'string'
    ) {
      return parsed as QueensState;
    }
  } catch (err) {
    console.error('Failed to load Queens state:', err);
  }
  return null;
}

export function clearQueensSavedState(): void {
  try {
    localStorage.removeItem(QUEENS_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Queens state:', err);
  }
}

export function loadQueensBestTimes(): BestTimes {
  const defaults: BestTimes = { easy: null, medium: null, hard: null };
  try {
    const raw = localStorage.getItem(QUEENS_BEST_TIMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      easy: typeof parsed.easy === 'number' ? parsed.easy : null,
      medium: typeof parsed.medium === 'number' ? parsed.medium : null,
      hard: typeof parsed.hard === 'number' ? parsed.hard : null,
    };
  } catch {
    return defaults;
  }
}

export function saveQueensBestTime(difficulty: Difficulty, seconds: number): BestTimes {
  const current = loadQueensBestTimes();
  const prev = current[difficulty];
  if (prev === null || seconds < prev) {
    current[difficulty] = seconds;
    try {
      localStorage.setItem(QUEENS_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

// --- Mahjong Storage ---
const MAHJONG_STATE_KEY = 'mahjong_saved_game_v1';
const MAHJONG_BEST_TIMES_KEY = 'mahjong_best_times_v1';

export function saveMahjongStateToStorage(state: MahjongState): void {
  try {
    localStorage.setItem(MAHJONG_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Mahjong state:', err);
  }
}

export function loadMahjongStateFromStorage(): MahjongState | null {
  try {
    const raw = localStorage.getItem(MAHJONG_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.tiles) &&
      parsed.tiles.length >= 72 &&
      typeof parsed.layout === 'string' &&
      typeof parsed.hintsLeft === 'number'
    ) {
      return parsed as MahjongState;
    }
  } catch (err) {
    console.error('Failed to load Mahjong state:', err);
  }
  return null;
}

export function clearMahjongSavedState(): void {
  try {
    localStorage.removeItem(MAHJONG_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Mahjong state:', err);
  }
}

export function loadMahjongBestTimes(): MahjongBestTimes {
  const defaults: MahjongBestTimes = { pyramid: null, bridge: null, turtle: null };
  try {
    const raw = localStorage.getItem(MAHJONG_BEST_TIMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      pyramid: typeof parsed.pyramid === 'number' ? parsed.pyramid : null,
      bridge: typeof parsed.bridge === 'number' ? parsed.bridge : null,
      turtle: typeof parsed.turtle === 'number' ? parsed.turtle : null,
    };
  } catch {
    return defaults;
  }
}

export function saveMahjongBestTime(
  layout: MahjongLayoutId,
  seconds: number
): MahjongBestTimes {
  const current = loadMahjongBestTimes();
  const prev = current[layout];
  if (prev === null || seconds < prev) {
    current[layout] = seconds;
    try {
      localStorage.setItem(MAHJONG_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

const MAHJONG_THEME_KEY = 'mahjong_theme_v1';

export function loadMahjongTheme(): MahjongTheme {
  try {
    const raw = localStorage.getItem(MAHJONG_THEME_KEY);
    if (raw === 'classic' || raw === 'comic' || raw === 'fairytale') return raw;
  } catch {
    // ignore
  }
  return 'comic';
}

export function saveMahjongTheme(theme: MahjongTheme): void {
  try {
    localStorage.setItem(MAHJONG_THEME_KEY, theme);
  } catch {
    // ignore
  }
}

const MAHJONG_ZOOM_KEY = 'mahjong_zoom_v1';

export function loadMahjongZoom(): number {
  try {
    const raw = localStorage.getItem(MAHJONG_ZOOM_KEY);
    if (!raw) return 100;
    const val = Number(raw);
    if (Number.isNaN(val)) return 100;
    const pct = val <= 3 ? Math.round(val * 100) : Math.round(val);
    if (pct >= 75 && pct <= 250) return pct;
  } catch {
    // ignore
  }
  return 100;
}

export function saveMahjongZoom(zoomPct: number): void {
  try {
    localStorage.setItem(MAHJONG_ZOOM_KEY, String(zoomPct));
  } catch {
    // ignore
  }
}

// --- Minibridge View Mode ---
const MINIBRIDGE_VIEW_MODE_KEY = 'minibridge_view_mode_v1';

export function loadMinibridgeViewMode(): MinibridgeViewMode {
  try {
    const raw = localStorage.getItem(MINIBRIDGE_VIEW_MODE_KEY);
    if (raw === 'fan' || raw === 'suits') return raw;
  } catch {
    // ignore
  }
  return 'fan';
}

export function saveMinibridgeViewMode(mode: MinibridgeViewMode): void {
  try {
    localStorage.setItem(MINIBRIDGE_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

// --- Zip Storage ---
const ZIP_STATE_KEY = 'zip_saved_game_v1';
const ZIP_BEST_TIMES_KEY = 'zip_best_times_v1';

export function saveZipStateToStorage(state: ZipState): void {
  try {
    localStorage.setItem(ZIP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Zip state:', err);
  }
}

export function loadZipStateFromStorage(): ZipState | null {
  try {
    const raw = localStorage.getItem(ZIP_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sz = parsed.size;
    if (
      (sz === 5 || sz === 6 || sz === 7) &&
      Array.isArray(parsed.numbers) &&
      parsed.numbers.length === sz * sz &&
      Array.isArray(parsed.solutionPath) &&
      parsed.solutionPath.length === sz * sz &&
      Array.isArray(parsed.horizontalWalls) &&
      Array.isArray(parsed.verticalWalls) &&
      Array.isArray(parsed.path)
    ) {
      return parsed as ZipState;
    }
  } catch (err) {
    console.error('Failed to load Zip state:', err);
  }
  return null;
}

export function clearZipSavedState(): void {
  try {
    localStorage.removeItem(ZIP_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Zip state:', err);
  }
}

export function loadZipBestTimes(): ZipBestTimes {
  const defaults: ZipBestTimes = { 5: null, 6: null, 7: null };
  try {
    const raw = localStorage.getItem(ZIP_BEST_TIMES_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      5: typeof parsed[5] === 'number' ? parsed[5] : null,
      6: typeof parsed[6] === 'number' ? parsed[6] : null,
      7: typeof parsed[7] === 'number' ? parsed[7] : null,
    };
  } catch {
    return defaults;
  }
}

export function saveZipBestTime(size: 5 | 6 | 7, seconds: number): ZipBestTimes {
  const current = loadZipBestTimes();
  const prev = current[size];
  if (prev === null || seconds < prev) {
    current[size] = seconds;
    try {
      localStorage.setItem(ZIP_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}




