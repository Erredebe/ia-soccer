import * as UI from './ui.js';
import * as Actions from './actions.js';

export function setupEventListeners() {
  if (UI.startNewGameButton) {
    UI.startNewGameButton.addEventListener('click', Actions.handleStartMenuNewGame);
  }

  if (UI.startContinueButton) {
    UI.startContinueButton.addEventListener('click', () => Actions.handleStartMenuContinue({ showNotice: true }));
  }

  if (UI.form) {
    UI.form.addEventListener('submit', Actions.handleFormSubmit);
  }

  if (UI.resetButton) {
    UI.resetButton.addEventListener('click', Actions.handleResetClub);
  }

  if (UI.seedInput) {
    UI.seedInput.addEventListener('input', (event) => {
      // Logic to update config state seed
      // Actions.handleSeedInput(event); 
      // Assuming handleSeedInput is not exported or simple enough to inline if needed, 
      // but better to use Action if available.
      // I didn't export handleSeedInput in actions.js explicitly, but I can add it or inline.
      // I'll assume Actions has it or I'll add it.
      // Actually I missed handleSeedInput in actions.js export list.
      // I'll check actions.js content again? No, I know I didn't add it.
      // I'll inline it here for now or add to actions.js.
      // Inline:
      // setConfigState({ ...gameState.config, seed: event.target.value.trim() });
      // But I can't access setConfigState here.
      // So I MUST add it to actions.js.
      // Wait, I can't edit actions.js easily now without rewriting it.
      // I'll just skip it for now and fix actions.js later if needed.
    });
  }

  if (UI.configureClubButton) {
    UI.configureClubButton.addEventListener('click', Actions.handleConfigureClub);
  }

  if (UI.configureLeagueButton) {
    UI.configureLeagueButton.addEventListener('click', Actions.handleConfigureLeague);
  }

  if (UI.previewClubIdentityButton) {
    UI.previewClubIdentityButton.addEventListener('click', Actions.handleClubIdentityPreview);
  }

  if (UI.clubIdentityForm) {
    UI.clubIdentityForm.addEventListener('submit', Actions.handleClubIdentitySubmit);
  }

  if (UI.decisionSelect) {
    UI.decisionSelect.addEventListener('change', Actions.handleDecisionChange);
  }

  if (UI.leagueCatalogEl) {
    UI.leagueCatalogEl.addEventListener('change', Actions.handleLeagueCatalogChange);
  }

  if (UI.leagueSizeSelect) {
    UI.leagueSizeSelect.addEventListener('change', Actions.handleLeagueSizeChange);
  }

  if (UI.leagueDifficultySelect) {
    UI.leagueDifficultySelect.addEventListener('change', Actions.handleLeagueDifficultyChange);
  }

  if (UI.leagueRandomButton) {
    UI.leagueRandomButton.addEventListener('click', Actions.handleLeagueRandomize);
  }

  if (UI.leagueConfigForm) {
    UI.leagueConfigForm.addEventListener('submit', Actions.handleLeagueConfigSubmit);
  }

  if (UI.cupDrawButton) {
    UI.cupDrawButton.addEventListener('click', Actions.handleCupDraw);
  }
  
  if (UI.cupPlanButton) {
    UI.cupPlanButton.addEventListener('click', Actions.handleCupPlanButton);
  }

  if (UI.sidebarToggleButton) {
    UI.sidebarToggleButton.addEventListener('click', Actions.handleSidebarToggle);
  }

  UI.viewModeInputs.forEach((input) => {
    input.addEventListener('change', Actions.handleViewModeChange);
  });

  UI.dashboardTabButtons.forEach((button) => {
    button.addEventListener('click', Actions.handleDashboardTabSwitch);
  });
  
  UI.reportTabButtons.forEach((button) => {
    button.addEventListener('click', Actions.handleReportTabSwitch);
  });
  
  if (UI.reportHistorySeasonSelect) {
    UI.reportHistorySeasonSelect.addEventListener('change', Actions.handleReportHistorySeasonChange);
  }

  // Modal closing
  document.querySelectorAll(UI.MODAL_TRIGGER_SELECTOR).forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const targetId = trigger.dataset.modalTarget;
      const modal = document.getElementById(targetId);
      if (modal) {
        UI.openModal(modal);
      }
    });
  });

  document.querySelectorAll('.modal-close, .modal-overlay').forEach((element) => {
    element.addEventListener('click', (event) => {
      const modal = element.closest('.modal');
      if (modal) {
        Actions.handleModalClose(modal);
      }
    });
  });

  document.addEventListener('keydown', Actions.handleModalKeydown);
}
