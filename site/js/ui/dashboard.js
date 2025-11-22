import {
  dashboardTabButtons,
  dashboardPanels,
  heroMatchdayBadgeEl,
  heroMatchOpponentNameEl,
  heroMatchStatusEl,
  MODAL_TRIGGER_SELECTOR
} from './elements.js';
import { updateBreadcrumbs } from './breadcrumbs.js';

export const initialDashboardTabButton = Array.from(dashboardTabButtons).find((button) =>
  button.classList.contains('is-active')
);
export const defaultDashboardTab =
  initialDashboardTabButton?.dataset.dashboardTab ?? dashboardTabButtons[0]?.dataset.dashboardTab ?? null;

export let activeDashboardTab = defaultDashboardTab;

export const defaultModalTrigger = document.querySelector(
  `${MODAL_TRIGGER_SELECTOR}[aria-current="page"]`
);
export let activeModalTrigger = defaultModalTrigger ?? null;

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

export function setActiveModalTrigger(trigger) {
    activeModalTrigger = trigger;
}
