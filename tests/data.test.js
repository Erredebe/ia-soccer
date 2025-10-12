// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createExampleClub,
  createExampleCup,
  drawCupRound,
  getCupFixture,
  applyCupMatchResult,
  DEFAULT_CLUB_LOGO,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  resolveStaffMatchImpact,
  calculateStaffWeeklyCost,
  normaliseStaffState,
} from '../src/core/data.js';

test('createExampleClub acepta identidad personalizada', () => {
  const club = createExampleClub({
    name: 'Club de Prueba',
    stadiumName: 'Estadio Demo',
    city: 'Vallekas',
  });

  assert.equal(club.name, 'Club de Prueba');
  assert.equal(club.city, 'Vallekas');
  assert.equal(club.stadiumName, 'Estadio Demo');
  assert.equal(club.league.name, 'Liga Canalla de Vallekas');
  assert.equal(club.primaryColor, DEFAULT_PRIMARY_COLOR);
  assert.equal(club.secondaryColor, DEFAULT_SECONDARY_COLOR);
  assert.equal(club.logoUrl, DEFAULT_CLUB_LOGO);
  const sponsorNames = (club.sponsors ?? []).map((sponsor) => sponsor.name);
  assert.ok(
    sponsorNames.includes('Estadio Demo Tours'),
    'Los patrocinadores se adaptan al estadio personalizado'
  );
  assert.ok(
    sponsorNames.some((name) => name.includes('Vallekas')),
    'Los patrocinadores reflejan la ciudad personalizada'
  );
});

test('createExampleCup y su flujo básico funcionan correctamente', () => {
  const cup = createExampleCup('Club Test', {
    size: 8,
    participants: ['Rival 1', 'Rival 2', 'Rival 3', 'Rival 4', 'Rival 5', 'Rival 6', 'Rival 7'],
    rng: () => 0.42,
  });
  assert.equal(cup.rounds.length, 3, 'La copa de 8 equipos debe tener tres rondas');
  const draw = drawCupRound(cup, 'Club Test', { rng: () => 0.18 });
  assert.equal(draw.cup.status, 'awaiting-match');
  assert.ok(Array.isArray(draw.narrative) && draw.narrative.length > 0);
  const fixture = getCupFixture(draw.cup, 'Club Test');
  assert.ok(fixture, 'Debe existir una eliminatoria para el club tras el sorteo');

  const baseStats = {
    possession: { for: 55, against: 45 },
    shots: { for: 7, against: 3, onTargetFor: 4, onTargetAgainst: 1 },
    expectedGoals: { for: 1.8, against: 0.7 },
    passes: { completedFor: 180, attemptedFor: 220, completedAgainst: 110, attemptedAgainst: 160 },
    fouls: { for: 12, against: 10 },
    cards: { yellowFor: 2, yellowAgainst: 1, redFor: 0, redAgainst: 0 },
    injuries: { for: 0, against: 0 },
    saves: { for: 3, against: 1 },
  };

  const match = {
    goalsFor: 2,
    goalsAgainst: 1,
    events: [],
    narrative: [],
    contributions: [],
    statistics: baseStats,
    commentary: [],
    viewMode: 'text',
    competition: 'cup',
    cupRoundId: fixture?.roundId,
  };

  const progress = applyCupMatchResult(draw.cup, 'Club Test', match, { rng: () => 0.61 });
  assert.equal(progress.cup.status, 'awaiting-draw', 'Tras ganar la primera ronda se espera nuevo sorteo');
  assert.equal(progress.historyEntry.outcome, 'victory');
  assert.ok(progress.historyEntry.prize >= 70000, 'El premio por avanzar debe ser sustancial');
  assert.ok(progress.historyEntry.reputationDelta > 0, 'Ganar debe sumar reputación');
  assert.ok(Array.isArray(progress.historyEntry.narrative) && progress.historyEntry.narrative.length > 0);
});

test('el staff aporta bonus y costes recurrentes', () => {
  const staffState = normaliseStaffState({
    roster: ['staff-ojeador-puente', 'staff-pr-capote'],
    available: [],
  });
  const impact = resolveStaffMatchImpact(staffState);
  assert.equal(impact.budget, 1400, 'El impacto en caja combina bonus y gastos ocultos');
  assert.equal(impact.reputation, 1, 'Debe sumarse el balance reputacional del staff activo');
  assert.ok(impact.narratives.length > 0, 'Los técnicos generan narrativa propia cada jornada');
  const weeklyCost = calculateStaffWeeklyCost(staffState);
  assert.ok(weeklyCost > 0, 'El coste semanal del staff debe ser mayor que cero');
});
