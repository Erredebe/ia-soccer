export const decisionSelect = document.querySelector('#decision-select');
export const tacticSelect = document.querySelector('#tactic-select');
export const formationSelect = document.querySelector('#formation-select');
export const homeCheckbox = document.querySelector('#home-checkbox');
export const opponentStrength = document.querySelector('#opponent-strength');
export const opponentOutput = document.querySelector('#opponent-output');
export const seedInput = document.querySelector('#seed-input');
export const viewModeInputs = document.querySelectorAll("input[name='viewMode']");
export const form = document.querySelector('#game-form');
export const resetButton = document.querySelector('#reset-club');
export const lineupBoard = document.querySelector('#lineup-board');
export const lineupTableBody = document.querySelector('#lineup-table-body');
export const lineupCountEl = document.querySelector('#lineup-count');
export const subsCountEl = document.querySelector('#subs-count');
export const lineupAutosortButton = document.querySelector('#lineup-autosort');
export const lineupErrorEl = document.querySelector('#lineup-error');
export const lineupModal = document.querySelector('#modal-lineup');
export const reportModal = document.querySelector('#modal-report');
export const playerEditModal = document.querySelector('#modal-player-edit');
export const playerEditForm = document.querySelector('#player-edit-form');
export const playerEditNameInput = document.querySelector('#player-edit-name');
export const playerEditNicknameInput = document.querySelector('#player-edit-nickname');
export const playerEditErrorEl = document.querySelector('#player-edit-error');
export const playerEditRandomButton = document.querySelector('#player-edit-random');
export const planNextButton = document.querySelector('#plan-next');
export const saveButton = document.querySelector('#save-game');
export const saveFeedback = document.querySelector('#save-feedback');
export const saveVersionEl = document.querySelector('#save-version');
export const loadNoticeEl = document.querySelector('#load-notice');
export const startMenuEl = document.querySelector('#start-menu');
export const startMenuMessageEl = document.querySelector('#start-menu-message');
export const startNewGameButton = document.querySelector('#start-new-game');
export const startContinueButton = document.querySelector('#start-continue-game');
export const mainPageEl = document.querySelector('main.page');
export const sidebarToggleButton = document.querySelector('#sidebar-toggle');
export const sidebarPanel = document.querySelector('#sidebar-panel');
export const sidebarCollapseQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 960px)')
    : null;

export const MODAL_TRIGGER_SELECTOR = '[data-modal-target]';
export const defaultModalTrigger = document.querySelector(
  `${MODAL_TRIGGER_SELECTOR}[aria-current="page"]`
);
export let activeModalTrigger = defaultModalTrigger ?? null;

export const matchdayBadgeEl = document.querySelector('#matchday-badge');
export const heroMatchdayBadgeEl = document.querySelector('#hero-matchday-badge');
export const matchOpponentNameEl = document.querySelector('#match-opponent-name');
export const heroMatchOpponentNameEl = document.querySelector('#hero-match-opponent-name');
export const matchOpponentStrengthEl = document.querySelector('#match-opponent-strength');
export const matchOpponentRecordEl = document.querySelector('#match-opponent-record');
export const matchLocationEl = document.querySelector('#match-location');
export const matchLineupStatusEl = document.querySelector('#match-lineup-status');
export const heroMatchStatusEl = document.querySelector('#hero-match-status');
export const matchSeedEl = document.querySelector('#match-seed');

export const clubNameEl = document.querySelector('#club-name');
export const clubCityEl = document.querySelector('#club-city');
export const clubStadiumEl = document.querySelector('#club-stadium');
export const clubBudgetEl = document.querySelector('#club-budget');
export const clubReputationEl = document.querySelector('#club-reputation');
export const clubMoraleEl = document.querySelector('#club-morale');
export const clubCupStatusEl = document.querySelector('#club-cup-status');
export const clubLogoEl = document.querySelector('#club-logo');
export const clubCardEl = document.querySelector('.club-card');
export const dashboardTabButtons = document.querySelectorAll('[data-dashboard-tab]');
export const dashboardPanels = document.querySelectorAll('[data-dashboard-panel]');
export const breadcrumbRootLink = document.querySelector('#breadcrumb-root');
export const breadcrumbTabItem = document.querySelector('#breadcrumb-tab-item');
export const breadcrumbTabLink = document.querySelector('#breadcrumb-tab-link');
export const breadcrumbModuleItem = document.querySelector('#breadcrumb-module-item');
export const breadcrumbModuleLabel = document.querySelector('#breadcrumb-module-label');

export const initialDashboardTabButton = Array.from(dashboardTabButtons).find((button) =>
  button.classList.contains('is-active')
);
export const defaultDashboardTab =
  initialDashboardTabButton?.dataset.dashboardTab ?? dashboardTabButtons[0]?.dataset.dashboardTab ?? null;
export let activeDashboardTab = defaultDashboardTab;

export const leagueMatchdayEl = document.querySelector('#league-matchday');
export const leagueTableBody = document.querySelector('#league-table-body');
export const leagueTopScorersBody = document.querySelector('#league-top-scorers-body');
export const leagueTopAssistsBody = document.querySelector('#league-top-assists-body');
export const leagueTopCleanSheetsBody = document.querySelector('#league-top-clean-sheets-body');
export const transferListEl = document.querySelector('#transfer-list');
export const transferMessageEl = document.querySelector('#transfer-message');

export const scorelineEl = document.querySelector('#scoreline');
export const financesDeltaEl = document.querySelector('#finances-delta');
export const financesAttendanceEl = document.querySelector('#finances-attendance');
export const financesIncomeList = document.querySelector('#finances-income');
export const financesExpenseList = document.querySelector('#finances-expenses');
export const staffBreakdownEl = document.querySelector('#staff-breakdown');
export const staffNoteEl = document.querySelector('#staff-note');
export const staffRosterList = document.querySelector('#staff-roster');
export const staffMarketList = document.querySelector('#staff-market');
export const narrativeList = document.querySelector('#narrative-list');
export const matchTimeline = document.querySelector('#match-timeline');
export const decisionReport = document.querySelector('#decision-report');
export const decisionNarrative = document.querySelector('#decision-narrative');
export const decisionStats = document.querySelector('#decision-stats');
export const postBudgetEl = document.querySelector('#post-budget');
export const postReputationEl = document.querySelector('#post-reputation');
export const postMoraleEl = document.querySelector('#post-morale');
export const mvpBadge = document.querySelector('#mvp-badge');
export const matchVisualizationSection = document.querySelector('#match-visualization');
export const matchVisualizationScreen = document.querySelector('#match-visualization-screen');
export const matchVisualizationPrevButton = document.querySelector('#match-visualization-prev');
export const matchVisualizationNextButton = document.querySelector('#match-visualization-next');
export const matchVisualizationSlider = document.querySelector('#match-visualization-slider');
export const matchVisualizationLegendList = document.querySelector('#match-visualization-legend');
export const matchVisualizationMinuteEl = document.querySelector('#match-visualization-minute');
export const matchVisualizationLabelEl = document.querySelector('#match-visualization-label');
export const matchVisualizationStatusEl = document.querySelector('#match-visualization-status');
export const matchVisualizationFrameEl = document.querySelector('#match-visualization-frame');
export const matchDuelsSection = document.querySelector('#match-duels');
export const matchDuelsStatusEl = document.querySelector('#match-duels-status');
export const matchDuelsListEl = document.querySelector('#match-duels-list');
export const matchDuelsScoreEl = document.querySelector('#match-duels-score');
export const reportTabButtons = document.querySelectorAll('[data-report-tab]');
export const reportPanels = document.querySelectorAll('[data-report-panel]');
export const reportHistoryList = document.querySelector('#report-history-list');
export const reportHistorySeasonSelect = document.querySelector('#report-history-season');
export const reportHistoryEmptyEl = document.querySelector('#report-history-empty');

export const seasonSummarySection = document.querySelector('#season-summary');
export const seasonChampionEl = document.querySelector('#season-champion');
export const seasonTopScorersList = document.querySelector('#season-top-scorers');
export const seasonTopAssistsList = document.querySelector('#season-top-assists');
export const seasonAveragePossessionEl = document.querySelector('#season-average-possession');
export const seasonStreakEl = document.querySelector('#season-streak');
export const seasonTitlesEl = document.querySelector('#season-titles');
export const seasonRecordsList = document.querySelector('#season-records');
export const newSeasonButton = document.querySelector('#new-season');
export const configureClubButton = document.querySelector('#configure-club');
export const configureLeagueButton = document.querySelector('#configure-league');
export const clubIdentityModal = document.querySelector('#modal-club-identity');
export const clubIdentityForm = document.querySelector('#club-identity-form');
export const clubNameInput = document.querySelector('#club-name-input');
export const clubCityInput = document.querySelector('#club-city-input');
export const clubStadiumInput = document.querySelector('#club-stadium-input');
export const clubPrimaryColorInput = document.querySelector('#club-primary-color');
export const clubSecondaryColorInput = document.querySelector('#club-secondary-color');
export const clubPrimaryColorHexInput = document.querySelector('#club-primary-color-hex');
export const clubSecondaryColorHexInput = document.querySelector('#club-secondary-color-hex');
export const clubPrimaryColorPreview = document.querySelector('#club-primary-color-preview');
export const clubSecondaryColorPreview = document.querySelector('#club-secondary-color-preview');
export const clubPrimaryColorErrorEl = document.querySelector('#club-primary-color-error');
export const clubSecondaryColorErrorEl = document.querySelector('#club-secondary-color-error');
export const clubLogoInput = document.querySelector('#club-logo-input');
export const previewClubIdentityButton = document.querySelector('#preview-club-identity');
export const clubIdentityPreview = document.querySelector('#club-identity-preview');
export const clubIdentityPreviewName = clubIdentityPreview?.querySelector('[data-preview-field="name"]');
export const clubIdentityPreviewCity = clubIdentityPreview?.querySelector('[data-preview-field="city"]');
export const clubIdentityPreviewStadium = clubIdentityPreview?.querySelector('[data-preview-field="stadium"]');
export const clubIdentityPreviewSeparator = clubIdentityPreview?.querySelector('.club-identity-preview__separator');
export const clubIdentityPreviewLogo = document.querySelector('#club-identity-preview-logo');

export const resultsControlButton = document.querySelector(
  '.control-panel__section-options [data-panel-action="results"]'
);
export const calendarList = document.querySelector('#calendar-list');
export const calendarNoteEl = document.querySelector('#calendar-note');
export const tacticPlanEl = document.querySelector('#tactic-plan');
export const tacticFormationEl = document.querySelector('#tactic-formation');
export const tacticInstructionsList = document.querySelector('#tactic-instructions');
export const opponentModalNameEl = document.querySelector('#opponent-modal-name');
export const opponentModalRecordEl = document.querySelector('#opponent-modal-record');
export const opponentModalStrengthEl = document.querySelector('#opponent-modal-strength');
export const opponentModalLocationEl = document.querySelector('#opponent-modal-location');
export const opponentModalCommentEl = document.querySelector('#opponent-modal-comment');
export const financesBudgetModalEl = document.querySelector('#finances-budget');
export const financesWagesModalEl = document.querySelector('#finances-wages');
export const financesOperatingModalEl = document.querySelector('#finances-operating');
export const financesNoteEl = document.querySelector('#finances-note');
export const financesIncomeTotalEl = document.querySelector('#finances-income-total');
export const financesExpenseTotalEl = document.querySelector('#finances-expense-total');
export const financesIncomeDonutEl = document.querySelector('#finances-income-donut');
export const financesExpenseBarEl = document.querySelector('#finances-expense-bar');
export const financesExpenseBarFillEl = document.querySelector('#finances-expense-bar-fill');
export const decisionsListEl = document.querySelector('#decisions-list');
export const decisionsHeatEl = document.querySelector('#decisions-heat');
export const stadiumCapacityEl = document.querySelector('#stadium-capacity');
export const stadiumLevelEl = document.querySelector('#stadium-level');
export const stadiumTrainingEl = document.querySelector('#stadium-training');
export const stadiumMedicalEl = document.querySelector('#stadium-medical');
export const stadiumAcademyEl = document.querySelector('#stadium-academy');
export const stadiumNoteEl = document.querySelector('#stadium-note');
export const stadiumUpgradeFeedbackEl = document.querySelector('#stadium-upgrade-feedback');
export const infrastructureUpgradeButtons = document.querySelectorAll('[data-infrastructure-upgrade]');
export const infrastructureCostEls = document.querySelectorAll('[data-infrastructure-cost]');
export const infrastructureDescriptionEls = document.querySelectorAll('[data-infrastructure-description]');

export const cupModalEl = document.querySelector('#modal-cup');
export const cupModalStatusEl = document.querySelector('#cup-modal-status');
export const cupDrawButton = document.querySelector('#cup-draw-button');
export const cupPlanButton = document.querySelector('#cup-plan-button');
export const cupNextFixtureEl = document.querySelector('#cup-next-fixture');
export const cupBracketList = document.querySelector('#cup-bracket');
export const cupHistoryList = document.querySelector('#cup-history');
export const cupDrawNarrativeList = document.querySelector('#cup-draw-narrative');

export const leagueConfigModal = document.querySelector('#modal-league-config');
export const leagueConfigForm = document.querySelector('#league-config-form');
export const leagueSizeSelect = document.querySelector('#league-size-select');
export const leagueDifficultySelect = document.querySelector('#league-difficulty-select');
export const leagueCatalogEl = document.querySelector('#league-catalog');
export const leagueSelectionCountEl = document.querySelector('#league-selection-count');
export const leagueRandomButton = document.querySelector('#league-randomize');
export const leagueConfigErrorEl = document.querySelector('#league-config-error');

export const playMatchButton = document.querySelector('#play-match');

export let commercialModal;
export let commercialOffersList;
export let commercialHistoryList;
export let commercialEmptyMessage;
export let commercialAlertButton;

export function restartAnimation(element, className) {
  if (!element) {
    return;
  }
  element.classList.remove(className);
  requestAnimationFrame(() => {
    element.classList.add(className);
  });
}

export const normaliseBreadcrumbText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
};

export const getDashboardTabLabel = (tabId) => {
  if (typeof tabId !== 'string' || tabId.length === 0) {
    return '';
  }
  const button = document.querySelector(`[data-dashboard-tab="${tabId}"]`);
  if (button instanceof HTMLElement) {
    const explicitLabel = button.getAttribute('data-breadcrumb-label');
    if (explicitLabel) {
      return normaliseBreadcrumbText(explicitLabel);
    }
    return normaliseBreadcrumbText(button.textContent ?? '');
  }
  return '';
};

export const getTriggerBreadcrumbLabel = (trigger) => {
  if (!(trigger instanceof HTMLElement)) {
    return '';
  }
  const labelledByAttr = trigger.getAttribute('aria-labelledby');
  const explicitLabel =
    trigger.getAttribute('data-breadcrumb-label') ?? trigger.getAttribute('aria-label');
  if (explicitLabel) {
    return normaliseBreadcrumbText(explicitLabel);
  }
  if (labelledByAttr) {
    const labelFromIds = labelledByAttr
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .filter(Boolean)
      .join(' ');
    if (labelFromIds) {
      return normaliseBreadcrumbText(labelFromIds);
    }
  }
  const highlightedLabel =
    trigger.querySelector('.control-panel__label, .hero__scoreboard-panel-title, .club-action');
  if (highlightedLabel instanceof HTMLElement) {
    return normaliseBreadcrumbText(highlightedLabel.textContent ?? '');
  }
  return normaliseBreadcrumbText(trigger.textContent ?? '');
};

export const updateBreadcrumbs = () => {
  if (breadcrumbTabItem && breadcrumbTabLink) {
    const tabLabel = getDashboardTabLabel(activeDashboardTab);
    if (tabLabel) {
      breadcrumbTabItem.hidden = false;
      breadcrumbTabLink.textContent = tabLabel;
      if (typeof activeDashboardTab === 'string') {
        breadcrumbTabLink.dataset.dashboardTab = activeDashboardTab;
      } else {
        delete breadcrumbTabLink.dataset.dashboardTab;
      }
    } else {
      breadcrumbTabItem.hidden = true;
      breadcrumbTabLink.textContent = '';
      delete breadcrumbTabLink.dataset.dashboardTab;
    }
  }

  if (breadcrumbModuleItem && breadcrumbModuleLabel && breadcrumbTabLink) {
    const moduleLabel = getTriggerBreadcrumbLabel(activeModalTrigger);
    const hasOpenModal = Boolean(
      typeof document !== 'undefined' &&
        document.body &&
        typeof document.body.classList?.contains === 'function' &&
        document.body.classList.contains('modal-open')
    );
    if (moduleLabel && hasOpenModal) {
      breadcrumbModuleItem.hidden = false;
      breadcrumbModuleLabel.textContent = moduleLabel;
      breadcrumbModuleLabel.setAttribute('aria-current', 'page');
      breadcrumbTabLink.removeAttribute('aria-current');
    } else {
      breadcrumbModuleItem.hidden = true;
      breadcrumbModuleLabel.textContent = '';
      breadcrumbModuleLabel.removeAttribute('aria-current');
      breadcrumbTabLink.setAttribute('aria-current', 'page');
    }
  }
};

export const switchDashboardTab = (targetTab) => {
  if (!targetTab) {
    return;
  }

  dashboardTabButtons.forEach((button) => {
    const isActive = button.dataset.dashboardTab === targetTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  dashboardPanels.forEach((panel) => {
    const isActive = panel.dataset.dashboardPanel === targetTab;
    panel.toggleAttribute('hidden', !isActive);
  });

  activeDashboardTab = targetTab;
  updateBreadcrumbs();
};

export const syncHeroMatchday = (text) => {
  if (heroMatchdayBadgeEl) {
    heroMatchdayBadgeEl.textContent = text;
  }
};

export const syncHeroOpponent = (text) => {
  if (heroMatchOpponentNameEl) {
    heroMatchOpponentNameEl.textContent = text;
  }
};

export const syncHeroStatus = (text, highlight = false) => {
  if (heroMatchStatusEl) {
    heroMatchStatusEl.textContent = text;
    heroMatchStatusEl.classList.toggle('is-warning', highlight);
  }
};
