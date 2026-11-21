import test from 'node:test';
import assert from 'node:assert/strict';
import { getDifficultyLabel } from '../src/utils/format';
import { REGION_COLORS } from '../src/utils/queensEngine';
import {
  getSeatInitial,
  getSeatLabel,
  getSeatShortLabel,
  getSuitLabel,
  getTrumpLabel,
  getTrumpShortLabel,
  recommendContract,
} from '../src/utils/minibridgeEngine';
import {
  getMahjongLayoutLabel,
  getMahjongTileCorner,
  getMahjongTileLabel,
} from '../src/utils/mahjongEngine';
import { formatZipReason } from '../src/utils/zipEngine';
import {
  DEFAULT_EN_QUIZ_TASKS,
  DEFAULT_EN_QUIZ_TASKS_JSON,
  isFillAnswerCorrect,
  parseLearningTasksJson,
  summarizeTaskTypes,
  validateTaskSourceUrl,
} from '../src/utils/learningTasks';
import { Card } from '../src/types/minibridge';
import { MahjongTileDef } from '../src/types/mahjong';

test('getDifficultyLabel returns localized Czech and English labels', () => {
  assert.equal(getDifficultyLabel('easy', 'cs'), 'Lehká');
  assert.equal(getDifficultyLabel('medium', 'cs'), 'Střední');
  assert.equal(getDifficultyLabel('hard', 'cs'), 'Těžká');

  assert.equal(getDifficultyLabel('easy', 'en'), 'Easy');
  assert.equal(getDifficultyLabel('medium', 'en'), 'Medium');
  assert.equal(getDifficultyLabel('hard', 'en'), 'Hard');
});

test('Queens REGION_COLORS provides both Czech and English region names', () => {
  assert.ok(REGION_COLORS.length >= 9);
  for (const color of REGION_COLORS) {
    assert.ok(color.name.length > 0);
    assert.ok(color.nameEn.length > 0);
  }
  assert.equal(REGION_COLORS[0].name, 'Modrá');
  assert.equal(REGION_COLORS[0].nameEn, 'Blue');
});

test('Minibridge seat, suit, trump, and contract recommendation helpers support cs and en', () => {
  assert.equal(getSeatLabel('south', 'cs'), 'Jih (Ty)');
  assert.equal(getSeatLabel('south', 'en'), 'South (You)');
  assert.equal(getSeatShortLabel('north', 'en'), 'North');
  assert.equal(getSeatShortLabel('west', 'cs'), 'Západ');

  assert.deepEqual(
    (['north', 'east', 'south', 'west'] as const).map((s) => getSeatInitial(s, 'cs')),
    ['S', 'V', 'J', 'Z']
  );
  assert.deepEqual(
    (['north', 'east', 'south', 'west'] as const).map((s) => getSeatInitial(s, 'en')),
    ['N', 'E', 'S', 'W']
  );

  assert.equal(getSuitLabel('spades', 'cs'), 'Piky');
  assert.equal(getSuitLabel('spades', 'en'), 'Spades');
  assert.equal(getTrumpLabel('NT', 'cs'), 'Bez trumfů (NT)');
  assert.equal(getTrumpLabel('NT', 'en'), 'No Trump (NT)');
  assert.equal(getTrumpShortLabel('hearts', 'en'), '♥ Hearts');

  const heartsHandA: Card[] = [14, 13, 12, 11, 10].map((r) => ({
    id: `hearts-${r}`,
    suit: 'hearts',
    rank: r as Card['rank'],
  }));
  const heartsHandB: Card[] = [9, 8, 7, 6].map((r) => ({
    id: `hearts-${r}`,
    suit: 'hearts',
    rank: r as Card['rank'],
  }));
  const rec = recommendContract(heartsHandA, heartsHandB, 26);
  assert.equal(rec.trump, 'hearts');
  assert.equal(rec.level, 'game');
  assert.ok(rec.reasonCs.includes('Srdce'));
  assert.ok(rec.reasonEn.includes('Hearts'));
  assert.ok(rec.reasonEn.includes('Game'));
});

test('Mahjong layout and tile label/corner helpers localize to Czech and English', () => {
  assert.equal(getMahjongLayoutLabel('pyramid', 'cs'), 'Pyramida (72)');
  assert.equal(getMahjongLayoutLabel('pyramid', 'en'), 'Pyramid (72)');
  assert.equal(getMahjongLayoutLabel('bridge', 'en'), 'Bridge (96)');
  assert.equal(getMahjongLayoutLabel('turtle', 'en'), 'Turtle (144)');

  const eastWind: MahjongTileDef = {
    kindId: 'wind-east',
    matchGroup: 'wind-east',
    suit: 'winds',
    rank: 1,
    labelCs: 'Východní vítr',
    labelEn: 'East Wind',
    symbol: '東',
    cornerText: 'V',
    cornerTextEn: 'E',
  };
  assert.equal(getMahjongTileLabel(eastWind, 'cs'), 'Východní vítr');
  assert.equal(getMahjongTileLabel(eastWind, 'en'), 'East Wind');
  assert.equal(getMahjongTileCorner(eastWind, 'cs'), 'V');
  assert.equal(getMahjongTileCorner(eastWind, 'en'), 'E');
});

test('Zip formatZipReason returns localized feedback in Czech and English', () => {
  assert.equal(formatZipReason('start_on_one', undefined, 'cs'), 'Začněte na čísle 1.');
  assert.equal(formatZipReason('start_on_one', undefined, 'en'), 'Start on number 1.');
  assert.equal(formatZipReason('wall', undefined, 'cs'), 'Přes zeď nelze projít.');
  assert.equal(formatZipReason('wall', undefined, 'en'), 'You cannot pass through a wall.');
  assert.equal(formatZipReason('wrong_order', 4, 'cs'), 'Další v pořadí je číslo 4.');
  assert.equal(formatZipReason('wrong_order', 4, 'en'), 'Next in order is number 4.');
});

test('Learning tasks English quiz bank, parser errors, summaries, and URL validation localize cleanly', () => {
  const parsed = parseLearningTasksJson(DEFAULT_EN_QUIZ_TASKS_JSON, 'en');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.tasks.length, DEFAULT_EN_QUIZ_TASKS.length);

  const summaryEn = summarizeTaskTypes(parsed.tasks, 'en');
  assert.ok(summaryEn.includes('match'));
  assert.ok(summaryEn.includes('fill'));
  assert.ok(summaryEn.includes('choice'));

  const badJsonEn = parseLearningTasksJson('{ invalid', 'en');
  assert.equal(badJsonEn.ok, false);
  assert.ok(badJsonEn.error && !badJsonEn.error.includes('Neplatný'));

  const badUrlEn = validateTaskSourceUrl('javascript:alert(1)', 'en');
  assert.equal(badUrlEn.ok, false);
  assert.ok(badUrlEn.error && badUrlEn.error.includes('Unsupported'));

  // Multi-variant fill answer check (used by skip/answer reveal)
  const multiFill = {
    type: 'fill' as const,
    prompt: 'Translate: pes',
    answer: 'dog',
    answers: ['dog', 'puppy'],
  };
  assert.equal(isFillAnswerCorrect(multiFill, 'dog'), true);
  assert.equal(isFillAnswerCorrect(multiFill, 'PUPPY'), true);
  assert.equal(isFillAnswerCorrect(multiFill, 'cat'), false);
});
