import { playMatchDay } from '../src/core/engine.js';
import {
  createDefaultMatchConfig,
  createDefaultLineup,
  createExampleClub,
  createExampleTransferMarket,
  estimatePlayerValue,
  listCanallaDecisions,
  updateLeagueTableAfterMatch,
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
const lineupBoard = document.querySelector('#lineup-board');
const lineupTableBody = document.querySelector('#lineup-table-body');
const lineupCountEl = document.querySelector('#lineup-count');
const subsCountEl = document.querySelector('#subs-count');
const lineupAutosortButton = document.querySelector('#lineup-autosort');
const lineupErrorEl = document.querySelector('#lineup-error');
const planningModal = document.querySelector('#modal-planning');
const reportModal = document.querySelector('#modal-report');
const planNextButton = document.querySelector('#plan-next');

const clubNameEl = document.querySelector('#club-name');
const clubBudgetEl = document.querySelector('#club-budget');
const clubReputationEl = document.querySelector('#club-reputation');
const clubMoraleEl = document.querySelector('#club-morale');

const leagueMatchdayEl = document.querySelector('#league-matchday');
const leagueTableBody = document.querySelector('#league-table-body');
const transferListEl = document.querySelector('#transfer-list');
const transferMessageEl = document.querySelector('#transfer-message');

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

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

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
let leagueState = clubState.league;
let transferMarketState = createExampleTransferMarket(clubState);
let configState = buildInitialConfig(clubState);
let transferMessageTimeout;
let modalHandlersAttached = false;

function updateBodyModalState() {
  const hasOpenModal = document.querySelector('.modal.is-open') !== null;
  document.body.classList.toggle('modal-open', hasOpenModal);
}

function focusModal(modal) {
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  const focusTarget =
    modal.querySelector('[data-modal-initial-focus]') ?? modal.querySelector(FOCUSABLE_SELECTOR);

  if (focusTarget instanceof HTMLElement) {
    window.requestAnimationFrame(() => {
      focusTarget.focus();
    });
  }
}

function closeModal(modal) {
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  updateBodyModalState();
}

function closeAllModals() {
  const openModals = document.querySelectorAll('.modal.is-open');
  openModals.forEach((modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });
  updateBodyModalState();
}

function openModal(modal) {
  if (!(modal instanceof HTMLElement)) {
    return;
  }

  if (modal.classList.contains('is-open')) {
    focusModal(modal);
    return;
  }

  closeAllModals();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  updateBodyModalState();
  focusModal(modal);
}

function attachModalHandlers() {
  if (modalHandlersAttached) {
    return;
  }
  modalHandlersAttached = true;

  const triggers = document.querySelectorAll('[data-modal-target]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const targetSelector = trigger.getAttribute('data-modal-target');
      if (!targetSelector) {
        return;
      }
      const modal = document.querySelector(targetSelector);
      openModal(modal);
    });
  });

  const closers = document.querySelectorAll('[data-modal-close]');
  closers.forEach((closer) => {
    closer.addEventListener('click', () => {
      const modal = closer.closest('.modal');
      closeModal(modal);
    });
  });

  const modals = document.querySelectorAll('.modal');
  modals.forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openModalElement = document.querySelector('.modal.is-open');
      if (openModalElement) {
        closeModal(openModalElement);
      }
    }
  });
}

function populateDecisions() {
  if (!decisionSelect || decisionSelect.dataset.populated === 'true') {
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
  if (lineupErrorEl.dataset.state) {
    delete lineupErrorEl.dataset.state;
  }
  lineupErrorEl.classList.remove('lineup-message');
}

function showLineupError(message) {
  if (!lineupErrorEl) {
    return;
  }
  lineupErrorEl.textContent = message;
  lineupErrorEl.hidden = false;
  lineupErrorEl.dataset.state = 'error';
  lineupErrorEl.classList.remove('lineup-message');
}

function showLineupNotice(message) {
  if (!lineupErrorEl) {
    return;
  }
  lineupErrorEl.textContent = message;
  lineupErrorEl.hidden = false;
  lineupErrorEl.dataset.state = 'notice';
  lineupErrorEl.classList.add('lineup-message');
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

function autoSortLineup() {
  hideLineupError();

  const playersById = new Map(clubState.squad.map((player) => [player.id, player]));
  const getSortData = (playerId) => {
    const player = playersById.get(playerId);
    if (!player) {
      return { rank: Number.POSITIVE_INFINITY, name: '' };
    }
    return {
      rank: POSITION_ORDER[player.position] ?? Number.POSITIVE_INFINITY,
      name: player.name,
    };
  };

  const sorter = (aId, bId) => {
    const aData = getSortData(aId);
    const bData = getSortData(bId);
    if (aData.rank !== bData.rank) {
      return aData.rank - bData.rank;
    }
    return aData.name.localeCompare(bData.name);
  };

  configState.startingLineup = [...configState.startingLineup].sort(sorter);
  configState.substitutes = [...configState.substitutes].sort(sorter);

  renderLineupBoard();
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

function clampIndex(list, desiredIndex) {
  if (typeof desiredIndex !== 'number' || Number.isNaN(desiredIndex)) {
    return list.length;
  }
  return Math.max(0, Math.min(desiredIndex, list.length));
}

function applyRoleChange(playerId, role, options = {}) {
  const { preferredIndex } = options;
  const starters = configState.startingLineup.filter((id) => id !== playerId);
  const subs = configState.substitutes.filter((id) => id !== playerId);

  if (role === 'starter') {
    const index = clampIndex(starters, preferredIndex);
    starters.splice(index, 0, playerId);
  } else if (role === 'sub') {
    const index = clampIndex(subs, preferredIndex);
    subs.splice(index, 0, playerId);
  }

  configState.startingLineup = starters;
  configState.substitutes = subs;
}

const setPlayerRole = applyRoleChange;

function findPlayerById(playerId) {
  return clubState.squad.find((player) => player.id === playerId);
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

function calculateWeeklyWageBill(squad) {
  return squad.reduce((acc, player) => acc + player.salary / 4, 0);
}

function clampStat(value) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function createStatCell(value) {
  const cell = document.createElement('td');
  cell.className = 'lineup-table__stat';
  const meter = document.createElement('div');
  meter.className = 'lineup-table__stat-meter';
  const bar = document.createElement('div');
  bar.className = 'lineup-table__stat-meter-bar';
  const fill = document.createElement('div');
  fill.className = 'lineup-table__stat-meter-fill';
  fill.style.setProperty('--value', String(clampStat(value)));
  bar.append(fill);
  const label = document.createElement('span');
  label.className = 'lineup-table__stat-value';
  label.textContent = String(clampStat(value));
  meter.append(bar, label);
  cell.append(meter);
  return cell;
}

function createMetaSpan(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
}

function createRoleControl(player) {
  const cell = document.createElement('td');
  const control = document.createElement('div');
  control.className = 'lineup-role-control';
  const currentRole = getPlayerRole(player.id);
  const roles = [
    { key: 'starter', label: 'Titular' },
    { key: 'sub', label: 'Banquillo' },
    { key: 'none', label: 'Reserva' },
  ];

  roles.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lineup-role-button';
    button.textContent = label;
    button.dataset.role = key;
    if (currentRole === key) {
      button.classList.add('is-active');
    }
    button.addEventListener('click', () => {
      handleRoleSelection(player.id, key);
    });
    control.append(button);
  });

  cell.append(control);
  return cell;
}

function handleRoleSelection(playerId, role) {
  if (!playerId) {
    return;
  }

  const previousRole = getPlayerRole(playerId);
  if (role === previousRole) {
    hideLineupError();
    return;
  }

  const getCollectionForRole = (targetRole) => {
    if (targetRole === 'starter') {
      return configState.startingLineup;
    }
    if (targetRole === 'sub') {
      return configState.substitutes;
    }
    return null;
  };

  const targetCollection = getCollectionForRole(role);
  const targetLimit = role === 'starter' ? STARTERS_LIMIT : role === 'sub' ? SUBS_LIMIT : Number.POSITIVE_INFINITY;

  let noticeMessage = '';

  if (role !== previousRole && targetCollection && targetCollection.length >= targetLimit) {
    const candidateId = targetCollection.find((id) => id !== playerId);
    if (!candidateId) {
      if (role === 'starter') {
        showLineupError('Solo caben 11 titulares. Haz hueco antes de sumar otro.');
      } else if (role === 'sub') {
        showLineupError('El banquillo está lleno: máximo 5 suplentes.');
      }
      return;
    }

    const fallbackRole = previousRole;
    const fallbackIndex =
      fallbackRole === 'starter'
        ? configState.startingLineup.length
        : fallbackRole === 'sub'
          ? configState.substitutes.length
          : -1;
    const displacedPlayer = findPlayerById(candidateId);

    applyRoleChange(candidateId, fallbackRole, { preferredIndex: fallbackIndex });

    if (displacedPlayer) {
      const fallbackLabel =
        fallbackRole === 'starter'
          ? 'titularidad'
          : fallbackRole === 'sub'
            ? 'banquillo'
            : 'lista de reservas';
      noticeMessage = `${displacedPlayer.name} se movió a la ${fallbackLabel}.`;
    }
  }

  const targetIndex =
    role === 'starter'
      ? configState.startingLineup.length
      : role === 'sub'
        ? configState.substitutes.length
        : -1;

  applyRoleChange(playerId, role, { preferredIndex: targetIndex });

  renderLineupBoard();

  if (noticeMessage) {
    showLineupNotice(noticeMessage);
  } else {
    hideLineupError();
  }
}

function renderLineupBoard() {
  if (!lineupBoard || !lineupTableBody) {
    return;
  }

  ensureLineupCompleteness();
  hideLineupError();

  const players = [...clubState.squad].sort((a, b) => {
    const roleRank = { starter: 0, sub: 1, none: 2 };
    const roleDiff = roleRank[getPlayerRole(a.id)] - roleRank[getPlayerRole(b.id)];
    if (roleDiff !== 0) {
      return roleDiff;
    }
    const positionDiff = (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99);
    if (positionDiff !== 0) {
      return positionDiff;
    }
    return a.name.localeCompare(b.name);
  });

  lineupTableBody.innerHTML = '';

  players.forEach((player) => {
    const row = document.createElement('tr');
    row.dataset.playerId = player.id;
    row.dataset.role = getPlayerRole(player.id);

    const indexCell = document.createElement('th');
    indexCell.scope = 'row';
    indexCell.textContent = String(lineupTableBody.children.length + 1);

    const playerCell = document.createElement('td');
    playerCell.className = 'lineup-table__player';
    const name = document.createElement('span');
    name.className = 'lineup-table__player-name';
    name.textContent = player.name;
    const meta = document.createElement('div');
    meta.className = 'lineup-table__player-meta';
    meta.append(
      createMetaSpan(player.position),
      createMetaSpan(`${player.age} años`),
      createMetaSpan(`Valor ${numberFormatter.format(estimatePlayerValue(player))}`)
    );
    playerCell.append(name, meta);

    const statValues = [
      player.fitness,
      player.attributes.pace,
      player.attributes.stamina,
      player.attributes.shooting,
      player.attributes.defending,
      player.attributes.passing,
      player.attributes.dribbling,
      player.attributes.leadership,
    ];

    const cells = statValues.map((value) => createStatCell(value));
    const moraleCell = createStatCell(player.morale);

    const roleCell = createRoleControl(player);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'lineup-table__actions';
    const sellButton = document.createElement('button');
    sellButton.type = 'button';
    sellButton.className = 'lineup-sell-button';
    sellButton.textContent = 'Vender';
    sellButton.addEventListener('click', () => {
      sellPlayer(player.id);
    });
    actionsCell.append(sellButton);

    row.append(indexCell, playerCell, ...cells, moraleCell, roleCell, actionsCell);
    lineupTableBody.append(row);
  });
  updateSelectionCounts();
}

function switchToPlanningView() {
  if (planningModal) {
    openModal(planningModal);
  }
  renderLineupBoard();
}

function switchToReportView() {
  if (reportModal) {
    openModal(reportModal);
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

function renderLeagueTable() {
  if (!leagueTableBody || !leagueState) {
    return;
  }

  leagueTableBody.innerHTML = '';
  leagueState.table.forEach((standing, index) => {
    const row = document.createElement('tr');
    if (standing.club === clubState.name) {
      row.classList.add('is-user');
    }
    const positionCell = document.createElement('td');
    positionCell.textContent = String(index + 1);
    const nameCell = document.createElement('td');
    nameCell.textContent = standing.club;
    const played = document.createElement('td');
    played.textContent = String(standing.played);
    const wins = document.createElement('td');
    wins.textContent = String(standing.wins);
    const draws = document.createElement('td');
    draws.textContent = String(standing.draws);
    const losses = document.createElement('td');
    losses.textContent = String(standing.losses);
    const goalsFor = document.createElement('td');
    goalsFor.textContent = String(standing.goalsFor);
    const goalsAgainst = document.createElement('td');
    goalsAgainst.textContent = String(standing.goalsAgainst);
    const points = document.createElement('td');
    points.textContent = String(standing.points);

    row.append(positionCell, nameCell, played, wins, draws, losses, goalsFor, goalsAgainst, points);
    leagueTableBody.append(row);
  });

  if (leagueMatchdayEl) {
    leagueMatchdayEl.textContent = leagueState.matchDay > 0 ? `Jornada ${leagueState.matchDay}` : 'Pretemporada';
  }
}

function clearTransferMessage() {
  if (!transferMessageEl) {
    return;
  }
  transferMessageEl.hidden = true;
  transferMessageEl.textContent = '';
  transferMessageEl.classList.remove('error');
}

function showTransferMessage(message, type = 'info') {
  if (!transferMessageEl) {
    return;
  }
  transferMessageEl.textContent = message;
  transferMessageEl.hidden = false;
  transferMessageEl.classList.toggle('error', type === 'error');
  if (transferMessageTimeout) {
    window.clearTimeout(transferMessageTimeout);
  }
  transferMessageTimeout = window.setTimeout(() => {
    clearTransferMessage();
  }, 4000);
}

function renderTransferMarket() {
  if (!transferListEl) {
    return;
  }

  transferListEl.innerHTML = '';

  if (transferMarketState.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'transfer-empty';
    empty.textContent = 'El mercado está calmado... por ahora.';
    transferListEl.append(empty);
    return;
  }

  transferMarketState.forEach((target) => {
    const card = document.createElement('article');
    card.className = 'transfer-card';

    const header = document.createElement('div');
    header.className = 'transfer-card__header';

    const title = document.createElement('div');
    title.className = 'transfer-card__title';
    const name = document.createElement('strong');
    name.textContent = target.player.name;
    const position = document.createElement('span');
    position.textContent = `${target.player.position} · ${target.origin}`;
    title.append(name, position);

    const value = document.createElement('span');
    value.className = 'transfer-card__value';
    value.textContent = numberFormatter.format(target.price);

    header.append(title, value);

    const meta = document.createElement('div');
    meta.className = 'transfer-card__meta';
    const age = document.createElement('span');
    age.textContent = `${target.player.age} años`;
    const morale = document.createElement('span');
    morale.textContent = `Moral ${formatMorale(target.player.morale)}`;
    const salary = document.createElement('span');
    salary.textContent = `Sueldo semanal ${numberFormatter.format(target.player.salary / 4)}`;
    meta.append(age, morale, salary);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'transfer-button';
    action.textContent = `Fichar por ${numberFormatter.format(target.price)}`;
    action.disabled = clubState.budget < target.price;
    action.addEventListener('click', () => buyPlayer(target.id));

    card.append(header, meta, action);
    transferListEl.append(card);
  });
}

function calculateSaleValue(player) {
  return Math.round(estimatePlayerValue(player) * 0.75);
}

function buyPlayer(targetId) {
  const index = transferMarketState.findIndex((target) => target.id === targetId);
  if (index === -1) {
    return;
  }
  const target = transferMarketState[index];
  if (clubState.budget < target.price) {
    showTransferMessage('No alcanza la caja para ese fichaje.', 'error');
    return;
  }

  const newPlayer = {
    ...target.player,
    morale: target.player.morale + 10,
    fitness: Math.min(100, target.player.fitness + 5),
    salary: Math.max(target.player.salary, Math.round(target.price / 52)),
  };

  const updatedSquad = [...clubState.squad, newPlayer];
  const updatedBudget = clubState.budget - target.price;

  clubState = {
    ...clubState,
    budget: updatedBudget,
    reputation: Math.min(100, clubState.reputation + 1),
    squad: updatedSquad,
    weeklyWageBill: calculateWeeklyWageBill(updatedSquad),
  };

  transferMarketState = [
    ...transferMarketState.slice(0, index),
    ...transferMarketState.slice(index + 1),
  ];

  ensureLineupCompleteness();
  renderLineupBoard();
  renderTransferMarket();
  updateClubSummary();
  showTransferMessage(`¡${newPlayer.name} se enfunda la camiseta por ${numberFormatter.format(target.price)}!`);
}

function sellPlayer(playerId) {
  const player = clubState.squad.find((item) => item.id === playerId);
  if (!player) {
    return;
  }
  if (clubState.squad.length <= STARTERS_LIMIT + SUBS_LIMIT) {
    showTransferMessage('No puedes quedarte sin banquillo competitivo.', 'error');
    return;
  }

  const salePrice = calculateSaleValue(player);

  setPlayerRole(playerId, 'none');

  const remainingSquad = clubState.squad.filter((item) => item.id !== playerId);

  clubState = {
    ...clubState,
    budget: clubState.budget + salePrice,
    reputation: Math.max(-100, clubState.reputation - 1),
    squad: remainingSquad,
    weeklyWageBill: calculateWeeklyWageBill(remainingSquad),
  };

  transferMarketState = [
    ...transferMarketState,
    {
      id: `rebotado-${player.id}-${Date.now()}`,
      player: { ...player, morale: Math.max(player.morale, 35) },
      price: Math.round(estimatePlayerValue(player) * 1.05),
      origin: clubState.name,
    },
  ];

  ensureLineupCompleteness();
  renderLineupBoard();
  renderTransferMarket();
  updateClubSummary();
  showTransferMessage(`${player.name} vendido por ${numberFormatter.format(salePrice)}.`);
}

function clearReport() {
  closeModal(reportModal);
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
  hideLineupError();
}

if (lineupAutosortButton) {
  lineupAutosortButton.addEventListener('click', autoSortLineup);
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
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  hideLineupError();
  if (configState.startingLineup.length !== STARTERS_LIMIT) {
    showLineupError(`Necesitas ${STARTERS_LIMIT} titulares para saltar al campo.`);
    return;
  }
  if (configState.substitutes.length > SUBS_LIMIT) {
    showLineupError('Reduce el banquillo a 5 suplentes.');
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
  const updatedLeague = updateLeagueTableAfterMatch(leagueState ?? workingClub.league, workingClub.name, report.match);
  leagueState = updatedLeague;

  const refreshedWageBill = calculateWeeklyWageBill(report.updatedClub.squad);

  clubState = {
    ...report.updatedClub,
    weeklyWageBill: refreshedWageBill,
    league: updatedLeague,
  };

  renderLeagueTable();
  renderTransferMarket();
  renderLineupBoard();
  renderMatchReport(report, decisionOutcome);
  updateClubSummary();
  switchToReportView();
});

resetButton.addEventListener('click', () => {
  clubState = createExampleClub();
  leagueState = clubState.league;
  transferMarketState = createExampleTransferMarket(clubState);
  configState = buildInitialConfig(clubState);
  decisionSelect.value = '';
  updateFormDefaults();
  updateClubSummary();
  renderLeagueTable();
  renderTransferMarket();
  renderLineupBoard();
  switchToPlanningView();
  clearTransferMessage();
  clearReport();
});

opponentStrength.addEventListener('input', updateOpponentOutput);

if (planNextButton) {
  planNextButton.addEventListener('click', () => {
    closeModal(reportModal);
    switchToPlanningView();
  });
}

function init() {
  attachModalHandlers();
  populateDecisions();
  updateFormDefaults();
  updateClubSummary();
  renderLeagueTable();
  renderTransferMarket();
  updateOpponentOutput();
  switchToPlanningView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
