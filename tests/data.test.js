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
  generateSponsorOffers,
  generateTvDeals,
  createDefaultLineup,
  isPlayerAvailable,
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

test('createDefaultLineup alinea un único guardameta disponible', () => {
  const club = createExampleClub();
  const lineup = createDefaultLineup(club);

  const starters = lineup.starters
    .map((id) => club.squad.find((player) => player.id === id))
    .filter((player) => Boolean(player));

  const goalkeepers = starters.filter((player) => player?.position === 'GK');
  assert.equal(goalkeepers.length, 1, 'La alineación debe incluir un único portero titular');
  assert.ok(
    goalkeepers.every((player) => player && isPlayerAvailable(player)),
    'El portero titular seleccionado debe estar disponible'
  );

  const substitutes = lineup.substitutes
    .map((id) => club.squad.find((player) => player.id === id))
    .filter((player) => Boolean(player));
  const reserveGoalkeepers = substitutes.filter((player) => player?.position === 'GK');
  assert.ok(
    reserveGoalkeepers.length >= 1,
    'Debe reservarse al menos un portero suplente cuando esté disponible'
  );
  assert.ok(
    reserveGoalkeepers.every((player) => player && isPlayerAvailable(player)),
    'El guardameta suplente debe estar en condiciones de jugar'
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

test('generateSponsorOffers limita resultados y refleja perfil narrativo', () => {
  const club = createExampleClub();
  club.reputation = 68;
  const baseStats = {
    possession: { for: 60, against: 40 },
    shots: { for: 9, against: 4, onTargetFor: 6, onTargetAgainst: 2 },
    expectedGoals: { for: 2.1, against: 0.8 },
    passes: { completedFor: 220, attemptedFor: 260, completedAgainst: 120, attemptedAgainst: 180 },
    fouls: { for: 11, against: 9 },
    cards: { yellowFor: 1, yellowAgainst: 2, redFor: 0, redAgainst: 0 },
    injuries: { for: 0, against: 0 },
    saves: { for: 2, against: 3 },
  };
  const matchTemplate = { events: [], narrative: [], contributions: [], statistics: baseStats, commentary: [], viewMode: 'text' };
  const recent = [
    { ...matchTemplate, goalsFor: 3, goalsAgainst: 0 },
    { ...matchTemplate, goalsFor: 2, goalsAgainst: 1 },
    { ...matchTemplate, goalsFor: 1, goalsAgainst: 1 },
  ];
  const offers = generateSponsorOffers(club, recent, { rng: () => 0.42 });
  assert.ok(offers.length <= 3, 'Debe ofrecer como máximo tres alternativas a la vez');
  assert.ok(offers.some((offer) => offer.profile === 'purista'), 'Incluye perfiles variados');
  offers.forEach((offer) => {
    assert.ok(offer.upfrontPayment > 0, 'Cada oferta promete un pago inicial');
    assert.ok(offer.contract.value > 0, 'Las cantidades periódicas deben ser positivas');
  });
});

test('generateTvDeals ajusta pagos base y respeta límite', () => {
  const club = createExampleClub();
  club.reputation = 55;
  const baseStats = {
    possession: { for: 52, against: 48 },
    shots: { for: 7, against: 6, onTargetFor: 3, onTargetAgainst: 2 },
    expectedGoals: { for: 1.4, against: 1.1 },
    passes: { completedFor: 210, attemptedFor: 250, completedAgainst: 180, attemptedAgainst: 220 },
    fouls: { for: 12, against: 10 },
    cards: { yellowFor: 2, yellowAgainst: 2, redFor: 0, redAgainst: 0 },
    injuries: { for: 0, against: 0 },
    saves: { for: 4, against: 3 },
  };
  const matchTemplate = { events: [], narrative: [], contributions: [], statistics: baseStats, commentary: [], viewMode: 'text' };
  const recent = [
    { ...matchTemplate, goalsFor: 2, goalsAgainst: 0 },
    { ...matchTemplate, goalsFor: 4, goalsAgainst: 1 },
  ];
  const deals = generateTvDeals(club, recent, { rng: () => 0.11 });
  assert.ok(deals.length <= 2, 'Las ofertas televisivas deben limitarse a dos propuestas');
  deals.forEach((offer) => {
    assert.ok(offer.deal.perMatch >= 16000, 'El pago por partido mantiene mínimos razonables');
    assert.ok(offer.upfrontPayment >= 25000, 'El pago inicial televisivo debe ser significativo');
  });
});
