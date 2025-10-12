// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { createExampleClub } from '../src/core/data.js';
import { resolveCanallaDecision, resolveCupReputation } from '../src/core/reputation.js';

/** Retorna un valor bajo para forzar éxitos en las pruebas. */
const alwaysSuccess = () => 0.01;
/** Retorna un valor alto para simular fracasos continuados. */
const alwaysFail = () => 0.99;

test('resolveCanallaDecision mejora la moral y reputación cuando sale bien', () => {
  const club = createExampleClub();
  const { outcome, updatedClub } = resolveCanallaDecision(
    club,
    { type: 'filtrarRumor', intensity: 'media' },
    alwaysSuccess
  );

  assert.equal(outcome.success, true);
  assert.ok(outcome.reputationChange > 0);
  assert.ok(updatedClub.reputation > club.reputation);
});

test('resolveCanallaDecision castiga duramente cuando se descubre la jugada', () => {
  const club = createExampleClub();
  const { outcome, updatedClub } = resolveCanallaDecision(
    club,
    { type: 'sobornoArbitro', intensity: 'alta' },
    alwaysFail
  );

  assert.equal(outcome.success, false);
  assert.ok(outcome.reputationChange < 0);
  assert.equal(typeof outcome.sanctions, 'string');
  assert.ok(updatedClub.budget < club.budget);
});

test('resolveCupReputation premia levantar el trofeo y castiga la eliminación', () => {
  const win = resolveCupReputation('final', 'champion');
  assert.ok(win.reputation > 0);
  assert.ok(win.narrative.includes('mito'));
  const elimination = resolveCupReputation('semiFinal', 'eliminated');
  assert.ok(elimination.reputation < 0);
  assert.ok(elimination.narrative.includes('tropiezo'));
});
