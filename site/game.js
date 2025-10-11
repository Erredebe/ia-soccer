import { playMatchDay } from '../src/core/engine.js';
import {
  createDefaultMatchConfig,
  createDefaultLineup,
  createExampleClub,
  createExampleTransferMarket,
  createExampleLeague,
  createSeasonStats,
  createDefaultInstructions,
  estimatePlayerValue,
  listCanallaDecisions,
  updateLeagueTableAfterMatch,
  TOTAL_MATCHDAYS,
  isPlayerAvailable,
  resetPlayerForNewSeason,
} from '../src/core/data.js';
import { resolveCanallaDecision } from '../src/core/reputation.js';
import { clearSavedGame, loadSavedGame, saveGame, SAVE_VERSION } from '../src/core/persistence.js';

const decisionSelect = document.querySelector('#decision-select');
const tacticSelect = document.querySelector('#tactic-select');
const formationSelect = document.querySelector('#formation-select');
const homeCheckbox = document.querySelector('#home-checkbox');
const opponentStrength = document.querySelector('#opponent-strength');
const opponentOutput = document.querySelector('#opponent-output');
const seedInput = document.querySelector('#seed-input');
const form = document.querySelector('#game-form');
const resetButton = document.querySelector('#reset-club');
const lineupBoard = document.querySelector('#lineup-board');
const lineupTableBody = document.querySelector('#lineup-table-body');
const lineupCountEl = document.querySelector('#lineup-count');
const subsCountEl = document.querySelector('#subs-count');
const lineupAutosortButton = document.querySelector('#lineup-autosort');
const lineupErrorEl = document.querySelector('#lineup-error');
const lineupModal = document.querySelector('#modal-lineup');
const reportModal = document.querySelector('#modal-report');
const planNextButton = document.querySelector('#plan-next');
const saveButton = document.querySelector('#save-game');
const saveFeedback = document.querySelector('#save-feedback');
const saveVersionEl = document.querySelector('#save-version');
const loadNoticeEl = document.querySelector('#load-notice');

const matchdayBadgeEl = document.querySelector('#matchday-badge');
const matchOpponentNameEl = document.querySelector('#match-opponent-name');
const matchOpponentStrengthEl = document.querySelector('#match-opponent-strength');
const matchOpponentRecordEl = document.querySelector('#match-opponent-record');
const matchLocationEl = document.querySelector('#match-location');
const matchLineupStatusEl = document.querySelector('#match-lineup-status');
const matchSeedEl = document.querySelector('#match-seed');

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
const financesAttendanceEl = document.querySelector('#finances-attendance');
const financesIncomeList = document.querySelector('#finances-income');
const financesExpenseList = document.querySelector('#finances-expenses');
const narrativeList = document.querySelector('#narrative-list');
const eventsList = document.querySelector('#events-list');
const decisionReport = document.querySelector('#decision-report');
const decisionNarrative = document.querySelector('#decision-narrative');
const decisionStats = document.querySelector('#decision-stats');
const postBudgetEl = document.querySelector('#post-budget');
const postReputationEl = document.querySelector('#post-reputation');
const postMoraleEl = document.querySelector('#post-morale');
const mvpBadge = document.querySelector('#mvp-badge');

const seasonSummarySection = document.querySelector('#season-summary');
const seasonChampionEl = document.querySelector('#season-champion');
const seasonTopScorersList = document.querySelector('#season-top-scorers');
const seasonTopAssistsList = document.querySelector('#season-top-assists');
const seasonAveragePossessionEl = document.querySelector('#season-average-possession');
const seasonStreakEl = document.querySelector('#season-streak');
const newSeasonButton = document.querySelector('#new-season');

const resultsControlButton = document.querySelector('[data-panel-action="results"]');
const calendarList = document.querySelector('#calendar-list');
const calendarNoteEl = document.querySelector('#calendar-note');
const tacticPlanEl = document.querySelector('#tactic-plan');
const tacticFormationEl = document.querySelector('#tactic-formation');
const tacticInstructionsList = document.querySelector('#tactic-instructions');
const opponentModalNameEl = document.querySelector('#opponent-modal-name');
const opponentModalRecordEl = document.querySelector('#opponent-modal-record');
const opponentModalStrengthEl = document.querySelector('#opponent-modal-strength');
const opponentModalLocationEl = document.querySelector('#opponent-modal-location');
const opponentModalCommentEl = document.querySelector('#opponent-modal-comment');
const staffBreakdownEl = document.querySelector('#staff-breakdown');
const staffNoteEl = document.querySelector('#staff-note');
const financesBudgetModalEl = document.querySelector('#finances-budget');
const financesWagesModalEl = document.querySelector('#finances-wages');
const financesOperatingModalEl = document.querySelector('#finances-operating');
const financesNoteEl = document.querySelector('#finances-note');
const decisionsListEl = document.querySelector('#decisions-list');
const stadiumCapacityEl = document.querySelector('#stadium-capacity');
const stadiumLevelEl = document.querySelector('#stadium-level');
const stadiumTrainingEl = document.querySelector('#stadium-training');
const stadiumMedicalEl = document.querySelector('#stadium-medical');
const stadiumAcademyEl = document.querySelector('#stadium-academy');
const stadiumNoteEl = document.querySelector('#stadium-note');

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

const decisions = listCanallaDecisions();
const decisionLabels = {
  sobornoArbitro: 'Soborno al árbitro',
  filtrarRumor: 'Filtrar rumor',
  fiestaIlegal: 'Fiesta ilegal',
  presionarFederacion: 'Presionar a la federación',
};

const instructionText = {
  pressing: {
    low: 'Presión baja',
    medium: 'Presión media',
    high: 'Presión alta',
  },
  tempo: {
    slow: 'Ritmo pausado',
    balanced: 'Ritmo equilibrado',
    fast: 'Ritmo alto',
  },
  width: {
    narrow: 'Juego cerrado',
    balanced: 'Anchura equilibrada',
    wide: 'Ataque por bandas',
  },
};

const booleanInstructionText = {
  counterAttack: { true: 'Buscar contragolpes', false: 'Sin contraataques' },
  playThroughMiddle: {
    true: 'Construir por dentro',
    false: 'Abrir el juego a las bandas',
  },
};

const numberFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const STARTERS_LIMIT = 11;
const SUBS_LIMIT = 5;
const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const SAVE_NOTICE_DURATION = 4000;

function isSelectable(player) {
  return isPlayerAvailable(player);
}

function describeAvailability(player) {
  const availability = player.availability ?? { injuryMatches: 0, suspensionMatches: 0 };
  if (availability.injuryMatches > 0) {
    return `Lesionado (${availability.injuryMatches} jornada${availability.injuryMatches > 1 ? 's' : ''})`;
  }
  if (availability.suspensionMatches > 0) {
    return `Sancionado (${availability.suspensionMatches} jornada${availability.suspensionMatches > 1 ? 's' : ''})`;
  }
  return '';
}

function buildInitialConfig(club) {
  const baseConfig = createDefaultMatchConfig();
  const instructions = { ...createDefaultInstructions(), ...(baseConfig.instructions ?? {}) };
  const defaultLineup = createDefaultLineup(club);
  return {
    ...baseConfig,
    startingLineup: defaultLineup.starters,
    substitutes: defaultLineup.substitutes,
    instructions,
    seed: typeof baseConfig.seed === 'string' ? baseConfig.seed : '',
  };
}

function computeOpponentRotation(league, clubName) {
  if (!league || !Array.isArray(league.table)) {
    return [];
  }
  return league.table.filter((entry) => entry.club !== clubName).map((entry) => entry.club);
}

let clubState = createExampleClub();
let leagueState = clubState.league;
let transferMarketState = createExampleTransferMarket(clubState);
let configState = buildInitialConfig(clubState);
let transferMessageTimeout;
let modalHandlersAttached = false;
let opponentRotation = computeOpponentRotation(leagueState, clubState.name);
let saveMessageTimeout;
let loadNoticeTimeout;
let hasLatestReport = false;

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

function getSelectLabel(selectElement, value) {
  if (!selectElement) {
    return value;
  }
  const option = selectElement.querySelector(`option[value="${value}"]`);
  return option?.textContent ?? value;
}

function describeInstructionEntry(key, value) {
  if (typeof value === 'boolean') {
    const map = booleanInstructionText[key];
    if (map) {
      return map[String(value)] ?? `${key}: ${value ? 'sí' : 'no'}`;
    }
    return `${key}: ${value ? 'sí' : 'no'}`;
  }
  if (typeof value === 'string') {
    const map = instructionText[key];
    if (map && map[value]) {
      return map[value];
    }
    return `${key}: ${value}`;
  }
  return `${key}: ${String(value)}`;
}

function updateResultsButtonState() {
  if (!resultsControlButton) {
    return;
  }
  resultsControlButton.disabled = !hasLatestReport;
  resultsControlButton.setAttribute('aria-disabled', hasLatestReport ? 'false' : 'true');
}

function renderCalendarModal() {
  if (!calendarList || !calendarNoteEl) {
    return;
  }

  calendarList.innerHTML = '';
  calendarNoteEl.textContent = '';

  if (!leagueState) {
    calendarNoteEl.textContent = 'Todavía no hay calendario porque la liga no está cargada.';
    return;
  }

  if (leagueState.matchDay >= TOTAL_MATCHDAYS) {
    calendarNoteEl.textContent = `Temporada completada tras ${TOTAL_MATCHDAYS} jornadas.`;
    return;
  }

  const rotation = computeOpponentRotation(leagueState, clubState.name);
  if (rotation.length === 0) {
    calendarNoteEl.textContent = 'Los rivales están por confirmar. Vuelve tras el sorteo.';
    return;
  }

  const remaining = TOTAL_MATCHDAYS - leagueState.matchDay;
  const itemsToShow = Math.min(6, remaining);

  for (let offset = 0; offset < itemsToShow; offset += 1) {
    const listItem = document.createElement('li');
    if (offset === 0) {
      listItem.classList.add('is-next');
    }
    const matchDayNumber = leagueState.matchDay + offset + 1;
    const rotationIndex = (leagueState.matchDay + offset) % rotation.length;
    const opponentName = rotation[rotationIndex];
    const isHome = offset === 0 ? homeCheckbox.checked : (leagueState.matchDay + offset) % 2 === 0;
    const opponentSpan = document.createElement('span');
    opponentSpan.className = 'control-calendar__opponent';
    opponentSpan.textContent = `${isHome ? 'vs' : '@'} ${opponentName}`;

    const meta = document.createElement('span');
    meta.className = 'control-calendar__meta';
    const position = leagueState.table.findIndex((entry) => entry.club === opponentName);
    const standing = position !== -1 ? leagueState.table[position] : undefined;
    const placeLabel = position !== -1 ? `${position + 1}º` : 'Sin ranking';
    const pointsLabel = standing ? `${standing.points} pts` : 'Puntos por estrenar';
    meta.textContent = `Jornada ${matchDayNumber} · ${placeLabel} · ${pointsLabel}`;

    listItem.append(opponentSpan, meta);
    calendarList.append(listItem);
  }

  if (remaining > 6) {
    calendarNoteEl.textContent = `Quedan ${remaining - 6} jornadas más tras las mostradas.`;
  } else {
    calendarNoteEl.textContent = `Restan ${remaining} jornadas para completar la temporada.`;
  }
}

function renderTacticsModal() {
  if (!tacticPlanEl || !tacticFormationEl || !tacticInstructionsList) {
    return;
  }
  const tacticLabel = getSelectLabel(tacticSelect, configState.tactic);
  tacticPlanEl.textContent = tacticLabel;

  const formationLabel = getSelectLabel(formationSelect, configState.formation ?? '4-4-2');
  tacticFormationEl.textContent = formationLabel;

  const instructions = configState.instructions ?? createDefaultInstructions();
  tacticInstructionsList.innerHTML = '';
  Object.entries(instructions).forEach(([key, value]) => {
    const item = document.createElement('li');
    item.textContent = describeInstructionEntry(key, value);
    tacticInstructionsList.append(item);
  });
}

function renderOpponentModal() {
  if (
    !opponentModalNameEl ||
    !opponentModalRecordEl ||
    !opponentModalStrengthEl ||
    !opponentModalLocationEl ||
    !opponentModalCommentEl
  ) {
    return;
  }

  const opponent = getUpcomingOpponent();
  const opponentName = opponent?.club ?? 'Rival misterioso';
  opponentModalNameEl.textContent = opponentName;
  opponentModalRecordEl.textContent = formatOpponentRecord(opponent);

  const strengthValue = Number.parseInt(opponentStrength.value, 10) || configState.opponentStrength;
  opponentModalStrengthEl.textContent = `${strengthValue} (${describeOpponentStrength(strengthValue)})`;

  opponentModalLocationEl.textContent = homeCheckbox.checked ? 'Tu estadio' : 'Fuera de casa';

  let comment = 'Aún no hay informes detallados del rival.';
  if (opponent && leagueState) {
    const position = leagueState.table.findIndex((entry) => entry.club === opponent.club);
    if (position !== -1) {
      const ordinal = position + 1;
      const streakDescriptor = opponent.points >= 9 ? 'enrachado' : opponent.points === 0 ? 'necesitado' : 'peleón';
      comment = `${opponent.club} marcha ${ordinal}º con ${opponent.points} puntos: equipo ${streakDescriptor}.`;
    } else {
      comment = `${opponent.club} todavía no ha debutado en la liga.`;
    }
  }
  opponentModalCommentEl.textContent = comment;
}

function getOperatingExpenses() {
  const expenses = clubState.operatingExpenses;
  if (!expenses) {
    return { maintenance: 0, staff: 0, academy: 0, medical: 0 };
  }
  return {
    maintenance: expenses.maintenance ?? 0,
    staff: expenses.staff ?? 0,
    academy: expenses.academy ?? 0,
    medical: expenses.medical ?? 0,
  };
}

function renderStaffModal() {
  if (!staffBreakdownEl || !staffNoteEl) {
    return;
  }
  staffBreakdownEl.innerHTML = '';

  const expenses = getOperatingExpenses();
  const entries = [
    { label: 'Cuerpo técnico', value: expenses.staff },
    { label: 'Cantera', value: expenses.academy },
    { label: 'Área médica', value: expenses.medical },
    { label: 'Mantenimiento', value: expenses.maintenance },
  ];

  entries.forEach((entry) => {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = entry.label;
    const dd = document.createElement('dd');
    dd.textContent = numberFormatter.format(entry.value);
    wrapper.append(dt, dd);
    staffBreakdownEl.append(wrapper);
  });

  const academyLevel = clubState.infrastructure?.academyLevel ?? 0;
  const medicalLevel = clubState.infrastructure?.medicalLevel ?? 0;
  staffNoteEl.textContent = `Cantera nivel ${academyLevel} · Área médica nivel ${medicalLevel}. Ajusta la inversión si necesitas potenciar jóvenes o recuperar lesionados.`;
}

function renderFinancesModal() {
  if (!financesBudgetModalEl || !financesWagesModalEl || !financesOperatingModalEl || !financesNoteEl) {
    return;
  }
  financesBudgetModalEl.textContent = numberFormatter.format(clubState.budget);
  financesWagesModalEl.textContent = numberFormatter.format(clubState.weeklyWageBill ?? 0);

  const expenses = getOperatingExpenses();
  const totalOperating = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  financesOperatingModalEl.textContent = numberFormatter.format(totalOperating);

  const projected = (clubState.weeklyWageBill ?? 0) + totalOperating;
  financesNoteEl.textContent = `Proyección semanal estimada: ${numberFormatter.format(projected)} entre salarios y operaciones.`;
}

function renderDecisionsModal() {
  if (!decisionsListEl) {
    return;
  }
  decisionsListEl.innerHTML = '';

  decisions.forEach((decision, index) => {
    const item = document.createElement('li');
    if (String(index) === decisionSelect.value) {
      item.classList.add('is-active');
    }
    const label = document.createElement('span');
    label.textContent = decisionLabels[decision.type] ?? decision.type;
    const intensity = document.createElement('span');
    intensity.textContent = `Intensidad ${decision.intensity}`;
    item.append(label, intensity);
    decisionsListEl.append(item);
  });

  if (decisions.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No hay travesuras disponibles por ahora.';
    decisionsListEl.append(empty);
  }
}

function describeInfrastructureLevel(level) {
  if (level >= 4) {
    return 'élite urbana';
  }
  if (level === 3) {
    return 'ambición continental';
  }
  if (level === 2) {
    return 'nivel profesional';
  }
  if (level === 1) {
    return 'espíritu de barrio';
  }
  return 'en obras';
}

function renderStadiumModal() {
  if (
    !stadiumCapacityEl ||
    !stadiumLevelEl ||
    !stadiumTrainingEl ||
    !stadiumMedicalEl ||
    !stadiumAcademyEl ||
    !stadiumNoteEl
  ) {
    return;
  }

  stadiumCapacityEl.textContent = `${clubState.stadiumCapacity.toLocaleString('es-ES')} espectadores`;
  const infrastructure = clubState.infrastructure ?? {};
  stadiumLevelEl.textContent = `Nivel ${infrastructure.stadiumLevel ?? 0} (${describeInfrastructureLevel(infrastructure.stadiumLevel ?? 0)})`;
  stadiumTrainingEl.textContent = `Nivel ${infrastructure.trainingLevel ?? 0}`;
  stadiumMedicalEl.textContent = `Nivel ${infrastructure.medicalLevel ?? 0}`;
  stadiumAcademyEl.textContent = `Nivel ${infrastructure.academyLevel ?? 0}`;

  stadiumNoteEl.textContent = 'Invierte en grada y servicios para atraer más taquilla y mantener feliz a la afición.';
}

function refreshControlPanel() {
  renderCalendarModal();
  renderTacticsModal();
  renderOpponentModal();
  renderStaffModal();
  renderFinancesModal();
  renderDecisionsModal();
  renderStadiumModal();
  updateResultsButtonState();
}

function updateFormDefaults() {
  tacticSelect.value = configState.tactic;
  if (formationSelect) {
    formationSelect.value = configState.formation ?? '4-4-2';
  }
  homeCheckbox.checked = configState.home;
  opponentStrength.value = String(configState.opponentStrength);
  if (seedInput) {
    seedInput.value = typeof configState.seed === 'string' ? configState.seed : '';
  }
  updateOpponentOutput();
  refreshControlPanel();
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
  if (lineupModal) {
    openModal(lineupModal);
  }
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
  if (matchLineupStatusEl) {
    const starters = configState.startingLineup.length;
    const substitutes = configState.substitutes.length;
    const startersOk = starters === STARTERS_LIMIT;
    const subsOk = substitutes <= SUBS_LIMIT;
    const summary = [`Titulares ${starters}/${STARTERS_LIMIT}`, `Suplentes ${substitutes}/${SUBS_LIMIT}`];
    matchLineupStatusEl.textContent = `Estado de la convocatoria: ${summary.join(' · ')}`;
    matchLineupStatusEl.classList.toggle('warning', !startersOk || !subsOk);
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
  const used = new Set([...configState.startingLineup, ...configState.substitutes]);
  const availablePlayers = clubState.squad.filter((player) => isSelectable(player));

  for (const player of availablePlayers) {
    if (configState.startingLineup.length >= STARTERS_LIMIT) {
      break;
    }
    if (!used.has(player.id)) {
      configState.startingLineup.push(player.id);
      used.add(player.id);
    }
  }

  if (configState.startingLineup.length < STARTERS_LIMIT) {
    for (const player of clubState.squad) {
      if (configState.startingLineup.length >= STARTERS_LIMIT) {
        break;
      }
      if (!used.has(player.id)) {
        configState.startingLineup.push(player.id);
        used.add(player.id);
      }
    }
  }

  for (const player of availablePlayers) {
    if (configState.substitutes.length >= SUBS_LIMIT) {
      break;
    }
    if (!used.has(player.id)) {
      configState.substitutes.push(player.id);
      used.add(player.id);
    }
  }

  if (configState.substitutes.length < SUBS_LIMIT) {
    for (const player of clubState.squad) {
      if (configState.substitutes.length >= SUBS_LIMIT) {
        break;
      }
      if (!used.has(player.id)) {
        configState.substitutes.push(player.id);
        used.add(player.id);
      }
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

  const player = findPlayerById(playerId);
  if (!player) {
    return;
  }

  if ((role === 'starter' || role === 'sub') && !isSelectable(player)) {
    showLineupError('Ese jugador no está disponible: lesión o sanción en curso.');
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

  const roleHeaders = {
    starter: 'Titulares',
    sub: 'Banquillo',
    none: 'Reservas',
  };
  const columnCount =
    lineupTableBody.closest('table')?.tHead?.rows?.[0]?.cells.length ?? 13;
  let currentRole = null;
  let playerIndex = 0;

  players.forEach((player) => {
    const row = document.createElement('tr');
    row.dataset.playerId = player.id;
    const playerRole = getPlayerRole(player.id);
    row.dataset.role = playerRole;

    if (playerRole !== currentRole) {
      currentRole = playerRole;
      const headerRow = document.createElement('tr');
      headerRow.className = 'lineup-group-header';
      headerRow.dataset.roleGroup = playerRole;
      const headerCell = document.createElement('th');
      headerCell.scope = 'rowgroup';
      headerCell.setAttribute('role', 'rowheader');
      headerCell.colSpan = columnCount;
      headerCell.textContent = roleHeaders[playerRole] ?? 'Plantilla';
      headerRow.append(headerCell);
      lineupTableBody.append(headerRow);
    }

    const indexCell = document.createElement('th');
    indexCell.scope = 'row';
    playerIndex += 1;
    indexCell.textContent = String(playerIndex);

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
    const availabilityLabel = describeAvailability(player);
    if (availabilityLabel) {
      const availabilityTag = document.createElement('span');
      availabilityTag.className = 'lineup-table__player-availability';
      availabilityTag.textContent = availabilityLabel;
      meta.append(availabilityTag);
      row.classList.add('is-unavailable');
      row.dataset.availability = availabilityLabel;
    } else {
      row.dataset.availability = 'available';
    }
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
  closeAllModals();
  renderLineupBoard();
  updateMatchSummary();
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
  refreshControlPanel();
}

function getUpcomingOpponent() {
  if (!leagueState || !Array.isArray(leagueState.table)) {
    return null;
  }
  if (opponentRotation.length === 0) {
    opponentRotation = computeOpponentRotation(leagueState, clubState.name);
  }
  if (opponentRotation.length === 0) {
    return null;
  }
  const index = leagueState.matchDay % opponentRotation.length;
  const opponentName = opponentRotation[index];
  const standing = leagueState.table.find((entry) => entry.club === opponentName);
  if (standing) {
    return standing;
  }
  return {
    club: opponentName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function formatOpponentRecord(standing) {
  if (!standing) {
    return 'Sin registros disponibles';
  }
  const { played, wins, draws, losses, goalsFor, goalsAgainst, points } = standing;
  return `PJ ${played} · G ${wins} · E ${draws} · P ${losses} · GF ${goalsFor} · GC ${goalsAgainst} · Pts ${points}`;
}

function updateMatchSummary() {
  if (matchdayBadgeEl) {
    if (leagueState && leagueState.matchDay >= TOTAL_MATCHDAYS) {
      matchdayBadgeEl.textContent = `Temporada ${clubState.season} completada`;
    } else {
      const nextMatchday = leagueState ? leagueState.matchDay + 1 : 1;
      matchdayBadgeEl.textContent = `Jornada ${nextMatchday} de ${TOTAL_MATCHDAYS}`;
    }
  }

  const opponent = getUpcomingOpponent();

  if (matchOpponentNameEl) {
    matchOpponentNameEl.textContent = opponent?.club ?? 'Rival misterioso';
  }
  if (matchOpponentRecordEl) {
    matchOpponentRecordEl.textContent = formatOpponentRecord(opponent);
  }
  if (matchOpponentStrengthEl) {
    const strengthValue = opponentStrength?.value ?? `${configState.opponentStrength}`;
    matchOpponentStrengthEl.textContent = `${strengthValue}/100`;
  }
  if (matchLocationEl) {
    matchLocationEl.textContent = homeCheckbox.checked ? 'Tu estadio' : 'Fuera de casa';
  }
  refreshControlPanel();
}

function describeOpponentStrength(value) {
  if (value < 55) {
    return 'Asequible';
  }
  if (value < 70) {
    return 'Competitivo';
  }
  if (value < 85) {
    return 'Exigente';
  }
  return 'Élite';
}

function updateOpponentOutput() {
  const numericValue = Number.parseInt(opponentStrength.value, 10);
  opponentOutput.value = String(numericValue);
  opponentOutput.textContent = `${numericValue} (${describeOpponentStrength(numericValue)})`;
  opponentStrength.title = `Fortaleza rival estimada: ${describeOpponentStrength(numericValue)}`;
  updateMatchSummary();
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
    if (leagueState.matchDay === 0) {
      leagueMatchdayEl.textContent = 'Pretemporada';
    } else if (leagueState.matchDay >= TOTAL_MATCHDAYS) {
      leagueMatchdayEl.textContent = `Jornada final (${TOTAL_MATCHDAYS})`;
    } else {
      leagueMatchdayEl.textContent = `Jornada ${leagueState.matchDay}`;
    }
  }
  refreshControlPanel();
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

function clearSaveMessage() {
  if (!saveFeedback) {
    return;
  }
  saveFeedback.hidden = true;
  saveFeedback.textContent = '';
  saveFeedback.classList.remove('error');
  if (saveMessageTimeout) {
    window.clearTimeout(saveMessageTimeout);
  }
}

function showSaveMessage(message, type = 'info') {
  if (!saveFeedback) {
    return;
  }
  saveFeedback.textContent = message;
  saveFeedback.hidden = false;
  saveFeedback.classList.toggle('error', type === 'error');
  if (saveMessageTimeout) {
    window.clearTimeout(saveMessageTimeout);
  }
  saveMessageTimeout = window.setTimeout(() => {
    clearSaveMessage();
  }, SAVE_NOTICE_DURATION);
}

function clearLoadNotice() {
  if (!loadNoticeEl) {
    return;
  }
  loadNoticeEl.hidden = true;
  loadNoticeEl.textContent = '';
  if (loadNoticeTimeout) {
    window.clearTimeout(loadNoticeTimeout);
  }
}

function showLoadNotice(message) {
  if (!loadNoticeEl) {
    return;
  }
  loadNoticeEl.textContent = message;
  loadNoticeEl.hidden = false;
  if (loadNoticeTimeout) {
    window.clearTimeout(loadNoticeTimeout);
  }
  loadNoticeTimeout = window.setTimeout(() => {
    clearLoadNotice();
  }, SAVE_NOTICE_DURATION);
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
  if (financesAttendanceEl) {
    financesAttendanceEl.textContent = '';
  }
  if (financesIncomeList) {
    financesIncomeList.innerHTML = '';
  }
  if (financesExpenseList) {
    financesExpenseList.innerHTML = '';
  }
  if (matchSeedEl) {
    matchSeedEl.textContent = '';
    matchSeedEl.hidden = true;
  }
  narrativeList.innerHTML = '';
  eventsList.innerHTML = '';
  decisionReport.hidden = true;
  decisionNarrative.textContent = '';
  decisionStats.innerHTML = '';
  postBudgetEl.textContent = '';
  postReputationEl.textContent = '';
  postMoraleEl.textContent = '';
  if (mvpBadge) {
    mvpBadge.textContent = '';
    mvpBadge.hidden = true;
  }
  if (seasonSummarySection) {
    seasonSummarySection.hidden = true;
  }
  hideLineupError();
  hasLatestReport = false;
  refreshControlPanel();
}

if (lineupAutosortButton) {
  lineupAutosortButton.addEventListener('click', autoSortLineup);
}

if (saveButton) {
  saveButton.addEventListener('click', () => {
    persistState('manual');
  });
}

if (newSeasonButton) {
  newSeasonButton.addEventListener('click', () => {
    startNewSeason();
  });
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

function renderFinancialBreakdown(finances) {
  if (!finances) {
    return;
  }
  if (financesAttendanceEl) {
    financesAttendanceEl.textContent = finances.attendance
      ? `${finances.attendance.toLocaleString('es-ES')} espectadores`
      : 'Asistencia no disponible';
  }
  if (financesIncomeList) {
    financesIncomeList.innerHTML = '';
    Object.entries(finances.incomeBreakdown ?? {}).forEach(([key, value]) => {
      const item = document.createElement('li');
      item.textContent = `${key}: ${numberFormatter.format(value)}`;
      financesIncomeList.append(item);
    });
  }
  if (financesExpenseList) {
    financesExpenseList.innerHTML = '';
    Object.entries(finances.expenseBreakdown ?? {}).forEach(([key, value]) => {
      const item = document.createElement('li');
      item.textContent = `${key}: ${numberFormatter.format(value)}`;
      financesExpenseList.append(item);
    });
  }
}

function renderMatchReport(report, decisionOutcome, opponentName = 'Rival misterioso', metadata = {}) {
  const clubName = clubState.name;
  const scoreline = `${clubName} ${report.match.goalsFor} - ${report.match.goalsAgainst} ${opponentName}`;
  scorelineEl.textContent = scoreline;

  const financesPrefix = report.financesDelta >= 0 ? '+' : '−';
  const absFinances = Math.abs(report.financesDelta);
  financesDeltaEl.textContent = `Balance de la jornada: ${financesPrefix}${numberFormatter.format(absFinances)}`;
  renderFinancialBreakdown(report.finances);

  if (matchSeedEl) {
    const rawSeed = typeof metadata.seedInputValue === 'string' ? metadata.seedInputValue.trim() : '';
    const usedSeed = report.match.seed;
    if (usedSeed !== undefined && Number.isFinite(usedSeed)) {
      const displayValue = rawSeed && rawSeed !== String(usedSeed) ? `${rawSeed} (hash ${usedSeed})` : rawSeed || `${usedSeed}`;
      matchSeedEl.textContent = `Semilla reproducible: ${displayValue}`;
      matchSeedEl.hidden = false;
    } else if (rawSeed) {
      matchSeedEl.textContent = `Semilla reproducible: ${rawSeed}`;
      matchSeedEl.hidden = false;
    } else {
      matchSeedEl.textContent = '';
      matchSeedEl.hidden = true;
    }
  }

  narrativeList.innerHTML = '';
  report.match.narrative.forEach((line) => {
    const item = document.createElement('li');
    item.textContent = line;
    narrativeList.append(item);
  });

  eventsList.innerHTML = '';
  report.match.events.forEach((event) => {
    const item = document.createElement('li');
    item.className = 'event-item';
    if (['gol', 'penalti'].includes(event.type)) {
      item.classList.add('event-item--goal');
    } else if (['doble_amarilla', 'expulsion', 'tarjeta'].includes(event.type)) {
      item.classList.add('event-item--card');
    } else if (event.type.includes('lesion')) {
      item.classList.add('event-item--injury');
    }
    item.textContent = `[${event.minute}'] ${event.description}`;
    eventsList.append(item);
  });

  renderDecisionOutcome(decisionOutcome);

  postBudgetEl.textContent = numberFormatter.format(report.updatedClub.budget);
  postReputationEl.textContent = `${report.updatedClub.reputation}`;
  postMoraleEl.textContent = formatMorale(averageMorale(report.updatedClub));

  if (mvpBadge) {
    if (report.match.manOfTheMatch) {
      const hero = clubState.squad.find((player) => player.id === report.match.manOfTheMatch);
      mvpBadge.textContent = hero ? `MVP: ${hero.name}` : 'MVP destacado';
      mvpBadge.hidden = false;
    } else {
      mvpBadge.hidden = true;
    }
  }

  renderSeasonSummary();
  hasLatestReport = true;
  refreshControlPanel();
}

function renderSeasonList(listElement, entries, formatter) {
  if (!listElement) {
    return;
  }
  listElement.innerHTML = '';
  entries.forEach((entry, index) => {
    const item = document.createElement('li');
    item.textContent = formatter(entry, index);
    listElement.append(item);
  });
}

function renderSeasonSummary() {
  if (!seasonSummarySection) {
    return;
  }
  if (!leagueState || leagueState.matchDay < TOTAL_MATCHDAYS) {
    seasonSummarySection.hidden = true;
    if (newSeasonButton) {
      newSeasonButton.hidden = true;
    }
    return;
  }

  seasonSummarySection.hidden = false;
  if (newSeasonButton) {
    newSeasonButton.hidden = false;
  }

  const champion = leagueState.table[0]?.club ?? 'Sin datos';
  if (seasonChampionEl) {
    seasonChampionEl.textContent =
      champion === clubState.name ? `${champion} (¡campeón!)` : champion;
  }

  const stats = clubState.seasonStats ?? createSeasonStats();
  if (seasonAveragePossessionEl) {
    const possessionAvg = stats.matches > 0 ? stats.possessionFor / stats.matches : 0;
    seasonAveragePossessionEl.textContent = `${possessionAvg.toFixed(1)} %`;
  }
  if (seasonStreakEl) {
    seasonStreakEl.textContent = `Mejor racha sin perder: ${stats.bestUnbeatenRun} partidos`;
  }

  const scorers = [...clubState.squad]
    .map((player) => ({
      name: player.name,
      goals: player.seasonLog?.goals ?? 0,
    }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3);

  const assisters = [...clubState.squad]
    .map((player) => ({
      name: player.name,
      assists: player.seasonLog?.assists ?? 0,
    }))
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 3);

  renderSeasonList(seasonTopScorersList, scorers, (entry) => `${entry.name} · ${entry.goals} goles`);
  renderSeasonList(seasonTopAssistsList, assisters, (entry) => `${entry.name} · ${entry.assists} asistencias`);
}

function persistState(reason = 'auto') {
  const payload = saveGame(
    {
      club: clubState,
      league: leagueState,
      config: configState,
      transferMarket: transferMarketState,
    },
    undefined
  );
  if (!payload) {
    return;
  }
  if (reason === 'auto') {
    showSaveMessage('Guardado automático tras la jornada.');
  } else if (reason === 'manual') {
    showSaveMessage('Partida guardada.');
  }
}

function startNewSeason() {
  const nextSeason = clubState.season + 1;
  const refreshedSquad = clubState.squad.map((player) => resetPlayerForNewSeason(player));
  const newLeague = createExampleLeague(clubState.name);
  opponentRotation = computeOpponentRotation(newLeague, clubState.name);

  clubState = {
    ...clubState,
    season: nextSeason,
    league: newLeague,
    squad: refreshedSquad,
    seasonStats: createSeasonStats(),
    weeklyWageBill: calculateWeeklyWageBill(refreshedSquad),
  };
  leagueState = newLeague;
  transferMarketState = createExampleTransferMarket(clubState);
  configState = buildInitialConfig(clubState);

  renderLeagueTable();
  renderTransferMarket();
  renderLineupBoard();
  updateMatchSummary();
  updateClubSummary();
  clearReport();
  showSaveMessage('Nueva temporada lista: plantilla puesta a tono.');
  persistState('silent');
}

function applyLoadedState(saved) {
  clubState = {
    ...saved.club,
    weeklyWageBill: calculateWeeklyWageBill(saved.club.squad),
  };
  leagueState = saved.league;
  transferMarketState = saved.transferMarket.length
    ? saved.transferMarket
    : createExampleTransferMarket(clubState);
  const baseConfig = buildInitialConfig(clubState);
  const loadedSeed = saved.config?.seed;
  const seedValue =
    typeof loadedSeed === 'string'
      ? loadedSeed
      : typeof loadedSeed === 'number'
        ? String(loadedSeed)
        : baseConfig.seed ?? '';
  configState = {
    ...baseConfig,
    ...saved.config,
    instructions: { ...createDefaultInstructions(), ...(saved.config.instructions ?? {}) },
    seed: seedValue,
  };
  opponentRotation = computeOpponentRotation(leagueState, clubState.name);
  ensureLineupCompleteness();
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

  const opponentStanding = getUpcomingOpponent();
  const opponentName = opponentStanding?.club ?? 'Rival misterioso';

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

  const seedValue = seedInput ? seedInput.value.trim() : '';
  configState = {
    ...configState,
    home: homeCheckbox.checked,
    opponentStrength: Number.parseInt(opponentStrength.value, 10),
    tactic: tacticSelect.value,
    formation: formationSelect.value,
    seed: seedValue,
  };

  const simulationOptions = { decision, decisionOutcome };
  if (seedValue) {
    simulationOptions.seed = seedValue;
  }

  const report = playMatchDay(workingClub, configState, simulationOptions);
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
  updateMatchSummary();
  renderMatchReport(report, decisionOutcome, opponentName, { seedInputValue: seedValue });
  updateClubSummary();
  persistState('auto');
  switchToReportView();
});

resetButton.addEventListener('click', () => {
  clearSavedGame();
  clearSaveMessage();
  clearLoadNotice();
  clubState = createExampleClub();
  leagueState = clubState.league;
  opponentRotation = computeOpponentRotation(leagueState, clubState.name);
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
  showLoadNotice('Club reiniciado. Guardado anterior eliminado.');
});

opponentStrength.addEventListener('input', updateOpponentOutput);
homeCheckbox.addEventListener('change', updateMatchSummary);
if (seedInput) {
  seedInput.addEventListener('input', () => {
    const value = seedInput.value.trim();
    configState = { ...configState, seed: value };
  });
}

if (decisionSelect) {
  decisionSelect.addEventListener('change', renderDecisionsModal);
}

if (planNextButton) {
  planNextButton.addEventListener('click', () => {
    closeModal(reportModal);
    switchToPlanningView();
  });
}

function init() {
  attachModalHandlers();
  populateDecisions();
  if (saveVersionEl) {
    saveVersionEl.textContent = `Versión guardado v${SAVE_VERSION}`;
  }
  const saved = loadSavedGame();
  if (saved) {
    applyLoadedState(saved);
    showLoadNotice('Partida recuperada del guardado local.');
  }
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
