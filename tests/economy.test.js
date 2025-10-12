// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCupPrize, calculateMatchdayFinances } from '../src/core/economy.js';
import { createExampleClub } from '../src/core/data.js';

test('resolveCupPrize diferencia premio por victoria y eliminación', () => {
  const quarterLoser = resolveCupPrize('quarterFinal', 'eliminated');
  assert.equal(quarterLoser.prize, 28000);
  assert.ok(quarterLoser.notes[0].includes('eliminación'));

  const semiWin = resolveCupPrize('semiFinal', 'victory');
  assert.equal(semiWin.prize, 110000);
  assert.ok(semiWin.notes[0].includes('Semifinales'));

  const champion = resolveCupPrize('final', 'champion');
  assert.ok(champion.prize > 180000);
  assert.ok(champion.notes.some((line) => line.includes('bonus')));
});

test('calculateMatchdayFinances incluye salarios y efecto del staff', () => {
  const club = createExampleClub();
  const baseStats = {
    possession: { for: 55, against: 45 },
    shots: { for: 8, against: 5, onTargetFor: 4, onTargetAgainst: 2 },
    expectedGoals: { for: 1.6, against: 0.9 },
    passes: { completedFor: 190, attemptedFor: 240, completedAgainst: 120, attemptedAgainst: 170 },
    fouls: { for: 10, against: 12 },
    cards: { yellowFor: 2, yellowAgainst: 1, redFor: 0, redAgainst: 0 },
    injuries: { for: 0, against: 0 },
    saves: { for: 3, against: 2 },
  };
  const match = {
    goalsFor: 2,
    goalsAgainst: 1,
    events: [],
    narrative: [],
    contributions: [],
    statistics: baseStats,
    commentary: [],
  };
  const finances = calculateMatchdayFinances(club, match);
  assert.ok(finances.staffImpact, 'Debe devolver el impacto del staff en la jornada');
  assert.ok((finances.expenseBreakdown.salariosStaff ?? 0) > 0, 'Los salarios del staff se reflejan en el desglose');
  assert.ok(finances.staffImpact?.narratives.length > 0, 'El staff genera narrativa económica propia');
});
