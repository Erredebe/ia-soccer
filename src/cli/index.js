#!/usr/bin/env node
/**
 * CLI canallesco para vivir la jornada desde la banda.
 * @module cli/index
 */

import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { playMatchDay } from '../core/engine.js';
import {
  createDefaultMatchConfig,
  createDefaultLineup,
  createExampleClub,
  listCanallaDecisions,
} from '../core/data.js';
import { resolveCanallaDecision } from '../core/reputation.js';

/**
 * @returns {Promise<import('../types.js').CanallaDecision | undefined>}
 */
async function promptDecision() {
  const decisions = listCanallaDecisions();
  const rl = createInterface({ input, output });
  console.log('\n=== Decisiones canallas disponibles ===');
  decisions.forEach((decision, index) => {
    console.log(`${index + 1}. ${decision.type} (intensidad ${decision.intensity})`);
  });
  console.log('0. Mantenerse pulcro (por ahora)');

  const answer = await rl.question('¿Qué travesura quieres intentar antes del partido? ');
  rl.close();

  const choice = Number.parseInt(answer, 10);
  if (!Number.isFinite(choice) || choice === 0) {
    return undefined;
  }

  return decisions[choice - 1];
}

async function runDemo() {
  console.log('Bienvenido al chiringuito canalla. Preparando temporada...');
  let club = createExampleClub();
  console.log(`Club: ${club.name}`);
  console.log(`Presupuesto inicial: ${club.budget.toLocaleString()}€`);
  console.log(`Reputación: ${club.reputation}`);

  const decision = await promptDecision();
  /** @type {import('../types.js').DecisionOutcome | undefined} */
  let decisionOutcome;
  if (decision) {
    const resolution = resolveCanallaDecision(club, decision);
    club = resolution.updatedClub;
    decisionOutcome = resolution.outcome;
    console.log('\n>>> Resultado de la travesura <<<');
    console.log(decisionOutcome.narrative);
    if (decisionOutcome.sanctions) {
      console.log(`Sanciones: ${decisionOutcome.sanctions}`);
    }
    console.log(
      `Reputación: ${club.reputation} | Presupuesto: ${club.budget.toLocaleString()}€ | Moral media: ${(
        club.squad.reduce((acc, p) => acc + p.morale, 0) / club.squad.length
      ).toFixed(1)}`
    );
  } else {
    console.log('Nada de canalladas... por ahora. Veremos si la grada perdona tanta pureza.');
  }

  const matchConfig = createDefaultMatchConfig();
  const defaultLineup = createDefaultLineup(club);
  matchConfig.startingLineup = defaultLineup.starters;
  matchConfig.substitutes = defaultLineup.substitutes;
  const report = playMatchDay(club, matchConfig, { decision, decisionOutcome });

  console.log('\n>>> Crónica del partido <<<');
  report.match.narrative.forEach((line) => console.log(line));
  console.log('\nEventos destacados:');
  report.match.events.forEach((event) => console.log(`- [${event.minute}'] ${event.description}`));

  if (report.decisionOutcome) {
    console.log('\nImpacto de la decisión canalla en el partido:');
    console.log(`Éxito: ${report.decisionOutcome.success ? 'sí' : 'no'}`);
    console.log(`Reputación +/-: ${report.decisionOutcome.reputationChange}`);
    console.log(`Moral +/-: ${report.decisionOutcome.moraleChange}`);
    console.log(`Caja +/-: ${report.decisionOutcome.financesChange.toLocaleString()}€`);
  }

  console.log('\nEstado del club tras la jornada:');
  console.log(`Presupuesto: ${report.updatedClub.budget.toLocaleString()}€`);
  console.log(`Reputación: ${report.updatedClub.reputation}`);
  console.log(
    `Moral media: ${(
      report.updatedClub.squad.reduce((acc, p) => acc + p.morale, 0) / report.updatedClub.squad.length
    ).toFixed(1)}`
  );
}

runDemo().catch((error) => {
  console.error('Se nos fue de las manos la noche: ', error);
  process.exit(1);
});
