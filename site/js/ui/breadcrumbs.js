import {
  breadcrumbTabItem,
  breadcrumbTabLink,
  breadcrumbModuleItem,
  breadcrumbModuleLabel,
  dashboardTabButtons
} from './elements.js';
import { activeDashboardTab, activeModalTrigger } from './dashboard.js';

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
