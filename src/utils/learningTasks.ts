import {
  ChoiceLearningTask,
  FillLearningTask,
  LearningGateSettings,
  LearningTask,
  LearningTaskHistoryEntry,
  MatchLearningTask,
} from '../types/learningGate';
import { Language } from '../i18n/LanguageContext';

export const DEFAULT_ENGLISH_TASKS: LearningTask[] = [
  {
    type: 'match',
    prompt: 'Spoj anglická slovíčka (zvířata) s českým překladem',
    pairs: [
      { left: 'Dog', right: 'Pes' },
      { left: 'Cat', right: 'Kočka' },
      { left: 'Bird', right: 'Pták' },
      { left: 'Fish', right: 'Ryba' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Doplň anglicky: Jablko = ____',
    answer: 'apple',
    hint: 'Začíná na A (5 písmen)',
  },
  {
    type: 'choice',
    prompt: 'Jak se anglicky řekne „červená“?',
    options: ['Blue', 'Red', 'Green', 'Yellow'],
    correctIndex: 1,
  },
  {
    type: 'match',
    prompt: 'Spoj barvy v angličtině a češtině',
    pairs: [
      { left: 'Blue', right: 'Modrá' },
      { left: 'Green', right: 'Zelená' },
      { left: 'White', right: 'Bílá' },
      { left: 'Black', right: 'Černá' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Doplň chybějící slovo: Good ____! (Dobré ráno!)',
    answer: 'morning',
    hint: 'Začíná na M',
  },
  {
    type: 'choice',
    prompt: 'Které anglické slovo znamená „škola“?',
    options: ['House', 'Book', 'School', 'Table'],
    correctIndex: 2,
  },
  {
    type: 'match',
    prompt: 'Spoj čísla v angličtině s číslicí',
    pairs: [
      { left: 'Three', right: '3' },
      { left: 'Five', right: '5' },
      { left: 'Seven', right: '7' },
      { left: 'Ten', right: '10' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Napiš anglicky překlad slova „voda“:',
    answer: 'water',
    hint: 'Začíná na W',
  },
  {
    type: 'choice',
    prompt: 'Co znamená anglické slovo „Sun“?',
    options: ['Měsíc', 'Hvězda', 'Mrak', 'Slunce'],
    correctIndex: 3,
  },
  {
    type: 'match',
    prompt: 'Spoj členy rodiny',
    pairs: [
      { left: 'Mother', right: 'Maminka' },
      { left: 'Father', right: 'Tatínek' },
      { left: 'Sister', right: 'Sestra' },
      { left: 'Brother', right: 'Bratr' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Doplň anglický tvar slovesa „být“: I ____ happy. (Jsem šťastný.)',
    answer: 'am',
    hint: '2 písmena',
  },
  {
    type: 'choice',
    prompt: 'Jak se anglicky řekne „děkuji“?',
    options: ['Please', 'Sorry', 'Thank you', 'Hello'],
    correctIndex: 2,
  },
];

export const DEFAULT_ENGLISH_TASKS_JSON = JSON.stringify(DEFAULT_ENGLISH_TASKS, null, 2);

export const DEFAULT_EN_QUIZ_TASKS: LearningTask[] = [
  {
    type: 'match',
    prompt: 'Match each animal with its habitat',
    pairs: [
      { left: 'Camel', right: 'Desert' },
      { left: 'Penguin', right: 'Antarctica' },
      { left: 'Dolphin', right: 'Ocean' },
      { left: 'Squirrel', right: 'Forest' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Complete the math equation: 7 × 8 = ____',
    answer: '56',
    hint: 'Between 50 and 60',
  },
  {
    type: 'choice',
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
  },
  {
    type: 'match',
    prompt: 'Match each country with its capital city',
    pairs: [
      { left: 'France', right: 'Paris' },
      { left: 'Japan', right: 'Tokyo' },
      { left: 'Czechia', right: 'Prague' },
      { left: 'Italy', right: 'Rome' },
    ],
  },
  {
    type: 'fill',
    prompt: 'Fill in the missing word: The opposite of "cold" is ____.',
    answer: 'hot',
    answers: ['hot', 'warm'],
    hint: '3 letters, starts with H',
  },
  {
    type: 'choice',
    prompt: 'How many sides does a hexagon have?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
  },
];

export const DEFAULT_EN_QUIZ_TASKS_JSON = JSON.stringify(DEFAULT_EN_QUIZ_TASKS, null, 2);

export const DEFAULT_LEARNING_GATE_SETTINGS: LearningGateSettings = {
  enabled: true,
  triggerByGames: true,
  gamesLimit: 3,
  triggerByMinutes: false,
  minutesLimit: 0,
  tasksPerBreak: 1,
  randomOrder: true,
  customJson: DEFAULT_ENGLISH_TASKS_JSON,
};

export interface ParseTasksResult {
  ok: boolean;
  tasks: LearningTask[];
  error?: string;
}

export function parseLearningTasksJson(
  rawJson: string,
  lang: Language = 'cs'
): ParseTasksResult {
  const isEn = lang === 'en';
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return {
      ok: false,
      tasks: [],
      error: isEn ? 'JSON task definition cannot be empty.' : 'JSON zadání nesmí být prázdné.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      ok: false,
      tasks: [],
      error: isEn
        ? `Invalid JSON format: ${err instanceof Error ? err.message : 'syntax error'}`
        : `Neplatný JSON formát: ${err instanceof Error ? err.message : 'chyba syntaxe'}`,
    };
  }

  let rawList: unknown;
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { tasks?: unknown }).tasks)
  ) {
    rawList = (parsed as { tasks: unknown[] }).tasks;
  } else {
    return {
      ok: false,
      tasks: [],
      error: isEn
        ? 'Root JSON must be a task array [...] or an object { "tasks": [...] }.'
        : 'Kořenový JSON musí být pole úkolů [...] nebo objekt { "tasks": [...] }.',
    };
  }

  const list = rawList as unknown[];
  if (list.length === 0) {
    return {
      ok: false,
      tasks: [],
      error: isEn
        ? 'Task list must contain at least 1 task.'
        : 'Seznam úkolů musí obsahovat alespoň 1 úkol.',
    };
  }

  const tasks: LearningTask[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const label = isEn ? `Task #${i + 1}` : `Úkol #${i + 1}`;
    if (!item || typeof item !== 'object') {
      return {
        ok: false,
        tasks: [],
        error: isEn ? `${label}: must be an object.` : `${label}: musí být objekt.`,
      };
    }
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    const prompt = typeof obj.prompt === 'string' ? obj.prompt.trim() : '';

    if (!prompt) {
      return {
        ok: false,
        tasks: [],
        error: isEn
          ? `${label}: missing prompt text ("prompt").`
          : `${label}: chybí text zadání ("prompt").`,
      };
    }

    if (type === 'match') {
      if (!Array.isArray(obj.pairs) || obj.pairs.length < 2) {
        return {
          ok: false,
          tasks: [],
          error: isEn
            ? `${label} (match): "pairs" array must have at least 2 { "left", "right" } pairs.`
            : `${label} (match): pole "pairs" musí obsahovat alespoň 2 dvojice { "left", "right" }.`,
        };
      }
      const pairs: { left: string; right: string }[] = [];
      for (let p = 0; p < obj.pairs.length; p++) {
        const pair = obj.pairs[p] as Record<string, unknown>;
        const left = pair && typeof pair.left === 'string' ? pair.left.trim() : '';
        const right = pair && typeof pair.right === 'string' ? pair.right.trim() : '';
        if (!left || !right) {
          return {
            ok: false,
            tasks: [],
            error: isEn
              ? `${label} (match): pair #${p + 1} must have non-empty "left" and "right".`
              : `${label} (match): dvojice #${p + 1} musí mít neprázdné "left" i "right".`,
          };
        }
        pairs.push({ left, right });
      }
      const task: MatchLearningTask = { type: 'match', prompt, pairs };
      tasks.push(task);
    } else if (type === 'fill') {
      const mainAns = typeof obj.answer === 'string' ? obj.answer.trim() : '';
      const extraAns = Array.isArray(obj.answers)
        ? obj.answers.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
        : [];
      const primary = mainAns || extraAns[0] || '';
      if (!primary) {
        return {
          ok: false,
          tasks: [],
          error: isEn
            ? `${label} (fill): missing correct answer ("answer").`
            : `${label} (fill): chybí správná odpověď ("answer").`,
        };
      }
      const task: FillLearningTask = {
        type: 'fill',
        prompt,
        answer: primary,
        ...(extraAns.length > 0 ? { answers: extraAns } : {}),
        ...(typeof obj.hint === 'string' && obj.hint.trim() ? { hint: obj.hint.trim() } : {}),
      };
      tasks.push(task);
    } else if (type === 'choice') {
      if (!Array.isArray(obj.options) || obj.options.length < 2) {
        return {
          ok: false,
          tasks: [],
          error: isEn
            ? `${label} (choice): "options" must contain at least 2 choices.`
            : `${label} (choice): "options" musí obsahovat alespoň 2 možnosti.`,
        };
      }
      const options = obj.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
      if (options.some((o) => !o)) {
        return {
          ok: false,
          tasks: [],
          error: isEn
            ? `${label} (choice): all items in "options" must be non-empty strings.`
            : `${label} (choice): všechny položky v "options" musí být neprázdný text.`,
        };
      }
      let correctIndex = -1;
      if (typeof obj.correctIndex === 'number' && Number.isInteger(obj.correctIndex)) {
        correctIndex = obj.correctIndex;
      } else if (typeof obj.answer === 'string') {
        const ansLower = obj.answer.trim().toLowerCase();
        correctIndex = options.findIndex((o) => o.toLowerCase() === ansLower);
      }
      if (correctIndex < 0 || correctIndex >= options.length) {
        return {
          ok: false,
          tasks: [],
          error: isEn
            ? `${label} (choice): specify a valid "correctIndex" (0 to ${options.length - 1}) or "answer".`
            : `${label} (choice): zadejte platné "correctIndex" (0 až ${options.length - 1}) nebo "answer".`,
        };
      }
      const task: ChoiceLearningTask = {
        type: 'choice',
        prompt,
        options,
        correctIndex,
      };
      tasks.push(task);
    } else {
      return {
        ok: false,
        tasks: [],
        error: isEn
          ? `${label}: unknown type "${String(type)}". Allowed types are "match", "fill", "choice".`
          : `${label}: neznámý typ "${String(type)}". Povolené typy jsou "match", "fill", "choice".`,
      };
    }
  }

  return { ok: true, tasks };
}

export function getActiveLearningTasks(settings: LearningGateSettings): LearningTask[] {
  const parsed = parseLearningTasksJson(settings.customJson);
  if (parsed.ok && parsed.tasks.length > 0) {
    return parsed.tasks;
  }
  return DEFAULT_ENGLISH_TASKS;
}

export function selectTasksForBreak(
  tasks: LearningTask[],
  cursor: number,
  count: number
): LearningTask[] {
  if (tasks.length === 0) return [DEFAULT_ENGLISH_TASKS[0]];
  const safeCount = Math.max(1, Math.min(10, Math.round(count)));
  const picked: LearningTask[] = [];
  for (let i = 0; i < safeCount; i++) {
    picked.push(tasks[(cursor + i) % tasks.length]);
  }
  return picked;
}

export interface DrawTasksResult {
  tasks: LearningTask[];
  nextCursor: number;
  nextRemainingOrder: number[];
}

function buildShuffledIndices(
  length: number,
  avoidFirstIndex: number | null,
  rng: () => number
): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (length > 1 && avoidFirstIndex !== null && arr[0] === avoidFirstIndex) {
    const swapIdx = 1 + Math.floor(rng() * (length - 1));
    [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
  }
  return arr;
}

export function drawTasksForBreak(
  tasks: LearningTask[],
  count: number,
  options: {
    randomOrder: boolean;
    taskCursor?: number;
    remainingOrder?: number[];
    rng?: () => number;
  }
): DrawTasksResult {
  const safeTasks = tasks.length > 0 ? tasks : [DEFAULT_ENGLISH_TASKS[0]];
  const safeCount = Math.max(1, Math.min(10, Math.round(count)));
  const cursor = Math.max(0, Math.floor(options.taskCursor ?? 0));

  if (!options.randomOrder) {
    const picked = selectTasksForBreak(safeTasks, cursor, safeCount);
    return {
      tasks: picked,
      nextCursor: (cursor + safeCount) % safeTasks.length,
      nextRemainingOrder: [],
    };
  }

  const rng = options.rng ?? Math.random;
  // Sanitize incoming remainingOrder: keep unique valid indices within bounds
  const seen = new Set<number>();
  const deck: number[] = [];
  if (Array.isArray(options.remainingOrder)) {
    for (const idx of options.remainingOrder) {
      if (
        typeof idx === 'number' &&
        Number.isInteger(idx) &&
        idx >= 0 &&
        idx < safeTasks.length &&
        !seen.has(idx)
      ) {
        seen.add(idx);
        deck.push(idx);
      }
    }
  }

  const picked: LearningTask[] = [];
  let lastIdx: number | null = null;

  for (let i = 0; i < safeCount; i++) {
    if (deck.length === 0) {
      deck.push(...buildShuffledIndices(safeTasks.length, lastIdx, rng));
    }
    const nextIdx = deck.shift()!;
    lastIdx = nextIdx;
    picked.push(safeTasks[nextIdx]);
  }

  return {
    tasks: picked,
    nextCursor: cursor,
    nextRemainingOrder: deck,
  };
}

export function normalizeAnswerText(val: string): string {
  return val.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isFillAnswerCorrect(task: FillLearningTask, userInput: string): boolean {
  const norm = normalizeAnswerText(userInput);
  if (!norm) return false;
  const accepted = [task.answer, ...(task.answers || [])];
  return accepted.some((ans) => normalizeAnswerText(ans) === norm);
}

export function summarizeTaskTypes(tasks: LearningTask[], lang: Language = 'cs'): string {
  const counts: Record<'match' | 'fill' | 'choice', number> = {
    match: 0,
    fill: 0,
    choice: 0,
  };
  for (const t of tasks) {
    counts[t.type]++;
  }
  const isEn = lang === 'en';
  const parts: string[] = [];
  if (counts.match > 0) parts.push(`${isEn ? 'match' : 'spojování'} (${counts.match})`);
  if (counts.fill > 0) parts.push(`${isEn ? 'fill' : 'doplnění'} (${counts.fill})`);
  if (counts.choice > 0) parts.push(`${isEn ? 'choice' : 'výběr'} (${counts.choice})`);
  return parts.join(' · ') || (isEn ? `${tasks.length} tasks` : `${tasks.length} úkolů`);
}

export function buildTaskHistoryEntry(
  rawJson: string,
  customName?: string,
  lang: Language = 'cs'
): LearningTaskHistoryEntry | null {
  const parsed = parseLearningTasksJson(rawJson, lang);
  if (!parsed.ok) return null;

  const trimmedName = (customName || '').trim();
  const formattedJson = rawJson.trim();
  const now = Date.now();
  const timeLabel = new Date(now).toLocaleTimeString(lang === 'en' ? 'en-US' : 'cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const firstPrompt =
    parsed.tasks[0]?.prompt?.trim() || (lang === 'en' ? 'Task set' : 'Sada úkolů');
  const shortPrompt =
    firstPrompt.length > 34 ? `${firstPrompt.slice(0, 34)}…` : firstPrompt;

  return {
    id: `hist_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName || `${shortPrompt} (${timeLabel})`,
    json: formattedJson,
    taskCount: parsed.tasks.length,
    typesSummary: summarizeTaskTypes(parsed.tasks, lang),
    savedAt: now,
  };
}

export const DEFAULT_TASK_HISTORY_ENTRY: LearningTaskHistoryEntry = {
  id: 'default_english_v1',
  name: 'Výchozí angličtina (12 úkolů)',
  json: DEFAULT_ENGLISH_TASKS_JSON,
  taskCount: DEFAULT_ENGLISH_TASKS.length,
  typesSummary: summarizeTaskTypes(DEFAULT_ENGLISH_TASKS),
  savedAt: 0,
};

export interface RemoteCatalogItem {
  name: string;
  url?: string;
  inlineJson?: string;
  taskCount?: number;
}

export type RemoteTasksParseResult =
  | {
      kind: 'tasks';
      name?: string;
      tasks: LearningTask[];
      normalizedJson: string;
    }
  | {
      kind: 'catalog';
      items: RemoteCatalogItem[];
    }
  | {
      kind: 'error';
      error: string;
    };

export function extractSetNameFromFilename(source: string): string {
  const cleaned = source.split('?')[0].split('#')[0].trim();
  if (!cleaned) return '';
  const segments = cleaned.replace(/\\/g, '/').split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    // keep raw segment
  }
  return decoded.replace(/\.(json|txt)$/i, '').trim();
}

export function extractSetNameFromJsonOrSource(
  rawJson: string,
  fallbackSource?: string
): string | undefined {
  try {
    const parsed = JSON.parse(rawJson);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as { name?: unknown }).name === 'string' &&
      (parsed as { name: string }).name.trim().length > 0
    ) {
      return (parsed as { name: string }).name.trim();
    }
  } catch {
    // fall through to filename
  }
  if (fallbackSource) {
    const fromSource = extractSetNameFromFilename(fallbackSource);
    if (fromSource) return fromSource;
  }
  return undefined;
}

export function validateTaskSourceUrl(
  input: string,
  lang: Language = 'cs'
): { ok: true; url: string } | { ok: false; error: string } {
  const isEn = lang === 'en';
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: isEn ? 'Enter the URL of a JSON file.' : 'Zadejte adresu (URL) JSON souboru.',
    };
  }
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return {
      ok: false,
      error: isEn
        ? 'Unsupported protocol. Use https://, http://, or a relative path (e.g. ./tasks.json).'
        : 'Nepodporovaný protokol. Použijte https://, http:// nebo relativní cestu (např. ./ukoly.json).',
    };
  }
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/')
  ) {
    return { ok: true, url: trimmed };
  }
  // Allow bare relative path like "tasks/anglictina.json" or domain like "ithonza.cz/games/ukoly.json"
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(trimmed)) {
    return { ok: true, url: `https://${trimmed}` };
  }
  return { ok: true, url: `./${trimmed}` };
}

export function resolveRelativeUrl(targetUrl: string, baseUrl?: string): string {
  const trimmed = targetUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const fallbackOrigin =
      typeof window !== 'undefined' && window.location?.href
        ? window.location.href
        : 'https://example.invalid/';
    const resolvedBase = baseUrl ? new URL(baseUrl, fallbackOrigin).href : fallbackOrigin;
    return new URL(trimmed, resolvedBase).href;
  } catch {
    return trimmed;
  }
}

export function parseRemoteTasksOrCatalog(
  rawJson: string,
  sourceUrl?: string,
  lang: Language = 'cs'
): RemoteTasksParseResult {
  const isEn = lang === 'en';
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return { kind: 'error', error: isEn ? 'Loaded file is empty.' : 'Načtený soubor je prázdný.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : isEn ? 'Invalid JSON syntax' : 'Neplatná syntaxe JSON';
    return { kind: 'error', error: isEn ? `Invalid JSON: ${msg}` : `Neplatný JSON: ${msg}` };
  }

  // Catalog format: { "sets": [ { "name": "...", "url": "..." } | { "name": "...", "tasks": [...] } ] }
  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    Array.isArray((parsed as { sets?: unknown }).sets)
  ) {
    const rawSets = (parsed as { sets: unknown[] }).sets;
    const items: RemoteCatalogItem[] = [];

    for (let i = 0; i < rawSets.length; i++) {
      const entry = rawSets[i];
      if (!entry || typeof entry !== 'object') continue;
      const obj = entry as Record<string, unknown>;
      const fallbackSetName = isEn ? `Set #${i + 1}` : `Sada #${i + 1}`;
      const name =
        typeof obj.name === 'string' && obj.name.trim().length > 0
          ? obj.name.trim()
          : typeof obj.url === 'string'
            ? extractSetNameFromFilename(obj.url) || fallbackSetName
            : fallbackSetName;

      if (typeof obj.url === 'string' && obj.url.trim().length > 0) {
        const checked = validateTaskSourceUrl(obj.url, lang);
        if (checked.ok) {
          items.push({
            name,
            url: resolveRelativeUrl(checked.url, sourceUrl),
          });
        }
      } else if (Array.isArray(obj.tasks)) {
        const inlineJson = JSON.stringify(obj.tasks, null, 2);
        const res = parseLearningTasksJson(inlineJson, lang);
        if (res.ok) {
          items.push({
            name,
            inlineJson,
            taskCount: res.tasks.length,
          });
        }
      }
    }

    if (items.length === 0) {
      return {
        kind: 'error',
        error: isEn
          ? 'Catalog "sets" contains no valid task sets.'
          : 'Katalog "sets" neobsahuje žádné platné sady úkolů.',
      };
    }

    return { kind: 'catalog', items };
  }

  // Standard single task set: [...] or { "name"?: "...", "tasks": [...] }
  const tasksRes = parseLearningTasksJson(trimmed, lang);
  if (!tasksRes.ok) {
    return {
      kind: 'error',
      error: tasksRes.error || (isEn ? 'Invalid task format.' : 'Neplatný formát úkolů.'),
    };
  }

  return {
    kind: 'tasks',
    name: extractSetNameFromJsonOrSource(trimmed, sourceUrl),
    tasks: tasksRes.tasks,
    normalizedJson: JSON.stringify(tasksRes.tasks, null, 2),
  };
}

export interface FillKeyboardLayout {
  keys: string[];
  hasSpace: boolean;
}

const LATIN_DISTRACTOR_POOL = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l',
  'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y',
];
const CZECH_DIACRITIC_POOL = ['á', 'č', 'é', 'ě', 'í', 'ř', 'š', 'ý', 'ž'];
const DIGIT_DISTRACTOR_POOL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Builds a shuffled on-screen keyboard containing all unique characters needed
 * for a fill-in-the-blank answer plus 1–2 extra distractor keys (ideal for mobile).
 */
export function buildFillKeyboardKeys(
  task: FillLearningTask,
  rng: () => number = Math.random
): FillKeyboardLayout {
  const normalized = task.answer.trim().replace(/\s+/g, ' ');
  const hasSpace = normalized.includes(' ');

  const uniqueChars: string[] = [];
  const seen = new Set<string>();
  for (const ch of Array.from(normalized)) {
    if (ch === ' ') continue;
    const key = ch.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueChars.push(key);
    }
  }

  const isNumericOnly =
    uniqueChars.length > 0 && uniqueChars.every((ch) => /^[0-9]$/.test(ch));
  const hasCzechChars = uniqueChars.some((ch) => /[áčďéěíňóřšťúůýž]/.test(ch));

  const basePool = isNumericOnly
    ? DIGIT_DISTRACTOR_POOL
    : hasCzechChars
    ? [...LATIN_DISTRACTOR_POOL, ...CZECH_DIACRITIC_POOL]
    : LATIN_DISTRACTOR_POOL;

  const availableDistractors = basePool.filter((ch) => !seen.has(ch));
  const desiredExtras =
    availableDistractors.length === 0
      ? 0
      : uniqueChars.length >= 9
      ? 1
      : rng() < 0.35
      ? 1
      : 2;
  const extraCount = Math.min(desiredExtras, availableDistractors.length);

  // Pick unique distractors using Fisher-Yates partial shuffle
  const poolCopy = [...availableDistractors];
  const extras: string[] = [];
  for (let i = 0; i < extraCount; i++) {
    const pickIdx = i + Math.floor(rng() * (poolCopy.length - i));
    [poolCopy[i], poolCopy[pickIdx]] = [poolCopy[pickIdx], poolCopy[i]];
    extras.push(poolCopy[i]);
  }

  const keys = [...uniqueChars, ...extras];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }

  // Avoid accidentally spelling out the exact answer left-to-right when shuffled
  const compactAnswer = normalized.replace(/\s+/g, '').toLowerCase();
  if (keys.length >= 2 && keys.join('') === compactAnswer) {
    [keys[0], keys[1]] = [keys[1], keys[0]];
  }

  return { keys, hasSpace };
}

/**
 * Generates a ready-to-paste initial prompt for creating a valid JSON task set
 * with the chosen subject area placed cleanly at the end.
 */
export function buildTaskGeneratorPrompt(
  topic: string,
  lang: Language = 'cs',
  taskCount: number = 12
): string {
  const safeCount = Math.max(3, Math.min(50, Math.round(taskCount || 12)));
  const cleanTopic = topic.trim();

  if (lang === 'en') {
    const topicLine = cleanTopic || '[ENTER SUBJECT AREA / TOPIC HERE]';
    return [
      `Create a set of ${safeCount} educational quiz tasks for a learning game.`,
      `Return ONLY valid JSON (no extra text or explanation before or after the JSON) using this exact structure:`,
      ``,
      `{`,
      `  "name": "Short set title",`,
      `  "tasks": [`,
      `    {`,
      `      "type": "match",`,
      `      "prompt": "Match the pairs",`,
      `      "pairs": [`,
      `        { "left": "Item A", "right": "Match A" },`,
      `        { "left": "Item B", "right": "Match B" },`,
      `        { "left": "Item C", "right": "Match C" },`,
      `        { "left": "Item D", "right": "Match D" }`,
      `      ]`,
      `    },`,
      `    {`,
      `      "type": "fill",`,
      `      "prompt": "Fill in the blank: ...",`,
      `      "answer": "word",`,
      `      "answers": ["word", "alternative"],`,
      `      "hint": "Short helpful hint"`,
      `    },`,
      `    {`,
      `      "type": "choice",`,
      `      "prompt": "Question text?",`,
      `      "options": ["Option A", "Option B", "Option C", "Option D"],`,
      `      "correctIndex": 1`,
      `    }`,
      `  ]`,
      `}`,
      ``,
      `Rules:`,
      `- Mix all three task types evenly ("match", "fill", "choice").`,
      `- For "match", include 3 to 4 unique pairs per task.`,
      `- For "fill", keep the answer short (1-2 words or a number) and add a brief hint.`,
      `- For "choice", include 4 options and set "correctIndex" (0 to 3) to the exact right option.`,
      `- Make sure every question has a single unambiguous correct answer.`,
      ``,
      `Topic / subject area for the questions: ${topicLine}`,
    ].join('\n');
  }

  const topicLine = cleanTopic || '[SEM DOPLŇTE OBLAST / TÉMA OTÁZEK]';
  return [
    `Vytvoř sadu ${safeCount} výukových úkolů pro vzdělávací hru.`,
    `Vrať POUZE platný JSON (bez dalšího textu nebo vysvětlování před ani za JSONem) přesně v tomto formátu:`,
    ``,
    `{`,
    `  "name": "Krátký název sady",`,
    `  "tasks": [`,
    `    {`,
    `      "type": "match",`,
    `      "prompt": "Spoj odpovídající dvojice",`,
    `      "pairs": [`,
    `        { "left": "Pojem A", "right": "Význam A" },`,
    `        { "left": "Pojem B", "right": "Význam B" },`,
    `        { "left": "Pojem C", "right": "Význam C" },`,
    `        { "left": "Pojem D", "right": "Význam D" }`,
    `      ]`,
    `    },`,
    `    {`,
    `      "type": "fill",`,
    `      "prompt": "Doplň chybějící slovo: ...",`,
    `      "answer": "slovo",`,
    `      "answers": ["slovo", "alternativa"],`,
    `      "hint": "Krátká nápověda"`,
    `    },`,
    `    {`,
    `      "type": "choice",`,
    `      "prompt": "Znění otázky?",`,
    `      "options": ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],`,
    `      "correctIndex": 1`,
    `    }`,
    `  ]`,
    `}`,
    ``,
    `Pravidla:`,
    `- Rovnoměrně střídej všechny 3 typy úloh ("match", "fill", "choice").`,
    `- U typu "match" dej do každé úlohy 3 až 4 jedinečné dvojice.`,
    `- U typu "fill" volte krátkou jednoznačnou odpověď (1–2 slova nebo číslo) a přidej stručnou nápovědu.`,
    `- U typu "choice" dej 4 možnosti a nastav "correctIndex" (0 až 3) na správnou možnost.`,
    `- Všechny otázky musí být jasné, věcně správné a bez překlepů.`,
    ``,
    `Oblast / téma, ze které budou otázky: ${topicLine}`,
  ].join('\n');
}

