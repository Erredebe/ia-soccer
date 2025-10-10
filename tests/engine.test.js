import test from 'node:test';
import assert from 'node:assert/strict';

import { simulateMatch } from '../src/core/engine.js';
import { createDefaultMatchConfig, createExampleClub } from '../src/core/data.js';

function createDeterministicRng(sequence) {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}

test('simulateMatch genera eventos y narrativa coherente', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  const rng = createDeterministicRng([0.1, 0.4, 0.6, 0.2, 0.7]);
  const result = simulateMatch(club, config, { rng });

  assert.ok(result.events.length > 0, 'debe generar eventos');
  assert.ok(result.narrative[0].includes(club.name), 'la narrativa menciona al club');
  assert.ok(result.goalsFor >= 0);
  assert.ok(result.goalsAgainst >= 0);
});

test('simulateMatch aplica el impulso de decisiones canallas exitosas', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  const rng = createDeterministicRng([0.05, 0.3, 0.3, 0.4, 0.2, 0.1]);
  const decisionOutcome = {
    success: true,
    reputationChange: 10,
    financesChange: 5000,
    moraleChange: 15,
    riskLevel: 80,
    narrative: '',
  };

  const result = simulateMatch(club, config, { rng, decisionOutcome });
  assert.ok(result.narrative.join(' ').includes('Marcador final'));
  assert.ok(result.events.some((event) => event.type === 'gol'), 'debe haber al menos un gol propio');
});

test('simulateMatch respeta un once titular definido', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.startingLineup = club.squad.slice(0, 11).map((player) => player.id);
  config.substitutes = club.squad.slice(11, 16).map((player) => player.id);
  const rng = createDeterministicRng([0.12, 0.45, 0.78, 0.33, 0.91]);

  const result = simulateMatch(club, config, { rng });
  assert.equal(result.contributions.length, 11 + config.substitutes.length);
  const contributionIds = result.contributions.map((c) => c.playerId);
  assert.ok(config.startingLineup.every((id) => contributionIds.includes(id)));
});
