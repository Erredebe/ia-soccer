// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { simulateMatch, playMatchDay } from '../src/core/engine.js';
import { createDefaultMatchConfig, createDefaultLineup, createExampleClub } from '../src/core/data.js';
import { resolveCanallaDecision } from '../src/core/reputation.js';

/**
 * Devuelve un generador que recorre una secuencia fija de números.
 * @param {number[]} sequence
 */
function createDeterministicRng(sequence) {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}

/**
 * Generador pseudoaleatorio que consume una secuencia y luego usa un valor por defecto.
 * @param {number[]} sequence Valores prefijados.
 * @param {number} [fallback]
 */
function createSequenceRng(sequence, fallback = 0.95) {
  let index = 0;
  return () => {
    if (index < sequence.length) {
      const value = sequence[index];
      index += 1;
      return value;
    }
    return fallback;
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

test('simulateMatch genera frames 2D cuando se solicita', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.viewMode = '2d';
  config.startingLineup = club.squad.slice(0, 11).map((player) => player.id);
  config.substitutes = club.squad.slice(11, 16).map((player) => player.id);
  const rng = createDeterministicRng([0.2, 0.31, 0.45, 0.62, 0.77, 0.12, 0.88, 0.54, 0.27, 0.93]);

  const result = simulateMatch(club, config, { rng });
  assert.strictEqual(result.viewMode, '2d');
  assert.ok(result.visualization2d, 'la visualización 2D debe existir');
  const viz = result.visualization2d;
  assert.ok(viz.frames.length >= 1, 'debe haber al menos un frame');
  const firstFrame = viz.frames[0];
  assert.ok(firstFrame.players.some((player) => player.team === 'us'));
  assert.ok(firstFrame.players.every((player) => Number.isFinite(player.xPercent)));
  assert.ok(Number.isFinite(firstFrame.ball.xPercent));
  assert.ok(viz.legend.length > 0);
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

test('simulateMatch gestiona doble amarilla y registra la expulsión', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.startingLineup = club.squad.slice(0, 11).map((player) => player.id);
  config.substitutes = club.squad.slice(11, 16).map((player) => player.id);
  club.squad[0].attributes.defending = 95;
  for (const player of club.squad.slice(1, 11)) {
    player.attributes.defending = 1;
  }
  const sequence = [
    0.9, 0.05, 0.0,
    0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
    0.9, 0.04, 0.0,
    0.9, 0.9, 0.9,
  ];
  const rng = createSequenceRng(sequence, 0.95);
  const result = simulateMatch(club, config, { rng });
  const offenderId = config.startingLineup[0];
  const offenderEvents = result.events.filter((event) => event.playerId === offenderId);
  assert.ok(offenderEvents.some((event) => event.type === 'doble_amarilla'));
  assert.ok(result.statistics.cards.redFor >= 1);
});

test('simulateMatch reemplaza al portero expulsado con suplente', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  const starters = club.squad.slice(0, 11);
  const bench = [club.squad[1], ...club.squad.slice(11, 16)];
  starters.splice(1, 1, club.squad[11]);
  config.startingLineup = starters.map((player) => player.id);
  config.substitutes = bench.map((player) => player.id);
  club.squad[0].attributes.defending = 95;
  for (const player of starters.slice(1)) {
    const squadPlayer = club.squad.find((p) => p.id === player.id);
    if (squadPlayer) {
      squadPlayer.attributes.defending = 1;
    }
  }
  const rng = createSequenceRng([0.9, 0.01, 0.0, 0.9, 0.9, 0.9], 0.95);
  const result = simulateMatch(club, config, { rng });
  const benchKeeperId = config.substitutes.find((id) => {
    const player = club.squad.find((p) => p.id === id);
    return player?.position === 'GK';
  });
  const benchContribution = result.contributions.find((entry) => entry.playerId === benchKeeperId);
  assert.ok(benchContribution && benchContribution.minutesPlayed > 0);
  assert.ok(result.events.some((event) => event.type === 'expulsion'));
});

test('playMatchDay actualiza sanciones y estadísticas de temporada', () => {
  const club = createExampleClub();
  const config = createDefaultMatchConfig();
  config.startingLineup = club.squad.slice(0, 11).map((player) => player.id);
  config.substitutes = club.squad.slice(11, 16).map((player) => player.id);
  club.squad[0].attributes.defending = 95;
  for (const player of club.squad.slice(1, 11)) {
    player.attributes.defending = 1;
  }
  const sequence = [
    0.9, 0.05, 0.0,
    0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
    0.9, 0.04, 0.0,
    0.9, 0.9, 0.9,
  ];
  const rng = createSequenceRng(sequence, 0.95);
  const report = playMatchDay(club, config, { rng });
  const disciplined = report.updatedClub.squad.find((player) => player.id === config.startingLineup[0]);
  assert.ok((disciplined?.availability?.suspensionMatches ?? 0) >= 1);
  assert.ok((report.updatedClub.seasonStats?.matches ?? 0) >= 1);
});

test('playMatchDay reproduce la misma crónica con semilla compartida', () => {
  const seed = 'derbi-canalla';
  const buildClubAndConfig = () => {
    const club = createExampleClub();
    const config = createDefaultMatchConfig();
    const lineup = createDefaultLineup(club);
    config.startingLineup = [...lineup.starters];
    config.substitutes = [...lineup.substitutes];
    return { club, config };
  };

  const { club: clubA, config: configA } = buildClubAndConfig();
  const reportA = playMatchDay(clubA, configA, { seed });
  const { club: clubB, config: configB } = buildClubAndConfig();
  const reportB = playMatchDay(clubB, configB, { seed });

  assert.equal(reportA.match.goalsFor, reportB.match.goalsFor);
  assert.equal(reportA.match.goalsAgainst, reportB.match.goalsAgainst);
  assert.deepEqual(reportA.match.events, reportB.match.events);
  assert.deepEqual(reportA.match.narrative, reportB.match.narrative);
  assert.equal(reportA.match.seed, reportB.match.seed);
  assert.ok(Number.isFinite(reportA.match.seed));
});
