import test from 'node:test';
import assert from 'node:assert/strict';

import { simulateMatch, playMatchDay } from '../src/core/engine.js';
import { createDefaultMatchConfig, createExampleClub } from '../src/core/data.js';
import { resolveCanallaDecision } from '../src/core/reputation.js';

function createDeterministicRng(sequence) {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}

test('simulateMatch genera estadísticas y comentarios completos', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.viewMode = 'text';
  const rng = createDeterministicRng([0.11, 0.42, 0.78, 0.32, 0.27, 0.66, 0.19, 0.51, 0.9, 0.08]);
  const result = simulateMatch(club, config, { rng });

  assert.ok(result.events.length > 0, 'debe generar eventos');
  assert.ok(result.commentary.length > 0, 'debe incluir comentarios estilo transistor');
  assert.ok(result.statistics.shots.for + result.statistics.shots.against > 0, 'debe haber tiros contabilizados');
  const possessionSum = result.statistics.possession.for + result.statistics.possession.against;
  assert.ok(Math.abs(possessionSum - 100) <= 2, 'la posesión debe ser porcentual');
  assert.strictEqual(result.viewMode, 'text');
});

test('simulateMatch respeta ajustes tácticos y sustituciones programadas', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.startingLineup = club.squad.slice(0, 11).map((player) => player.id);
  config.substitutes = club.squad.slice(11, 16).map((player) => player.id);
  config.halftimeAdjustments = {
    minute: 50,
    tactic: 'attacking',
    substitutions: [
      { out: config.startingLineup[0], in: config.substitutes[0], reason: 'revulsivo' },
    ],
  };
  const rng = createDeterministicRng([0.15, 0.22, 0.31, 0.49, 0.65, 0.81, 0.12, 0.93, 0.27, 0.74, 0.18, 0.6]);

  const result = simulateMatch(club, config, { rng });
  const contributionIds = new Set(result.contributions.map((c) => c.playerId));
  assert.ok(config.startingLineup.every((id) => contributionIds.has(id)), 'todos los titulares deben aparecer');
  const subContribution = result.contributions.find((c) => c.playerId === config.substitutes[0]);
  assert.ok(subContribution && subContribution.minutesPlayed > 0, 'el cambio programado debe jugar');
  assert.ok(result.events.some((event) => event.type === 'cambio'), 'debe registrarse el evento de cambio');
});

test('playMatchDay incluye balance financiero ampliado', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  const rng = createDeterministicRng([0.12, 0.44, 0.65, 0.23, 0.56, 0.77, 0.91, 0.19, 0.38, 0.84, 0.07, 0.28]);
  const report = playMatchDay(club, config, { rng });

  assert.ok(report.finances, 'debe existir un informe financiero');
  assert.equal(report.financesDelta, report.finances?.net);
  assert.ok(Object.keys(report.finances?.incomeBreakdown ?? {}).length > 0);
  assert.ok(report.finances?.notes.length > 0);
  assert.notDeepEqual(report.updatedClub.sponsors, club.sponsors, 'los patrocinadores deben actualizarse tras el pago');
});

test('playMatchDay no duplica el impacto de una decisión resuelta', () => {
  const baseClub = createExampleClub();
  const decision = { type: 'sobornoArbitro', intensity: 'alta' };
  const resolution = resolveCanallaDecision(baseClub, decision, () => 0.1);
  const clubAfterDecision = resolution.updatedClub;
  const configA = createDefaultMatchConfig();
  configA.startingLineup = clubAfterDecision.squad.slice(0, 11).map((player) => player.id);
  configA.substitutes = clubAfterDecision.squad.slice(11, 16).map((player) => player.id);
  const rngSequence = [0.41, 0.68, 0.54, 0.33, 0.72, 0.27, 0.85, 0.19, 0.62, 0.48, 0.91, 0.15];

  const reportWithOutcome = playMatchDay(clubAfterDecision, configA, {
    rng: createDeterministicRng(rngSequence),
    decision,
    decisionOutcome: resolution.outcome,
  });

  const configB = createDefaultMatchConfig();
  configB.startingLineup = [...configA.startingLineup];
  configB.substitutes = [...configA.substitutes];
  const reportWithoutOutcome = playMatchDay(clubAfterDecision, configB, {
    rng: createDeterministicRng(rngSequence),
  });

  assert.equal(
    reportWithOutcome.updatedClub.reputation,
    reportWithoutOutcome.updatedClub.reputation,
    'la reputación no debe aplicarse dos veces'
  );

  const moraleWithOutcome = reportWithOutcome.updatedClub.squad.map((player) => player.morale);
  const moraleWithoutOutcome = reportWithoutOutcome.updatedClub.squad.map((player) => player.morale);
  assert.deepEqual(moraleWithOutcome, moraleWithoutOutcome, 'la moral por jugador debe coincidir');
  assert.equal(reportWithOutcome.decisionOutcome?.appliedToClub, true, 'el resultado debe marcarse como aplicado');
});
