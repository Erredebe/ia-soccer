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
  createDefaultInstructions,
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
  matchConfig.instructions = createDefaultInstructions();
  const defaultLineup = createDefaultLineup(club);
  matchConfig.startingLineup = defaultLineup.starters;
  matchConfig.substitutes = defaultLineup.substitutes;
  const report = playMatchDay(club, matchConfig, { decision, decisionOutcome });

  console.log('\n>>> Crónica del partido <<<');
  report.match.narrative.forEach((line) => console.log(line));
  console.log('\nEventos destacados:');
  report.match.events.forEach((event) => console.log(`- [${event.minute}'] ${event.description}`));

  if (report.match.viewMode === 'text' && report.match.commentary.length > 0) {
    console.log('\nMinuto a minuto estilo transistor:');
    report.match.commentary.forEach((line) => console.log(`• ${line}`));
  }

  const stats = report.match.statistics;
  console.log('\n>>> Estadísticas avanzadas <<<');
  console.log(
    `Posesión: ${stats.possession.for}% vs ${stats.possession.against}% | xG: ${stats.expectedGoals.for.toFixed(
      2
    )} - ${stats.expectedGoals.against.toFixed(2)}`
  );
  console.log(
    `Tiros (a puerta): ${stats.shots.for} (${stats.shots.onTargetFor}) - ${stats.shots.against} (${stats.shots.onTargetAgainst})`
  );
  console.log(
    `Pases completados: ${stats.passes.completedFor}/${stats.passes.attemptedFor} | Rival ${stats.passes.completedAgainst}/${stats.passes.attemptedAgainst}`
  );
  console.log(
    `Faltas: ${stats.fouls.for} (A ${stats.cards.yellowFor}, R ${stats.cards.redFor}) - Rival ${stats.fouls.against} (A ${stats.cards.yellowAgainst}, R ${stats.cards.redAgainst})`
  );
  console.log(`Paradas: ${stats.saves.for} propias, ${stats.saves.against} rival.`);

  if (report.decisionOutcome) {
    console.log('\nImpacto de la decisión canalla en el partido:');
    console.log(`Éxito: ${report.decisionOutcome.success ? 'sí' : 'no'}`);
    console.log(`Reputación +/-: ${report.decisionOutcome.reputationChange}`);
    console.log(`Moral +/-: ${report.decisionOutcome.moraleChange}`);
    console.log(`Caja +/-: ${report.decisionOutcome.financesChange.toLocaleString()}€`);
  }

  if (report.finances) {
    console.log('\n>>> Balance económico de la jornada <<<');
    console.log(`Ingresos: ${report.finances.income.toLocaleString()}€`);
    Object.entries(report.finances.incomeBreakdown).forEach(([label, value]) => {
      console.log(`  - ${label}: ${value.toLocaleString()}€`);
    });
    console.log(`Gastos: ${report.finances.expenses.toLocaleString()}€`);
    Object.entries(report.finances.expenseBreakdown).forEach(([label, value]) => {
      console.log(`  - ${label}: ${value.toLocaleString()}€`);
    });
    console.log(`Balance neto: ${report.finances.net.toLocaleString()}€`);
    if (report.finances.attendance) {
      console.log(`Asistencia estimada: ${report.finances.attendance.toLocaleString()} aficionados.`);
    }
    report.finances.notes.forEach((note) => console.log(`  * ${note}`));
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
