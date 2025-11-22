import {
  matchVisualizationState,
  matchDuelsState,
  scorelineState,
  gameState
} from './state.js';
import {
  MATCH_VISUALIZATION_AUTOPLAY_INTERVAL,
  MATCH_VISUALIZATION_TRANSITION_CLASS,
  MATCH_VISUALIZATION_MINUTE_CLASS
} from './constants.js';
import {
  matchVisualizationSection,
  matchVisualizationScreen,
  matchVisualizationMinuteEl,
  matchVisualizationLabelEl,
  matchVisualizationSlider,
  matchVisualizationFrameEl,
  matchVisualizationPrevButton,
  matchVisualizationNextButton,
  matchVisualizationStatusEl,
  matchVisualizationLegendList,
  matchDuelsSection,
  matchDuelsListEl,
  matchDuelsStatusEl,
  matchDuelsScoreEl,
  scorelineEl,
  viewModeInputs,
  restartAnimation
} from './ui.js';
import { PitchRenderer } from './renderers/pitch-renderer.js';
import { DuelsRenderer } from './renderers/duels-renderer.js';

// Initialize renderers
let pitchRenderer = null;
let duelsRenderer = null;

function getPitchRenderer() {
  if (!pitchRenderer && matchVisualizationScreen) {
    pitchRenderer = new PitchRenderer(matchVisualizationScreen);
  }
  return pitchRenderer;
}

function getDuelsRenderer() {
  if (!duelsRenderer) {
    duelsRenderer = new DuelsRenderer({
      list: matchDuelsListEl,
      status: matchDuelsStatusEl,
      score: matchDuelsScoreEl,
      scoreline: scorelineEl
    });
  }
  return duelsRenderer;
}

function applyScoreline(text, { animate = false } = {}) {
  if (!scorelineEl) {
    return;
  }
  scorelineEl.textContent = text;
  if (animate) {
    restartAnimation(scorelineEl, 'scoreline--flash');
  }
}

function restoreScoreline(animate = false) {
  if (!scorelineEl) {
    return;
  }
  if (scorelineState.finalText) {
    applyScoreline(scorelineState.finalText, { animate });
  } else {
    applyScoreline('', { animate: false });
  }
}

export function clearMatchVisualizationAutoplay() {
  if (matchVisualizationState.autoplayId) {
    window.clearTimeout(matchVisualizationState.autoplayId);
    matchVisualizationState.autoplayId = null;
  }
}

export function scheduleMatchVisualizationAutoplay() {
  clearMatchVisualizationAutoplay();
  if (!matchVisualizationState.autoplayActive) {
    return;
  }
  matchVisualizationState.autoplayId = window.setTimeout(() => {
    advanceMatchVisualizationAutoplay();
  }, MATCH_VISUALIZATION_AUTOPLAY_INTERVAL);
}

export function startMatchVisualizationAutoplay() {
  matchVisualizationState.autoplayActive = true;
  scheduleMatchVisualizationAutoplay();
}

export function stopMatchVisualizationAutoplay() {
  matchVisualizationState.autoplayActive = false;
  clearMatchVisualizationAutoplay();
}

export function resetMatchVisualizationAutoplay() {
  stopMatchVisualizationAutoplay();
}

export function advanceMatchVisualizationAutoplay() {
  if (!matchVisualizationState.autoplayActive) {
    return;
  }
  const total = matchVisualizationState.frames.length;
  if (total === 0) {
    stopMatchVisualizationAutoplay();
    return;
  }
  const nextIndex = matchVisualizationState.index + 1;
  if (nextIndex >= total) {
    stopMatchVisualizationAutoplay();
    return;
  }
  updateMatchVisualizationFrame(nextIndex);
  scheduleMatchVisualizationAutoplay();
}

export function resetMatchVisualizationElements({ detachPitch = false } = {}) {
  const renderer = getPitchRenderer();
  if (renderer) {
    if (detachPitch) {
      renderer.destroy();
    } else {
      renderer.clear();
    }
  }
}

export function updateMatchVisualizationFrame(index, options = {}) {
  if (!matchVisualizationSection || matchVisualizationState.frames.length === 0) {
    return;
  }
  const total = matchVisualizationState.frames.length;
  const clamped = Math.max(0, Math.min(total - 1, index));
  matchVisualizationState.index = clamped;
  const frame = matchVisualizationState.frames[clamped];

  const renderer = getPitchRenderer();
  if (renderer) {
    renderer.renderFrame(frame);
    if (matchVisualizationScreen) {
        restartAnimation(matchVisualizationScreen, MATCH_VISUALIZATION_TRANSITION_CLASS);
    }
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

function normaliseViewMode(value) {
  return value === '2d' || value === 'duels' || value === 'text' ? value : 'text';
}

function resolveSelectedViewMode() {
  const selectedInput = Array.from(viewModeInputs).find(
    (input) => input instanceof HTMLInputElement && input.checked
  );
  if (selectedInput instanceof HTMLInputElement) {
    return normaliseViewMode(selectedInput.value);
  }
  return normaliseViewMode(gameState.config?.viewMode);
}

export function renderMatchVisualization(report) {
  if (!matchVisualizationSection) {
    return;
  }

  const selectedViewMode = resolveSelectedViewMode();
  renderMatchDuels(selectedViewMode === 'duels' ? report?.match?.duels ?? null : null);
  const is2dActive = selectedViewMode === '2d';
  
  if (!is2dActive) {
    matchVisualizationSection.hidden = true;
    matchVisualizationSection.setAttribute('aria-hidden', 'true');
    stopMatchVisualizationAutoplay();
    return;
  }

  matchVisualizationSection.hidden = false;
  matchVisualizationSection.setAttribute('aria-hidden', 'false');
  
  const clearVisualization = (message) => {
    matchVisualizationState.frames = [];
    matchVisualizationState.index = 0;
    matchVisualizationState.dimensions = { width: 21, height: 11 };
    stopMatchVisualizationAutoplay();
    matchVisualizationSection.dataset.state = 'empty';
    
    resetMatchVisualizationElements({ detachPitch: true });
    
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

  if (!is2dActive) {
    clearVisualization('Selecciona la vista 2D en el selector para proyectar la pizarra retro.');
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
  
  // Initialize renderer with dimensions
  const renderer = getPitchRenderer();
  if (renderer) {
    renderer.initialize(matchVisualizationState.dimensions);
  }
  
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

export function stepMatchVisualization(delta) {
  if (matchVisualizationState.frames.length === 0) {
    return;
  }
  const nextIndex = matchVisualizationState.index + delta;
  updateMatchVisualizationFrame(nextIndex, { userInitiated: true });
}

export function renderMatchDuels(summary) {
  if (!matchDuelsSection) {
    return;
  }

  const renderer = getDuelsRenderer();
  if (renderer) {
    renderer.clearAnimation();
  }

  const isActive = resolveSelectedViewMode() === 'duels';
  matchDuelsSection.hidden = !isActive;
  matchDuelsSection.setAttribute('aria-hidden', isActive ? 'false' : 'true');

  if (!isActive) {
    matchDuelsSection.dataset.state = 'empty';
    if (matchDuelsListEl) {
      matchDuelsListEl.innerHTML = '';
      matchDuelsListEl.setAttribute('aria-busy', 'false');
    }
    if (matchDuelsStatusEl) {
      matchDuelsStatusEl.textContent = 'Selecciona el modo cartas para comparar jugador a jugador.';
    }
    if (renderer) {
        renderer.updateScore(Number.NaN);
    }
    restoreScoreline();
    return;
  }

  if (renderer) {
    renderer.render(summary, () => {
        restoreScoreline(true);
    });
  }
}
