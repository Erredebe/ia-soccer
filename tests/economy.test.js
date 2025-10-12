// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCupPrize } from '../src/core/economy.js';

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
