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
import {
  LearningGateProgress,
  LearningGateSettings,
  LearningTaskHistoryEntry,
} from '../types/learningGate';
import {
  DEFAULT_LEARNING_GATE_SETTINGS,
  DEFAULT_TASK_HISTORY_ENTRY,
} from './learningTasks';
import { isValidTangoBoard, isTangoHumanSolvable } from './tangoEngine';

const GAME_STATE_KEY = 'minisudoku_saved_game_v1';
const BEST_TIMES_KEY = 'minisudoku_best_times_v1';

export function saveGameStateToStorage(state: SudokuState): void {
  try {
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Sudoku state:', err);
  }
}

export function loadGameStateFromStorage(): SudokuState | null {
  try {
    const raw = sessionStorage.getItem(GAME_STATE_KEY);
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
    sessionStorage.removeItem(GAME_STATE_KEY);
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
    const raw = sessionStorage.getItem(BEST_TIMES_KEY);
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
      sessionStorage.setItem(BEST_TIMES_KEY, JSON.stringify(current));
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
    sessionStorage.setItem(TANGO_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Tango state:', err);
  }
}

export function loadTangoStateFromStorage(): TangoState | null {
  try {
    const raw = sessionStorage.getItem(TANGO_STATE_KEY);
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
      sessionStorage.removeItem(TANGO_STATE_KEY);
    }
  } catch (err) {
    console.error('Failed to load Tango state:', err);
  }
  return null;
}

export function clearTangoSavedState(): void {
  try {
    sessionStorage.removeItem(TANGO_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Tango state:', err);
  }
}

export function loadTangoBestTimes(): BestTimes {
  const defaults: BestTimes = { easy: null, medium: null, hard: null };
  try {
    const raw = sessionStorage.getItem(TANGO_BEST_TIMES_KEY);
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
      sessionStorage.setItem(TANGO_BEST_TIMES_KEY, JSON.stringify(current));
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
    sessionStorage.setItem(QUEENS_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Queens state:', err);
  }
}

export function loadQueensStateFromStorage(): QueensState | null {
  try {
    const raw = sessionStorage.getItem(QUEENS_STATE_KEY);
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
    sessionStorage.removeItem(QUEENS_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Queens state:', err);
  }
}

export function loadQueensBestTimes(): BestTimes {
  const defaults: BestTimes = { easy: null, medium: null, hard: null };
  try {
    const raw = sessionStorage.getItem(QUEENS_BEST_TIMES_KEY);
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
      sessionStorage.setItem(QUEENS_BEST_TIMES_KEY, JSON.stringify(current));
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
    sessionStorage.setItem(MAHJONG_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Mahjong state:', err);
  }
}

export function loadMahjongStateFromStorage(): MahjongState | null {
  try {
    const raw = sessionStorage.getItem(MAHJONG_STATE_KEY);
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
    sessionStorage.removeItem(MAHJONG_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Mahjong state:', err);
  }
}

export function loadMahjongBestTimes(): MahjongBestTimes {
  const defaults: MahjongBestTimes = { pyramid: null, bridge: null, turtle: null };
  try {
    const raw = sessionStorage.getItem(MAHJONG_BEST_TIMES_KEY);
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
      sessionStorage.setItem(MAHJONG_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

const MAHJONG_THEME_KEY = 'mahjong_theme_v1';

export function loadMahjongTheme(): MahjongTheme {
  try {
    const raw = sessionStorage.getItem(MAHJONG_THEME_KEY);
    if (raw === 'classic' || raw === 'comic' || raw === 'fairytale') return raw;
  } catch {
    // ignore
  }
  return 'comic';
}

export function saveMahjongTheme(theme: MahjongTheme): void {
  try {
    sessionStorage.setItem(MAHJONG_THEME_KEY, theme);
  } catch {
    // ignore
  }
}

const MAHJONG_ZOOM_KEY = 'mahjong_zoom_v1';

export function loadMahjongZoom(): number {
  try {
    const raw = sessionStorage.getItem(MAHJONG_ZOOM_KEY);
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
    sessionStorage.setItem(MAHJONG_ZOOM_KEY, String(zoomPct));
  } catch {
    // ignore
  }
}

// --- Minibridge View Mode ---
const MINIBRIDGE_VIEW_MODE_KEY = 'minibridge_view_mode_v1';

export function loadMinibridgeViewMode(): MinibridgeViewMode {
  try {
    const raw = sessionStorage.getItem(MINIBRIDGE_VIEW_MODE_KEY);
    if (raw === 'fan' || raw === 'suits') return raw;
  } catch {
    // ignore
  }
  return 'fan';
}

export function saveMinibridgeViewMode(mode: MinibridgeViewMode): void {
  try {
    sessionStorage.setItem(MINIBRIDGE_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

// --- Zip Storage ---
const ZIP_STATE_KEY = 'zip_saved_game_v1';
const ZIP_BEST_TIMES_KEY = 'zip_best_times_v1';

export function saveZipStateToStorage(state: ZipState): void {
  try {
    sessionStorage.setItem(ZIP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Zip state:', err);
  }
}

export function loadZipStateFromStorage(): ZipState | null {
  try {
    const raw = sessionStorage.getItem(ZIP_STATE_KEY);
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
    sessionStorage.removeItem(ZIP_STATE_KEY);
  } catch (err) {
    console.error('Failed to clear Zip state:', err);
  }
}

export function loadZipBestTimes(): ZipBestTimes {
  const defaults: ZipBestTimes = { 5: null, 6: null, 7: null };
  try {
    const raw = sessionStorage.getItem(ZIP_BEST_TIMES_KEY);
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
      sessionStorage.setItem(ZIP_BEST_TIMES_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

// --- Learning Gate Settings & Progress ---
const LEARNING_SETTINGS_KEY = 'learning_gate_settings_v1';
const LEARNING_PROGRESS_KEY = 'learning_gate_progress_v1';

export function loadLearningGateSettings(): LearningGateSettings {
  try {
    const raw = sessionStorage.getItem(LEARNING_SETTINGS_KEY);
    if (!raw) return DEFAULT_LEARNING_GATE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_LEARNING_GATE_SETTINGS.enabled,
      triggerByGames:
        typeof parsed.triggerByGames === 'boolean'
          ? parsed.triggerByGames
          : DEFAULT_LEARNING_GATE_SETTINGS.triggerByGames,
      gamesLimit:
        typeof parsed.gamesLimit === 'number' && parsed.gamesLimit >= 1 && parsed.gamesLimit <= 99
          ? Math.floor(parsed.gamesLimit)
          : DEFAULT_LEARNING_GATE_SETTINGS.gamesLimit,
      triggerByMinutes:
        typeof parsed.triggerByMinutes === 'boolean'
          ? parsed.triggerByMinutes
          : DEFAULT_LEARNING_GATE_SETTINGS.triggerByMinutes,
      minutesLimit:
        typeof parsed.minutesLimit === 'number' && parsed.minutesLimit >= 1 && parsed.minutesLimit <= 240
          ? Math.floor(parsed.minutesLimit)
          : DEFAULT_LEARNING_GATE_SETTINGS.minutesLimit,
      tasksPerBreak:
        typeof parsed.tasksPerBreak === 'number' && parsed.tasksPerBreak >= 1 && parsed.tasksPerBreak <= 5
          ? Math.floor(parsed.tasksPerBreak)
          : DEFAULT_LEARNING_GATE_SETTINGS.tasksPerBreak,
      customJson:
        typeof parsed.customJson === 'string' && parsed.customJson.trim().length > 0
          ? parsed.customJson
          : DEFAULT_LEARNING_GATE_SETTINGS.customJson,
    };
  } catch {
    return DEFAULT_LEARNING_GATE_SETTINGS;
  }
}

export function saveLearningGateSettings(settings: LearningGateSettings): void {
  try {
    sessionStorage.setItem(LEARNING_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save learning gate settings:', err);
  }
}

export function loadLearningGateProgress(): LearningGateProgress {
  const defaults: LearningGateProgress = {
    gamesSinceLastGate: 0,
    secondsSinceLastGate: 0,
    gatePending: false,
    taskCursor: 0,
  };
  try {
    const raw = sessionStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      gamesSinceLastGate:
        typeof parsed.gamesSinceLastGate === 'number' && parsed.gamesSinceLastGate >= 0
          ? Math.floor(parsed.gamesSinceLastGate)
          : 0,
      secondsSinceLastGate:
        typeof parsed.secondsSinceLastGate === 'number' && parsed.secondsSinceLastGate >= 0
          ? Math.floor(parsed.secondsSinceLastGate)
          : 0,
      gatePending: Boolean(parsed.gatePending),
      taskCursor:
        typeof parsed.taskCursor === 'number' && parsed.taskCursor >= 0
          ? Math.floor(parsed.taskCursor)
          : 0,
    };
  } catch {
    return defaults;
  }
}

export function saveLearningGateProgress(progress: LearningGateProgress): void {
  try {
    sessionStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save learning gate progress:', err);
  }
}

const LEARNING_TASK_HISTORY_KEY = 'learning_gate_task_history_v1';
const MAX_TASK_HISTORY_ENTRIES = 20;

export function loadLearningTaskHistory(): LearningTaskHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(LEARNING_TASK_HISTORY_KEY);
    if (!raw) return [DEFAULT_TASK_HISTORY_ENTRY];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_TASK_HISTORY_ENTRY];
    }
    const valid = parsed.filter(
      (item): item is LearningTaskHistoryEntry =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.json === 'string' &&
        typeof item.taskCount === 'number'
    );
    if (valid.length === 0) return [DEFAULT_TASK_HISTORY_ENTRY];
    return valid;
  } catch {
    return [DEFAULT_TASK_HISTORY_ENTRY];
  }
}

export function saveLearningTaskToHistory(
  entry: LearningTaskHistoryEntry
): LearningTaskHistoryEntry[] {
  const current = loadLearningTaskHistory();
  const normalizedTarget = entry.json.trim();
  const filtered = current.filter((item) => item.json.trim() !== normalizedTarget);
  const next = [entry, ...filtered].slice(0, MAX_TASK_HISTORY_ENTRIES);
  try {
    sessionStorage.setItem(LEARNING_TASK_HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save learning task history:', err);
  }
  return next;
}

export function deleteLearningTaskFromHistory(id: string): LearningTaskHistoryEntry[] {
  const current = loadLearningTaskHistory();
  const filtered = current.filter((item) => item.id !== id);
  const next = filtered.length > 0 ? filtered : [DEFAULT_TASK_HISTORY_ENTRY];
  try {
    sessionStorage.setItem(LEARNING_TASK_HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to update learning task history:', err);
  }
  return next;
}






