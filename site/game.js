import { playMatchDay } from '../src/core/engine.js';
import {
  createDefaultMatchConfig,
  createExampleClub,
  listCanallaDecisions,
} from '../src/core/data.js';
import { resolveCanallaDecision } from '../src/core/reputation.js';

const decisionSelect = document.querySelector('#decision-select');
const tacticSelect = document.querySelector('#tactic-select');
const homeCheckbox = document.querySelector('#home-checkbox');
const opponentStrength = document.querySelector('#opponent-strength');
const opponentOutput = document.querySelector('#opponent-output');
const form = document.querySelector('#game-form');
const resetButton = document.querySelector('#reset-club');

const clubNameEl = document.querySelector('#club-name');
const clubBudgetEl = document.querySelector('#club-budget');
const clubReputationEl = document.querySelector('#club-reputation');
const clubMoraleEl = document.querySelector('#club-morale');

const reportCard = document.querySelector('#report-card');
const scorelineEl = document.querySelector('#scoreline');
const financesDeltaEl = document.querySelector('#finances-delta');
const narrativeList = document.querySelector('#narrative-list');
const eventsList = document.querySelector('#events-list');
const decisionReport = document.querySelector('#decision-report');
const decisionNarrative = document.querySelector('#decision-narrative');
const decisionStats = document.querySelector('#decision-stats');
const postBudgetEl = document.querySelector('#post-budget');
const postReputationEl = document.querySelector('#post-reputation');
const postMoraleEl = document.querySelector('#post-morale');

const decisions = listCanallaDecisions();
const decisionLabels = {
  sobornoArbitro: 'Soborno al árbitro',
  filtrarRumor: 'Filtrar rumor',
  fiestaIlegal: 'Fiesta ilegal',
  presionarFederacion: 'Presionar a la federación',
};

const numberFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

let clubState = createExampleClub();
let configState = createDefaultMatchConfig();

function populateDecisions() {
  if (decisionSelect.dataset.populated === 'true') {
    return;
  }

  decisions.forEach((decision, index) => {
    const option = document.createElement('option');
    const label = decisionLabels[decision.type] ?? decision.type;
    option.value = String(index);
    option.textContent = `${label} (intensidad ${decision.intensity})`;
    decisionSelect.append(option);
  });

  decisionSelect.dataset.populated = 'true';
}

function updateFormDefaults() {
  tacticSelect.value = configState.tactic;
  homeCheckbox.checked = configState.home;
  opponentStrength.value = String(configState.opponentStrength);
  updateOpponentOutput();
}

function averageMorale(club) {
  const total = club.squad.reduce((sum, player) => sum + player.morale, 0);
  return total / club.squad.length;
}

function formatMorale(value) {
  return `${value.toFixed(1)} / 100`;
}

function updateClubSummary() {
  clubNameEl.textContent = clubState.name;
  clubBudgetEl.textContent = numberFormatter.format(clubState.budget);
  clubReputationEl.textContent = `${clubState.reputation}`;
  clubMoraleEl.textContent = formatMorale(averageMorale(clubState));
}

function updateOpponentOutput() {
  opponentOutput.value = opponentStrength.value;
  opponentOutput.textContent = opponentStrength.value;
}

function clearReport() {
  reportCard.hidden = true;
  scorelineEl.textContent = '';
  financesDeltaEl.textContent = '';
  narrativeList.innerHTML = '';
  eventsList.innerHTML = '';
  decisionReport.hidden = true;
  decisionNarrative.textContent = '';
  decisionStats.innerHTML = '';
  postBudgetEl.textContent = '';
  postReputationEl.textContent = '';
  postMoraleEl.textContent = '';
}

function renderDecisionOutcome(decisionOutcome) {
  if (!decisionOutcome) {
    decisionReport.hidden = true;
    decisionNarrative.textContent = '';
    decisionStats.innerHTML = '';
    return;
  }

  decisionReport.hidden = false;
  decisionNarrative.textContent = decisionOutcome.narrative;

  const stats = [
    `Éxito: ${decisionOutcome.success ? 'sí' : 'no'}`,
    `Reputación: ${decisionOutcome.reputationChange >= 0 ? '+' : ''}${decisionOutcome.reputationChange}`,
    `Moral: ${decisionOutcome.moraleChange >= 0 ? '+' : ''}${decisionOutcome.moraleChange}`,
    `Caja: ${numberFormatter.format(decisionOutcome.financesChange)}`,
    `Nivel de riesgo percibido: ${decisionOutcome.riskLevel}/100`,
  ];

  if (decisionOutcome.sanctions) {
    stats.push(`Sanciones: ${decisionOutcome.sanctions}`);
  }

  decisionStats.innerHTML = '';
  stats.forEach((stat) => {
    const li = document.createElement('li');
    li.textContent = stat;
    decisionStats.append(li);
  });
}

function renderMatchReport(report, decisionOutcome) {
  const clubName = clubState.name;
  const scoreline = `${clubName} ${report.match.goalsFor} - ${report.match.goalsAgainst} Rival misterioso`;
  scorelineEl.textContent = scoreline;

  const financesPrefix = report.financesDelta >= 0 ? '+' : '−';
  const absFinances = Math.abs(report.financesDelta);
  financesDeltaEl.textContent = `Balance de la jornada: ${financesPrefix}${numberFormatter.format(absFinances)}`;

  narrativeList.innerHTML = '';
  report.match.narrative.forEach((line) => {
    const item = document.createElement('li');
    item.textContent = line;
    narrativeList.append(item);
  });

  eventsList.innerHTML = '';
  report.match.events.forEach((event) => {
    const item = document.createElement('li');
    item.textContent = `[${event.minute}'] ${event.description}`;
    eventsList.append(item);
  });

  renderDecisionOutcome(decisionOutcome);

  postBudgetEl.textContent = numberFormatter.format(report.updatedClub.budget);
  postReputationEl.textContent = `${report.updatedClub.reputation}`;
  postMoraleEl.textContent = formatMorale(averageMorale(report.updatedClub));

  reportCard.hidden = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const decisionIndex = decisionSelect.value;
  let decision;
  let decisionOutcome;
  let workingClub = clubState;

  if (decisionIndex !== '') {
    decision = decisions[Number.parseInt(decisionIndex, 10)];
    const resolution = resolveCanallaDecision(workingClub, decision);
    workingClub = resolution.updatedClub;
    decisionOutcome = resolution.outcome;
  }

  configState = {
    home: homeCheckbox.checked,
    opponentStrength: Number.parseInt(opponentStrength.value, 10),
    tactic: tacticSelect.value,
  };

  const report = playMatchDay(workingClub, configState, { decision, decisionOutcome });
  clubState = report.updatedClub;

  renderMatchReport(report, decisionOutcome);
  updateClubSummary();
});

resetButton.addEventListener('click', () => {
  clubState = createExampleClub();
  configState = createDefaultMatchConfig();
  decisionSelect.value = '';
  updateFormDefaults();
  updateClubSummary();
  clearReport();
});

opponentStrength.addEventListener('input', updateOpponentOutput);

function init() {
  populateDecisions();
  updateFormDefaults();
  updateClubSummary();
  updateOpponentOutput();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
