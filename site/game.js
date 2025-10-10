import { playMatchDay } from '../src/core/engine.js';
import {
  createDefaultMatchConfig,
  createDefaultLineup,
  createExampleClub,
  listCanallaDecisions,
} from '../src/core/data.js';
import { resolveCanallaDecision } from '../src/core/reputation.js';

const decisionSelect = document.querySelector('#decision-select');
const tacticSelect = document.querySelector('#tactic-select');
const formationSelect = document.querySelector('#formation-select');
const homeCheckbox = document.querySelector('#home-checkbox');
const opponentStrength = document.querySelector('#opponent-strength');
const opponentOutput = document.querySelector('#opponent-output');
const form = document.querySelector('#game-form');
const resetButton = document.querySelector('#reset-club');
const squadSelector = document.querySelector('#squad-selector');
const lineupCountEl = document.querySelector('#lineup-count');
const subsCountEl = document.querySelector('#subs-count');
const lineupErrorEl = document.querySelector('#lineup-error');
const planningCard = document.querySelector('#planning-card');
const planNextButton = document.querySelector('#plan-next');

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

const STARTERS_LIMIT = 11;
const SUBS_LIMIT = 5;
const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

function buildInitialConfig(club) {
  const baseConfig = createDefaultMatchConfig();
  const defaultLineup = createDefaultLineup(club);
  return {
    ...baseConfig,
    startingLineup: defaultLineup.starters,
    substitutes: defaultLineup.substitutes,
  };
}

let clubState = createExampleClub();
let configState = buildInitialConfig(clubState);

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
  if (formationSelect) {
    formationSelect.value = configState.formation ?? '4-4-2';
  }
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

function hideLineupError() {
  if (!lineupErrorEl) {
    return;
  }
  lineupErrorEl.hidden = true;
  lineupErrorEl.textContent = '';
}

function showLineupError(message) {
  if (!lineupErrorEl) {
    return;
  }
  lineupErrorEl.textContent = message;
  lineupErrorEl.hidden = false;
}

function updateSelectionCounts() {
  if (lineupCountEl) {
    lineupCountEl.textContent = `Titulares: ${configState.startingLineup.length} / ${STARTERS_LIMIT}`;
    lineupCountEl.classList.toggle('warning', configState.startingLineup.length !== STARTERS_LIMIT);
  }
  if (subsCountEl) {
    subsCountEl.textContent = `Suplentes: ${configState.substitutes.length} / ${SUBS_LIMIT}`;
    subsCountEl.classList.toggle('warning', configState.substitutes.length > SUBS_LIMIT);
  }
}

function getPlayerRole(playerId) {
  if (configState.startingLineup.includes(playerId)) {
    return 'starter';
  }
  if (configState.substitutes.includes(playerId)) {
    return 'sub';
  }
  return 'none';
}

function setPlayerRole(playerId, role) {
  configState.startingLineup = configState.startingLineup.filter((id) => id !== playerId);
  configState.substitutes = configState.substitutes.filter((id) => id !== playerId);

  if (role === 'starter') {
    configState.startingLineup = [...configState.startingLineup, playerId];
  } else if (role === 'sub') {
    configState.substitutes = [...configState.substitutes, playerId];
  }
}

function ensureLineupCompleteness() {
  const availableIds = clubState.squad.map((player) => player.id);
  const used = new Set([...configState.startingLineup, ...configState.substitutes]);

  for (const id of availableIds) {
    if (configState.startingLineup.length >= STARTERS_LIMIT) {
      break;
    }
    if (!used.has(id)) {
      configState.startingLineup.push(id);
      used.add(id);
    }
  }

  for (const id of availableIds) {
    if (configState.substitutes.length >= SUBS_LIMIT) {
      break;
    }
    if (!used.has(id)) {
      configState.substitutes.push(id);
      used.add(id);
    }
  }
}

function handleRoleChange(event) {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }
  const playerId = select.dataset.playerId;
  if (!playerId) {
    return;
  }

  const nextRole = select.value;
  const previousRole = getPlayerRole(playerId);

  if (nextRole === previousRole) {
    return;
  }

  if (nextRole === 'starter' && configState.startingLineup.length >= STARTERS_LIMIT) {
    showLineupError('Solo caben 11 titulares. Haz hueco antes de sumar otro.');
    select.value = previousRole;
    return;
  }

  if (nextRole === 'sub' && configState.substitutes.length >= SUBS_LIMIT) {
    showLineupError('El banquillo está lleno: máximo 5 suplentes.');
    select.value = previousRole;
    return;
  }

  setPlayerRole(playerId, nextRole);
  hideLineupError();
  updateSelectionCounts();
}

function renderSquadSelectors() {
  if (!squadSelector) {
    return;
  }

  const availableIds = new Set(clubState.squad.map((player) => player.id));

  const uniqueStarters = [];
  configState.startingLineup.forEach((id) => {
    if (availableIds.has(id) && !uniqueStarters.includes(id) && uniqueStarters.length < STARTERS_LIMIT) {
      uniqueStarters.push(id);
    }
  });
  configState.startingLineup = uniqueStarters;

  const uniqueSubs = [];
  configState.substitutes.forEach((id) => {
    if (
      availableIds.has(id) &&
      !uniqueStarters.includes(id) &&
      !uniqueSubs.includes(id) &&
      uniqueSubs.length < SUBS_LIMIT
    ) {
      uniqueSubs.push(id);
    }
  });
  configState.substitutes = uniqueSubs;

  ensureLineupCompleteness();
  hideLineupError();

  squadSelector.innerHTML = '';

  const players = [...clubState.squad].sort((a, b) => {
    const positionDiff = (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99);
    if (positionDiff !== 0) {
      return positionDiff;
    }
    return a.name.localeCompare(b.name);
  });

  players.forEach((player) => {
    const row = document.createElement('div');
    row.className = 'squad-row';

    const info = document.createElement('div');
    const nameEl = document.createElement('strong');
    nameEl.textContent = player.name;
    const detailsEl = document.createElement('span');
    detailsEl.textContent = `${player.position} · Moral ${formatMorale(player.morale)} · Forma ${player.fitness}/100`;
    info.append(nameEl, detailsEl);

    const select = document.createElement('select');
    select.className = 'squad-role';
    select.dataset.playerId = player.id;

    const options = [
      { value: 'none', label: 'Reservado' },
      { value: 'starter', label: 'Titular' },
      { value: 'sub', label: 'Suplente' },
    ];

    options.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      select.append(opt);
    });

    select.value = getPlayerRole(player.id);
    select.addEventListener('change', handleRoleChange);

    row.append(info, select);
    squadSelector.append(row);
  });

  updateSelectionCounts();
}

function switchToPlanningView() {
  if (planningCard) {
    planningCard.hidden = false;
  }
  if (reportCard) {
    reportCard.hidden = true;
  }
  renderSquadSelectors();
}

function switchToReportView() {
  if (planningCard) {
    planningCard.hidden = true;
  }
  if (reportCard) {
    reportCard.hidden = false;
  }
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
  if (reportCard) {
    reportCard.hidden = true;
  }
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
  if (planningCard) {
    planningCard.hidden = false;
  }
  hideLineupError();
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

  hideLineupError();
  if (configState.startingLineup.length !== STARTERS_LIMIT) {
    showLineupError(`Necesitas ${STARTERS_LIMIT} titulares para saltar al campo.`);
    return;
  }

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
    ...configState,
    home: homeCheckbox.checked,
    opponentStrength: Number.parseInt(opponentStrength.value, 10),
    tactic: tacticSelect.value,
    formation: formationSelect.value,
  };

  const report = playMatchDay(workingClub, configState, { decision, decisionOutcome });
  clubState = report.updatedClub;

  renderMatchReport(report, decisionOutcome);
  updateClubSummary();
  switchToReportView();
});

resetButton.addEventListener('click', () => {
  clubState = createExampleClub();
  configState = buildInitialConfig(clubState);
  decisionSelect.value = '';
  updateFormDefaults();
  updateClubSummary();
  switchToPlanningView();
  clearReport();
});

opponentStrength.addEventListener('input', updateOpponentOutput);

if (planNextButton) {
  planNextButton.addEventListener('click', () => {
    switchToPlanningView();
  });
}

function init() {
  populateDecisions();
  updateFormDefaults();
  updateClubSummary();
  updateOpponentOutput();
  switchToPlanningView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
