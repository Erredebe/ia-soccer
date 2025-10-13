// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { createExampleClub } from '../src/core/data.js';
import {
  resolveCanallaDecision,
  resolveCupReputation,
  tickCanallaState,
  describeSponsorChoice,
  describeTvDealChoice,
} from '../src/core/reputation.js';

/** Retorna un valor bajo para forzar éxitos en las pruebas. */
const alwaysSuccess = () => 0.01;
/** Retorna un valor alto para simular fracasos continuados. */
const alwaysFail = () => 0.99;

test('resolveCanallaDecision mejora la moral y reputación cuando sale bien', () => {
  const club = createExampleClub();
  let rolls = 0;
  const successNoInspection = () => {
    rolls += 1;
    return rolls === 1 ? 0.01 : 0.99;
  };
  const { outcome, updatedClub } = resolveCanallaDecision(
    club,
    { type: 'filtrarRumor', intensity: 'media' },
    successNoInspection
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

test('las decisiones nuevas programan efectos a medio plazo y acumulan calor', () => {
  const club = createExampleClub();
  const { outcome, updatedClub } = resolveCanallaDecision(
    club,
    { type: 'sobornoJugador', intensity: 'media' },
    alwaysSuccess
  );

  assert.equal(outcome.success, true);
  assert.ok(outcome.heatChange > 0);
  assert.ok(Array.isArray(updatedClub.canallaStatus?.ongoingEffects));
  assert.ok((updatedClub.canallaStatus?.ongoingEffects?.length ?? 0) > 0);

  const passive = tickCanallaState(updatedClub);
  assert.ok(passive.applied.morale > 0, 'Los efectos diferidos deben modificar la moral');
  assert.ok(passive.status.heat >= updatedClub.canallaStatus.heat - 1, 'El calor no debe dispararse hacia valores negativos.');
});

test('resolveCupReputation premia levantar el trofeo y castiga la eliminación', () => {
  const win = resolveCupReputation('final', 'champion');
  assert.ok(win.reputation > 0);
  assert.ok(win.narrative.includes('mito'));
  const elimination = resolveCupReputation('semiFinal', 'eliminated');
  assert.ok(elimination.reputation < 0);
  assert.ok(elimination.narrative.includes('tropiezo'));
});

test('describeSponsorChoice genera narrativa coherente con la elección', () => {
  const offer = {
    id: 'oferta',
    profile: 'canalla',
    contract: { name: 'Criptocasino', value: 25000, frequency: 'match', lastPaidMatchDay: -1 },
    upfrontPayment: 30000,
    reputationImpact: { accept: -3, reject: 2 },
    summary: 'Oferta picante para financiar las noches de gloria.',
    clauses: [],
  };
  const accept = describeSponsorChoice({ action: 'accept', offer, upfrontPayment: offer.upfrontPayment });
  assert.ok(accept[0].includes('show') || accept[0].includes('nocturnos') || accept[0].includes('gamberro'));
  const reject = describeSponsorChoice({ action: 'reject', offer, upfrontPayment: offer.upfrontPayment });
  assert.ok(reject[0].includes('respira') || reject[0].includes('evita'));
});

test('describeTvDealChoice resume pagos y reacción mediática', () => {
  const offer = {
    id: 'tv',
    profile: 'purista',
    deal: { name: 'Televisión Pública', perMatch: 28000, bonusWin: 14000, bonusDraw: 6000 },
    upfrontPayment: 45000,
    reputationImpact: { accept: 3, reject: -1 },
    summary: 'Cobertura respetuosa y cercana.',
    clauses: [],
  };
  const lines = describeTvDealChoice({ action: 'accept', offer, upfrontPayment: offer.upfrontPayment });
  assert.ok(lines[0].includes('Televisión') || lines[0].includes('cámaras'));
  assert.ok(lines[0].includes('cobra'));
});
