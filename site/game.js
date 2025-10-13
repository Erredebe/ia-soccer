import { playMatchDay } from '../src/core/engine.js';
import {
  createDefaultMatchConfig,
  createDefaultLineup,
  createExampleClub,
  createExampleCup,
  createExampleTransferMarket,
  createExampleLeague,
  createSeasonStats,
  createDefaultInstructions,
  calculateStaffWeeklyCost,
  LEAGUE_RIVAL_CATALOG,
  normaliseLeagueRivals,
  estimatePlayerValue,
  listCanallaDecisions,
  selectRandomLeagueRivals,
  updateLeagueTableAfterMatch,
  DEFAULT_LEAGUE_SIZE,
  DEFAULT_LEAGUE_DIFFICULTY,
  MIN_LEAGUE_SIZE,
  MAX_LEAGUE_SIZE,
  calculateTotalMatchdays,
  resolveLeagueDifficulty,
  DEFAULT_CLUB_NAME,
  DEFAULT_STADIUM_NAME,
  DEFAULT_CLUB_CITY,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_CLUB_LOGO,
  isPlayerAvailable,
  resetPlayerForNewSeason,
  generateRandomPlayerIdentity,
  drawCupRound,
  getCupFixture,
  applyCupMatchResult,
  INFRASTRUCTURE_BLUEPRINT,
  calculateInfrastructureUpgradeCost,
  calculateOperatingExpensesForInfrastructure,
  calculateStadiumCapacity,
  createAcademyProspects,
  normaliseStaffState,
  getStaffDefinition,
  STAFF_ROLE_INFO,
  listStaffMembers,
} from '../src/core/data.js';
import { resolveCanallaDecision, resolveCupReputation, tickCanallaState } from '../src/core/reputation.js';
import { clearSavedGame, loadSavedGame, saveGame, SAVE_VERSION } from '../src/core/persistence.js';
import { resolveCupPrize } from '../src/core/economy.js';
import { CUP_ROUND_DEFINITIONS } from '../src/core/types.js';

const decisionSelect = document.querySelector('#decision-select');
const tacticSelect = document.querySelector('#tactic-select');
const formationSelect = document.querySelector('#formation-select');
const homeCheckbox = document.querySelector('#home-checkbox');
const opponentStrength = document.querySelector('#opponent-strength');
const opponentOutput = document.querySelector('#opponent-output');
const seedInput = document.querySelector('#seed-input');
const viewModeToggle = document.querySelector('#view-mode-toggle');
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
const playerEditModal = document.querySelector('#modal-player-edit');
const playerEditForm = document.querySelector('#player-edit-form');
const playerEditNameInput = document.querySelector('#player-edit-name');
const playerEditNicknameInput = document.querySelector('#player-edit-nickname');
const playerEditErrorEl = document.querySelector('#player-edit-error');
const playerEditRandomButton = document.querySelector('#player-edit-random');
const planNextButton = document.querySelector('#plan-next');
const saveButton = document.querySelector('#save-game');
const saveFeedback = document.querySelector('#save-feedback');
const saveVersionEl = document.querySelector('#save-version');
const loadNoticeEl = document.querySelector('#load-notice');
const sidebarToggleButton = document.querySelector('#sidebar-toggle');
const sidebarPanel = document.querySelector('#sidebar-panel');
const sidebarCollapseQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 960px)')
    : null;

const matchdayBadgeEl = document.querySelector('#matchday-badge');
const matchOpponentNameEl = document.querySelector('#match-opponent-name');
const matchOpponentStrengthEl = document.querySelector('#match-opponent-strength');
const matchOpponentRecordEl = document.querySelector('#match-opponent-record');
const matchLocationEl = document.querySelector('#match-location');
const matchLineupStatusEl = document.querySelector('#match-lineup-status');
const matchSeedEl = document.querySelector('#match-seed');

const clubNameEl = document.querySelector('#club-name');
const clubCityEl = document.querySelector('#club-city');
const clubStadiumEl = document.querySelector('#club-stadium');
const clubBudgetEl = document.querySelector('#club-budget');
const clubReputationEl = document.querySelector('#club-reputation');
const clubMoraleEl = document.querySelector('#club-morale');
const clubCupStatusEl = document.querySelector('#club-cup-status');
const clubLogoEl = document.querySelector('#club-logo');
const clubCardEl = document.querySelector('.club-card');

const leagueMatchdayEl = document.querySelector('#league-matchday');
const leagueTableBody = document.querySelector('#league-table-body');
const leagueTopScorersBody = document.querySelector('#league-top-scorers-body');
const leagueTopAssistsBody = document.querySelector('#league-top-assists-body');
const leagueTopCleanSheetsBody = document.querySelector('#league-top-clean-sheets-body');
const transferListEl = document.querySelector('#transfer-list');
const transferMessageEl = document.querySelector('#transfer-message');

const scorelineEl = document.querySelector('#scoreline');
const financesDeltaEl = document.querySelector('#finances-delta');
const financesAttendanceEl = document.querySelector('#finances-attendance');
const financesIncomeList = document.querySelector('#finances-income');
const financesExpenseList = document.querySelector('#finances-expenses');
const staffBreakdownEl = document.querySelector('#staff-breakdown');
const staffNoteEl = document.querySelector('#staff-note');
const staffRosterList = document.querySelector('#staff-roster');
const staffMarketList = document.querySelector('#staff-market');
const narrativeList = document.querySelector('#narrative-list');
const matchTimeline = document.querySelector('#match-timeline');
const decisionReport = document.querySelector('#decision-report');
const decisionNarrative = document.querySelector('#decision-narrative');
const decisionStats = document.querySelector('#decision-stats');
const postBudgetEl = document.querySelector('#post-budget');
const postReputationEl = document.querySelector('#post-reputation');
const postMoraleEl = document.querySelector('#post-morale');
const mvpBadge = document.querySelector('#mvp-badge');
const matchVisualizationSection = document.querySelector('#match-visualization');
const matchVisualizationScreen = document.querySelector('#match-visualization-screen');
const matchVisualizationPrevButton = document.querySelector('#match-visualization-prev');
const matchVisualizationNextButton = document.querySelector('#match-visualization-next');
const matchVisualizationSlider = document.querySelector('#match-visualization-slider');
const matchVisualizationLegendList = document.querySelector('#match-visualization-legend');
const matchVisualizationMinuteEl = document.querySelector('#match-visualization-minute');
const matchVisualizationLabelEl = document.querySelector('#match-visualization-label');
const matchVisualizationStatusEl = document.querySelector('#match-visualization-status');
const matchVisualizationFrameEl = document.querySelector('#match-visualization-frame');
const reportTabButtons = document.querySelectorAll('[data-report-tab]');
const reportPanels = document.querySelectorAll('[data-report-panel]');
const reportHistoryList = document.querySelector('#report-history-list');
const reportHistorySeasonSelect = document.querySelector('#report-history-season');
const reportHistoryEmptyEl = document.querySelector('#report-history-empty');

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const GOAL_EVENT_TYPES = new Set(['gol', 'penalti', 'gol_en_contra', 'penalti_en_contra']);
const TIMELINE_EVENT_META = {
  gol: {
    iconId: 'icon-goal',
    label: 'Gol a favor',
    className: 'timeline-event--goal',
    highlight: true,
  },
  penalti: {
    iconId: 'icon-penalty',
    label: 'Penalti convertido',
    className: 'timeline-event--penalty',
    highlight: true,
  },
  gol_en_contra: {
    iconId: 'icon-goal',
    label: 'Gol encajado',
    className: 'timeline-event--goal-against',
    highlight: true,
  },
  penalti_en_contra: {
    iconId: 'icon-penalty',
    label: 'Penalti encajado',
    className: 'timeline-event--penalty-against',
    highlight: true,
  },
  penalti_fallado: {
    iconId: 'icon-penalty',
    label: 'Penalti fallado',
    className: 'timeline-event--penalty-missed',
  },
  penalti_atrapado: {
    iconId: 'icon-penalty',
    label: 'Penalti detenido',
    className: 'timeline-event--penalty-save',
  },
  tarjeta: {
    iconId: 'icon-yellow-card',
    label: 'Tarjeta amarilla',
    className: 'timeline-event--yellow-card',
    highlight: true,
  },
  tarjeta_rival: {
    iconId: 'icon-yellow-card',
    label: 'Tarjeta amarilla rival',
    className: 'timeline-event--yellow-card-opponent',
    highlight: true,
  },
  doble_amarilla: {
    iconId: 'icon-red-card',
    label: 'Doble amarilla',
    className: 'timeline-event--red-card',
    highlight: true,
  },
  expulsion: {
    iconId: 'icon-red-card',
    label: 'Expulsión',
    className: 'timeline-event--red-card',
    highlight: true,
  },
  expulsion_rival: {
    iconId: 'icon-red-card',
    label: 'Expulsión rival',
    className: 'timeline-event--red-card-opponent',
    highlight: true,
  },
  lesion: {
    iconId: 'icon-injury',
    label: 'Lesión',
    className: 'timeline-event--injury',
    highlight: true,
  },
  cambio: {
    iconId: 'icon-substitution',
    label: 'Sustitución',
    className: 'timeline-event--substitution',
  },
  atajada: {
    iconId: 'icon-goal',
    label: 'Paradón rival',
    className: 'timeline-event--defensive',
  },
  atajada_portero: {
    iconId: 'icon-goal',
    label: 'Paradón propio',
    className: 'timeline-event--defensive',
  },
  ocasión: {
    iconId: 'icon-goal',
    label: 'Ocasión creada',
    className: 'timeline-event--chance',
  },
  ocasión_rival: {
    iconId: 'icon-goal',
    label: 'Ocasión rival',
    className: 'timeline-event--chance-opponent',
  },
  default: {
    iconId: 'icon-club-shield',
    label: 'Momento destacado',
    className: 'timeline-event--generic',
  },
};

const MATCH_VISUALIZATION_TRANSITION_CLASS = 'match-visualization__screen--transition';
const MATCH_VISUALIZATION_MINUTE_CLASS = 'match-visualization__minute--pulse';
const MATCH_VISUALIZATION_AUTOPLAY_INTERVAL = 3400;
const matchVisualizationState = {
  frames: [],
  index: 0,
  dimensions: { width: 21, height: 11 },
  autoplayId: null,
  autoplayActive: false,
};

function clearMatchVisualizationAutoplay() {
  if (matchVisualizationState.autoplayId !== null) {
    window.clearTimeout(matchVisualizationState.autoplayId);
    matchVisualizationState.autoplayId = null;
  }
}

function scheduleMatchVisualizationAutoplay() {
  clearMatchVisualizationAutoplay();
  if (!matchVisualizationState.autoplayActive || matchVisualizationState.frames.length <= 1) {
    return;
  }
  matchVisualizationState.autoplayId = window.setTimeout(() => {
    advanceMatchVisualizationAutoplay();
  }, MATCH_VISUALIZATION_AUTOPLAY_INTERVAL);
}

function startMatchVisualizationAutoplay() {
  matchVisualizationState.autoplayActive = matchVisualizationState.frames.length > 1;
  scheduleMatchVisualizationAutoplay();
}

function stopMatchVisualizationAutoplay() {
  matchVisualizationState.autoplayActive = false;
  clearMatchVisualizationAutoplay();
}

function resetMatchVisualizationAutoplay() {
  if (!matchVisualizationState.autoplayActive) {
    return;
  }
  scheduleMatchVisualizationAutoplay();
}

function advanceMatchVisualizationAutoplay() {
  if (matchVisualizationState.frames.length === 0) {
    return;
  }
  const total = matchVisualizationState.frames.length;
  const nextIndex = (matchVisualizationState.index + 1) % total;
  updateMatchVisualizationFrame(nextIndex);
  scheduleMatchVisualizationAutoplay();
}

function getPlayerInitials(name, role) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return role === 'GK' ? 'GK' : 'J';
  }
  const parts = name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);
  if (parts.length === 0) {
    return role === 'GK' ? 'GK' : 'J';
  }
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  if (initials.length === 1 && role === 'GK') {
    return `${initials}K`;
  }
  return initials;
}

function getPlayerBadgeLabel(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'Jugador';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 2) {
    return parts[1];
  }
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0]?.toUpperCase() ?? ''}.`;
}

function renderMatchVisualizationPitch(frame) {
  const pitch = document.createElement('div');
  pitch.className = 'match-visualization__pitch';
  pitch.setAttribute('role', 'presentation');

  frame.players.forEach((player) => {
    const token = document.createElement('div');
    token.className = `match-visualization__player match-visualization__player--${player.team}`;
    if (player.role === 'GK') {
      token.classList.add('match-visualization__player--goalkeeper');
    }
    token.style.left = `${player.xPercent}%`;
    token.style.top = `${player.yPercent}%`;
    token.dataset.name = getPlayerBadgeLabel(player.name);
    token.setAttribute('role', 'img');
    token.setAttribute(
      'aria-label',
      `${player.name} · ${player.team === 'us' ? 'nuestro equipo' : 'rival'}${
        player.role === 'GK' ? ' · portero' : ''
      }`
    );
    token.title = player.name;
    const initials = document.createElement('span');
    initials.className = 'match-visualization__player-initials';
    initials.textContent = getPlayerInitials(player.name, player.role);
    token.append(initials);
    pitch.append(token);
  });

  const ball = document.createElement('div');
  ball.className = `match-visualization__ball match-visualization__ball--${frame.ball.possession}`;
  ball.style.left = `${frame.ball.xPercent}%`;
  ball.style.top = `${frame.ball.yPercent}%`;
  ball.setAttribute('aria-hidden', 'true');
  pitch.append(ball);

  return pitch;
}

if (financesDeltaEl) {
  financesDeltaEl.setAttribute('aria-live', 'polite');
  financesDeltaEl.setAttribute('role', 'status');
}

if (financesIncomeList) {
  financesIncomeList.setAttribute('aria-live', 'polite');
  financesIncomeList.setAttribute('aria-label', 'Detalle de ingresos de la jornada');
}

if (financesExpenseList) {
  financesExpenseList.setAttribute('aria-live', 'polite');
  financesExpenseList.setAttribute('aria-label', 'Detalle de gastos de la jornada');
}

if (staffNoteEl) {
  staffNoteEl.setAttribute('aria-live', 'polite');
}

const seasonSummarySection = document.querySelector('#season-summary');
const seasonChampionEl = document.querySelector('#season-champion');
const seasonTopScorersList = document.querySelector('#season-top-scorers');
const seasonTopAssistsList = document.querySelector('#season-top-assists');
const seasonAveragePossessionEl = document.querySelector('#season-average-possession');
const seasonStreakEl = document.querySelector('#season-streak');
const seasonTitlesEl = document.querySelector('#season-titles');
const seasonRecordsList = document.querySelector('#season-records');
const newSeasonButton = document.querySelector('#new-season');
const configureClubButton = document.querySelector('#configure-club');
const configureLeagueButton = document.querySelector('#configure-league');
const clubIdentityModal = document.querySelector('#modal-club-identity');
const clubIdentityForm = document.querySelector('#club-identity-form');
const clubNameInput = document.querySelector('#club-name-input');
const clubCityInput = document.querySelector('#club-city-input');
const clubStadiumInput = document.querySelector('#club-stadium-input');
const clubPrimaryColorInput = document.querySelector('#club-primary-color');
const clubSecondaryColorInput = document.querySelector('#club-secondary-color');
const clubLogoInput = document.querySelector('#club-logo-input');

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
const financesBudgetModalEl = document.querySelector('#finances-budget');
const financesWagesModalEl = document.querySelector('#finances-wages');
const financesOperatingModalEl = document.querySelector('#finances-operating');
const financesNoteEl = document.querySelector('#finances-note');
const financesIncomeTotalEl = document.querySelector('#finances-income-total');
const financesExpenseTotalEl = document.querySelector('#finances-expense-total');
const financesIncomeDonutEl = document.querySelector('#finances-income-donut');
const financesExpenseBarEl = document.querySelector('#finances-expense-bar');
const financesExpenseBarFillEl = document.querySelector('#finances-expense-bar-fill');
const decisionsListEl = document.querySelector('#decisions-list');
const decisionsHeatEl = document.querySelector('#decisions-heat');
const stadiumCapacityEl = document.querySelector('#stadium-capacity');
const stadiumLevelEl = document.querySelector('#stadium-level');
const stadiumTrainingEl = document.querySelector('#stadium-training');
const stadiumMedicalEl = document.querySelector('#stadium-medical');
const stadiumAcademyEl = document.querySelector('#stadium-academy');
const stadiumNoteEl = document.querySelector('#stadium-note');
const stadiumUpgradeFeedbackEl = document.querySelector('#stadium-upgrade-feedback');
const infrastructureUpgradeButtons = document.querySelectorAll('[data-infrastructure-upgrade]');
const infrastructureCostEls = document.querySelectorAll('[data-infrastructure-cost]');
const infrastructureDescriptionEls = document.querySelectorAll('[data-infrastructure-description]');

const cupModalEl = document.querySelector('#modal-cup');
const cupModalStatusEl = document.querySelector('#cup-modal-status');
const cupDrawButton = document.querySelector('#cup-draw-button');
const cupPlanButton = document.querySelector('#cup-plan-button');
const cupNextFixtureEl = document.querySelector('#cup-next-fixture');
const cupBracketList = document.querySelector('#cup-bracket');
const cupHistoryList = document.querySelector('#cup-history');
const cupDrawNarrativeList = document.querySelector('#cup-draw-narrative');

const leagueConfigModal = document.querySelector('#modal-league-config');
const leagueConfigForm = document.querySelector('#league-config-form');
const leagueSizeSelect = document.querySelector('#league-size-select');
const leagueDifficultySelect = document.querySelector('#league-difficulty-select');
const leagueCatalogEl = document.querySelector('#league-catalog');
const leagueSelectionCountEl = document.querySelector('#league-selection-count');
const leagueRandomButton = document.querySelector('#league-randomize');
const leagueConfigErrorEl = document.querySelector('#league-config-error');

const playMatchButton = document.querySelector('#play-match');

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

const decisions = listCanallaDecisions();
const decisionLabels = {
  sobornoArbitro: 'Soborno al árbitro',
  filtrarRumor: 'Filtrar rumor',
  fiestaIlegal: 'Fiesta ilegal',
  presionarFederacion: 'Presionar a la federación',
  sobornoJugador: 'Soborno a jugador rival',
  manipularCesped: 'Manipular césped',
  espionajeAnalitico: 'Espionaje analítico',
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

const defaultDifficultyInfo = resolveLeagueDifficulty(DEFAULT_LEAGUE_DIFFICULTY);

let leagueSettings = {
  leagueSize: DEFAULT_LEAGUE_SIZE,
  difficulty: defaultDifficultyInfo.id,
  difficultyMultiplier: defaultDifficultyInfo.multiplier,
  totalMatchdays: calculateTotalMatchdays(DEFAULT_LEAGUE_SIZE - 1),
};

function clampLeagueSize(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_LEAGUE_SIZE;
  }
  const truncated = Math.trunc(value);
  return Math.max(MIN_LEAGUE_SIZE, Math.min(MAX_LEAGUE_SIZE, truncated));
}

function parseLeagueSizeValue(raw) {
  const base = leagueSettings?.leagueSize ?? DEFAULT_LEAGUE_SIZE;
  if (raw === undefined || raw === null) {
    return base;
  }
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed)) {
    return base;
  }
  return clampLeagueSize(parsed);
}

function getActiveLeagueSize() {
  return leagueSettings?.leagueSize ?? DEFAULT_LEAGUE_SIZE;
}

function getSelectedLeagueSize() {
  if (leagueSizeSelect instanceof HTMLSelectElement) {
    return parseLeagueSizeValue(leagueSizeSelect.value);
  }
  return getActiveLeagueSize();
}

function getTargetRivalCount() {
  return Math.max(1, getSelectedLeagueSize() - 1);
}

function deriveLeagueSettings(league) {
  if (!league) {
    return { ...leagueSettings };
  }
  const difficultyInfo = resolveLeagueDifficulty(
    typeof league.difficulty === 'string' && league.difficulty.length > 0
      ? league.difficulty
      : leagueSettings.difficulty ?? DEFAULT_LEAGUE_DIFFICULTY
  );
  const sizeSource = Number.isFinite(league.size) && league.size
    ? league.size
    : Array.isArray(league.rivals) && league.rivals.length > 0
      ? league.rivals.length + 1
      : Array.isArray(league.table) && league.table.length > 0
        ? league.table.length
        : leagueSettings.leagueSize ?? DEFAULT_LEAGUE_SIZE;
  const leagueSize = clampLeagueSize(sizeSource);
  const rivalCount = Array.isArray(league.rivals) && league.rivals.length > 0
    ? league.rivals.length
    : Math.max(1, leagueSize - 1);
  const totalMatchdays =
    typeof league.totalMatchdays === 'number' && Number.isFinite(league.totalMatchdays)
      ? Math.max(1, Math.trunc(league.totalMatchdays))
      : calculateTotalMatchdays(rivalCount);
  const difficultyMultiplier =
    typeof league.difficultyMultiplier === 'number' && Number.isFinite(league.difficultyMultiplier)
      ? league.difficultyMultiplier
      : difficultyInfo.multiplier;
  return {
    leagueSize,
    difficulty: difficultyInfo.id,
    difficultyMultiplier,
    totalMatchdays,
  };
}

function getTotalMatchdays() {
  if (typeof leagueSettings?.totalMatchdays === 'number' && Number.isFinite(leagueSettings.totalMatchdays)) {
    return Math.max(1, Math.trunc(leagueSettings.totalMatchdays));
  }
  if (leagueState) {
    const derived = deriveLeagueSettings(leagueState);
    leagueSettings = { ...leagueSettings, ...derived };
    return derived.totalMatchdays;
  }
  return calculateTotalMatchdays(DEFAULT_LEAGUE_SIZE - 1);
}

function getDifficultyInfo() {
  return resolveLeagueDifficulty(leagueSettings?.difficulty ?? DEFAULT_LEAGUE_DIFFICULTY);
}

function getDifficultyMultiplier() {
  if (typeof leagueSettings?.difficultyMultiplier === 'number' && Number.isFinite(leagueSettings.difficultyMultiplier)) {
    return leagueSettings.difficultyMultiplier;
  }
  const info = getDifficultyInfo();
  leagueSettings = { ...leagueSettings, difficultyMultiplier: info.multiplier };
  return info.multiplier;
}

function getDifficultyLabel() {
  return getDifficultyInfo().label;
}

function syncLeagueSelectorsFromSettings() {
  if (leagueSizeSelect instanceof HTMLSelectElement) {
    leagueSizeSelect.value = String(leagueSettings.leagueSize);
  }
  if (leagueDifficultySelect instanceof HTMLSelectElement) {
    leagueDifficultySelect.value = leagueSettings.difficulty;
  }
  updateLeagueSelectionCountDisplay();
}

function updateLeagueSettingsFromState(league, options = {}) {
  const derived = deriveLeagueSettings(league);
  leagueSettings = derived;
  if (options.syncSelectors) {
    syncLeagueSelectorsFromSettings();
  }
}

const numberFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const historyDateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function syncSidebarState() {
  if (!sidebarToggleButton || !sidebarPanel || !sidebarCollapseQuery) {
    return;
  }

  if (sidebarCollapseQuery.matches) {
    sidebarToggleButton.setAttribute(
      'aria-expanded',
      sidebarPanel.classList.contains('is-open') ? 'true' : 'false'
    );
  } else {
    sidebarPanel.classList.remove('is-open');
    sidebarToggleButton.setAttribute('aria-expanded', 'true');
  }
}

if (clubLogoEl) {
  clubLogoEl.addEventListener('error', () => {
    if (clubLogoEl.dataset.logoSrc === DEFAULT_CLUB_LOGO) {
      return;
    }
    clubLogoEl.dataset.logoSrc = DEFAULT_CLUB_LOGO;
    clubLogoEl.src = DEFAULT_CLUB_LOGO;
  });
}

const STARTERS_LIMIT = 11;
const SUBS_LIMIT = 5;
const LEADERBOARD_LIMIT = 7;
const POSITION_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const SAVE_NOTICE_DURATION = 4000;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function restartAnimation(element, className) {
  if (!element) {
    return;
  }
  element.classList.remove(className);
  requestAnimationFrame(() => {
    element.classList.add(className);
  });
}

function cloneData(value) {
  if (value === undefined) {
    return value;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normaliseRecordEntry(entry) {
  if (!entry) {
    return null;
  }
  const opponent =
    typeof entry.opponent === 'string' && entry.opponent.trim().length > 0
      ? entry.opponent.trim()
      : 'Rival misterioso';
  const goalsFor = Number.isFinite(entry.goalsFor) ? entry.goalsFor : 0;
  const goalsAgainst = Number.isFinite(entry.goalsAgainst) ? entry.goalsAgainst : 0;
  const goalDifference = Number.isFinite(entry.goalDifference)
    ? entry.goalDifference
    : goalsFor - goalsAgainst;
  const totalGoals = Number.isFinite(entry.totalGoals)
    ? entry.totalGoals
    : goalsFor + goalsAgainst;
  const season = Number.isFinite(entry.season) ? entry.season : 1;
  const matchday = Number.isFinite(entry.matchday) ? entry.matchday : 1;
  return {
    ...entry,
    opponent,
    goalsFor,
    goalsAgainst,
    goalDifference,
    totalGoals,
    season,
    matchday,
  };
}

function normaliseSeasonStats(stats) {
  const defaults = createSeasonStats();
  if (!stats) {
    return createSeasonStats();
  }
  const merged = { ...defaults, ...stats };
  const defaultHistory = defaults.history ?? { titles: 0, lastTitleSeason: 0, records: {} };
  const incomingHistory = stats.history ?? {};
  const mergedHistory = {
    ...defaultHistory,
    ...incomingHistory,
  };
  const defaultRecords = defaultHistory.records ?? {};
  const incomingRecords = incomingHistory.records ?? {};
  const mergedRecords = {
    ...defaultRecords,
    ...incomingRecords,
  };
  mergedRecords.biggestWin = normaliseRecordEntry(mergedRecords.biggestWin);
  mergedRecords.heaviestDefeat = normaliseRecordEntry(mergedRecords.heaviestDefeat);
  mergedRecords.goalFestival = normaliseRecordEntry(mergedRecords.goalFestival);
  mergedHistory.records = mergedRecords;
  mergedHistory.titles = Number.isFinite(mergedHistory.titles) ? mergedHistory.titles : 0;
  mergedHistory.lastTitleSeason = Number.isFinite(mergedHistory.lastTitleSeason)
    ? mergedHistory.lastTitleSeason
    : 0;
  merged.history = mergedHistory;
  return merged;
}

function updateSeasonHistoricalMetrics(report, opponentName, league) {
  if (!report || !report.updatedClub || !report.match) {
    return;
  }
  const seasonStats = normaliseSeasonStats(report.updatedClub.seasonStats);
  report.updatedClub.seasonStats = seasonStats;
  const history = seasonStats.history;
  const records = history.records;
  const cleanOpponent =
    typeof opponentName === 'string' && opponentName.trim().length > 0
      ? opponentName.trim()
      : 'Rival misterioso';
  const matchdayNumber = Number.isFinite(league?.matchDay) ? Math.max(1, league.matchDay) : 1;
  const entry = {
    season: report.updatedClub.season,
    matchday: matchdayNumber,
    opponent: cleanOpponent,
    goalsFor: report.match.goalsFor,
    goalsAgainst: report.match.goalsAgainst,
    goalDifference: report.match.goalsFor - report.match.goalsAgainst,
    totalGoals: report.match.goalsFor + report.match.goalsAgainst,
  };

  if (report.match.goalsFor > report.match.goalsAgainst) {
    const previous = records.biggestWin;
    const previousMargin = previous ? previous.goalDifference : Number.NEGATIVE_INFINITY;
    const previousGoals = previous ? previous.goalsFor : Number.NEGATIVE_INFINITY;
    if (
      entry.goalDifference > previousMargin ||
      (entry.goalDifference === previousMargin && entry.goalsFor > previousGoals)
    ) {
      records.biggestWin = normaliseRecordEntry(entry);
    }
  }

  if (report.match.goalsAgainst > report.match.goalsFor) {
    const previous = records.heaviestDefeat;
    const previousMargin = previous ? previous.goalDifference : Number.POSITIVE_INFINITY;
    const previousConceded = previous ? previous.goalsAgainst : Number.NEGATIVE_INFINITY;
    if (
      entry.goalDifference < previousMargin ||
      (entry.goalDifference === previousMargin && entry.goalsAgainst > previousConceded)
    ) {
      records.heaviestDefeat = normaliseRecordEntry(entry);
    }
  }

  const previousFestival = records.goalFestival;
  const previousGoals = previousFestival ? previousFestival.totalGoals : Number.NEGATIVE_INFINITY;
  if (entry.totalGoals > previousGoals && entry.totalGoals > 0) {
    records.goalFestival = normaliseRecordEntry(entry);
  }

  const totalMatchdays =
    Number.isFinite(league?.totalMatchdays) && league.totalMatchdays > 0
      ? Math.max(1, Math.trunc(league.totalMatchdays))
      : getTotalMatchdays();
  const champion = league?.table?.[0]?.club;
  if (
    league &&
    league.matchDay >= totalMatchdays &&
    champion === report.updatedClub.name &&
    history.lastTitleSeason !== report.updatedClub.season
  ) {
    history.titles = (history.titles ?? 0) + 1;
    history.lastTitleSeason = report.updatedClub.season;
  }
}

function buildLeaguePlayerDataset() {
  const dataset = [];
  if (clubState && Array.isArray(clubState.squad)) {
    clubState.squad.forEach((player) => {
      const log = player.seasonLog ?? {};
      dataset.push({
        id: player.id,
        name: player.name,
        club: clubState.name,
        goals: Number.isFinite(log.goals) ? log.goals : 0,
        assists: Number.isFinite(log.assists) ? log.assists : 0,
        cleanSheets: Number.isFinite(log.cleanSheets) ? log.cleanSheets : 0,
      });
    });
  }

  if (leagueState && Array.isArray(leagueState.table)) {
    leagueState.table
      .filter((standing) => standing.club !== clubState.name)
      .forEach((standing) => {
        const syntheticGoals = Math.max(0, Math.round(standing.goalsFor * 0.55));
        const syntheticAssists = Math.max(0, Math.round(standing.goalsFor * 0.35));
        const cleanSheetBase = standing.played > 0 ? standing.played - standing.goalsAgainst / 2.5 : 0;
        const syntheticCleanSheets = Math.max(
          0,
          Math.min(standing.played, Math.round(cleanSheetBase))
        );
        dataset.push({
          id: `club-${standing.club}-referente`,
          name: `Referente de ${standing.club}`,
          club: standing.club,
          goals: syntheticGoals,
          assists: syntheticAssists,
          cleanSheets: syntheticCleanSheets,
        });
      });
  }

  return dataset;
}

function computeLeaderboard(dataset, key) {
  return dataset
    .filter((entry) => Number.isFinite(entry[key]) && entry[key] > 0)
    .sort((a, b) => {
      if (b[key] !== a[key]) {
        return b[key] - a[key];
      }
      if (a.club !== b.club) {
        return a.club.localeCompare(b.club);
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, LEADERBOARD_LIMIT);
}

function renderLeaderboardTable(body, entries, key) {
  if (!body) {
    return;
  }
  body.innerHTML = '';
  if (!entries.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Todavía no hay datos disponibles.';
    row.append(cell);
    body.append(row);
    return;
  }
  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    if (entry.club === clubState.name) {
      row.classList.add('is-user');
    }
    const positionCell = document.createElement('td');
    positionCell.textContent = String(index + 1);
    const nameCell = document.createElement('td');
    nameCell.textContent = entry.name;
    const clubCell = document.createElement('td');
    clubCell.textContent = entry.club;
    const valueCell = document.createElement('td');
    valueCell.textContent = String(entry[key]);
    row.append(positionCell, nameCell, clubCell, valueCell);
    body.append(row);
  });
}

function renderLeagueLeaderboards() {
  const dataset = buildLeaguePlayerDataset();
  const topScorers = computeLeaderboard(dataset, 'goals');
  const topAssists = computeLeaderboard(dataset, 'assists');
  const topCleanSheets = computeLeaderboard(dataset, 'cleanSheets');
  renderLeaderboardTable(leagueTopScorersBody, topScorers, 'goals');
  renderLeaderboardTable(leagueTopAssistsBody, topAssists, 'assists');
  renderLeaderboardTable(leagueTopCleanSheetsBody, topCleanSheets, 'cleanSheets');
}

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

function normaliseColorValue(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function getReadableTextColor(hexColor) {
  if (!HEX_COLOR_PATTERN.test(hexColor)) {
    return '#ffffff';
  }
  const toLinear = (component) => {
    const normalized = component / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.55 ? '#111827' : '#ffffff';
}

function resolveClubLogoUrl(club) {
  if (!club || typeof club.logoUrl !== 'string') {
    return DEFAULT_CLUB_LOGO;
  }
  const trimmed = club.logoUrl.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_CLUB_LOGO;
}

function updateClubLogoDisplay() {
  if (!clubLogoEl) {
    return;
  }
  const resolved = resolveClubLogoUrl(clubState);
  if (clubLogoEl.dataset.logoSrc !== resolved) {
    clubLogoEl.dataset.logoSrc = resolved;
    clubLogoEl.src = resolved;
  }
  clubLogoEl.alt = `Escudo de ${clubState.name}`;
}

function applyClubThemeColors() {
  if (typeof document === 'undefined') {
    return;
  }
  const primary = normaliseColorValue(clubState?.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondary = normaliseColorValue(clubState?.secondaryColor, DEFAULT_SECONDARY_COLOR);
  const onPrimary = getReadableTextColor(primary);
  const onSecondary = getReadableTextColor(secondary);
  const root = document.documentElement;
  const targets = [root, clubCardEl].filter(Boolean);
  for (const element of targets) {
    element.style.setProperty('--club-theme-primary', primary);
    element.style.setProperty('--club-theme-secondary', secondary);
    element.style.setProperty('--club-theme-on-primary', onPrimary);
    element.style.setProperty('--club-theme-on-secondary', onSecondary);
  }
}

function normaliseIdentity(partial) {
  const rawName = typeof partial?.name === 'string' ? partial.name.trim() : '';
  const rawStadium = typeof partial?.stadiumName === 'string' ? partial.stadiumName.trim() : '';
  const rawCity = typeof partial?.city === 'string' ? partial.city.trim() : '';
  const primaryColor = normaliseColorValue(partial?.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = normaliseColorValue(partial?.secondaryColor, DEFAULT_SECONDARY_COLOR);
  const rawLogo = typeof partial?.logoUrl === 'string' ? partial.logoUrl.trim() : '';
  return {
    name: rawName.length > 0 ? rawName : DEFAULT_CLUB_NAME,
    stadiumName: rawStadium.length > 0 ? rawStadium : DEFAULT_STADIUM_NAME,
    city: rawCity.length > 0 ? rawCity : DEFAULT_CLUB_CITY,
    primaryColor,
    secondaryColor,
    logoUrl: rawLogo.length > 0 ? rawLogo : DEFAULT_CLUB_LOGO,
  };
}

function extractClubIdentity(club) {
  return normaliseIdentity({
    name: club?.name,
    stadiumName: club?.stadiumName,
    city: club?.city,
    primaryColor: club?.primaryColor,
    secondaryColor: club?.secondaryColor,
    logoUrl: club?.logoUrl,
  });
}

function getHomeVenueLabel() {
  if (!clubState) {
    return DEFAULT_STADIUM_NAME;
  }
  const identity = extractClubIdentity(clubState);
  return identity.stadiumName;
}

function buildInitialConfig(club) {
  const baseConfig = createDefaultMatchConfig();
  const instructions = { ...createDefaultInstructions(), ...(baseConfig.instructions ?? {}) };
  const defaultLineup = createDefaultLineup(club);
  const leagueInfo = deriveLeagueSettings(club.league ?? leagueState);
  return {
    ...baseConfig,
    startingLineup: defaultLineup.starters,
    substitutes: defaultLineup.substitutes,
    instructions,
    seed: typeof baseConfig.seed === 'string' ? baseConfig.seed : '',
    difficultyMultiplier: leagueInfo.difficultyMultiplier,
    viewMode: baseConfig.viewMode ?? 'text',
  };
}

function computeOpponentRotation(league, clubName) {
  if (!league || !Array.isArray(league.table)) {
    return [];
  }
  return league.table.filter((entry) => entry.club !== clubName).map((entry) => entry.club);
}

function prefillClubIdentityForm() {
  if (!clubIdentityForm) {
    return;
  }
  const identity = extractClubIdentity(clubState);
  if (clubNameInput) {
    clubNameInput.value = identity.name;
  }
  if (clubCityInput) {
    clubCityInput.value = identity.city;
  }
  if (clubStadiumInput) {
    clubStadiumInput.value = identity.stadiumName;
  }
  if (clubPrimaryColorInput) {
    clubPrimaryColorInput.value = identity.primaryColor;
  }
  if (clubSecondaryColorInput) {
    clubSecondaryColorInput.value = identity.secondaryColor;
  }
  if (clubLogoInput) {
    clubLogoInput.value = '';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('La imagen seleccionada no es válida.'));
      }
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('No se pudo leer la imagen del escudo.'));
    });
    reader.readAsDataURL(file);
  });
}

async function getLogoFromForm() {
  if (!clubLogoInput || !clubLogoInput.files || clubLogoInput.files.length === 0) {
    return clubIdentity.logoUrl ?? clubState.logoUrl ?? DEFAULT_CLUB_LOGO;
  }
  const file = clubLogoInput.files[0];
  if (!file || file.size === 0 || typeof FileReader === 'undefined') {
    return clubIdentity.logoUrl ?? clubState.logoUrl ?? DEFAULT_CLUB_LOGO;
  }
  try {
    return await readFileAsDataUrl(file);
  } catch (error) {
    console.warn('No se pudo procesar el nuevo escudo del club:', error);
    return clubIdentity.logoUrl ?? clubState.logoUrl ?? DEFAULT_CLUB_LOGO;
  }
}

async function collectIdentityFromForm() {
  const logoUrl = await getLogoFromForm();
  return normaliseIdentity({
    name: clubNameInput?.value,
    city: clubCityInput?.value,
    stadiumName: clubStadiumInput?.value,
    primaryColor: clubPrimaryColorInput?.value,
    secondaryColor: clubSecondaryColorInput?.value,
    logoUrl,
  });
}

function rebuildClubState(identity) {
  const resolvedIdentity = normaliseIdentity(identity ?? clubIdentity);
  clubIdentity = resolvedIdentity;
  const freshClub = createExampleClub(resolvedIdentity);
  clubState = { ...freshClub, ...resolvedIdentity };
  clubState.seasonStats = normaliseSeasonStats(clubState.seasonStats);
  clubState.staff = normaliseStaffState(clubState.staff);
  leagueState = freshClub.league;
  cupState = freshClub.cup;
  updateLeagueSettingsFromState(leagueState, { syncSelectors: true });
  transferMarketState = createExampleTransferMarket(freshClub);
  configState = buildInitialConfig(freshClub);
  opponentRotation = computeOpponentRotation(leagueState, freshClub.name);
  decisionSelect.value = '';
  updateFormDefaults();
  updateClubSummary();
  renderLeagueTable();
  renderTransferMarket();
  renderLineupBoard();
  updateMatchSummary();
  switchToPlanningView();
  clearTransferMessage();
  matchHistory = [];
  currentHistoryEntryId = null;
  reportHistoryFilterSeason = 'all';
  activeReportTab = 'current';
  renderReportHistory();
  clearReport();
  return resolvedIdentity;
}

let clubState = createExampleClub();
clubState.seasonStats = normaliseSeasonStats(clubState.seasonStats);
clubState.staff = normaliseStaffState(clubState.staff);
let leagueState = clubState.league;
let cupState = clubState.cup;
updateLeagueSettingsFromState(leagueState, { syncSelectors: true });
let transferMarketState = createExampleTransferMarket(clubState);
let configState = buildInitialConfig(clubState);
let transferMessageTimeout;
let modalHandlersAttached = false;
let opponentRotation = computeOpponentRotation(leagueState, clubState.name);
let saveMessageTimeout;
let loadNoticeTimeout;
let hasLatestReport = false;
let matchHistory = [];
let currentHistoryEntryId = null;
let reportHistoryFilterSeason = 'all';
let activeReportTab = 'current';
let currentReportData = null;
let clubIdentity = extractClubIdentity(clubState);
let editingPlayerId = null;
let staffFeedback = '';

if (!cupState) {
  cupState = createExampleCup(clubState.name, { participants: leagueState?.rivals });
  clubState = { ...clubState, cup: cupState };
}

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
  if (modal === playerEditModal) {
    resetPlayerEditForm();
  }
  updateBodyModalState();
}

function closeAllModals() {
  const openModals = document.querySelectorAll('.modal.is-open');
  openModals.forEach((modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal === playerEditModal) {
      resetPlayerEditForm();
    }
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
  if (!decisionSelect) {
    return;
  }

  const previousValue = decisionSelect.value;
  decisionSelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Mantenerse pulcro (sin travesuras)';
  decisionSelect.append(defaultOption);

  decisions.forEach((decision, index) => {
    const option = document.createElement('option');
    const label = decisionLabels[decision.type] ?? decision.type;
    option.value = String(index);
    const pieces = [`${label}`, `intensidad ${decision.intensity}`];
    const cooldownRemaining = clubState.canallaStatus?.cooldowns?.[decision.type] ?? 0;
    if (cooldownRemaining > 0) {
      pieces.push(`en cooldown (${cooldownRemaining})`);
      option.disabled = true;
    } else if (decision.cooldownMatches) {
      pieces.push(`cd ${decision.cooldownMatches}`);
    }
    option.textContent = pieces.join(' · ');
    decisionSelect.append(option);
  });

  if (previousValue && decisionSelect.querySelector(`option[value="${previousValue}"]`)) {
    decisionSelect.value = previousValue;
  } else {
    decisionSelect.value = '';
  }
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

function findCupDefinition(roundId) {
  return CUP_ROUND_DEFINITIONS.find((entry) => entry.id === roundId);
}

function getCupRoundName(roundId) {
  if (!roundId) {
    return 'Ronda misteriosa';
  }
  const definition = findCupDefinition(roundId);
  return definition ? definition.name : roundId;
}

function updateResultsButtonState() {
  if (!resultsControlButton) {
    return;
  }
  const hasReports = hasLatestReport || matchHistory.length > 0;
  resultsControlButton.disabled = !hasReports;
  resultsControlButton.setAttribute('aria-disabled', hasReports ? 'false' : 'true');
}

function determineNextEvent() {
  if (!cupState) {
    return { type: 'league' };
  }
  const currentRound = cupState.rounds?.[cupState.currentRoundIndex];
  if (cupState.status === 'awaiting-draw' && currentRound) {
    return { type: 'cup-draw', round: currentRound };
  }
  if (cupState.status === 'awaiting-match' && currentRound) {
    const fixture = getCupFixture(cupState, clubState.name);
    return { type: 'cup-match', round: currentRound, fixture };
  }
  return { type: 'league' };
}

function formatCupStatusText() {
  if (!cupState) {
    return 'Sin participación copera';
  }
  const currentRound = cupState.rounds?.[cupState.currentRoundIndex];
  const roundName = currentRound ? getCupRoundName(currentRound.id) : 'Eliminatoria';
  switch (cupState.status) {
    case 'awaiting-draw':
      return `Sorteo de ${roundName}`;
    case 'awaiting-match': {
      const fixture = getCupFixture(cupState, clubState.name);
      if (fixture) {
        const venue = fixture.home ? 'en casa' : 'a domicilio';
        return `${roundName} · vs ${fixture.opponent} (${venue})`;
      }
      return `${roundName} pendiente`;
    }
    case 'eliminated': {
      const last = cupState.history?.[cupState.history.length - 1];
      const label = last?.roundName ?? roundName;
      return `Eliminados en ${label}`;
    }
    case 'champions':
      return '¡Campeones de copa!';
    case 'idle':
    default:
      return 'Copa en preparación';
  }
}

function updateCupSummary() {
  const statusText = formatCupStatusText();
  if (clubCupStatusEl) {
    clubCupStatusEl.textContent = statusText;
  }
  if (cupModalStatusEl) {
    cupModalStatusEl.textContent = statusText;
  }
}

function renderCupModal() {
  if (!cupState) {
    return;
  }
  updateCupSummary();
  if (cupDrawButton) {
    cupDrawButton.disabled = cupState.status !== 'awaiting-draw';
  }
  if (cupNextFixtureEl) {
    const event = determineNextEvent();
    if (event.type === 'cup-match' && event.fixture) {
      const roundName = getCupRoundName(event.round.id);
      const venue = event.fixture.home ? 'en casa' : 'a domicilio';
      cupNextFixtureEl.textContent = `${roundName}: ${clubState.name} vs ${event.fixture.opponent} (${venue})`;
    } else if (event.type === 'cup-draw') {
      const roundName = getCupRoundName(event.round.id);
      cupNextFixtureEl.textContent = `Sorteo pendiente de ${roundName}.`;
    } else {
      const last = cupState.history?.[cupState.history.length - 1];
      if (last) {
        cupNextFixtureEl.textContent = `${last.roundName}: ${last.outcome === 'champion' ? 'Título conquistado' : 'Eliminados'}.`;
      } else {
        cupNextFixtureEl.textContent = 'Sin eliminatorias pendientes.';
      }
    }
  }

  if (cupBracketList) {
    cupBracketList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    cupState.rounds.forEach((round) => {
      const item = document.createElement('li');
      item.className = 'cup-bracket__round';
      const title = document.createElement('h4');
      title.textContent = round.name;
      item.append(title);
      const tieList = document.createElement('ul');
      tieList.className = 'cup-bracket__ties';
      round.ties.forEach((tie) => {
        const tieItem = document.createElement('li');
        tieItem.className = 'cup-bracket__tie';
        const home = tie.home ?? 'Pendiente';
        const away = tie.away ?? 'Pendiente';
        if (tie.includesClub) {
          tieItem.classList.add('cup-bracket__tie--club');
        }
        if (tie.played && tie.homeGoals !== null && tie.awayGoals !== null) {
          tieItem.textContent = `${home} ${tie.homeGoals}-${tie.awayGoals} ${away}`;
        } else {
          tieItem.textContent = `${home} vs ${away}`;
        }
        tieList.append(tieItem);
      });
      item.append(tieList);
      fragment.append(item);
    });
    cupBracketList.append(fragment);
  }

  if (cupHistoryList) {
    cupHistoryList.innerHTML = '';
    if (cupState.history.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Sin hitos todavía.';
      cupHistoryList.append(empty);
    } else {
      cupState.history.forEach((entry) => {
        const historyItem = document.createElement('li');
        historyItem.textContent = `${entry.roundName}: ${entry.narrative[0] ?? entry.outcome}`;
        cupHistoryList.append(historyItem);
      });
    }
  }

  if (cupDrawNarrativeList) {
    cupDrawNarrativeList.innerHTML = '';
    const round = cupState.rounds?.[cupState.currentRoundIndex];
    const drawLines = round?.drawNarrative ?? [];
    if (drawLines.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Aún no se ha celebrado el sorteo.';
      cupDrawNarrativeList.append(item);
    } else {
      drawLines.forEach((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        cupDrawNarrativeList.append(item);
      });
    }
  }
}

function handleCupDraw() {
  if (!cupState || cupState.status !== 'awaiting-draw') {
    return;
  }
  const result = drawCupRound(cupState, clubState.name);
  cupState = result.cup;
  clubState = { ...clubState, cup: cupState };
  renderCupModal();
  renderLineupBoard();
  updateMatchSummary();
  updateCupSummary();
  persistState('silent');
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

  const totalMatchdays = getTotalMatchdays();

  if (leagueState.matchDay >= totalMatchdays) {
    calendarNoteEl.textContent = `Temporada completada tras ${totalMatchdays} jornadas.`;
    return;
  }

  const rotation = computeOpponentRotation(leagueState, clubState.name);
  if (rotation.length === 0) {
    calendarNoteEl.textContent = 'Los rivales están por confirmar. Vuelve tras el sorteo.';
    return;
  }

  const remaining = Math.max(0, totalMatchdays - leagueState.matchDay);
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

  const nextEvent = determineNextEvent();
  if (nextEvent.type === 'cup-match' && nextEvent.fixture) {
    opponentModalLocationEl.textContent = nextEvent.fixture.home ? getHomeVenueLabel() : 'Fuera de casa';
  } else {
    opponentModalLocationEl.textContent = homeCheckbox.checked ? getHomeVenueLabel() : 'Fuera de casa';
  }

  let comment = 'Aún no hay informes detallados del rival.';
  if (nextEvent.type === 'cup-draw') {
    comment = 'Todo depende del sorteo: prepara los bombos y la corbata de la suerte.';
  } else if (nextEvent.type === 'cup-match') {
    const roundName = getCupRoundName(nextEvent.round.id);
    comment = `Eliminatoria de ${roundName}. No hay margen de error.`;
  }
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

function ensureStaffState() {
  const normalised = normaliseStaffState(clubState?.staff);
  clubState.staff = normalised;
  return normalised;
}

function describeStaffRole(role) {
  return STAFF_ROLE_INFO[role]?.label ?? role;
}

function formatStaffEffects(member) {
  if (!Array.isArray(member.effects)) {
    return 'Sin impacto directo registrado.';
  }
  const parts = [];
  member.effects.forEach((effect) => {
    if (!effect || effect.frequency !== 'match') {
      return;
    }
    const value = Number(effect.value);
    if (!Number.isFinite(value) || value === 0) {
      return;
    }
    const absolute = Math.abs(value);
    if (effect.target === 'budget') {
      const sign = value > 0 ? '+' : '−';
      parts.push(`Caja ${sign}${numberFormatter.format(absolute)}`);
    } else if (effect.target === 'reputation') {
      const sign = value > 0 ? '+' : '−';
      parts.push(`Reputación ${sign}${absolute}`);
    } else if (effect.target === 'morale') {
      const sign = value > 0 ? '+' : '−';
      parts.push(`Moral ${sign}${absolute}`);
    }
  });
  return parts.length > 0 ? `${parts.join(' · ')} por jornada` : 'Sin impacto directo registrado.';
}

function getStaffDismissalCost(member) {
  if (Number.isFinite(member.dismissalCost)) {
    return Math.max(0, Math.round(Number(member.dismissalCost)));
  }
  return Math.max(0, Math.round(member.salary / 4));
}

function renderStaffList(listEl, members, options = {}) {
  if (!listEl) {
    return;
  }
  const settings = {
    action: 'hire',
    emptyMessage: 'Sin registros disponibles.',
    ...options,
  };
  listEl.innerHTML = '';
  if (members.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'stadium-upgrades__item';
    const message = document.createElement('p');
    message.textContent = settings.emptyMessage;
    emptyItem.append(message);
    listEl.append(emptyItem);
    return;
  }

  members.forEach((member) => {
    const item = document.createElement('li');
    item.className = 'stadium-upgrades__item';
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'stadium-upgrades__info';

    const nameEl = document.createElement('p');
    nameEl.className = 'stadium-upgrades__title';
    nameEl.textContent = member.name;
    const roleEl = document.createElement('p');
    roleEl.textContent = describeStaffRole(member.role);
    const descriptionEl = document.createElement('p');
    descriptionEl.textContent = member.description;
    const effectsEl = document.createElement('p');
    effectsEl.textContent = formatStaffEffects(member);
    const salaryEl = document.createElement('p');
    salaryEl.textContent = `Salario mensual: ${numberFormatter.format(member.salary)}`;

    infoWrapper.append(nameEl, roleEl, descriptionEl, effectsEl, salaryEl);

    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'stadium-upgrades__button';

    if (settings.action === 'fire') {
      const dismissalCost = getStaffDismissalCost(member);
      const severanceEl = document.createElement('p');
      severanceEl.textContent =
        dismissalCost > 0
          ? `Indemnización estimada: ${numberFormatter.format(dismissalCost)}`
          : 'Indemnización simbólica.';
      infoWrapper.append(severanceEl);
      actionButton.textContent =
        dismissalCost > 0
          ? `Rescindir (${numberFormatter.format(dismissalCost)})`
          : 'Rescindir sin coste';
      actionButton.addEventListener('click', () => {
        fireStaffMember(member.id);
      });
    } else {
      const hireCostEl = document.createElement('p');
      hireCostEl.textContent = `Coste de firma: ${numberFormatter.format(member.hiringCost)}`;
      infoWrapper.append(hireCostEl);
      if (clubState.budget < member.hiringCost) {
        const warningEl = document.createElement('p');
        warningEl.textContent = 'Presupuesto insuficiente para este fichaje.';
        infoWrapper.append(warningEl);
      }
      actionButton.textContent = `Contratar por ${numberFormatter.format(member.hiringCost)}`;
      actionButton.addEventListener('click', () => {
        hireStaffMember(member.id);
      });
    }

    item.append(infoWrapper, actionButton);
    listEl.append(item);
  });
}

function renderStaffModal() {
  if (!staffBreakdownEl || !staffNoteEl) {
    return;
  }

  const staffState = ensureStaffState();
  const rosterMembers = listStaffMembers(staffState.roster);
  const availableMembers = listStaffMembers(staffState.available).filter(
    (member) => !staffState.roster.includes(member.id)
  );
  const weeklyStaffCost = calculateStaffWeeklyCost(staffState);

  staffBreakdownEl.innerHTML = '';
  const summaryEntries = [
    { label: 'Empleados activos', value: String(rosterMembers.length) },
    { label: 'Coste semanal', value: numberFormatter.format(weeklyStaffCost) },
  ];
  summaryEntries.forEach((entry) => {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = entry.label;
    const dd = document.createElement('dd');
    dd.textContent = entry.value;
    wrapper.append(dt, dd);
    staffBreakdownEl.append(wrapper);
  });

  renderStaffList(staffRosterList, rosterMembers, {
    action: 'fire',
    emptyMessage: 'Sin empleados en nómina. El vestuario se autogestiona.',
  });
  renderStaffList(staffMarketList, availableMembers, {
    action: 'hire',
    emptyMessage: 'No hay candidatos disponibles en la agenda.',
  });

  const identity = extractClubIdentity(clubState);
  const defaultMessage = `Mantén el equilibrio entre moral, reputación y caja en ${identity.city}.`;
  const message = staffFeedback || defaultMessage;
  staffNoteEl.textContent = message;
  staffFeedback = '';
}

function hireStaffMember(staffId) {
  const member = getStaffDefinition(staffId);
  if (!member) {
    staffFeedback = 'No se ha encontrado el perfil solicitado.';
    renderStaffModal();
    return;
  }

  const staffState = ensureStaffState();
  if (staffState.roster.includes(staffId)) {
    staffFeedback = `${member.name} ya forma parte del cuerpo técnico.`;
    renderStaffModal();
    return;
  }

  if (clubState.budget < member.hiringCost) {
    staffFeedback = `Presupuesto insuficiente: necesitas ${numberFormatter.format(
      member.hiringCost
    )} para fichar a ${member.name}.`;
    renderStaffModal();
    return;
  }

  const updatedStaff = normaliseStaffState({
    roster: [...staffState.roster, staffId],
    available: staffState.available.filter((id) => id !== staffId),
  });

  clubState = {
    ...clubState,
    budget: clubState.budget - member.hiringCost,
    staff: updatedStaff,
  };
  staffFeedback = `${member.name} firma por ${numberFormatter.format(
    member.hiringCost
  )} y se suma a la aventura canalla.`;
  updateClubSummary();
}

function fireStaffMember(staffId) {
  const member = getStaffDefinition(staffId);
  if (!member) {
    staffFeedback = 'Ese perfil no figura en la plantilla.';
    renderStaffModal();
    return;
  }

  const staffState = ensureStaffState();
  if (!staffState.roster.includes(staffId)) {
    staffFeedback = `${member.name} ya no estaba en nómina.`;
    renderStaffModal();
    return;
  }

  const dismissalCost = getStaffDismissalCost(member);
  const updatedStaff = normaliseStaffState({
    roster: staffState.roster.filter((id) => id !== staffId),
    available: [...staffState.available, staffId],
  });

  clubState = {
    ...clubState,
    budget: clubState.budget - dismissalCost,
    staff: updatedStaff,
  };
  staffFeedback =
    dismissalCost > 0
      ? `${member.name} se marcha tras abonar ${numberFormatter.format(dismissalCost)} en indemnización.`
      : `${member.name} se despide sin coste extra.`;
  updateClubSummary();
}

function renderFinancesModal() {
  if (!financesBudgetModalEl || !financesWagesModalEl || !financesOperatingModalEl || !financesNoteEl) {
    return;
  }
  financesBudgetModalEl.textContent = numberFormatter.format(clubState.budget);
  const staffWeeklyCost = calculateStaffWeeklyCost(clubState.staff);
  const totalWages = (clubState.weeklyWageBill ?? 0) + staffWeeklyCost;
  financesWagesModalEl.textContent = numberFormatter.format(totalWages);

  const expenses = getOperatingExpenses();
  const totalOperating = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  financesOperatingModalEl.textContent = numberFormatter.format(totalOperating);

  const projected = totalWages + totalOperating;
  financesNoteEl.textContent = `Proyección semanal estimada: ${numberFormatter.format(
    projected
  )} entre plantilla, staff y operaciones.`;
}

function describeHeatLevel(heat) {
  if (heat >= 75) {
    return `Riesgo acumulado: ${heat}/100 · La lupa mediática arde, el comité acecha.`;
  }
  if (heat >= 50) {
    return `Riesgo acumulado: ${heat}/100 · Hay demasiado ruido; quizá conviene aflojar la picardía.`;
  }
  if (heat >= 25) {
    return `Riesgo acumulado: ${heat}/100 · Las sospechas crecen, mueve ficha con cuidado.`;
  }
  return `Riesgo acumulado: ${heat}/100 · Ambiente sereno, perfecto para una jugada fina.`;
}

function renderDecisionsModal() {
  if (!decisionsListEl) {
    return;
  }
  decisionsListEl.innerHTML = '';

  const status = clubState.canallaStatus ?? { heat: 0, cooldowns: {}, ongoingEffects: [] };
  if (decisionsHeatEl) {
    const heatValue = Math.round(status.heat ?? 0);
    decisionsHeatEl.textContent = describeHeatLevel(heatValue);
  }

  decisions.forEach((decision, index) => {
    const item = document.createElement('li');
    if (decisionSelect && String(index) === decisionSelect.value) {
      item.classList.add('is-active');
    }
    const header = document.createElement('div');
    header.className = 'control-decision__header';
    const label = document.createElement('span');
    label.textContent = decisionLabels[decision.type] ?? decision.type;
    const intensity = document.createElement('span');
    intensity.textContent = `Intensidad ${decision.intensity}`;
    header.append(label, intensity);

    const description = document.createElement('p');
    description.className = 'control-decision__description';
    description.textContent = decision.description ?? 'Sin descripción disponible para esta travesura.';

    const details = document.createElement('p');
    details.className = 'control-decision__details';
    const detailParts = [];
    const cooldownRemaining = status.cooldowns?.[decision.type] ?? 0;
    if (cooldownRemaining > 0) {
      detailParts.push(`En enfriamiento: ${cooldownRemaining} jornada${cooldownRemaining === 1 ? '' : 's'}.`);
    } else if (decision.cooldownMatches) {
      detailParts.push(`Cooldown base: ${decision.cooldownMatches} jornada${decision.cooldownMatches === 1 ? '' : 's'}.`);
    }
    if (typeof decision.expectedHeat === 'number') {
      detailParts.push(`Sospecha estimada: +${decision.expectedHeat}.`);
    }
    if (decision.consequenceSummary) {
      detailParts.push(decision.consequenceSummary);
    }
    const relatedEffects = Array.isArray(status.ongoingEffects)
      ? status.ongoingEffects.filter((effect) => effect.source === decision.type)
      : [];
    relatedEffects.forEach((effect) => {
      const remainingText = effect.remainingMatches > 1 ? `${effect.remainingMatches} jornadas restantes` : 'Último partido en vigor';
      detailParts.push(`${effect.narrative} · ${remainingText}.`);
    });
    details.textContent = detailParts.length > 0 ? detailParts.join(' ') : 'Sin consecuencias activas registradas.';

    item.append(header, description, details);
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

function getInfrastructureLevel(type) {
  const blueprint = INFRASTRUCTURE_BLUEPRINT[type];
  if (!blueprint || !clubState) {
    return 0;
  }
  const level = clubState.infrastructure?.[blueprint.levelKey];
  return Number.isFinite(level) ? Number(level) : 0;
}

function updateInfrastructureDescriptions() {
  infrastructureDescriptionEls.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const type = element.dataset.infrastructureDescription;
    const blueprint = type ? INFRASTRUCTURE_BLUEPRINT[type] : undefined;
    if (!blueprint) {
      return;
    }
    element.textContent = blueprint.description;
  });
}

function showInfrastructureFeedback(message, tone = 'info') {
  if (!stadiumUpgradeFeedbackEl) {
    return;
  }
  stadiumUpgradeFeedbackEl.textContent = message;
  if (message && tone) {
    stadiumUpgradeFeedbackEl.dataset.tone = tone;
  } else {
    stadiumUpgradeFeedbackEl.removeAttribute('data-tone');
  }
}

function updateInfrastructureControls() {
  if (!clubState) {
    return;
  }

  updateInfrastructureDescriptions();

  infrastructureUpgradeButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const type = button.dataset.infrastructureUpgrade;
    const blueprint = type ? INFRASTRUCTURE_BLUEPRINT[type] : undefined;
    if (!blueprint) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      return;
    }

    const currentLevel = getInfrastructureLevel(type);
    const costElement = document.querySelector(`[data-infrastructure-cost="${type}"]`);

    if (currentLevel >= blueprint.maxLevel) {
      button.textContent = `${blueprint.label}: nivel máximo`;
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      if (costElement instanceof HTMLElement) {
        costElement.textContent = 'Objetivo cumplido: no hay más ampliaciones disponibles.';
      }
      return;
    }

    const nextLevel = currentLevel + 1;
    const cost = calculateInfrastructureUpgradeCost(type, nextLevel);
    const afford = clubState.budget >= cost;
    button.textContent = `${blueprint.label} · nivel ${nextLevel}`;
    button.disabled = !afford;
    button.setAttribute('aria-disabled', afford ? 'false' : 'true');
    button.dataset.cost = String(cost);
    button.title = blueprint.description;

    if (costElement instanceof HTMLElement) {
      const costLabel = numberFormatter.format(cost);
      costElement.textContent = afford
        ? `Coste: ${costLabel}`
        : `Coste: ${costLabel} · falta presupuesto`;
    }
  });
}

function buildInfrastructureFeedback(type, level, capacity, prospects) {
  if (type === 'stadium') {
    return `La grada queda en nivel ${level}: aforo para ${capacity.toLocaleString('es-ES')} almas canallas.`;
  }
  if (type === 'training') {
    return `El centro de entrenamiento sube a nivel ${level}. Las piernas cargarán menos cansancio entre jornadas.`;
  }
  if (type === 'medical') {
    return `Área médica nivel ${level}: la enfermería se convierte en spa de élite para la plantilla.`;
  }
  if (type === 'academy' && Array.isArray(prospects) && prospects.length > 0) {
    const names = prospects.map((player) => {
      if (player.nickname && player.nickname.trim().length > 0) {
        return `${player.nickname} (${player.name})`;
      }
      return player.name;
    });
    return `La cantera ya es nivel ${level}: ${names.join(', ')} se suman al primer equipo.`;
  }
  return `Infraestructura al nivel ${level}: el proyecto sigue creciendo.`;
}

function handleInfrastructureUpgrade(type) {
  if (!type) {
    return;
  }
  const blueprint = INFRASTRUCTURE_BLUEPRINT[type];
  if (!blueprint) {
    return;
  }

  const currentLevel = getInfrastructureLevel(type);
  if (currentLevel >= blueprint.maxLevel) {
    showInfrastructureFeedback('Esta área ya luce su máximo esplendor.', 'error');
    return;
  }

  const nextLevel = currentLevel + 1;
  const cost = calculateInfrastructureUpgradeCost(type, nextLevel);
  if (clubState.budget < cost) {
    showInfrastructureFeedback('No alcanza la caja para esa obra. Ajusta gastos o espera otra jornada.', 'error');
    return;
  }

  const currentInfrastructure = clubState.infrastructure ?? {};
  const updatedInfrastructure = { ...currentInfrastructure, [blueprint.levelKey]: nextLevel };
  let updatedStadiumCapacity = clubState.stadiumCapacity;
  if (type === 'stadium') {
    updatedStadiumCapacity = calculateStadiumCapacity(nextLevel);
  }

  let updatedSquad = clubState.squad;
  let newProspects = [];
  if (type === 'academy') {
    const intakeCount = nextLevel >= 4 ? 2 : 1;
    newProspects = createAcademyProspects(nextLevel, { count: intakeCount });
    if (newProspects.length > 0) {
      updatedSquad = [...clubState.squad, ...newProspects];
    }
  }

  const updatedOperatingExpenses = calculateOperatingExpensesForInfrastructure(updatedInfrastructure);
  const updatedBudget = clubState.budget - cost;
  const updatedWageBill = calculateWeeklyWageBill(updatedSquad);

  clubState = {
    ...clubState,
    budget: updatedBudget,
    infrastructure: updatedInfrastructure,
    stadiumCapacity: updatedStadiumCapacity,
    operatingExpenses: updatedOperatingExpenses,
    squad: updatedSquad,
    weeklyWageBill: updatedWageBill,
  };

  if (newProspects.length > 0) {
    ensureLineupCompleteness();
    renderLineupBoard();
  }

  updateClubSummary();
  showInfrastructureFeedback(
    buildInfrastructureFeedback(type, nextLevel, updatedStadiumCapacity, newProspects),
    'success'
  );
}

if (infrastructureUpgradeButtons.length > 0) {
  infrastructureUpgradeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.infrastructureUpgrade ?? '';
      handleInfrastructureUpgrade(type);
    });
  });
}

if (infrastructureDescriptionEls.length > 0) {
  updateInfrastructureDescriptions();
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

  const identity = extractClubIdentity(clubState);
  stadiumNoteEl.textContent = `${identity.stadiumName} vibra en ${identity.city}. Cada mejora suma costes, pero también impulsa ingresos, salud y cantera.`;
  updateInfrastructureControls();
}

function refreshControlPanel() {
  populateDecisions();
  renderCalendarModal();
  renderTacticsModal();
  renderOpponentModal();
  renderStaffModal();
  renderFinancesModal();
  renderDecisionsModal();
  renderStadiumModal();
  renderCupModal();
  updateResultsButtonState();
}

function getCurrentLeagueRivals() {
  if (!leagueState || !Array.isArray(leagueState.table)) {
    return [];
  }
  if (Array.isArray(leagueState.rivals) && leagueState.rivals.length > 0) {
    return leagueState.rivals
      .map((name) => (typeof name === 'string' ? name.trim() : ''))
      .filter((name) => name.length > 0 && name !== clubState.name);
  }
  return leagueState.table
    .filter((entry) => entry.club !== clubState.name)
    .map((entry) => entry.club)
    .filter((name) => typeof name === 'string' && name.trim().length > 0);
}

function updateLeagueSelectionCountDisplay() {
  if (!leagueSelectionCountEl || !leagueCatalogEl) {
    return;
  }
  const selected = leagueCatalogEl.querySelectorAll("input[type='checkbox'][name='league-rival']:checked").length;
  const target = getTargetRivalCount();
  const totalMatchdaysPreview = calculateTotalMatchdays(target);
  leagueSelectionCountEl.textContent = `${selected}/${target} rivales elegidos · ${totalMatchdaysPreview} jornadas`;
}

function hideLeagueConfigError() {
  if (!leagueConfigErrorEl) {
    return;
  }
  leagueConfigErrorEl.hidden = true;
  leagueConfigErrorEl.textContent = '';
}

function showLeagueConfigError(message) {
  if (!leagueConfigErrorEl) {
    return;
  }
  leagueConfigErrorEl.hidden = false;
  leagueConfigErrorEl.textContent = message;
}

function populateLeagueCatalog() {
  if (!leagueCatalogEl) {
    return;
  }
  const current = getCurrentLeagueRivals();
  const currentSet = new Set(current);
  leagueCatalogEl.innerHTML = '';
  const seen = new Set();
  const extras = current.filter((name) => !LEAGUE_RIVAL_CATALOG.includes(name));
  const combined = [...LEAGUE_RIVAL_CATALOG, ...extras];
  combined.forEach((name) => {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed || seen.has(trimmed) || trimmed === clubState.name) {
      return;
    }
    seen.add(trimmed);
    const option = document.createElement('label');
    option.className = 'league-config__option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'league-rival';
    checkbox.value = trimmed;
    checkbox.checked = currentSet.has(trimmed);
    const span = document.createElement('span');
    span.textContent = trimmed;
    option.append(checkbox, span);
    leagueCatalogEl.append(option);
  });
  updateLeagueSelectionCountDisplay();
}

function applyLeagueSelectionToForm(rivals) {
  if (!leagueCatalogEl) {
    return;
  }
  const targetSet = new Set(rivals);
  const checkboxes = leagueCatalogEl.querySelectorAll("input[type='checkbox'][name='league-rival']");
  checkboxes.forEach((input) => {
    input.checked = targetSet.has(input.value);
  });
  updateLeagueSelectionCountDisplay();
}

function getSelectedLeagueRivals() {
  if (!leagueCatalogEl) {
    return [];
  }
  const checked = leagueCatalogEl.querySelectorAll("input[type='checkbox'][name='league-rival']:checked");
  return Array.from(checked)
    .map((input) => (input instanceof HTMLInputElement ? input.value : ''))
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter((name) => name.length > 0 && name !== clubState.name);
}

function prepareLeagueConfigModal() {
  syncLeagueSelectorsFromSettings();
  populateLeagueCatalog();
  hideLeagueConfigError();
  updateLeagueSelectionCountDisplay();
}

function applyLeagueConfiguration(rivals) {
  const leagueSize = getSelectedLeagueSize();
  const targetCount = Math.max(1, leagueSize - 1);
  const difficultyValue =
    leagueDifficultySelect instanceof HTMLSelectElement
      ? leagueDifficultySelect.value
      : leagueSettings.difficulty;
  const difficultyInfo = resolveLeagueDifficulty(difficultyValue);
  const normalised = normaliseLeagueRivals(rivals, {
    count: targetCount,
    exclude: [clubState.name],
  });
  const newLeague = createExampleLeague(clubState.name, {
    city: clubState.city,
    leagueSize,
    difficulty: difficultyInfo.id,
    rivals: normalised,
  });
  const updatedLeague = { ...newLeague, rivals: normalised };
  leagueState = updatedLeague;
  updateLeagueSettingsFromState(updatedLeague, { syncSelectors: true });
  clubState = { ...clubState, league: updatedLeague };
  configState = { ...configState, difficultyMultiplier: leagueSettings.difficultyMultiplier };
  opponentRotation = computeOpponentRotation(updatedLeague, clubState.name);
  clearReport();
  renderLeagueTable();
  updateMatchSummary();
  showLoadNotice(
    `Liga regenerada: ${leagueSize} clubes, dificultad ${difficultyInfo.label}. ¡Arranca una nueva temporada!`
  );
  persistState('silent');
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
  if (viewModeToggle instanceof HTMLInputElement) {
    viewModeToggle.checked = configState.viewMode === '2d';
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

function clearPlayerEditError() {
  if (!playerEditErrorEl) {
    return;
  }
  playerEditErrorEl.textContent = '';
  playerEditErrorEl.hidden = true;
}

function showPlayerEditError(message) {
  if (!playerEditErrorEl) {
    return;
  }
  playerEditErrorEl.textContent = message;
  playerEditErrorEl.hidden = false;
}

function resetPlayerEditForm() {
  editingPlayerId = null;
  if (playerEditForm) {
    playerEditForm.reset();
    delete playerEditForm.dataset.playerId;
  }
  clearPlayerEditError();
}

function openPlayerIdentityEditor(playerId) {
  if (!playerEditModal || !playerEditForm || !playerEditNameInput) {
    return;
  }
  const player = findPlayerById(playerId);
  if (!player) {
    showPlayerEditError('No se pudo cargar la ficha del jugador.');
    return;
  }
  editingPlayerId = playerId;
  clearPlayerEditError();
  playerEditNameInput.value = player.name ?? '';
  if (playerEditNicknameInput) {
    playerEditNicknameInput.value = player.nickname ?? '';
  }
  playerEditForm.dataset.playerId = playerId;
  openModal(playerEditModal);
}

function handlePlayerEditSubmit(event) {
  event.preventDefault();
  if (!playerEditNameInput) {
    return;
  }
  if (!editingPlayerId) {
    showPlayerEditError('Selecciona un jugador antes de guardar cambios.');
    return;
  }
  const trimmedName = playerEditNameInput.value.trim();
  const trimmedNickname = playerEditNicknameInput?.value.trim() ?? '';
  if (trimmedName.length === 0) {
    showPlayerEditError('El nombre no puede quedar vacío.');
    playerEditNameInput.focus();
    return;
  }
  const playerIndex = clubState.squad.findIndex((player) => player.id === editingPlayerId);
  if (playerIndex === -1) {
    showPlayerEditError('El jugador ya no pertenece a la plantilla.');
    return;
  }
  const targetPlayer = clubState.squad[playerIndex];
  const originalName = targetPlayer.originalName ?? targetPlayer.name;
  const updatedPlayer = {
    ...targetPlayer,
    originalName,
    name: trimmedName,
  };
  if (trimmedNickname) {
    updatedPlayer.nickname = trimmedNickname;
  } else {
    delete updatedPlayer.nickname;
  }
  const updatedSquad = [...clubState.squad];
  updatedSquad.splice(playerIndex, 1, updatedPlayer);
  clubState = {
    ...clubState,
    squad: updatedSquad,
  };
  renderLineupBoard();
  persistState('silent');
  clearPlayerEditError();
  closeModal(playerEditModal);
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
    const nicknameLabel = typeof player.nickname === 'string' ? player.nickname.trim() : '';
    const identityElements = [name];
    if (nicknameLabel) {
      const nicknameEl = document.createElement('span');
      nicknameEl.className = 'lineup-table__player-nickname';
      nicknameEl.textContent = `«${nicknameLabel}»`;
      identityElements.push(nicknameEl);
    }
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
    playerCell.append(...identityElements, meta);

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
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'lineup-edit-button';
    editButton.textContent = 'Editar';
    editButton.setAttribute('aria-label', `Editar identidad de ${player.name}`);
    editButton.addEventListener('click', () => {
      openPlayerIdentityEditor(player.id);
    });
    const sellButton = document.createElement('button');
    sellButton.type = 'button';
    sellButton.className = 'lineup-sell-button';
    sellButton.textContent = 'Vender';
    sellButton.addEventListener('click', () => {
      sellPlayer(player.id);
    });
    actionsCell.append(editButton, sellButton);

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
  switchReportTab(activeReportTab);
  if (reportModal) {
    openModal(reportModal);
  }
}

function updateClubSummary() {
  const identity = extractClubIdentity(clubState);
  clubIdentity = identity;
  clubState = { ...clubState, ...identity };
  if (clubNameEl) {
    clubNameEl.textContent = identity.name;
  }
  if (clubCityEl) {
    clubCityEl.textContent = identity.city;
  }
  if (clubStadiumEl) {
    clubStadiumEl.textContent = identity.stadiumName;
  }
  clubBudgetEl.textContent = numberFormatter.format(clubState.budget);
  clubReputationEl.textContent = `${clubState.reputation}`;
  clubMoraleEl.textContent = formatMorale(averageMorale(clubState));
  updateCupSummary();
  applyClubThemeColors();
  updateClubLogoDisplay();
  refreshControlPanel();
}

function getUpcomingOpponent() {
  const event = determineNextEvent();
  if (event.type === 'cup-match' && event.fixture) {
    return {
      club: event.fixture.opponent,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      competition: 'cup',
      roundName: event.round.name,
      home: event.fixture.home,
    };
  }
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
  if (standing.competition === 'cup') {
    const venue = standing.home ? 'Se juega en casa.' : 'Se juega fuera.';
    return `Eliminatoria directa. ${venue}`;
  }
  const { played, wins, draws, losses, goalsFor, goalsAgainst, points } = standing;
  return `PJ ${played} · G ${wins} · E ${draws} · P ${losses} · GF ${goalsFor} · GC ${goalsAgainst} · Pts ${points}`;
}

function updateMatchSummary() {
  const event = determineNextEvent();
  const totalMatchdays = getTotalMatchdays();
  if (matchdayBadgeEl) {
    if (event.type === 'cup-draw') {
      const roundName = getCupRoundName(event.round.id);
      matchdayBadgeEl.textContent = `Copa · Sorteo ${roundName}`;
    } else if (event.type === 'cup-match') {
      const roundName = getCupRoundName(event.round.id);
      matchdayBadgeEl.textContent = `Copa · ${roundName}`;
    } else if (leagueState && leagueState.matchDay >= totalMatchdays) {
      matchdayBadgeEl.textContent = `Temporada ${clubState.season} completada`;
    } else {
      const nextMatchday = leagueState ? leagueState.matchDay + 1 : 1;
      matchdayBadgeEl.textContent = `Jornada ${nextMatchday} de ${totalMatchdays}`;
    }
  }

  const opponent = getUpcomingOpponent();
  if (event.type === 'cup-draw') {
    if (matchOpponentNameEl) {
      matchOpponentNameEl.textContent = 'Pendiente de sorteo';
    }
    if (matchOpponentRecordEl) {
      matchOpponentRecordEl.textContent = 'El bombo aún no ha hablado.';
    }
    if (matchOpponentStrengthEl) {
      matchOpponentStrengthEl.textContent = '—';
    }
    if (matchLocationEl) {
      matchLocationEl.textContent = 'Sede de la federación';
    }
    if (playMatchButton) {
      playMatchButton.disabled = false;
      playMatchButton.textContent = 'Celebrar sorteo';
    }
    if (homeCheckbox) {
      homeCheckbox.checked = false;
      homeCheckbox.disabled = true;
    }
  } else {
    if (matchOpponentNameEl) {
      matchOpponentNameEl.textContent = opponent?.club ?? 'Rival misterioso';
    }
    if (matchOpponentRecordEl) {
      matchOpponentRecordEl.textContent = formatOpponentRecord(opponent);
    }
    const difficultyMultiplier = getDifficultyMultiplier();
    if (configState.difficultyMultiplier !== difficultyMultiplier) {
      configState = { ...configState, difficultyMultiplier };
    }
    if (matchOpponentStrengthEl) {
      const baseStrength = opponentStrength instanceof HTMLInputElement
        ? Number.parseInt(opponentStrength.value, 10)
        : configState.opponentStrength;
      const numericBase = Number.isFinite(baseStrength) ? baseStrength : configState.opponentStrength;
      const adjustedStrength = Math.min(100, Math.round(numericBase * difficultyMultiplier));
      matchOpponentStrengthEl.textContent = `${adjustedStrength}/100 · ${getDifficultyLabel()}`;
    }
    if (event.type === 'cup-match' && event.fixture) {
      if (homeCheckbox) {
        homeCheckbox.checked = event.fixture.home;
        homeCheckbox.disabled = true;
      }
      configState = { ...configState, home: event.fixture.home };
      if (matchLocationEl) {
        matchLocationEl.textContent = event.fixture.home ? getHomeVenueLabel() : 'Fuera de casa';
      }
      if (playMatchButton) {
        playMatchButton.disabled = false;
        playMatchButton.textContent = 'Jugar eliminatoria';
      }
    } else {
      if (homeCheckbox) {
        homeCheckbox.disabled = false;
      }
      if (matchLocationEl) {
        matchLocationEl.textContent = homeCheckbox.checked ? getHomeVenueLabel() : 'Fuera de casa';
      }
      if (playMatchButton) {
        playMatchButton.disabled = false;
        playMatchButton.textContent = 'Jugar jornada';
      }
    }
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
  const rawValue = Number.parseInt(opponentStrength.value, 10);
  const numericValue = Number.isFinite(rawValue) ? rawValue : configState.opponentStrength;
  const multiplier = getDifficultyMultiplier();
  const adjustedValue = Math.min(100, Math.round(numericValue * multiplier));
  opponentOutput.value = String(numericValue);
  opponentOutput.textContent = `${numericValue} base · ${adjustedValue} real (${describeOpponentStrength(adjustedValue)})`;
  opponentStrength.title = `Fortaleza rival con dificultad ${getDifficultyLabel()}: ${adjustedValue}/100`;
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
    } else if (leagueState.matchDay >= getTotalMatchdays()) {
      leagueMatchdayEl.textContent = `Jornada final (${getTotalMatchdays()})`;
    } else {
      leagueMatchdayEl.textContent = `Jornada ${leagueState.matchDay}`;
    }
  }
  renderLeagueLeaderboards();
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
  currentReportData = null;
  renderMatchVisualization(null);
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
  if (matchTimeline) {
    matchTimeline.innerHTML = '';
  }
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
  hasLatestReport = matchHistory.length > 0;
  refreshControlPanel();
}

if (playerEditForm) {
  playerEditForm.addEventListener('submit', handlePlayerEditSubmit);
}

if (playerEditRandomButton) {
  playerEditRandomButton.addEventListener('click', () => {
    const identity = generateRandomPlayerIdentity();
    if (playerEditNameInput) {
      playerEditNameInput.value = identity.name;
      playerEditNameInput.focus();
      playerEditNameInput.select();
    }
    if (playerEditNicknameInput) {
      playerEditNicknameInput.value = identity.nickname;
    }
    clearPlayerEditError();
  });
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

  if (typeof decisionOutcome.heatChange === 'number') {
    stats.push(`Sospecha: ${decisionOutcome.heatChange >= 0 ? '+' : ''}${decisionOutcome.heatChange}`);
  }

  if (decisionOutcome.sanctions) {
    stats.push(`Sanciones: ${decisionOutcome.sanctions}`);
  }

  if (Array.isArray(decisionOutcome.ongoingConsequences) && decisionOutcome.ongoingConsequences.length > 0) {
    stats.push('Consecuencias latentes:');
    decisionOutcome.ongoingConsequences.forEach((consequence) => {
      stats.push(`↳ ${consequence}`);
    });
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
  const incomeEntries = Object.entries(finances.incomeBreakdown ?? {});
  const expenseEntries = Object.entries(finances.expenseBreakdown ?? {});
  const totalIncome = incomeEntries.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0);
  const totalExpenses = expenseEntries.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0);
  const totalMovement = totalIncome + totalExpenses;
  const incomeShareRaw = totalMovement > 0 ? totalIncome / totalMovement : 0;
  const expenseShareRaw = totalMovement > 0 ? totalExpenses / totalMovement : 0;
  const incomeShare = Math.max(0, Math.min(1, incomeShareRaw));
  const expenseShare = Math.max(0, Math.min(1, expenseShareRaw));

  if (financesIncomeTotalEl) {
    financesIncomeTotalEl.textContent =
      totalIncome > 0
        ? `${numberFormatter.format(totalIncome)} · ${percentageFormatter.format(incomeShare)} del movimiento`
        : 'Sin ingresos registrados';
  }

  if (financesExpenseTotalEl) {
    financesExpenseTotalEl.textContent =
      totalExpenses > 0
        ? `${numberFormatter.format(totalExpenses)} · ${percentageFormatter.format(expenseShare)} del movimiento`
        : 'Sin gastos registrados';
  }

  if (financesIncomeDonutEl) {
    const sweep = Math.max(0, Math.min(360, incomeShare * 360));
    financesIncomeDonutEl.style.setProperty('--finances-sweep', `${sweep}deg`);
    financesIncomeDonutEl.dataset.percentage = percentageFormatter.format(incomeShare || 0);
    financesIncomeDonutEl.classList.toggle('is-empty', totalMovement <= 0);
  }

  if (financesExpenseBarEl && financesExpenseBarFillEl) {
    const percent = Math.max(0, Math.min(100, expenseShare * 100));
    const progressValue = `${percent.toFixed(2)}%`;
    financesExpenseBarFillEl.style.setProperty('--finances-progress', progressValue);
    financesExpenseBarFillEl.style.width = progressValue;
    financesExpenseBarEl.dataset.percentage = percentageFormatter.format(expenseShare || 0);
    financesExpenseBarEl.classList.toggle('is-empty', totalMovement <= 0);
  }

  if (financesAttendanceEl) {
    financesAttendanceEl.textContent = finances.attendance
      ? `${finances.attendance.toLocaleString('es-ES')} espectadores`
      : 'Asistencia no disponible';
  }
  const renderBreakdownList = (listEl, entries, type, total) => {
    if (!listEl) {
      return;
    }
    listEl.innerHTML = '';
    const sortedEntries = [...entries].sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    sortedEntries.forEach(([label, rawValue]) => {
      const amount = Number(rawValue) || 0;
      const formattedValue = numberFormatter.format(amount);
      const shareRaw = total > 0 ? amount / total : 0;
      const share = Math.max(0, Math.min(1, shareRaw));
      const sharePercent = Math.max(0, Math.min(100, share * 100));
      const shareText = percentageFormatter.format(share);

      const item = document.createElement('li');
      item.className = `finances-item finances-item--${type}`;

      const row = document.createElement('div');
      row.className = 'finances-item__row';

      const labelEl = document.createElement('span');
      labelEl.className = 'finances-item__label';
      labelEl.textContent = label;

      const valueEl = document.createElement('span');
      valueEl.className = 'finances-item__value';
      valueEl.textContent = formattedValue;

      row.append(labelEl, valueEl);

      const bar = document.createElement('div');
      bar.className = 'finances-bar finances-item__bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.setAttribute('data-percentage', shareText);

      const barFill = document.createElement('span');
      barFill.className = `finances-bar__fill finances-bar__fill--${type}`;
      const progressValue = `${sharePercent.toFixed(2)}%`;
      barFill.style.setProperty('--finances-progress', progressValue);
      barFill.style.width = progressValue;
      bar.append(barFill);

      const ariaLabelPrefix = type === 'income' ? 'Ingreso por' : 'Gasto en';
      const ariaLabelSuffix = type === 'income' ? 'del total de ingresos' : 'del total de gastos';
      item.setAttribute(
        'aria-label',
        `${ariaLabelPrefix} ${label}: ${formattedValue} (${shareText} ${ariaLabelSuffix})`
      );

      item.append(row, bar);
      listEl.append(item);
    });
  };

  renderBreakdownList(financesIncomeList, incomeEntries, 'income', totalIncome);
  renderBreakdownList(financesExpenseList, expenseEntries, 'expense', totalExpenses);
}


function resolveSelectedViewMode() {
  if (viewModeToggle instanceof HTMLInputElement) {
    return viewModeToggle.checked ? '2d' : 'text';
  }
  return configState.viewMode === '2d' ? '2d' : 'text';
}

function updateMatchVisualizationFrame(index, options = {}) {
  if (!matchVisualizationSection || matchVisualizationState.frames.length === 0) {
    return;
  }
  const total = matchVisualizationState.frames.length;
  const clamped = Math.max(0, Math.min(total - 1, index));
  matchVisualizationState.index = clamped;
  const frame = matchVisualizationState.frames[clamped];

  if (matchVisualizationScreen) {
    matchVisualizationScreen.innerHTML = '';
    const pitch = renderMatchVisualizationPitch(frame);
    matchVisualizationScreen.append(pitch);
    restartAnimation(matchVisualizationScreen, MATCH_VISUALIZATION_TRANSITION_CLASS);
  }

  if (matchVisualizationMinuteEl) {
    const hasMinute = typeof frame.minute === 'number' && Number.isFinite(frame.minute);
    matchVisualizationMinuteEl.textContent = hasMinute ? `Minuto ${frame.minute}'` : 'Minuto —';
    restartAnimation(matchVisualizationMinuteEl, MATCH_VISUALIZATION_MINUTE_CLASS);
  }

  if (matchVisualizationLabelEl) {
    matchVisualizationLabelEl.textContent = frame.label ?? '';
  }

  if (matchVisualizationSlider) {
    matchVisualizationSlider.value = String(clamped);
    matchVisualizationSlider.setAttribute('aria-valuemin', '0');
    matchVisualizationSlider.setAttribute('aria-valuemax', String(total - 1));
    matchVisualizationSlider.setAttribute('aria-valuenow', String(clamped));
    const hasMinute = typeof frame.minute === 'number' && Number.isFinite(frame.minute);
    const valuetext = hasMinute
      ? `Fotograma ${clamped + 1} · minuto ${frame.minute}`
      : `Fotograma ${clamped + 1}`;
    matchVisualizationSlider.setAttribute('aria-valuetext', valuetext);
    matchVisualizationSlider.disabled = total <= 1;
  }

  if (matchVisualizationFrameEl) {
    matchVisualizationFrameEl.textContent = `Fotograma ${clamped + 1} / ${total}`;
  }

  if (matchVisualizationPrevButton) {
    matchVisualizationPrevButton.disabled = clamped <= 0;
  }
  if (matchVisualizationNextButton) {
    matchVisualizationNextButton.disabled = clamped >= total - 1;
  }

  if (options.userInitiated) {
    resetMatchVisualizationAutoplay();
  }
}

function renderMatchVisualization(report) {
  if (!matchVisualizationSection) {
    return;
  }

  const selectedViewMode = resolveSelectedViewMode();
  const clearVisualization = (message) => {
    matchVisualizationState.frames = [];
    matchVisualizationState.index = 0;
    matchVisualizationState.dimensions = { width: 21, height: 11 };
    stopMatchVisualizationAutoplay();
    matchVisualizationSection.dataset.state = 'empty';
    if (matchVisualizationScreen) {
      matchVisualizationScreen.textContent = '';
    }
    if (matchVisualizationMinuteEl) {
      matchVisualizationMinuteEl.textContent = '—';
    }
    if (matchVisualizationLabelEl) {
      matchVisualizationLabelEl.textContent = '';
    }
    if (matchVisualizationFrameEl) {
      matchVisualizationFrameEl.textContent = '—';
    }
    if (matchVisualizationStatusEl) {
      matchVisualizationStatusEl.textContent = message;
      matchVisualizationStatusEl.hidden = false;
    }
    if (matchVisualizationLegendList) {
      matchVisualizationLegendList.innerHTML = '';
    }
    if (matchVisualizationSlider) {
      matchVisualizationSlider.value = '0';
      matchVisualizationSlider.min = '0';
      matchVisualizationSlider.max = '0';
      matchVisualizationSlider.disabled = true;
      matchVisualizationSlider.setAttribute('aria-valuemin', '0');
      matchVisualizationSlider.setAttribute('aria-valuemax', '0');
      matchVisualizationSlider.setAttribute('aria-valuenow', '0');
      matchVisualizationSlider.setAttribute('aria-valuetext', 'Sin fotogramas disponibles');
    }
    if (matchVisualizationPrevButton) {
      matchVisualizationPrevButton.disabled = true;
    }
    if (matchVisualizationNextButton) {
      matchVisualizationNextButton.disabled = true;
    }
  };

  if (selectedViewMode !== '2d') {
    clearVisualization('Activa la casilla de simulación 2D para proyectar la pizarra retro.');
    return;
  }

  const visualization = report?.match?.visualization2d;
  const frames = Array.isArray(visualization?.frames) ? visualization.frames : [];
  const legend = Array.isArray(visualization?.legend) ? visualization.legend : [];
  const dimensions = visualization?.dimensions ?? {};
  const resolvedWidth = Number.isFinite(dimensions.width) ? dimensions.width : 21;
  const resolvedHeight = Number.isFinite(dimensions.height) ? dimensions.height : 11;

  stopMatchVisualizationAutoplay();
  matchVisualizationState.frames = frames;
  matchVisualizationState.index = 0;
  matchVisualizationState.dimensions = { width: resolvedWidth, height: resolvedHeight };

  if (matchVisualizationLegendList) {
    matchVisualizationLegendList.innerHTML = '';
  }

  if (!frames.length) {
    clearVisualization('Juega una jornada para generar los fotogramas retro.');
    return;
  }

  matchVisualizationSection.dataset.state = 'ready';
  if (matchVisualizationStatusEl) {
    matchVisualizationStatusEl.textContent = '';
    matchVisualizationStatusEl.hidden = true;
  }

  if (matchVisualizationLegendList) {
    const fragment = document.createDocumentFragment();
    legend.forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      fragment.append(item);
    });
    matchVisualizationLegendList.append(fragment);
  }

  if (matchVisualizationSlider) {
    matchVisualizationSlider.disabled = frames.length <= 1;
    matchVisualizationSlider.min = '0';
    matchVisualizationSlider.max = String(frames.length - 1);
    matchVisualizationSlider.value = '0';
    matchVisualizationSlider.setAttribute('aria-valuemin', '0');
    matchVisualizationSlider.setAttribute('aria-valuemax', String(frames.length - 1));
    const first = frames[0];
    const hasMinute = typeof first.minute === 'number' && Number.isFinite(first.minute);
    matchVisualizationSlider.setAttribute(
      'aria-valuetext',
      hasMinute ? `Fotograma 1 · minuto ${first.minute}` : 'Fotograma 1'
    );
    matchVisualizationSlider.setAttribute('aria-valuenow', '0');
  }

  if (matchVisualizationFrameEl) {
    matchVisualizationFrameEl.textContent = `Fotograma 1 / ${frames.length}`;
  }

  updateMatchVisualizationFrame(0);
  startMatchVisualizationAutoplay();
}

function stepMatchVisualization(delta) {
  if (matchVisualizationState.frames.length === 0) {
    return;
  }
  const nextIndex = matchVisualizationState.index + delta;
  updateMatchVisualizationFrame(nextIndex, { userInitiated: true });
}


function switchReportTab(targetTab = 'current') {
  activeReportTab = targetTab;
  reportTabButtons.forEach((button) => {
    const isActive = button.dataset.reportTab === targetTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  reportPanels.forEach((panel) => {
    const isActive = panel.dataset.reportPanel === targetTab;
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });
}

function renderReportHistoryFilters() {
  if (!(reportHistorySeasonSelect instanceof HTMLSelectElement)) {
    return;
  }
  const seasons = Array.from(new Set(matchHistory.map((entry) => entry.season))).sort((a, b) => b - a);
  const previousFilter = reportHistoryFilterSeason;
  reportHistorySeasonSelect.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'Todas las temporadas';
  reportHistorySeasonSelect.append(allOption);
  seasons.forEach((season) => {
    const option = document.createElement('option');
    option.value = String(season);
    option.textContent = `Temporada ${season}`;
    reportHistorySeasonSelect.append(option);
  });
  if (previousFilter !== 'all') {
    const previousNumber = Number.parseInt(previousFilter, 10);
    if (!Number.isFinite(previousNumber) || !seasons.includes(previousNumber)) {
      reportHistoryFilterSeason = 'all';
    }
  }
  if (reportHistoryFilterSeason !== 'all') {
    const filterNumber = Number.parseInt(reportHistoryFilterSeason, 10);
    if (!Number.isFinite(filterNumber) || !seasons.includes(filterNumber)) {
      reportHistoryFilterSeason = 'all';
    }
  }
  reportHistorySeasonSelect.value = reportHistoryFilterSeason;
}

function renderReportHistoryList() {
  if (!reportHistoryList) {
    return;
  }
  const seasonFilter = reportHistoryFilterSeason;
  const filtered = matchHistory.filter((entry) => {
    if (seasonFilter === 'all') {
      return true;
    }
    return String(entry.season) === seasonFilter;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (b.season !== a.season) {
      return b.season - a.season;
    }
    if (b.matchday !== a.matchday) {
      return b.matchday - a.matchday;
    }
    return b.timestamp - a.timestamp;
  });
  reportHistoryList.innerHTML = '';
  if (sorted.length === 0) {
    if (reportHistoryEmptyEl) {
      reportHistoryEmptyEl.hidden = false;
      reportHistoryEmptyEl.textContent =
        matchHistory.length === 0
          ? 'Todavía no has disputado ninguna jornada.'
          : 'No hay jornadas guardadas para la temporada seleccionada.';
    }
    return;
  }
  if (reportHistoryEmptyEl) {
    reportHistoryEmptyEl.hidden = true;
  }
  sorted.forEach((entry) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'report-history__item';
    button.dataset.historyId = entry.id;
    if (entry.id === currentHistoryEntryId) {
      button.classList.add('is-active');
      button.setAttribute('aria-current', 'true');
    }

    const competition = entry?.competition === 'cup' ? 'cup' : entry?.metadata?.competition === 'cup' ? 'cup' : 'league';
    button.dataset.competition = competition;

    const opponentLabel = entry.opponent || 'Rival misterioso';
    const clubName = entry.report?.updatedClub?.name ?? clubState.name;
    const goalsFor = entry.report?.match?.goalsFor ?? 0;
    const goalsAgainst = entry.report?.match?.goalsAgainst ?? 0;

    const title = document.createElement('span');
    title.className = 'report-history__title';
    const cupRoundLabel =
      competition === 'cup'
        ? entry.cupRoundName ?? entry.metadata?.cupRoundName ?? 'Eliminatoria'
        : null;
    const titlePrefix = competition === 'cup' ? `Copa · ${cupRoundLabel}` : `Jornada ${entry.matchday}`;
    title.textContent = `${titlePrefix} · vs ${opponentLabel}`;

    const score = document.createElement('span');
    score.className = 'report-history__score';
    score.textContent = `${clubName} ${goalsFor} - ${goalsAgainst} ${opponentLabel}`;

    const meta = document.createElement('span');
    meta.className = 'report-history__meta';
    const competitionLabel = competition === 'cup' ? 'Copa' : 'Liga';
    meta.textContent = `Temporada ${entry.season} · ${competitionLabel} · Guardado: ${historyDateFormatter.format(
      new Date(entry.timestamp)
    )}`;

    button.append(title, score, meta);
    button.addEventListener('click', () => {
      showHistoryEntry(entry.id);
    });

    item.append(button);
    reportHistoryList.append(item);
  });
}

function renderReportHistory() {
  renderReportHistoryFilters();
  renderReportHistoryList();
  updateResultsButtonState();
}

function addReportToHistory(
  report,
  decisionOutcome,
  opponentName,
  metadata,
  season,
  matchday,
  extra = {}
) {
  const cleanOpponent = typeof opponentName === 'string' && opponentName.trim().length > 0
    ? opponentName.trim()
    : 'Rival misterioso';
  const fallbackSeason = typeof clubState?.season === 'number' ? Math.max(1, Math.trunc(clubState.season)) : 1;
  const fallbackMatchday =
    typeof leagueState?.matchDay === 'number' && Number.isFinite(leagueState.matchDay)
      ? Math.max(1, Math.trunc(leagueState.matchDay))
      : 1;
  const seasonNumber = typeof season === 'number' && Number.isFinite(season)
    ? Math.max(1, Math.trunc(season))
    : fallbackSeason;
  const matchdayNumber = typeof matchday === 'number' && Number.isFinite(matchday)
    ? Math.max(1, Math.trunc(matchday))
    : fallbackMatchday;
  const competition = extra && extra.competition === 'cup' ? 'cup' : 'league';
  const cupRoundId =
    competition === 'cup' && typeof extra?.cupRoundId === 'string' && extra.cupRoundId.length > 0
      ? extra.cupRoundId
      : undefined;
  const cupRoundName =
    competition === 'cup' && typeof extra?.cupRoundName === 'string' && extra.cupRoundName.length > 0
      ? extra.cupRoundName
      : undefined;
  const timestamp = Date.now();
  const entry = {
    id: `history-${seasonNumber}-${matchdayNumber}-${timestamp}`,
    season: seasonNumber,
    matchday: matchdayNumber,
    opponent: cleanOpponent,
    report: cloneData(report),
    decisionOutcome: decisionOutcome ? cloneData(decisionOutcome) : undefined,
    metadata: metadata ? cloneData(metadata) : {},
    timestamp,
    competition,
    cupRoundId: cupRoundId ?? null,
    cupRoundName: cupRoundName ?? null,
  };
  matchHistory = [
    entry,
    ...matchHistory.filter((item) => !(item.season === seasonNumber && item.matchday === matchdayNumber)),
  ];
  currentHistoryEntryId = entry.id;
  renderReportHistory();
  return entry;
}

function showHistoryEntry(entryId) {
  const entry = matchHistory.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }
  currentHistoryEntryId = entry.id;
  switchReportTab('current');
  renderMatchReport(entry.report, entry.decisionOutcome, entry.opponent, entry.metadata ?? {});
  renderReportHistory();
  switchToReportView();
}

function renderMatchReport(report, decisionOutcome, opponentName = 'Rival misterioso', metadata = {}) {
  currentReportData = report ?? null;
  renderMatchVisualization(report ?? null);
  const clubName = clubState.name;
  const scoreline = `${clubName} ${report.match.goalsFor} - ${report.match.goalsAgainst} ${opponentName}`;
  scorelineEl.textContent = scoreline;
  restartAnimation(scorelineEl, 'scoreline--flash');

  const isPositiveFinances = report.financesDelta >= 0;
  const financesPrefix = isPositiveFinances ? '+' : '−';
  const absFinances = Math.abs(report.financesDelta);
  const formattedFinances = numberFormatter.format(absFinances);
  if (financesDeltaEl) {
    financesDeltaEl.classList.remove('finances--positive', 'finances--negative');
    financesDeltaEl.classList.add(isPositiveFinances ? 'finances--positive' : 'finances--negative');
    financesDeltaEl.textContent = `Balance de la jornada: ${financesPrefix}${formattedFinances}`;
    financesDeltaEl.setAttribute(
      'aria-label',
      `Balance de la jornada ${isPositiveFinances ? 'a favor' : 'en contra'} de ${formattedFinances}`
    );
  }
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

  const goalMinutes = new Set(
    report.match.events.filter((event) => GOAL_EVENT_TYPES.has(event.type)).map((event) => event.minute)
  );

  narrativeList.innerHTML = '';
  report.match.narrative.forEach((line) => {
    const item = document.createElement('li');
    item.className = 'narrative-item';
    item.textContent = line;
    const minuteMatch = line.match(/\((\d+)'\)/u);
    if (minuteMatch) {
      const minuteValue = Number.parseInt(minuteMatch[1], 10);
      if (goalMinutes.has(minuteValue)) {
        item.classList.add('narrative-item--goal');
      }
    }
    narrativeList.append(item);
    requestAnimationFrame(() => {
      item.classList.add('narrative-item--visible');
    });
  });

  if (matchTimeline) {
    matchTimeline.innerHTML = '';
    report.match.events.forEach((event) => {
      const metadata = TIMELINE_EVENT_META[event.type] ?? TIMELINE_EVENT_META.default;
      const item = document.createElement('li');
      item.className = 'timeline-event';
      if (metadata.className) {
        item.classList.add(metadata.className);
      }

      const minute = document.createElement('span');
      minute.className = 'timeline-event__minute';
      minute.textContent = `${event.minute}'`;

      const iconWrapper = document.createElement('span');
      iconWrapper.className = 'timeline-event__icon';
      if (metadata.label) {
        iconWrapper.setAttribute('role', 'img');
        iconWrapper.setAttribute('aria-label', metadata.label);
      } else {
        iconWrapper.setAttribute('aria-hidden', 'true');
      }

      if (metadata.iconId) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'timeline-event__svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('focusable', 'false');
        const use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', `icons.svg#${metadata.iconId}`);
        use.setAttributeNS(XLINK_NS, 'href', `icons.svg#${metadata.iconId}`);
        svg.append(use);
        iconWrapper.append(svg);
      }

      const description = document.createElement('span');
      description.className = 'timeline-event__description';
      description.textContent = event.description;

      item.append(minute, iconWrapper, description);
      matchTimeline.append(item);
      requestAnimationFrame(() => {
        item.classList.add('timeline-event--visible');
        if (metadata.highlight) {
          item.classList.add('timeline-event--highlight');
        }
      });
    });
  }

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

function describeRecordLine(label, record, options = {}) {
  if (!record) {
    return null;
  }
  const settings = { includeTotalGoals: false, ...options };
  const scoreline = `${record.goalsFor}-${record.goalsAgainst}`;
  const detailParts = [`Temp. ${record.season}`, `J. ${record.matchday}`];
  if (settings.includeTotalGoals) {
    detailParts.push(`${record.totalGoals} goles en total`);
  }
  const context = detailParts.join(' · ');
  return `${label}: ${scoreline} vs ${record.opponent} (${context})`;
}

function renderSeasonSummary() {
  if (!seasonSummarySection) {
    return;
  }
  if (!leagueState || leagueState.matchDay < getTotalMatchdays()) {
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

  const stats = normaliseSeasonStats(clubState.seasonStats);
  clubState.seasonStats = stats;
  if (seasonAveragePossessionEl) {
    const possessionAvg = stats.matches > 0 ? stats.possessionFor / stats.matches : 0;
    seasonAveragePossessionEl.textContent = `${possessionAvg.toFixed(1)} %`;
  }
  if (seasonStreakEl) {
    seasonStreakEl.textContent = `Mejor racha sin perder: ${stats.bestUnbeatenRun} partidos`;
  }

  const history = stats.history;
  if (seasonTitlesEl) {
    if ((history.titles ?? 0) > 0) {
      const titleCount = history.titles;
      seasonTitlesEl.textContent = `${titleCount} título${titleCount === 1 ? '' : 's'} de liga`;
    } else {
      seasonTitlesEl.textContent = 'Aún sin trofeos ligueros';
    }
  }

  if (seasonRecordsList) {
    seasonRecordsList.innerHTML = '';
    const records = history.records ?? {};
    const entries = [
      describeRecordLine('Mayor goleada', records.biggestWin),
      describeRecordLine('Derrota más dolorosa', records.heaviestDefeat),
      describeRecordLine('Partido con más goles', records.goalFestival, {
        includeTotalGoals: true,
      }),
    ].filter((text) => typeof text === 'string' && text.length > 0);
    if (entries.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Todavía no hay récords registrados.';
      seasonRecordsList.append(item);
    } else {
      entries.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        seasonRecordsList.append(item);
      });
    }
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
  clubState = { ...clubState, cup: cupState };
  const payload = saveGame(
    {
      club: clubState,
      league: leagueState,
      config: configState,
      transferMarket: transferMarketState,
      history: matchHistory,
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
  const newLeague = createExampleLeague(clubState.name, {
    city: clubState.city,
    leagueSize: leagueSettings.leagueSize,
    difficulty: leagueSettings.difficulty,
  });
  const newCup = createExampleCup(clubState.name, { participants: newLeague.rivals });
  opponentRotation = computeOpponentRotation(newLeague, clubState.name);
  const previousStats = normaliseSeasonStats(clubState.seasonStats);
  const preservedHistory = cloneData(previousStats.history ?? createSeasonStats().history);
  const nextSeasonStats = createSeasonStats();
  nextSeasonStats.history = preservedHistory;

  clubState = {
    ...clubState,
    season: nextSeason,
    league: newLeague,
    cup: newCup,
    squad: refreshedSquad,
    seasonStats: nextSeasonStats,
    weeklyWageBill: calculateWeeklyWageBill(refreshedSquad),
  };
  clubState.staff = normaliseStaffState(clubState.staff);
  leagueState = newLeague;
  cupState = newCup;
  updateLeagueSettingsFromState(leagueState, { syncSelectors: true });
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
  const identity = extractClubIdentity(saved.club);
  clubIdentity = identity;
  clubState = {
    ...saved.club,
    ...identity,
    logoUrl: resolveClubLogoUrl(saved.club),
    weeklyWageBill: calculateWeeklyWageBill(saved.club.squad),
  };
  clubState = { ...clubState, staff: normaliseStaffState(clubState.staff) };
  const loadedLeague = saved.league;
  const initialRivals = Array.isArray(loadedLeague?.rivals) && loadedLeague.rivals.length > 0
    ? loadedLeague.rivals
    : Array.isArray(loadedLeague?.table)
      ? loadedLeague.table
          .filter((entry) => entry.club !== clubState.name)
          .map((entry) => entry.club)
      : [];
  const cleanedRivals = normaliseLeagueRivals(initialRivals, {
    count: Math.max(1, deriveLeagueSettings(loadedLeague).leagueSize - 1),
    exclude: [clubState.name],
  });
  const loadedSettings = deriveLeagueSettings(loadedLeague);
  leagueState = {
    ...loadedLeague,
    rivals: cleanedRivals,
    size: loadedSettings.leagueSize,
    totalMatchdays: loadedSettings.totalMatchdays,
    difficulty: loadedSettings.difficulty,
    difficultyMultiplier: loadedSettings.difficultyMultiplier,
  };
  updateLeagueSettingsFromState(leagueState, { syncSelectors: true });
  clubState = { ...clubState, league: leagueState };
  clubState.seasonStats = normaliseSeasonStats(clubState.seasonStats);
  cupState = clubState.cup;
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
  const savedViewMode = saved.config?.viewMode === '2d' ? '2d' : 'text';
  configState = {
    ...baseConfig,
    ...saved.config,
    instructions: { ...createDefaultInstructions(), ...(saved.config.instructions ?? {}) },
    seed: seedValue,
    difficultyMultiplier: leagueSettings.difficultyMultiplier,
    viewMode: savedViewMode,
  };
  opponentRotation = computeOpponentRotation(leagueState, clubState.name);
  ensureLineupCompleteness();
  matchHistory = Array.isArray(saved.history)
    ? saved.history.map((entry) => {
        const metadata = entry.metadata ? cloneData(entry.metadata) : {};
        const competition = entry?.competition === 'cup' || metadata?.competition === 'cup' ? 'cup' : 'league';
        const storedRoundId =
          competition === 'cup'
            ? entry?.cupRoundId ?? (typeof metadata?.cupRoundId === 'string' ? metadata.cupRoundId : null)
            : null;
        const storedRoundName =
          competition === 'cup'
            ? entry?.cupRoundName ?? (typeof metadata?.cupRoundName === 'string' ? metadata.cupRoundName : null)
            : null;
        return {
          ...entry,
          competition,
          cupRoundId: storedRoundId,
          cupRoundName: storedRoundName,
          report: cloneData(entry.report),
          decisionOutcome: entry.decisionOutcome ? cloneData(entry.decisionOutcome) : undefined,
          metadata,
        };
      })
    : [];
  currentHistoryEntryId = matchHistory[0]?.id ?? null;
  reportHistoryFilterSeason = 'all';
  activeReportTab = 'current';
  hasLatestReport = matchHistory.length > 0;
  renderReportHistory();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const nextEvent = determineNextEvent();
  if (nextEvent.type === 'cup-draw') {
    hideLineupError();
    handleCupDraw();
    return;
  }

  hideLineupError();
  if (configState.startingLineup.length !== STARTERS_LIMIT) {
    showLineupError(`Necesitas ${STARTERS_LIMIT} titulares para saltar al campo.`);
    return;
  }
  if (configState.substitutes.length > SUBS_LIMIT) {
    showLineupError('Reduce el banquillo a 5 suplentes.');
    return;
  }

  const isCupMatch = nextEvent.type === 'cup-match';

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
  } else {
    const passive = tickCanallaState(workingClub);
    workingClub = passive.updatedClub;
    const { budget = 0, reputation = 0, morale = 0, heat = 0, narratives = [] } = passive.applied ?? {};
    if (budget !== 0 || reputation !== 0 || morale !== 0 || heat !== 0 || narratives.length > 0) {
      decisionOutcome = {
        success: true,
        reputationChange: reputation,
        financesChange: budget,
        moraleChange: morale,
        heatChange: heat,
        riskLevel: Math.round(workingClub.canallaStatus?.heat ?? 0),
        sanctions: undefined,
        narrative: 'Los ecos de canalladas pasadas siguen presentes en el vestuario.',
        ongoingConsequences: narratives.length > 0 ? narratives : undefined,
        appliedToClub: true,
      };
    }
  }

  const seedValue = seedInput ? seedInput.value.trim() : '';
  const selectedViewMode =
    viewModeToggle instanceof HTMLInputElement && viewModeToggle.checked ? '2d' : 'text';
  configState = {
    ...configState,
    home: isCupMatch && nextEvent.type === 'cup-match' && nextEvent.fixture
      ? nextEvent.fixture.home
      : homeCheckbox.checked,
    opponentStrength: Number.parseInt(opponentStrength.value, 10),
    tactic: tacticSelect.value,
    formation: formationSelect.value,
    seed: seedValue,
    difficultyMultiplier: getDifficultyMultiplier(),
    viewMode: selectedViewMode,
  };

  const simulationOptions = { decision, decisionOutcome };
  if (seedValue) {
    simulationOptions.seed = seedValue;
  }

  const report = playMatchDay(workingClub, configState, simulationOptions);
  report.match.competition = isCupMatch ? 'cup' : 'league';
  report.match.cupRoundId = isCupMatch && nextEvent.type === 'cup-match' ? nextEvent.round.id : report.match.cupRoundId;
  report.competition = report.match.competition;

  let updatedLeague = leagueState ?? workingClub.league;
  if (!isCupMatch) {
    updatedLeague = updateLeagueTableAfterMatch(updatedLeague, workingClub.name, report.match);
    updateSeasonHistoricalMetrics(report, opponentName, updatedLeague);
    leagueState = updatedLeague;
    updateLeagueSettingsFromState(updatedLeague);
  }

  const refreshedWageBill = calculateWeeklyWageBill(report.updatedClub.squad);

  if (isCupMatch && nextEvent.type === 'cup-match') {
    const progress = applyCupMatchResult(cupState, clubState.name, report.match);
    cupState = progress.cup;
    const prizeInfo = resolveCupPrize(progress.historyEntry.roundId, progress.historyEntry.outcome);
    const reputationInfo = resolveCupReputation(progress.historyEntry.roundId, progress.historyEntry.outcome);
    const currentPrize = report.finances?.incomeBreakdown?.premios ?? 0;
    const deltaPrize = prizeInfo.prize - currentPrize;
    if (report.finances) {
      report.finances.incomeBreakdown = { ...(report.finances.incomeBreakdown ?? {}), premios: prizeInfo.prize };
      report.finances.income += deltaPrize;
      report.finances.net += deltaPrize;
      report.finances.notes = [...(report.finances.notes ?? []), ...prizeInfo.notes];
    }
    report.financesDelta += deltaPrize;
    report.updatedClub.budget += deltaPrize;
    report.updatedClub.reputation = Math.max(
      -100,
      Math.min(100, report.updatedClub.reputation + reputationInfo.reputation)
    );
    report.match.narrative = [...report.match.narrative, ...progress.historyEntry.narrative, reputationInfo.narrative];
    report.cupProgress = progress;
  }

  clubState = {
    ...report.updatedClub,
    logoUrl: resolveClubLogoUrl(report.updatedClub),
    weeklyWageBill: refreshedWageBill,
    league: updatedLeague,
    cup: cupState ?? report.updatedClub.cup,
  };
  leagueState = updatedLeague;

  renderLeagueTable();
  renderTransferMarket();
  renderLineupBoard();
  updateMatchSummary();
  renderCupModal();
  const competition = report.match?.competition === 'cup' ? 'cup' : 'league';
  const cupProgress = report.cupProgress;
  const cupRoundId =
    competition === 'cup'
      ? cupProgress?.historyEntry.roundId ?? report.match?.cupRoundId ??
        (isCupMatch && nextEvent.type === 'cup-match' ? nextEvent.round.id : undefined)
      : undefined;
  const cupRoundName =
    competition === 'cup'
      ? cupProgress?.historyEntry.roundName ??
        (isCupMatch && nextEvent.type === 'cup-match' ? nextEvent.round.name : undefined)
      : undefined;
  const historyMetadata = {
    seedInputValue: seedValue,
    competition,
  };
  if (cupRoundId) {
    historyMetadata.cupRoundId = cupRoundId;
  }
  if (cupRoundName) {
    historyMetadata.cupRoundName = cupRoundName;
  }
  const historyEntry = addReportToHistory(
    report,
    decisionOutcome,
    opponentName,
    historyMetadata,
    clubState.season,
    competition === 'cup' ? (leagueState?.matchDay ?? 0) : updatedLeague.matchDay,
    {
      competition,
      cupRoundId,
      cupRoundName,
    }
  );
  switchReportTab('current');
  renderMatchReport(historyEntry.report, historyEntry.decisionOutcome, historyEntry.opponent, historyEntry.metadata ?? {});
  updateClubSummary();
  persistState('auto');
  switchToReportView();
});

resetButton.addEventListener('click', () => {
  clearSavedGame();
  clearSaveMessage();
  clearLoadNotice();
  const identity = extractClubIdentity(clubState);
  rebuildClubState(identity);
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

if (configureClubButton && clubIdentityModal) {
  configureClubButton.addEventListener('click', () => {
    prefillClubIdentityForm();
    openModal(clubIdentityModal);
  });
}

if (configureLeagueButton && leagueConfigModal) {
  configureLeagueButton.addEventListener('click', () => {
    prepareLeagueConfigModal();
    openModal(leagueConfigModal);
  });
}

if (clubIdentityForm) {
  clubIdentityForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const identity = await collectIdentityFromForm();
    clearSavedGame();
    clearSaveMessage();
    clearLoadNotice();
    rebuildClubState(identity);
    if (clubLogoInput) {
      clubLogoInput.value = '';
    }
    if (clubIdentityModal) {
      closeModal(clubIdentityModal);
    }
    showLoadNotice('Identidad del club actualizada. Se ha preparado una nueva partida.');
    persistState('silent');
  });
}

if (decisionSelect) {
  decisionSelect.addEventListener('change', renderDecisionsModal);
}

if (leagueCatalogEl) {
  leagueCatalogEl.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      updateLeagueSelectionCountDisplay();
      hideLeagueConfigError();
    }
  });
}

if (leagueSizeSelect instanceof HTMLSelectElement) {
  leagueSizeSelect.addEventListener('change', () => {
    updateLeagueSelectionCountDisplay();
    hideLeagueConfigError();
  });
}

if (leagueDifficultySelect instanceof HTMLSelectElement) {
  leagueDifficultySelect.addEventListener('change', () => {
    hideLeagueConfigError();
  });
}

if (leagueRandomButton) {
  leagueRandomButton.addEventListener('click', () => {
    const targetCount = getTargetRivalCount();
    const randomSelection = selectRandomLeagueRivals(targetCount, {
      exclude: [clubState.name],
    });
    applyLeagueSelectionToForm(randomSelection);
    hideLeagueConfigError();
  });
}

if (leagueConfigForm && leagueConfigModal) {
  leagueConfigForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = getSelectedLeagueRivals();
    const targetCount = getTargetRivalCount();
    if (selected.length !== targetCount) {
      showLeagueConfigError(`Selecciona ${targetCount} rivales (actualmente ${selected.length}).`);
      return;
    }
    hideLeagueConfigError();
    applyLeagueConfiguration(selected);
    closeModal(leagueConfigModal);
  });
}

if (cupDrawButton) {
  cupDrawButton.addEventListener('click', () => {
    handleCupDraw();
  });
}

if (cupPlanButton) {
  cupPlanButton.addEventListener('click', () => {
    if (cupModalEl) {
      closeModal(cupModalEl);
    }
    switchToPlanningView();
  });
}

if (planNextButton) {
  planNextButton.addEventListener('click', () => {
    closeModal(reportModal);
    switchToPlanningView();
  });
}

if (viewModeToggle instanceof HTMLInputElement) {
  viewModeToggle.addEventListener('change', () => {
    const mode = viewModeToggle.checked ? '2d' : 'text';
    configState = { ...configState, viewMode: mode };
    renderMatchVisualization(currentReportData);
  });
}

if (matchVisualizationPrevButton) {
  matchVisualizationPrevButton.addEventListener('click', () => {
    stepMatchVisualization(-1);
  });
}

if (matchVisualizationNextButton) {
  matchVisualizationNextButton.addEventListener('click', () => {
    stepMatchVisualization(1);
  });
}

if (matchVisualizationSlider instanceof HTMLInputElement) {
  matchVisualizationSlider.addEventListener('input', () => {
    const nextIndex = Number.parseInt(matchVisualizationSlider.value, 10);
    if (Number.isFinite(nextIndex)) {
      updateMatchVisualizationFrame(nextIndex, { userInitiated: true });
    }
  });
}

if (matchVisualizationSection instanceof HTMLElement) {
  matchVisualizationSection.addEventListener('keydown', (event) => {
    if (event.target !== matchVisualizationSection) {
      return;
    }
    if (matchVisualizationState.frames.length === 0) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepMatchVisualization(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepMatchVisualization(1);
    }
  });
}

if (reportTabButtons.length > 0) {
  reportTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.reportTab;
      if (typeof targetTab === 'string' && targetTab.length > 0) {
        switchReportTab(targetTab);
      }
    });
  });
}

if (reportHistorySeasonSelect instanceof HTMLSelectElement) {
  reportHistorySeasonSelect.addEventListener('change', () => {
    const selected = reportHistorySeasonSelect.value || 'all';
    reportHistoryFilterSeason = selected;
    renderReportHistory();
  });
}

if (sidebarToggleButton && sidebarPanel && sidebarCollapseQuery) {
  sidebarToggleButton.addEventListener('click', () => {
    if (!sidebarCollapseQuery.matches) {
      return;
    }
    const isOpen = sidebarPanel.classList.toggle('is-open');
    sidebarToggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  const handleSidebarBreakpointChange = () => {
    syncSidebarState();
  };

  if (typeof sidebarCollapseQuery.addEventListener === 'function') {
    sidebarCollapseQuery.addEventListener('change', handleSidebarBreakpointChange);
  } else if (typeof sidebarCollapseQuery.addListener === 'function') {
    sidebarCollapseQuery.addListener(handleSidebarBreakpointChange);
  }

  syncSidebarState();
}

function init() {
  attachModalHandlers();
  populateDecisions();
  renderReportHistory();
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
  renderMatchVisualization(currentReportData);
  if (!saved && clubIdentityModal) {
    prefillClubIdentityForm();
    openModal(clubIdentityModal);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
