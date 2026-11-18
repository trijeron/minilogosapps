import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { Card, Seat, TrickCard } from '../src/types/minibridge';
import {
  calculateHandHcp,
  chooseAiCard,
  createAiContract,
  createDeck,
  dealHands,
  dealHandsForPlayerDeclarer,
  determineDeclarerFromHcp,
  evaluateTrickWinner,
  getCardHcp,
  getLegalCards,
  getNextSeat,
  getPartnership,
  getRequiredTricks,
  isLegalMove,
} from '../src/utils/minibridgeEngine';

test('deck has 52 unique cards summing to exactly 40 HCP', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  const uniqueIds = new Set(deck.map((c) => c.id));
  assert.equal(uniqueIds.size, 52);
  assert.equal(calculateHandHcp(deck), 40);

  const aceSpades: Card = { id: 'spades-14', suit: 'spades', rank: 14 };
  const kingHearts: Card = { id: 'hearts-13', suit: 'hearts', rank: 13 };
  const queenDiamonds: Card = { id: 'diamonds-12', suit: 'diamonds', rank: 12 };
  const jackClubs: Card = { id: 'clubs-11', suit: 'clubs', rank: 11 };
  const tenSpades: Card = { id: 'spades-10', suit: 'spades', rank: 10 };
  assert.equal(getCardHcp(aceSpades), 4);
  assert.equal(getCardHcp(kingHearts), 3);
  assert.equal(getCardHcp(queenDiamonds), 2);
  assert.equal(getCardHcp(jackClubs), 1);
  assert.equal(getCardHcp(tenSpades), 0);
});

test('dealHands deals 13 sorted cards per seat with total 40 HCP', () => {
  for (let i = 0; i < 20; i++) {
    const hands = dealHands();
    const seats: Seat[] = ['north', 'east', 'south', 'west'];
    const allIds = new Set<string>();
    let totalHcp = 0;

    for (const s of seats) {
      assert.equal(hands[s].length, 13);
      totalHcp += calculateHandHcp(hands[s]);
      for (const c of hands[s]) {
        allIds.add(c.id);
      }
      // Verify within each suit ranks are descending
      for (let k = 1; k < hands[s].length; k++) {
        const prev = hands[s][k - 1];
        const curr = hands[s][k];
        if (prev.suit === curr.suit) {
          assert.ok(prev.rank > curr.rank);
        }
      }
    }
    assert.equal(allIds.size, 52);
    assert.equal(totalHcp, 40);
  }
});

test('dealHandsForPlayerDeclarer always produces deals where South is Declarer', () => {
  for (let i = 0; i < 100; i++) {
    const hands = dealHandsForPlayerDeclarer();
    const hcp = {
      north: calculateHandHcp(hands.north),
      east: calculateHandHcp(hands.east),
      south: calculateHandHcp(hands.south),
      west: calculateHandHcp(hands.west),
    };
    const allIds = new Set([
      ...hands.north.map((c) => c.id),
      ...hands.east.map((c) => c.id),
      ...hands.south.map((c) => c.id),
      ...hands.west.map((c) => c.id),
    ]);
    assert.equal(allIds.size, 52);
    const info = determineDeclarerFromHcp(hcp);
    assert.equal(info.partnership, 'NS', `Deal #${i} should be won by NS`);
    assert.equal(info.declarer, 'south', `Deal #${i} should have South as Declarer`);
    assert.equal(info.dummy, 'north');
    assert.ok(info.nsTotal >= info.ewTotal);
    assert.ok(hcp.south >= hcp.north);
  }
});

test('determineDeclarerFromHcp picks winning partnership, declarer, and handles 20-20 tie', () => {
  const ewWins = determineDeclarerFromHcp({
    north: 8,
    south: 9,
    east: 15,
    west: 8,
  });
  assert.equal(ewWins.partnership, 'EW');
  assert.equal(ewWins.declarer, 'east');
  assert.equal(ewWins.dummy, 'west');
  assert.equal(ewWins.isTie20, false);

  const tie20 = determineDeclarerFromHcp({
    north: 10,
    south: 10,
    east: 12,
    west: 8,
  });
  assert.equal(tie20.isTie20, true);
  assert.equal(tie20.partnership, 'NS');
  assert.equal(tie20.declarer, 'south');
  assert.equal(tie20.dummy, 'north');
});

test('AI contract chooses >=8 card suit fit or NT, and Game at 25+ HCP', () => {
  const handA: Card[] = [
    { id: 'hearts-14', suit: 'hearts', rank: 14 },
    { id: 'hearts-13', suit: 'hearts', rank: 13 },
    { id: 'hearts-12', suit: 'hearts', rank: 12 },
    { id: 'hearts-10', suit: 'hearts', rank: 10 },
    { id: 'hearts-5', suit: 'hearts', rank: 5 },
    { id: 'spades-14', suit: 'spades', rank: 14 },
  ];
  const handB: Card[] = [
    { id: 'hearts-11', suit: 'hearts', rank: 11 },
    { id: 'hearts-9', suit: 'hearts', rank: 9 },
    { id: 'hearts-4', suit: 'hearts', rank: 4 },
    { id: 'clubs-14', suit: 'clubs', rank: 14 },
  ];
  // 8 hearts + 25 HCP -> 4H (10 tricks)
  const c1 = createAiContract('east', handA, handB, 25);
  assert.equal(c1.trump, 'hearts');
  assert.equal(c1.level, 'game');
  assert.equal(c1.targetTricks, 10);

  // No 8-card fit + 26 HCP -> NT game (9 tricks)
  const flatA: Card[] = [
    { id: 'spades-14', suit: 'spades', rank: 14 },
    { id: 'spades-13', suit: 'spades', rank: 13 },
    { id: 'spades-5', suit: 'spades', rank: 5 },
    { id: 'hearts-14', suit: 'hearts', rank: 14 },
    { id: 'hearts-8', suit: 'hearts', rank: 8 },
    { id: 'hearts-4', suit: 'hearts', rank: 4 },
    { id: 'diamonds-14', suit: 'diamonds', rank: 14 },
  ];
  const flatB: Card[] = [
    { id: 'spades-7', suit: 'spades', rank: 7 },
    { id: 'spades-3', suit: 'spades', rank: 3 },
    { id: 'clubs-14', suit: 'clubs', rank: 14 },
    { id: 'clubs-13', suit: 'clubs', rank: 13 },
    { id: 'clubs-9', suit: 'clubs', rank: 9 },
  ];
  const c2 = createAiContract('south', flatA, flatB, 26);
  assert.equal(c2.trump, 'NT');
  assert.equal(c2.level, 'game');
  assert.equal(c2.targetTricks, 9);

  // < 25 HCP -> Part score (7 tricks)
  const c3 = createAiContract('west', flatA, flatB, 22);
  assert.equal(c3.level, 'part_score');
  assert.equal(c3.targetTricks, 7);
  assert.equal(getRequiredTricks('diamonds', 'game'), 11);
});

test('follow-suit legal moves and trump trick evaluation rules hold', () => {
  const hand: Card[] = [
    { id: 'spades-14', suit: 'spades', rank: 14 },
    { id: 'hearts-13', suit: 'hearts', rank: 13 },
    { id: 'clubs-2', suit: 'clubs', rank: 2 },
  ];
  const trickLedSpades: TrickCard[] = [
    { seat: 'west', card: { id: 'spades-9', suit: 'spades', rank: 9 } },
  ];
  const legalSpades = getLegalCards(hand, trickLedSpades);
  assert.deepEqual(legalSpades.map((c) => c.id), ['spades-14']);
  assert.equal(isLegalMove(hand[0], hand, trickLedSpades), true);
  assert.equal(isLegalMove(hand[1], hand, trickLedSpades), false);

  // Void in led suit -> all cards legal
  const trickLedDiamonds: TrickCard[] = [
    { seat: 'west', card: { id: 'diamonds-14', suit: 'diamonds', rank: 14 } },
  ];
  assert.equal(getLegalCards(hand, trickLedDiamonds).length, 3);

  // Trump beats led Ace
  const fullTrick: TrickCard[] = [
    { seat: 'west', card: { id: 'diamonds-14', suit: 'diamonds', rank: 14 } },
    { seat: 'north', card: { id: 'diamonds-13', suit: 'diamonds', rank: 13 } },
    { seat: 'east', card: { id: 'clubs-2', suit: 'clubs', rank: 2 } },
    { seat: 'south', card: { id: 'diamonds-12', suit: 'diamonds', rank: 12 } },
  ];
  assert.equal(evaluateTrickWinner(fullTrick, 'clubs').seat, 'east');
  assert.equal(evaluateTrickWinner(fullTrick, 'NT').seat, 'west');
});

test('full 13-trick Minibridge games simulate cleanly from deal to 13 tricks', () => {
  for (let gameIdx = 0; gameIdx < 20; gameIdx++) {
    const hands = dealHands();
    const hcp = {
      north: calculateHandHcp(hands.north),
      east: calculateHandHcp(hands.east),
      south: calculateHandHcp(hands.south),
      west: calculateHandHcp(hands.west),
    };
    const decInfo = determineDeclarerFromHcp(hcp);
    const totalHcp = decInfo.partnership === 'NS' ? decInfo.nsTotal : decInfo.ewTotal;
    const contract = createAiContract(
      decInfo.declarer,
      hands[decInfo.declarer],
      hands[decInfo.dummy],
      totalHcp
    );

    let turn = getNextSeat(contract.declarer);
    let tricksNS = 0;
    let tricksEW = 0;

    for (let t = 0; t < 13; t++) {
      const trick: TrickCard[] = [];
      for (let p = 0; p < 4; p++) {
        const chosen = chooseAiCard(turn, hands[turn], trick, contract.trump);
        assert.equal(isLegalMove(chosen, hands[turn], trick), true);
        hands[turn] = hands[turn].filter((c) => c.id !== chosen.id);
        trick.push({ seat: turn, card: chosen });
        turn = getNextSeat(turn);
      }
      const winner = evaluateTrickWinner(trick, contract.trump);
      if (getPartnership(winner.seat) === 'NS') tricksNS++;
      else tricksEW++;
      turn = winner.seat;
    }

    assert.equal(tricksNS + tricksEW, 13);
    assert.equal(hands.north.length, 0);
    assert.equal(hands.east.length, 0);
    assert.equal(hands.south.length, 0);
    assert.equal(hands.west.length, 0);
  }
});

test('standalone public/minisudoku.html Minibridge JS parses cleanly and simulates deals', () => {
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
  const startMarker = '// --- MINIBRIDGE ENGINE & UI ---';
  const endMarker = "document.getElementById('mb-table').addEventListener";
  const startIdx = mainScript.indexOf(startMarker);
  const endIdx = mainScript.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx);

  const mbSlice = mainScript.slice(startIdx, endIdx);
  const noopEl = () => ({
    textContent: '',
    innerHTML: '',
    classList: { add() {}, remove() {} },
    addEventListener() {},
  });
  const sandbox: Record<string, unknown> = {
    Math,
    Array,
    Set,
    Map,
    activeTab: 'sudoku',
    realTimeCheck: true,
    sound: { play() {}, playVictory() {} },
    setTimeout: () => 0,
    clearTimeout: () => {},
    document: { getElementById: noopEl },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `${mbSlice}\nthis.__mb = { mbDeal, mbHcpHand, mbRecommend, mbLegalCards, mbEvalWinner, mbChooseAiCard, mbNextSeat };`,
    sandbox
  );

  const api = sandbox.__mb as {
    mbDeal: () => Record<Seat, Card[]>;
    mbHcpHand: (h: Card[]) => number;
    mbRecommend: (a: Card[], b: Card[], total: number) => { trump: string; level: string };
    mbLegalCards: (h: Card[], trick: TrickCard[]) => Card[];
    mbEvalWinner: (trick: TrickCard[], trump: string) => TrickCard;
    mbChooseAiCard: (seat: Seat, h: Card[], trick: TrickCard[], trump: string) => Card;
    mbNextSeat: (s: Seat) => Seat;
  };

  for (let i = 0; i < 50; i++) {
    const hands = api.mbDeal();
    const n = api.mbHcpHand(hands.north);
    const e = api.mbHcpHand(hands.east);
    const s = api.mbHcpHand(hands.south);
    const w = api.mbHcpHand(hands.west);
    assert.equal(n + e + s + w, 40);
    assert.ok(n + s >= e + w, `minisudoku.html deal #${i} NS should outpoint EW`);
    assert.ok(s >= n, `minisudoku.html deal #${i} South should have >= HCP than North`);
  }
  const hands = api.mbDeal();
  const rec = api.mbRecommend(hands.south, hands.north, api.mbHcpHand(hands.south) + api.mbHcpHand(hands.north));
  assert.ok(['spades', 'hearts', 'diamonds', 'clubs', 'NT'].includes(rec.trump));
});
