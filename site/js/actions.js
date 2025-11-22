import {
  gameState,
  setClubState,
  setLeagueState,
  setCupState,
  setTransferMarketState,
  setConfigState,
  setMatchHistory,
  setCurrentHistoryEntryId,
  setReportHistoryFilterSeason,
  setActiveReportTab,
  setCurrentReportData,
  setClubIdentity,
  setEditingPlayerId,
  setSelectedLineupPlayerId,
  setStaffFeedback,
  setPendingSavedGame,
  setAutoContinueTimeoutId,
  setTransferMessageTimeout,
  setModalHandlersAttached,
  setSaveMessageTimeout,
  setPreviewLogoObjectUrl,
  setLoadNoticeTimeout,
  setHasLatestReport,
  normaliseIdentity,
  extractClubIdentity,
  normaliseSeasonStats,
  computeOpponentRotation,
  ensureCommercialOffersAvailable,
  buildInitialConfig,
  decisions,
  leagueSettings
} from './state.js';

import {
  saveGame,
  loadSavedGame,
  hasSavedGame,
  clearSavedGame
} from '../../src/core/persistence.js';

import {
  createExampleClub,
  createExampleCup,
  createExampleTransferMarket,
  createDefaultMatchConfig,
  createDefaultInstructions,
  createSeasonStats,
  normaliseStaffState,
  resolveClubLogoUrl,
  STARTERS_LIMIT,
  SUBS_LIMIT,
  calculateWeeklyWageBill,
  resetPlayerForNewSeason,
  createExampleLeague,
  deriveLeagueSettings,
  normaliseLeagueRivals,
  selectRandomLeagueRivals,
  getTargetRivalCount,
  getSelectedLeagueSize,
  getDifficultyMultiplier,
  resolveNextMatchHome,
  resolveNextMatchStrength,
  determineNextEvent,
  getTotalMatchdays,
  GOAL_EVENT_TYPES,
  TIMELINE_EVENT_META,
  drawCupRound,
  getCupFixture,
  applyCupMatchResult,
  calculateInfrastructureUpgradeCost,
  calculateOperatingExpensesForInfrastructure,
  calculateStadiumCapacity,
  createAcademyProspects,
  getStaffDefinition,
  listStaffMembers,
  calculateStaffWeeklyCost,
  generateRandomPlayerIdentity,
  isPlayerAvailable,
  INFRASTRUCTURE_BLUEPRINT,
  STAFF_ROLE_INFO,
  LEAGUE_RIVAL_CATALOG,
  estimatePlayerValue
} from '../../src/core/data.js';

import {
  resolveCanallaDecision,
  tickCanallaState,
  resolveCupReputation
} from '../../src/core/reputation.js';

import {
  playMatchDay
} from '../../src/core/engine.js';

import {
  updateLeagueTableAfterMatch,
  updateSeasonHistoricalMetrics
} from '../../src/core/league.js';

import {
  resolveCupPrize,
  acceptSponsorOffer,
  rejectSponsorOffer,
  acceptTvDealOffer,
  rejectTvDealOffer,
  evaluateCommercialOpportunities
} from '../../src/core/economy.js';

import { CUP_ROUND_DEFINITIONS } from '../../src/core/types.js';

import * as UI from './ui.js';
import * as Visualization from './visualization.js';

// Helper to clone data
function cloneData(data) {
  if (data === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(data));
}

// ... persistState ...
export function persistState(reason = 'auto') {
  const currentClub = { ...gameState.club, cup: gameState.cup };
  setClubState(currentClub);
  
  const payload = saveGame(
    {
      club: currentClub,
      league: gameState.league,
      config: gameState.config,
      transferMarket: gameState.transferMarket,
      history: gameState.matchHistory,
    },
    undefined
  );
  
  if (!payload) {
    return;
  }
  
  if (reason === 'auto') {
    UI.showSaveMessage('Guardado automático tras la jornada.');
  } else if (reason === 'manual') {
    UI.showSaveMessage('Partida guardada.');
  }
}

// ... rebuildClubState ...
export function rebuildClubState(identity) {
  const newClub = createExampleClub(identity);
  setClubState(ensureCommercialOffersAvailable(newClub));
  setLeagueState(gameState.club.league);
  setCupState(gameState.club.cup);
  setTransferMarketState(createExampleTransferMarket(gameState.club));
  setConfigState(buildInitialConfig(gameState.club));
  setMatchHistory([]);
  setCurrentHistoryEntryId(null);
  setHasLatestReport(false);
  
  UI.renderLeagueTable();
  UI.renderTransferMarket();
  UI.renderLineupBoard();
  UI.updateMatchSummary();
  UI.updateClubSummary();
  UI.updateCommercialUi();
  UI.clearReport();
}

// ... handleStartMenuNewGame ...
export function handleStartMenuNewGame() {
  if (UI.startMenuEl) {
    UI.startMenuEl.hidden = true;
  }
  if (UI.mainPageEl) {
    UI.mainPageEl.hidden = false;
  }
  rebuildClubState(gameState.clubIdentity);
  UI.showLoadNotice('Nueva partida iniciada. ¡Mucha suerte!');
  persistState('silent');
}

// ... handleStartMenuContinue ...
export function handleStartMenuContinue({ showNotice = false } = {}) {
  const saved = loadSavedGame();
  if (!saved) {
    handleStartMenuNewGame();
    return;
  }
  
  if (UI.startMenuEl) {
    UI.startMenuEl.hidden = true;
  }
  if (UI.mainPageEl) {
    UI.mainPageEl.hidden = false;
  }
  
  applyLoadedState(saved);
  
  if (showNotice) {
    UI.showLoadNotice('Partida recuperada correctamente.');
  }
}

function applyLoadedState(saved) {
  const identity = extractClubIdentity(saved.club);
  setClubIdentity(identity);
  
  let loadedClub = {
    ...saved.club,
    ...identity,
    logoUrl: resolveClubLogoUrl(saved.club),
    weeklyWageBill: calculateWeeklyWageBill(saved.club.squad),
  };
  loadedClub.staff = normaliseStaffState(loadedClub.staff);
  loadedClub.seasonStats = normaliseSeasonStats(loadedClub.seasonStats);
  
  const loadedLeague = saved.league;
  
  const initialRivals = Array.isArray(loadedLeague?.rivals) && loadedLeague.rivals.length > 0
    ? loadedLeague.rivals
    : Array.isArray(loadedLeague?.table)
      ? loadedLeague.table
          .filter((entry) => entry.club !== loadedClub.name)
          .map((entry) => entry.club)
      : [];
      
  const cleanedRivals = normaliseLeagueRivals(initialRivals, {
    count: Math.max(1, deriveLeagueSettings(loadedLeague).leagueSize - 1),
    exclude: [loadedClub.name],
  });
  
  const loadedSettings = deriveLeagueSettings(loadedLeague);
  const newLeagueState = {
    ...loadedLeague,
    rivals: cleanedRivals,
    size: loadedSettings.leagueSize,
    totalMatchdays: loadedSettings.totalMatchdays,
    difficulty: loadedSettings.difficulty,
    difficultyMultiplier: loadedSettings.difficultyMultiplier,
  };
  
  UI.updateLeagueSettingsFromState(newLeagueState, { syncSelectors: true });
  
  loadedClub.league = newLeagueState;
  loadedClub.cup = loadedClub.cup;
  
  setClubState(loadedClub);
  setLeagueState(newLeagueState);
  setCupState(loadedClub.cup);
  
  setTransferMarketState(saved.transferMarket.length ? saved.transferMarket : createExampleTransferMarket(loadedClub));
  
  const baseConfig = buildInitialConfig(loadedClub);
  const loadedSeed = saved.config?.seed;
  const seedValue = typeof loadedSeed === 'string' ? loadedSeed : typeof loadedSeed === 'number' ? String(loadedSeed) : baseConfig.seed ?? '';
  
  setConfigState({
    ...baseConfig,
    ...saved.config,
    instructions: { ...createDefaultInstructions(), ...(saved.config.instructions ?? {}) },
    seed: seedValue,
    difficultyMultiplier: loadedSettings.difficultyMultiplier,
    viewMode: saved.config?.viewMode ?? 'text',
  });
  
  setMatchHistory(Array.isArray(saved.history) ? saved.history : []);
  setCurrentHistoryEntryId(gameState.matchHistory[0]?.id ?? null);
  setReportHistoryFilterSeason('all');
  setActiveReportTab('current');
  setHasLatestReport(gameState.matchHistory.length > 0);
  
  UI.renderReportHistory();
  UI.renderLeagueTable();
  UI.renderTransferMarket();
  UI.renderLineupBoard();
  UI.updateMatchSummary();
  UI.updateClubSummary();
  UI.updateCommercialUi();
}

export function handleCupDraw() {
  if (!gameState.cup || gameState.cup.status !== 'awaiting-draw') {
    return;
  }
  const result = drawCupRound(gameState.cup, gameState.club.name);
  setCupState(result.cup);
  setClubState({ ...gameState.club, cup: result.cup });
  UI.renderCupModal();
  UI.renderLineupBoard();
  UI.updateMatchSummary();
  UI.updateCupSummary();
  persistState('silent');
}

export function handleFormSubmit(event) {
  event.preventDefault();
  
  const nextEvent = determineNextEvent();
  if (nextEvent.type === 'cup-draw') {
    UI.hideLineupError();
    handleCupDraw();
    return;
  }
  
  UI.hideLineupError();
  if (gameState.config.startingLineup.length !== STARTERS_LIMIT) {
    UI.showLineupError(`Necesitas ${STARTERS_LIMIT} titulares para saltar al campo.`);
    return;
  }
  if (gameState.config.substitutes.length > SUBS_LIMIT) {
    UI.showLineupError('Reduce el banquillo a 5 suplentes.');
    return;
  }
  
  const isCupMatch = nextEvent.type === 'cup-match';
  
  const opponentStanding = getUpcomingOpponent();
  const opponentName =
    typeof opponentStanding?.club === 'string' && opponentStanding.club.trim().length > 0
      ? opponentStanding.club.trim()
      : 'Rival misterioso';
      
  const decisionIndex = UI.decisionSelect.value;
  let decision;
  let decisionOutcome;
  let workingClub = gameState.club;
  
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
  
  const seedValue = UI.seedInput ? UI.seedInput.value.trim() : '';
  const selectedViewMode = Visualization.resolveSelectedViewMode();
  const resolvedHome = resolveNextMatchHome(nextEvent);
  const resolvedStrength = resolveNextMatchStrength(nextEvent);
  
  setConfigState({
    ...gameState.config,
    home: resolvedHome,
    opponentStrength: resolvedStrength,
    opponentName,
    tactic: UI.tacticSelect.value,
    formation: UI.formationSelect.value,
    seed: seedValue,
    difficultyMultiplier: getDifficultyMultiplier(),
    viewMode: selectedViewMode,
  });
  
  const simulationOptions = { decision, decisionOutcome };
  if (seedValue) {
    simulationOptions.seed = seedValue;
  }
  
  const report = playMatchDay(workingClub, gameState.config, simulationOptions);
  report.match.competition = isCupMatch ? 'cup' : 'league';
  report.match.cupRoundId = isCupMatch && nextEvent.type === 'cup-match' ? nextEvent.round.id : report.match.cupRoundId;
  report.competition = report.match.competition;
  
  let updatedLeague = gameState.league ?? workingClub.league;
  let previousMatchDay = !isCupMatch && updatedLeague?.matchDay ? updatedLeague.matchDay : 0;
  if (!isCupMatch) {
    updatedLeague = updateLeagueTableAfterMatch(updatedLeague, workingClub.name, report.match);
    updateSeasonHistoricalMetrics(report, opponentName, updatedLeague);
    setLeagueState(updatedLeague);
    UI.updateLeagueSettingsFromState(updatedLeague);
  }
  
  const refreshedWageBill = calculateWeeklyWageBill(report.updatedClub.squad);
  
  if (isCupMatch && nextEvent.type === 'cup-match') {
    const progress = applyCupMatchResult(gameState.cup, gameState.club.name, report.match);
    setCupState(progress.cup);
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
  
  setClubState({
    ...report.updatedClub,
    logoUrl: resolveClubLogoUrl(report.updatedClub),
    weeklyWageBill: refreshedWageBill,
    league: updatedLeague,
    cup: gameState.cup ?? report.updatedClub.cup,
  });
  setLeagueState(updatedLeague);
  
  const totalMatchdays = getTotalMatchdays();
  const seasonFinished = !isCupMatch && previousMatchDay < totalMatchdays && updatedLeague.matchDay >= totalMatchdays;
  const cupOutcome = report.cupProgress?.historyEntry?.outcome;
  evaluateCommercialOpportunities({ report, seasonFinished, cupOutcome });
  
  UI.renderLeagueTable();
  UI.renderTransferMarket();
  UI.renderLineupBoard();
  UI.updateMatchSummary();
  UI.renderCupModal();
  
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
    gameState.club.season,
    competition === 'cup' ? (gameState.league?.matchDay ?? 0) : updatedLeague.matchDay,
    {
      competition,
      cupRoundId,
      cupRoundName,
    }
  );
  
  UI.switchReportTab('current');
  UI.renderMatchReport(historyEntry.report, historyEntry.decisionOutcome, historyEntry.opponent, historyEntry.metadata ?? {});
  UI.updateClubSummary();
  persistState('auto');
  UI.switchToReportView();
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
  if (!gameState.league || !Array.isArray(gameState.league.table)) {
    return null;
  }
  if (gameState.opponentRotation.length === 0) {
    const rotation = computeOpponentRotation(gameState.league, gameState.club.name);
    if (rotation.length === 0) return null;
    const index = gameState.league.matchDay % rotation.length;
    const opponentName = rotation[index];
    const standing = gameState.league.table.find((entry) => entry.club === opponentName);
    if (standing) return standing;
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
  const index = gameState.league.matchDay % gameState.opponentRotation.length;
  const opponentName = gameState.opponentRotation[index];
  const standing = gameState.league.table.find((entry) => entry.club === opponentName);
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
  const fallbackSeason = typeof gameState.club?.season === 'number' ? Math.max(1, Math.trunc(gameState.club.season)) : 1;
  const fallbackMatchday =
    typeof gameState.league?.matchDay === 'number' && Number.isFinite(gameState.league.matchDay)
      ? Math.max(1, Math.trunc(gameState.league.matchDay))
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
  
  const newHistory = [
    entry,
    ...gameState.matchHistory.filter((item) => !(item.season === seasonNumber && item.matchday === matchdayNumber)),
  ];
  setMatchHistory(newHistory);
  setCurrentHistoryEntryId(entry.id);
  UI.renderReportHistory();
  return entry;
}

// Initialize game
export function initializeGame() {
  if (hasSavedGame()) {
    if (UI.startMenuMessageEl) {
      UI.startMenuMessageEl.textContent = 'Se ha detectado una partida guardada.';
    }
    if (UI.startContinueButton) {
      UI.startContinueButton.disabled = false;
      UI.startContinueButton.hidden = false;
    }
  } else {
    if (UI.startContinueButton) {
      UI.startContinueButton.disabled = true;
      UI.startContinueButton.hidden = true;
    }
  }
  
  UI.renderLeagueTable();
  UI.renderTransferMarket();
  UI.renderLineupBoard();
  UI.updateMatchSummary();
  UI.updateClubSummary();
  UI.updateCommercialUi();
}

export function handleResetClub() {
  const confirmationMessage =
    '¿Seguro que quieres reiniciar el club? Esta acción eliminará el progreso guardado.';
  const confirmed = window.confirm(confirmationMessage);

  if (!confirmed) {
    UI.showLoadNotice('Reinicio cancelado. El club sigue intacto.');
    return;
  }

  clearSavedGame();
  UI.clearSaveMessage();
  UI.clearLoadNotice();
  const identity = extractClubIdentity(gameState.club);
  rebuildClubState(identity);
  UI.showLoadNotice('Club reiniciado. Guardado anterior eliminado.');
}

export function handleClubIdentityPreview() {
  const identity = collectIdentityFromForm();
  UI.renderClubIdentityPreview(identity);
}

export async function handleClubIdentitySubmit(event) {
  event.preventDefault();
  const identity = collectIdentityFromForm();
  clearSavedGame();
  UI.clearSaveMessage();
  UI.clearLoadNotice();
  rebuildClubState(identity);
  if (UI.clubLogoInput) {
    UI.clubLogoInput.value = '';
  }
  if (UI.clubIdentityModal) {
    UI.closeModal(UI.clubIdentityModal);
  }
  UI.showLoadNotice('Identidad del club actualizada. Se ha preparado una nueva partida.');
  persistState('silent');
}

function collectIdentityFromForm() {
  const name = UI.clubNameInput?.value.trim() || 'Club Canalla';
  const city = UI.clubCityInput?.value.trim() || 'Ciudad Canalla';
  const stadium = UI.clubStadiumInput?.value.trim() || 'Estadio Canalla';
  const primaryColor = UI.clubPrimaryColorInput?.value || '#e63946';
  const secondaryColor = UI.clubSecondaryColorInput?.value || '#1d3557';
  
  return {
    name,
    city,
    stadium,
    primaryColor,
    secondaryColor,
  };
}

export function handleLeagueConfigSubmit(event) {
  event.preventDefault();
  const selected = UI.getSelectedLeagueRivals();
  const targetCount = getTargetRivalCount();
  if (selected.length !== targetCount) {
    UI.showLeagueConfigError(`Selecciona ${targetCount} rivales (actualmente ${selected.length}).`);
    return;
  }
  UI.hideLeagueConfigError();
  UI.applyLeagueConfiguration(selected);
  UI.closeModal(UI.leagueConfigModal);
}

export function handleLeagueRandomize() {
  const targetCount = getTargetRivalCount();
  const randomSelection = selectRandomLeagueRivals(targetCount, {
    exclude: [gameState.club.name],
  });
  UI.applyLeagueSelectionToForm(randomSelection);
  UI.hideLeagueConfigError();
}

export function handleDecisionChange() {
  UI.renderDecisionsModal();
}

export function handleSidebarToggle() {
  if (!UI.sidebarPanel || !UI.sidebarToggleButton) return;
  const isCollapsed = UI.sidebarPanel.getAttribute('aria-expanded') === 'false';
  UI.sidebarPanel.setAttribute('aria-expanded', !isCollapsed);
  UI.sidebarToggleButton.setAttribute('aria-expanded', !isCollapsed);
}

export function handleViewModeChange(event) {
  if (event.target.checked) {
    setConfigState({ ...gameState.config, viewMode: event.target.value });
  }
}

export function handleModalClose(modal) {
  UI.closeModal(modal);
}

export function handleModalOutsideClick(event) {
  if (event.target.hasAttribute('data-modal-target')) {
    UI.closeModal(event.target);
  }
}

export function handleModalKeydown(event) {
  if (event.key === 'Escape') {
    const openModal = document.querySelector('.modal[aria-hidden="false"]');
    if (openModal) {
      UI.closeModal(openModal);
    }
  }
}

export function handleConfigureClub() {
  UI.prefillClubIdentityForm();
  handleClubIdentityPreview();
  UI.openModal(UI.clubIdentityModal);
}

export function handleConfigureLeague() {
  UI.prepareLeagueConfigModal();
  UI.openModal(UI.leagueConfigModal);
}

export function handleLeagueCatalogChange(event) {
  if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
    UI.updateLeagueSelectionCountDisplay();
    UI.hideLeagueConfigError();
  }
}

export function handleLeagueSizeChange() {
  UI.updateLeagueSelectionCountDisplay();
  UI.hideLeagueConfigError();
}

export function handleLeagueDifficultyChange() {
  UI.hideLeagueConfigError();
}

export function handleCupPlanButton() {
  // Logic for cup planning?
  // Maybe just close modal?
  if (UI.cupModalEl) {
    UI.closeModal(UI.cupModalEl);
  }
}

export function handleAutoSortLineup() {
  // Implement auto sort logic
  // ...
  UI.renderLineupBoard();
}

export function handlePlayerEditSubmit(event) {
  event.preventDefault();
  // ...
}

export function handlePlayerEditRandom() {
  // ...
}

export function handleInfrastructureUpgrade(event) {
  // ...
}

export function handleResultsControl() {
  // ...
}

export function handleReportTabSwitch(event) {
  const tab = event.target.dataset.reportTab;
  UI.switchReportTab(tab);
}

export function handleReportHistorySeasonChange(event) {
  setReportHistoryFilterSeason(event.target.value);
  UI.renderReportHistory();
}

export function handleReportHistoryItemClick(entryId) {
  // ...
}

export function handleTransferBuy(playerId) {
  // ...
}

export function handleTransferSell(playerId) {
  // ...
}

export function handleLineupRowClick(playerId) {
  // ...
}

export function handleLineupRowKeydown(event, playerId) {
  // ...
}

export function handleDashboardTabSwitch(event) {
  const tab = event.target.dataset.dashboardTab;
  UI.switchDashboardTab(tab);
}
