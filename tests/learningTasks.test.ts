import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import {
  buildTaskHistoryEntry,
  DEFAULT_ENGLISH_TASKS,
  DEFAULT_ENGLISH_TASKS_JSON,
  DEFAULT_LEARNING_GATE_SETTINGS,
  DEFAULT_TASK_HISTORY_ENTRY,
  getActiveLearningTasks,
  isFillAnswerCorrect,
  normalizeAnswerText,
  parseLearningTasksJson,
  selectTasksForBreak,
  summarizeTaskTypes,
} from '../src/utils/learningTasks';
import {
  deleteLearningTaskFromHistory,
  loadLearningGateSettings,
  loadLearningTaskHistory,
  saveLearningGateSettings,
  saveLearningTaskToHistory,
} from '../src/utils/storage';

test('DEFAULT_ENGLISH_TASKS parses cleanly and covers match, fill, and choice task types', () => {
  const parsed = parseLearningTasksJson(DEFAULT_ENGLISH_TASKS_JSON);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.tasks.length, DEFAULT_ENGLISH_TASKS.length);

  const types = new Set(parsed.tasks.map((t) => t.type));
  assert.equal(types.has('match'), true);
  assert.equal(types.has('fill'), true);
  assert.equal(types.has('choice'), true);
});

test('parseLearningTasksJson accepts { tasks: [...] } wrapper and choice "answer" shorthand', () => {
  const json = JSON.stringify({
    tasks: [
      {
        type: 'match',
        prompt: 'Spoj dvojice',
        pairs: [
          { left: 'One', right: '1' },
          { left: 'Two', right: '2' },
        ],
      },
      {
        type: 'fill',
        prompt: 'Přelož: pes',
        answers: ['dog', 'puppy'],
        hint: 'D _ _',
      },
      {
        type: 'choice',
        prompt: 'Vyber barvu nebe',
        options: ['Red', 'Blue', 'Green'],
        answer: 'blue',
      },
    ],
  });

  const res = parseLearningTasksJson(json);
  assert.equal(res.ok, true);
  assert.equal(res.tasks.length, 3);
  assert.equal(res.tasks[0].type, 'match');
  assert.equal(res.tasks[1].type, 'fill');
  if (res.tasks[1].type === 'fill') {
    assert.equal(res.tasks[1].answer, 'dog');
    assert.deepEqual(res.tasks[1].answers, ['dog', 'puppy']);
    assert.equal(res.tasks[1].hint, 'D _ _');
  }
  assert.equal(res.tasks[2].type, 'choice');
  if (res.tasks[2].type === 'choice') {
    assert.equal(res.tasks[2].correctIndex, 1);
  }
});

test('parseLearningTasksJson rejects malformed or incomplete task definitions', () => {
  const invalidPayloads = [
    '',
    '{ broken json',
    '{}',
    '[]',
    JSON.stringify([{ type: 'match', prompt: 'Missing pairs', pairs: [{ left: 'A', right: 'B' }] }]),
    JSON.stringify([{ type: 'fill', prompt: 'Missing answer' }]),
    JSON.stringify([{ type: 'choice', prompt: 'Bad index', options: ['A', 'B'], correctIndex: 5 }]),
    JSON.stringify([{ type: 'choice', prompt: 'Only 1 option', options: ['A'], correctIndex: 0 }]),
    JSON.stringify([{ type: 'unknown', prompt: 'Nope' }]),
  ];

  for (const payload of invalidPayloads) {
    const res = parseLearningTasksJson(payload);
    assert.equal(res.ok, false, `Expected failure for payload: ${payload}`);
    assert.ok(res.error && res.error.length > 0);
  }
});

test('isFillAnswerCorrect and normalizeAnswerText handle whitespace, case, and aliases', () => {
  assert.equal(normalizeAnswerText('  Thank   You '), 'thank you');

  const task = {
    type: 'fill' as const,
    prompt: 'Doplň',
    answer: 'apple',
    answers: ['an apple'],
  };

  assert.equal(isFillAnswerCorrect(task, 'APPLE'), true);
  assert.equal(isFillAnswerCorrect(task, '  an   Apple '), true);
  assert.equal(isFillAnswerCorrect(task, 'banana'), false);
  assert.equal(isFillAnswerCorrect(task, '   '), false);
});

test('selectTasksForBreak wraps around bank and getActiveLearningTasks falls back safely', () => {
  const fallback = getActiveLearningTasks({
    ...DEFAULT_LEARNING_GATE_SETTINGS,
    customJson: '{ invalid',
  });
  assert.equal(fallback.length, DEFAULT_ENGLISH_TASKS.length);

  const picked = selectTasksForBreak(DEFAULT_ENGLISH_TASKS.slice(0, 3), 2, 3);
  assert.equal(picked.length, 3);
  assert.equal(picked[0], DEFAULT_ENGLISH_TASKS[2]);
  assert.equal(picked[1], DEFAULT_ENGLISH_TASKS[0]);
  assert.equal(picked[2], DEFAULT_ENGLISH_TASKS[1]);
});

test('task history builder and sessionStorage persistence allow saving, selecting, and deleting previous sets', () => {
  const store = new Map<string, string>();
  const mockSessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  (globalThis as Record<string, unknown>).sessionStorage = mockSessionStorage;

  try {
    const initial = loadLearningTaskHistory();
    assert.equal(initial.length, 1);
    assert.equal(initial[0].id, DEFAULT_TASK_HISTORY_ENTRY.id);

    const customJson = JSON.stringify([
      { type: 'fill', prompt: 'Přelož: kočka', answer: 'cat' },
    ]);
    const entry = buildTaskHistoryEntry(customJson, 'Moje lekce 1');
    assert.ok(entry);
    assert.equal(entry.name, 'Moje lekce 1');
    assert.equal(entry.taskCount, 1);
    assert.equal(summarizeTaskTypes([{ type: 'fill', prompt: 'x', answer: 'y' }]), 'doplnění (1)');

    const afterSave = saveLearningTaskToHistory(entry);
    assert.equal(afterSave.length, 2);
    assert.equal(afterSave[0].name, 'Moje lekce 1');

    const loaded = loadLearningTaskHistory();
    assert.equal(loaded.length, 2);

    const afterDelete = deleteLearningTaskFromHistory(entry.id);
    assert.equal(afterDelete.length, 1);
    assert.equal(afterDelete[0].id, DEFAULT_TASK_HISTORY_ENTRY.id);
  } finally {
    delete (globalThis as Record<string, unknown>).sessionStorage;
  }
});

test('learning gate settings normalize 0-10 slider limits where 0 means never', () => {
  const store = new Map<string, string>();
  const mockSessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  (globalThis as Record<string, unknown>).sessionStorage = mockSessionStorage;

  try {
    saveLearningGateSettings({
      ...DEFAULT_LEARNING_GATE_SETTINGS,
      gamesLimit: 0,
      triggerByGames: false,
      minutesLimit: 7,
      triggerByMinutes: true,
    });
    const loaded = loadLearningGateSettings();
    assert.equal(loaded.gamesLimit, 0);
    assert.equal(loaded.triggerByGames, false);
    assert.equal(loaded.minutesLimit, 7);
    assert.equal(loaded.triggerByMinutes, true);

    // Out-of-range values are clamped to 0..10
    saveLearningGateSettings({
      ...DEFAULT_LEARNING_GATE_SETTINGS,
      gamesLimit: 25,
      triggerByGames: true,
      minutesLimit: -3,
      triggerByMinutes: true,
    });
    const clamped = loadLearningGateSettings();
    assert.equal(clamped.gamesLimit, 10);
    assert.equal(clamped.triggerByGames, true);
    assert.equal(clamped.minutesLimit, 0);
    assert.equal(clamped.triggerByMinutes, false);
  } finally {
    delete (globalThis as Record<string, unknown>).sessionStorage;
  }
});

test('standalone public/minisudoku.html compiles cleanly, uses sessionStorage, and validates all 3 types', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/minisudoku.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.equal(html.includes('localStorage'), false, 'minisudoku.html must use sessionStorage instead of localStorage');

  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
  assert.ok(scriptMatch && scriptMatch.length > 0);
  const mainScript = scriptMatch[scriptMatch.length - 1]
    .replace(/^<script>/, '')
    .replace(/<\/script>$/, '');

  // Verify the entire standalone HTML <script> parses cleanly
  transformSync(mainScript, { loader: 'js' });

  const startMarker = 'function parseGateTasksJson(raw) {';
  const endMarker = 'let gateRuntime = {';
  const startIdx = mainScript.indexOf(startMarker);
  const endIdx = mainScript.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx, 'Could not locate parseGateTasksJson in minisudoku.html');

  const slice = mainScript.slice(startIdx, endIdx);
  const sandbox: Record<string, unknown> = { Array, JSON, Object, String };
  vm.createContext(sandbox);
  vm.runInContext(`${slice}\nthis.__exports = { parseGateTasksJson };`, sandbox);

  const { parseGateTasksJson } = sandbox.__exports as {
    parseGateTasksJson: (raw: string) => { ok: boolean; tasks: unknown[]; error?: string };
  };

  const validRes = parseGateTasksJson(DEFAULT_ENGLISH_TASKS_JSON);
  assert.equal(validRes.ok, true);
  assert.equal(validRes.tasks.length, DEFAULT_ENGLISH_TASKS.length);

  const invalidRes = parseGateTasksJson('[{"type":"choice","prompt":"X","options":["A","B"],"correctIndex":9}]');
  assert.equal(invalidRes.ok, false);
});
