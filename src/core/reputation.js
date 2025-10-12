// @ts-check
/**
 * Resolución de decisiones canallas, efectos en reputación y moral.
 * @module core/reputation
 */

import { CUP_ROUND_DEFINITIONS } from './types.js';

/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */
/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').DecisionOutcome} DecisionOutcome */
/** @typedef {import('./types.js').CupRoundId} CupRoundId */

/**
 * Definición del tipo `DecisionResolution` utilizado en los informes canallas.
 * @typedef {Object} DecisionResolution
 * @property {DecisionOutcome} outcome
 * @property {ClubState} updatedClub
 */

/**
 * Definición del tipo `DecisionParameters` con los modificadores internos.
 * @property {number} baseSuccess
 * @property {number} reputationSuccess
 * @property {number} reputationFailure
 * @property {number} moraleSuccess
 * @property {number} moraleFailure
 * @property {number} cost
 * @property {number} fine
 */

/** @type {Record<CanallaDecision['type'], DecisionParameters>} */
const DECISION_MAP = {
  sobornoArbitro: {
    baseSuccess: 0.35,
    reputationSuccess: 6,
    reputationFailure: -18,
    moraleSuccess: 8,
    moraleFailure: -12,
    cost: -25000,
    fine: 60000,
  },
  filtrarRumor: {
    baseSuccess: 0.55,
    reputationSuccess: 3,
    reputationFailure: -9,
    moraleSuccess: 5,
    moraleFailure: -6,
    cost: -4000,
    fine: 15000,
  },
  fiestaIlegal: {
    baseSuccess: 0.4,
    reputationSuccess: 4,
    reputationFailure: -14,
    moraleSuccess: 12,
    moraleFailure: -15,
    cost: -8000,
    fine: 20000,
  },
  presionarFederacion: {
    baseSuccess: 0.45,
    reputationSuccess: 7,
    reputationFailure: -10,
    moraleSuccess: 3,
    moraleFailure: -5,
    cost: -5000,
    fine: 25000,
  },
};

/** @type {Record<CanallaDecision['intensity'], number>} */
const INTENSITY_MODIFIER = {
  baja: -0.08,
  media: 0,
  alta: 0.12,
};

const CUP_REPUTATION_MAP = new Map(CUP_ROUND_DEFINITIONS.map((definition) => [definition.id, definition]));

/**
 * Resuelve una decisión canalla aplicando cambios en reputación, moral y finanzas.
 * @param {ClubState} club Estado actual del club.
 * @param {CanallaDecision} decision Travesura elegida.
 * @param {() => number} [rng] Generador aleatorio opcional.
 * @returns {DecisionResolution}
 */
export function resolveCanallaDecision(club, decision, rng = Math.random) {
  const params = DECISION_MAP[decision.type];
  const intensity = INTENSITY_MODIFIER[decision.intensity];
  const successThreshold = params.baseSuccess + intensity;
  const success = rng() < successThreshold;

  const reputationChange = success ? params.reputationSuccess : params.reputationFailure;
  const moraleChange = success ? params.moraleSuccess : params.moraleFailure;
  const financesChange = success ? params.cost : params.cost - params.fine;

  const narrative = success ? generarNarrativaExito(decision) : generarNarrativaDesastre(decision);

  const updatedClub = {
    ...club,
    budget: club.budget + financesChange,
    reputation: Math.max(-100, Math.min(100, club.reputation + reputationChange)),
    squad: club.squad.map((player) => ({
      ...player,
      morale: Math.max(-100, Math.min(100, player.morale + moraleChange / club.squad.length)),
    })),
  };

  const outcome = {
    success,
    reputationChange,
    financesChange,
    moraleChange,
    riskLevel: Math.max(0, Math.min(100, Math.round((successThreshold + (success ? 0 : 0.2)) * 100))),
    sanctions: success ? undefined : 'La prensa ha pillado el pastel; posible sanción en el próximo comité.',
    narrative,
    appliedToClub: true,
  };

  return { outcome, updatedClub };
}

/**
 * Genera la narración asociada a una decisión canalla exitosa.
 * @param {CanallaDecision} decision
 * @returns {string}
 */
function generarNarrativaExito(decision) {
  switch (decision.type) {
    case 'sobornoArbitro':
      return 'El sobre llegó con lacito y el árbitro pitó como si llevara camiseta del club.';
    case 'filtrarRumor':
      return 'El rumor explotó en los corrillos de radio; el rival llegó con la cabeza hecha trizas.';
    case 'fiestaIlegal':
      return 'La farra clandestina terminó en química perfecta; la plantilla se siente familia mafiosa.';
    case 'presionarFederacion':
      return 'La llamada nocturna surtió efecto; el calendario se puso blandito como flan.';
    default:
      return 'La jugada salió de escándalo, el vestuario se vino arriba.';
  }
}

/**
 * Describe el desastre mediático cuando la canallada sale mal.
 * @param {CanallaDecision} decision
 * @returns {string}
 */
function generarNarrativaDesastre(decision) {
  switch (decision.type) {
    case 'sobornoArbitro':
      return 'El maletín tenía cámara oculta; ahora los tertulianos se huelen el chanchullo.';
    case 'filtrarRumor':
      return 'El rumor se volvió boomerang; los socios montaron bronca en la puerta 18.';
    case 'fiestaIlegal':
      return 'La fiesta acabó en comisaría y con videos filtrados; la moral cayó como acciones tóxicas.';
    case 'presionarFederacion':
      return 'Los papeles salieron a la luz; federativos enfadados y llamadas perdidas al amanecer.';
    default:
      return 'Se nos fue de las manos y ahora hay que apagar fuegos con cubos pequeños.';
  }
}

/**
 * Ajusta la reputación del club según el rendimiento en la copa.
 * @param {CupRoundId} roundId
 * @param {'victory' | 'eliminated' | 'champion'} [outcome]
 * @returns {{ reputation: number; narrative: string }}
 */
export function resolveCupReputation(roundId, outcome = 'victory') {
  const definition = CUP_REPUTATION_MAP.get(roundId);
  if (!definition) {
    const fallback = outcome === 'eliminated' ? -3 : 5;
    const narrative =
      outcome === 'eliminated'
        ? 'El barrio suspira: caer en la copa deja dudas en la parroquia.'
        : 'La hazaña copera corre por las tabernas y sube nuestra fama.';
    return { reputation: fallback, narrative };
  }
  if (outcome === 'eliminated') {
    const narrative = `El tropiezo en ${definition.name} amarga a la grada (${definition.reputationEliminated} de reputación).`;
    return { reputation: definition.reputationEliminated, narrative };
  }
  let reputation = definition.reputationWin;
  let narrative = `Superar ${definition.name} alimenta la leyenda del barrio (+${definition.reputationWin}).`;
  if (outcome === 'champion') {
    const bonus = 10;
    reputation += bonus;
    narrative = `Coronarse en ${definition.name} convierte al club en mito (+${reputation}).`;
  }
  return { reputation, narrative };
}
