import { MATCH_DUELS_REVEAL_DELAY } from '../constants.js';
import { scorelineState, gameState } from '../state.js';

// Helper to format numbers
const numberFormatter = new Intl.NumberFormat('es-ES');

function formatSignedDifference(value) {
  const rounded = Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  const normalised = Object.is(rounded, -0) ? 0 : rounded;
  const base = normalised.toFixed(2);
  return normalised > 0 ? `+${base}` : base;
}

function formatAverage(value) {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  const rounded = Number(value.toFixed(2));
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

export class DuelsRenderer {
  constructor(elements) {
    this.elements = elements; // { list, status, score, scoreline }
    this.timeouts = [];
  }

  clearAnimation() {
    this.timeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this.timeouts = [];
  }

  updateScore(value, options = {}) {
    if (!this.elements.score) return;
    
    const settings = { final: false, ...options };
    this.elements.score.classList.remove('match-duels__score--positive', 'match-duels__score--negative');
    
    if (!Number.isFinite(value)) {
      this.elements.score.textContent = 'Marcador cartas: —';
      return;
    }
    
    const text = formatSignedDifference(value);
    this.elements.score.textContent = settings.final
      ? `Marcador cartas: ${text} (final)`
      : `Marcador cartas: ${text}`;
      
    if (value > 0) {
      this.elements.score.classList.add('match-duels__score--positive');
    } else if (value < 0) {
      this.elements.score.classList.add('match-duels__score--negative');
    }
  }

  applyScoreline(value) {
    if (!this.elements.scoreline) return;
    
    const clubLabel = scorelineState.clubName || gameState.club?.name || 'Nuestro club';
    const opponentLabel = scorelineState.opponentName || 'Rival misterioso';
    this.elements.scoreline.textContent = `${clubLabel} vs ${opponentLabel} · Cartas ${formatSignedDifference(value)}`;
  }

  createParticipant(participant, side) {
    const container = document.createElement('div');
    container.className = `match-duel-card__participant match-duel-card__participant--${side}`;
    
    const name = document.createElement('span');
    name.className = 'match-duel-card__name';
    name.textContent = participant?.name ?? (side === 'home' ? 'Jugador canalla' : 'Rival proyectado');
    
    const meta = document.createElement('span');
    meta.className = 'match-duel-card__meta';
    
    const role = document.createElement('span');
    role.textContent = participant?.position ?? '—';
    
    const average = document.createElement('span');
    average.textContent = `Media ${formatAverage(participant?.average)}`;
    
    meta.append(role, average);
    container.append(name, meta);
    
    return { container, name, role, average, raw: participant };
  }

  createCard(entry, index) {
    const card = document.createElement('article');
    card.className = 'match-duel-card';
    card.setAttribute('role', 'listitem');
    card.tabIndex = -1;
    
    const badge = document.createElement('span');
    badge.className = 'match-duel-card__badge';
    badge.textContent = `Duelo ${index + 1}`;

    const participants = document.createElement('div');
    participants.className = 'match-duel-card__participants';
    const homeParticipant = this.createParticipant(entry?.home ?? null, 'home');
    const awayParticipant = this.createParticipant(entry?.away ?? null, 'away');
    participants.append(homeParticipant.container, awayParticipant.container);

    const difference = document.createElement('p');
    difference.className = 'match-duel-card__difference';
    const rawDifference = Number.isFinite(entry?.difference) ? entry.difference : 0;
    difference.textContent = formatSignedDifference(rawDifference);
    
    const duelOutcome = rawDifference > 0 ? 'positive' : rawDifference < 0 ? 'negative' : 'neutral';
    card.dataset.outcome = duelOutcome;

    const winner = document.createElement('span');
    winner.className = 'match-duel-card__winner';
    winner.textContent = 'Duelo en preparación';

    const partial = document.createElement('p');
    partial.className = 'match-duel-card__partial';
    partial.textContent = 'Acumulado: —';

    card.append(badge, participants, difference, winner, partial);

    return {
      element: card,
      entry: {
        home: entry?.home ?? null,
        away: entry?.away ?? null,
        difference: rawDifference,
      },
      partialEl: partial,
      winnerEl: winner,
    };
  }

  revealCard(cardData, runningTotal) {
    const { element, entry, partialEl, winnerEl } = cardData;
    const difference = entry.difference;
    
    let winner = 'draw';
    let winnerLabel = 'Empate vibrante';
    
    if (difference > 0.01) {
      winner = 'home';
      winnerLabel = 'Ventaja canalla';
    } else if (difference < -0.01) {
      winner = 'away';
      winnerLabel = 'Golpe rival';
    }
    
    element.dataset.winner = winner;
    winnerEl.textContent = winnerLabel;
    partialEl.innerHTML = `Acumulado: <strong>${formatSignedDifference(runningTotal)}</strong>`;
    
    element.classList.add('match-duel-card--visible');
    element.tabIndex = 0;
    
    const homeName = entry.home?.name ?? 'Jugador canalla';
    const awayName = entry.away?.name ?? 'Rival proyectado';
    const homeAverage = formatAverage(entry.home?.average);
    const awayAverage = formatAverage(entry.away?.average);
    
    const contextLabel =
      winner === 'home'
        ? `${scorelineState.clubName || gameState.club?.name || 'Nuestro club'} domina`
        : winner === 'away'
        ? `${scorelineState.opponentName || 'El rival'} se adelanta`
        : 'Duelo equilibrado';
        
    element.setAttribute(
      'aria-label',
      `${homeName} (${homeAverage}) vs ${awayName} (${awayAverage}). ${contextLabel}. Acumulado ${formatSignedDifference(runningTotal)}.`
    );
  }

  render(summary, onComplete) {
    this.clearAnimation();
    
    const breakdown = Array.isArray(summary?.breakdown) ? summary.breakdown : [];
    const totalDifference = Number.isFinite(summary?.totalDifference) ? summary.totalDifference : 0;

    if (!breakdown.length) {
      if (this.elements.status) {
        this.elements.status.textContent = 'Juega una jornada con el modo cartas para ver el enfrentamiento completo.';
      }
      if (this.elements.list) {
        this.elements.list.innerHTML = '';
        this.elements.list.setAttribute('aria-busy', 'false');
      }
      this.updateScore(Number.NaN);
      return;
    }

    if (this.elements.status) {
      this.elements.status.textContent = 'Reproduciendo duelos carta a carta.';
    }

    const cards = breakdown.map((entry, index) => this.createCard(entry, index));

    if (this.elements.list) {
      this.elements.list.innerHTML = '';
      this.elements.list.setAttribute('aria-busy', 'true');
      const fragment = document.createDocumentFragment();
      cards.forEach((card) => {
        fragment.append(card.element);
      });
      this.elements.list.append(fragment);
    }

    this.updateScore(0);
    this.applyScoreline(0);

    let runningTotal = 0;

    cards.forEach((cardData, index) => {
      const revealDelay = index * MATCH_DUELS_REVEAL_DELAY + 120;
      const revealTimeout = window.setTimeout(() => {
        runningTotal = Number((runningTotal + cardData.entry.difference).toFixed(2));
        this.revealCard(cardData, runningTotal);
        this.updateScore(runningTotal);
        this.applyScoreline(runningTotal);

        if (index === cards.length - 1) {
          if (this.elements.list) {
            this.elements.list.setAttribute('aria-busy', 'false');
          }
          const finalizeTimeout = window.setTimeout(() => {
            if (this.elements.status) {
              this.elements.status.textContent = 'Cartas completadas. Repasa el acumulado final.';
            }
            this.updateScore(totalDifference, { final: true });
            if (onComplete) onComplete();
          }, MATCH_DUELS_REVEAL_DELAY);
          this.timeouts.push(finalizeTimeout);
        }
      }, revealDelay);
      this.timeouts.push(revealTimeout);
    });
  }
}
