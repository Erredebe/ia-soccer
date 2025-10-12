// @ts-check
/**
 * Resolución de decisiones canallas, efectos en reputación y moral.
 * @module core/reputation
 */

import { CUP_ROUND_DEFINITIONS } from './types.js';

/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */
/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').DecisionOutcome} DecisionOutcome */
/** @typedef {import('../types.js').CanallaStatus} CanallaStatus */
/** @typedef {import('../types.js').CanallaOngoingEffect} CanallaOngoingEffect */
/** @typedef {import('./types.js').CupRoundId} CupRoundId */

/**
 * Definición del tipo `DecisionResolution` utilizado en los informes canallas.
 * @typedef {Object} DecisionResolution
 * @property {DecisionOutcome} outcome
 * @property {ClubState} updatedClub
 */

/**
 * Modificador de efectos a medio plazo que se generan a raíz de una travesura.
 * @typedef {Object} MediumTermEffect
 * @property {'budget' | 'reputation' | 'morale' | 'heat'} target
 * @property {number} magnitude
 * @property {number} duration
 * @property {string} narrative
 * @property {boolean=} startsNextMatch
 */

/**
 * Estructura auxiliar para aplicar cambios acumulados sobre el club.
 * @typedef {Object} ClubDelta
 * @property {number} budget
 * @property {number} reputation
 * @property {number} morale
 */

/**
 * Resultado de avanzar el estado canalla una jornada.
 * @typedef {Object} CanallaProgress
 * @property {{ budget: number; reputation: number; morale: number; heat: number; narratives: string[] }} applied
 * @property {CanallaStatus} status
 */

/**
 * Definición del tipo `DecisionParameters` con los modificadores internos.
 * @typedef {Object} DecisionParameters
 * @property {number} baseSuccess
 * @property {number} reputationSuccess
 * @property {number} reputationFailure
 * @property {number} moraleSuccess
 * @property {number} moraleFailure
 * @property {number} cost
 * @property {number} fine
 * @property {number} heatSuccess
 * @property {number} heatFailure
 * @property {number} cooldownMatches
 * @property {number=} detectionRisk
 * @property {MediumTermEffect[]=} successEffects
 * @property {MediumTermEffect[]=} failureEffects
 * @property {string=} successSanction
 * @property {string=} failureSanction
 */

const EURO_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const DEFAULT_FAILURE_SANCTION = 'La prensa ha pillado el pastel; posible sanción en el próximo comité.';
const PASSIVE_HEAT_COOLDOWN = 1;

/** @type {Record<CanallaDecision['intensity'], number>} */
const INTENSITY_MODIFIER = {
  baja: -0.08,
  media: 0,
  alta: 0.12,
};

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
    heatSuccess: 12,
    heatFailure: 24,
    cooldownMatches: 3,
    detectionRisk: 0.12,
    successEffects: [
      {
        target: 'reputation',
        magnitude: 2,
        duration: 2,
        narrative: 'Los parroquianos comentan que el silbato nos guiña el ojo.',
      },
    ],
    failureEffects: [
      {
        target: 'reputation',
        magnitude: -4,
        duration: 3,
        narrative: 'El barrio murmura sobre el sobre cazado en plena luz.',
      },
      {
        target: 'heat',
        magnitude: 6,
        duration: 2,
        narrative: 'Los programas nocturnos atizan el escándalo arbitral.',
      },
    ],
    failureSanction: DEFAULT_FAILURE_SANCTION,
  },
  filtrarRumor: {
    baseSuccess: 0.55,
    reputationSuccess: 3,
    reputationFailure: -9,
    moraleSuccess: 5,
    moraleFailure: -6,
    cost: -4000,
    fine: 15000,
    heatSuccess: 6,
    heatFailure: 14,
    cooldownMatches: 1,
    detectionRisk: 0.08,
    successEffects: [
      {
        target: 'morale',
        magnitude: 3,
        duration: 2,
        narrative: 'El vestuario se ríe del caos sembrado en la prensa.',
      },
    ],
    failureEffects: [
      {
        target: 'reputation',
        magnitude: -3,
        duration: 2,
        narrative: 'Los socios se indignan al descubrir la patraña.',
      },
      {
        target: 'heat',
        magnitude: 3,
        duration: 2,
        narrative: 'Columnistas y tuiteros ponen el foco en nuestras filtraciones.',
      },
    ],
    failureSanction: 'La afición detecta el bulo y exige disculpas públicas.',
  },
  fiestaIlegal: {
    baseSuccess: 0.4,
    reputationSuccess: 4,
    reputationFailure: -14,
    moraleSuccess: 12,
    moraleFailure: -15,
    cost: -8000,
    fine: 20000,
    heatSuccess: 10,
    heatFailure: 20,
    cooldownMatches: 2,
    detectionRisk: 0.1,
    successEffects: [
      {
        target: 'morale',
        magnitude: 5,
        duration: 3,
        narrative: 'El grupo sigue enchufado recordando la juerga clandestina.',
      },
    ],
    failureEffects: [
      {
        target: 'morale',
        magnitude: -9,
        duration: 3,
        narrative: 'La resaca disciplinaria pesa varios partidos.',
      },
      {
        target: 'reputation',
        magnitude: -4,
        duration: 2,
        narrative: 'Videos virales muestran al club sin control.',
      },
    ],
    failureSanction: 'La policía multa la fiesta y avisa a la liga del descontrol.',
  },
  presionarFederacion: {
    baseSuccess: 0.45,
    reputationSuccess: 7,
    reputationFailure: -10,
    moraleSuccess: 3,
    moraleFailure: -5,
    cost: -5000,
    fine: 25000,
    heatSuccess: 9,
    heatFailure: 18,
    cooldownMatches: 2,
    detectionRisk: 0.09,
    successEffects: [
      {
        target: 'heat',
        magnitude: -2,
        duration: 2,
        narrative: 'Los favores pactados enfrían las sospechas en despachos.',
        startsNextMatch: true,
      },
    ],
    failureEffects: [
      {
        target: 'reputation',
        magnitude: -5,
        duration: 2,
        narrative: 'La federación filtra la maniobra y quedamos retratados.',
      },
      {
        target: 'heat',
        magnitude: 5,
        duration: 2,
        narrative: 'Se multiplican las auditorías por la llamada cazada.',
      },
    ],
    failureSanction: 'Los federativos anuncian inspección en nuestras oficinas.',
  },
  sobornoJugador: {
    baseSuccess: 0.28,
    reputationSuccess: 7,
    reputationFailure: -22,
    moraleSuccess: 10,
    moraleFailure: -14,
    cost: -45000,
    fine: 120000,
    heatSuccess: 18,
    heatFailure: 32,
    cooldownMatches: 4,
    detectionRisk: 0.18,
    successEffects: [
      {
        target: 'morale',
        magnitude: 6,
        duration: 3,
        narrative: 'El vestuario presume de tener a los rivales en el bolsillo.',
      },
    ],
    failureEffects: [
      {
        target: 'morale',
        magnitude: -8,
        duration: 3,
        narrative: 'Las dudas internas rompen la confianza del grupo.',
      },
      {
        target: 'reputation',
        magnitude: -5,
        duration: 2,
        narrative: 'El rumor de compra fallida mancha las tertulias.',
      },
    ],
    failureSanction: 'Los comités disciplinarios investigan el intento de amaño.',
  },
  manipularCesped: {
    baseSuccess: 0.52,
    reputationSuccess: 2,
    reputationFailure: -8,
    moraleSuccess: 5,
    moraleFailure: -7,
    cost: -5000,
    fine: 16000,
    heatSuccess: 5,
    heatFailure: 12,
    cooldownMatches: 1,
    detectionRisk: 0.08,
    successEffects: [
      {
        target: 'morale',
        magnitude: 4,
        duration: 2,
        narrative: 'El césped a medida impulsa nuestra confianza callejera.',
      },
      {
        target: 'heat',
        magnitude: -2,
        duration: 2,
        narrative: 'La trampa pasa desapercibida entre bromas de la grada.',
        startsNextMatch: true,
      },
    ],
    failureEffects: [
      {
        target: 'reputation',
        magnitude: -3,
        duration: 2,
        narrative: 'Rivales y periodistas nos acusan de destrozar el tapete.',
      },
      {
        target: 'heat',
        magnitude: 4,
        duration: 2,
        narrative: 'Los cuidadores rivales exigen sanciones por la manipulación.',
      },
    ],
    failureSanction: 'El acta arbitral recoge el césped sabotajeado y avisa a la liga.',
  },
  espionajeAnalitico: {
    baseSuccess: 0.4,
    reputationSuccess: 4,
    reputationFailure: -16,
    moraleSuccess: 6,
    moraleFailure: -9,
    cost: -15000,
    fine: 70000,
    heatSuccess: 16,
    heatFailure: 28,
    cooldownMatches: 3,
    detectionRisk: 0.2,
    successEffects: [
      {
        target: 'budget',
        magnitude: 10000,
        duration: 1,
        narrative: 'Un patrocinador paga por el informe de datos robados.',
        startsNextMatch: false,
      },
      {
        target: 'heat',
        magnitude: 3,
        duration: 2,
        narrative: 'Foros tecnológicos sospechan pero sin pruebas concluyentes.',
      },
    ],
    failureEffects: [
      {
        target: 'budget',
        magnitude: -12000,
        duration: 2,
        narrative: 'Reparar los servidores hackeados drena la tesorería.',
      },
      {
        target: 'heat',
        magnitude: 8,
        duration: 3,
        narrative: 'Expertos en ciberseguridad señalan al club sin piedad.',
      },
    ],
    failureSanction: 'La liga abre expediente tecnológico por espionaje digital.',
  },
};

const CUP_REPUTATION_MAP = new Map(CUP_ROUND_DEFINITIONS.map((definition) => [definition.id, definition]));

/**
 * Reduce el valor a un rango controlado.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Garantiza una estructura de estado canalla válida.
 * @param {CanallaStatus | undefined} status
 * @returns {CanallaStatus}
 */
function ensureCanallaStatus(status) {
  const heat = clamp(status?.heat ?? 0, 0, 100);
  /** @type {Record<CanallaDecision['type'], number>} */
  const cooldowns = {};
  if (status && status.cooldowns) {
    Object.entries(status.cooldowns).forEach(([key, value]) => {
      const numeric = Number.isFinite(value) ? Number(value) : 0;
      cooldowns[/** @type {CanallaDecision['type']} */ (key)] = numeric > 0 ? Math.trunc(numeric) : 0;
    });
  }
  const effects = Array.isArray(status?.ongoingEffects)
    ? status.ongoingEffects
        .filter((effect) => effect && typeof effect === 'object')
        .map((effect) => ({
          source: effect.source,
          target: effect.target,
          magnitude: Number(effect.magnitude) || 0,
          remainingMatches: Math.max(0, Math.trunc(effect.remainingMatches ?? 0)),
          narrative: effect.narrative ?? '',
          startsNextMatch: effect.startsNextMatch === true,
        }))
        .filter((effect) => Boolean(effect.source))
    : [];
  return {
    heat,
    cooldowns,
    ongoingEffects: effects,
  };
}

/**
 * Aplica los efectos canallas pendientes y enfría ligeramente la sospecha.
 * @param {CanallaStatus} status
 * @returns {CanallaProgress}
 */
function progressCanallaStatus(status) {
  const applied = { budget: 0, reputation: 0, morale: 0, heat: 0, narratives: [] };
  /** @type {CanallaOngoingEffect[]} */
  const nextEffects = [];
  status.ongoingEffects.forEach((effect) => {
    const effectToApply = effect.startsNextMatch
      ? { ...effect, startsNextMatch: false }
      : effect;
    if (effectToApply.remainingMatches <= 0) {
      return;
    }
    switch (effectToApply.target) {
      case 'budget':
        applied.budget += effectToApply.magnitude;
        break;
      case 'reputation':
        applied.reputation += effectToApply.magnitude;
        break;
      case 'morale':
        applied.morale += effectToApply.magnitude;
        break;
      case 'heat':
        applied.heat += effectToApply.magnitude;
        break;
      default:
        break;
    }
    if (effectToApply.narrative) {
      const remainingAfter = effectToApply.remainingMatches - 1;
      const suffix = remainingAfter > 0 ? ` (restan ${remainingAfter} jornadas)` : ' (último coletazo)';
      applied.narratives.push(`${effectToApply.narrative}${suffix}`);
    }
    if (effectToApply.remainingMatches > 1) {
      nextEffects.push({ ...effectToApply, remainingMatches: effectToApply.remainingMatches - 1 });
    }
  });

  const cooledHeat = clamp(status.heat - (status.heat > 0 ? PASSIVE_HEAT_COOLDOWN : 0) + applied.heat, 0, 100);
  applied.heat = cooledHeat - status.heat;

  /** @type {Record<CanallaDecision['type'], number>} */
  const cooldowns = {};
  Object.entries(status.cooldowns).forEach(([key, value]) => {
    const numeric = Number(value) || 0;
    cooldowns[/** @type {CanallaDecision['type']} */ (key)] = numeric > 0 ? Math.max(0, Math.trunc(numeric) - 1) : 0;
  });

  return {
    applied,
    status: {
      heat: cooledHeat,
      cooldowns,
      ongoingEffects: nextEffects,
    },
  };
}

/**
 * Aplica deltas al club manteniendo la moral en el rango permitido.
 * @param {ClubState} club
 * @param {ClubDelta} deltas
 * @returns {ClubState}
 */
function applyClubDeltas(club, deltas) {
  const squadLength = club.squad.length;
  const moralePerPlayer = squadLength > 0 ? deltas.morale / squadLength : 0;
  const updatedSquad = club.squad.map((player) => ({
    ...player,
    morale: clamp(player.morale + moralePerPlayer, -100, 100),
  }));
  return {
    ...club,
    budget: club.budget + deltas.budget,
    reputation: clamp(club.reputation + deltas.reputation, -100, 100),
    squad: updatedSquad,
  };
}

/**
 * Suma la moral total de la plantilla.
 * @param {ClubState['squad']} squad
 * @returns {number}
 */
function sumMorale(squad) {
  return squad.reduce((sum, player) => sum + player.morale, 0);
}

/**
 * Convierte efectos a medio plazo en estructuras internas.
 * @param {MediumTermEffect[] | undefined} effects
 * @param {CanallaDecision['type']} source
 * @returns {CanallaOngoingEffect[]}
 */
function scheduleEffects(effects, source) {
  if (!Array.isArray(effects)) {
    return [];
  }
  return effects.map((effect) => ({
    source,
    target: effect.target,
    magnitude: effect.magnitude,
    remainingMatches: Math.max(1, Math.trunc(effect.duration)),
    narrative: effect.narrative,
    startsNextMatch: effect.startsNextMatch !== false,
  }));
}

/**
 * Describe un efecto pendiente para mostrarlo en la interfaz.
 * @param {CanallaOngoingEffect} effect
 * @returns {string}
 */
function formatEffectSummary(effect) {
  const startText = effect.startsNextMatch ? 'Empieza la próxima jornada' : 'Activo desde ya';
  const remainingText = effect.remainingMatches > 1 ? `${effect.remainingMatches} jornadas pendientes` : 'Última jornada pendiente';
  return `${effect.narrative} · ${startText} · ${remainingText}.`;
}

/**
 * Avanza una jornada el estado canalla sin ejecutar nuevas travesuras.
 * @param {ClubState} club
 * @returns {CanallaProgress & { updatedClub: ClubState }}
 */
export function tickCanallaState(club) {
  const ensuredStatus = ensureCanallaStatus(club.canallaStatus);
  const progress = progressCanallaStatus(ensuredStatus);
  const clubWithStatus = { ...club, canallaStatus: ensuredStatus };
  const clubAfterEffects = applyClubDeltas(clubWithStatus, {
    budget: progress.applied.budget,
    reputation: progress.applied.reputation,
    morale: progress.applied.morale,
  });
  const updatedClub = { ...clubAfterEffects, canallaStatus: progress.status };
  return { updatedClub, ...progress };
}

/**
 * Resuelve una decisión canalla aplicando cambios en reputación, moral y finanzas.
 * @param {ClubState} club Estado actual del club.
 * @param {CanallaDecision} decision Travesura elegida.
 * @param {() => number} [rng] Generador aleatorio opcional.
 * @returns {DecisionResolution}
 */
export function resolveCanallaDecision(club, decision, rng = Math.random) {
  const params = DECISION_MAP[decision.type];
  if (!params) {
    return {
      outcome: {
        success: false,
        reputationChange: 0,
        financesChange: 0,
        moraleChange: 0,
        riskLevel: 0,
        heatChange: 0,
        sanctions: undefined,
        narrative: 'La jugada escogida no tiene efectos registrados.',
        appliedToClub: false,
      },
      updatedClub: club,
    };
  }

  const initialHeat = clamp(club.canallaStatus?.heat ?? 0, 0, 100);
  const passiveAdvance = tickCanallaState(club);
  let workingClub = passiveAdvance.updatedClub;
  const progressedStatus = workingClub.canallaStatus ?? ensureCanallaStatus(undefined);

  const intensity = INTENSITY_MODIFIER[decision.intensity] ?? 0;
  const heatPenalty = progressedStatus.heat / 250;
  const successThreshold = clamp(params.baseSuccess + intensity - heatPenalty, 0.05, 0.85);
  const success = rng() < successThreshold;

  const immediateBudget = success ? params.cost : params.cost - params.fine;
  const immediateReputation = success ? params.reputationSuccess : params.reputationFailure;
  const immediateMorale = success ? params.moraleSuccess : params.moraleFailure;

  workingClub = applyClubDeltas(workingClub, {
    budget: immediateBudget,
    reputation: immediateReputation,
    morale: immediateMorale,
  });

  let heatAfterDecision = clamp(
    progressedStatus.heat + (success ? params.heatSuccess : params.heatFailure),
    0,
    100
  );

  const detectionBase = params.detectionRisk ?? 0.07;
  const cumulativeRisk = Math.min(0.9, detectionBase + Math.max(0, heatAfterDecision - 20) / 120);
  let inspectionNarrative;
  let inspectionNote;
  if (rng() < cumulativeRisk) {
    const inspectionFine = Math.round(Math.max(params.fine * 0.35, 15000 + heatAfterDecision * 320));
    workingClub = applyClubDeltas(workingClub, {
      budget: -inspectionFine,
      reputation: -4,
      morale: -3,
    });
    heatAfterDecision = clamp(heatAfterDecision + 6, 0, 100);
    inspectionNarrative = `Los auditores huelen la jugada: multa extra de ${EURO_FORMATTER.format(
      inspectionFine
    )} y bronca pública.`;
    inspectionNote = 'Los inspectores se presentan en la ciudad deportiva tras la sospecha creciente.';
  }

  const scheduledEffects = scheduleEffects(success ? params.successEffects : params.failureEffects, decision.type);
  const cooldowns = { ...progressedStatus.cooldowns };
  cooldowns[decision.type] = params.cooldownMatches > 0 ? params.cooldownMatches : 0;

  const finalStatus = {
    heat: heatAfterDecision,
    cooldowns,
    ongoingEffects: [...progressedStatus.ongoingEffects, ...scheduledEffects],
  };

  const updatedClub = { ...workingClub, canallaStatus: finalStatus };
  const totalBudgetChange = updatedClub.budget - club.budget;
  const totalReputationChange = updatedClub.reputation - club.reputation;
  const totalMoraleChange = sumMorale(updatedClub.squad) - sumMorale(club.squad);
  const totalHeatChange = finalStatus.heat - initialHeat;

  let riskLevel = clamp(Math.round((1 - successThreshold) * 50 + finalStatus.heat), 0, 100);
  if (inspectionNarrative) {
    riskLevel = Math.min(100, riskLevel + 10);
  }

  const scheduledSummaries = scheduledEffects.map((effect) => formatEffectSummary(effect));
  const ongoingConsequences = [
    ...passiveAdvance.applied.narratives,
    ...scheduledSummaries,
    ...(inspectionNarrative ? [inspectionNarrative] : []),
  ];

  const narrativeParts = [success ? generarNarrativaExito(decision) : generarNarrativaDesastre(decision)];
  if (inspectionNote) {
    narrativeParts.push(inspectionNote);
  }
  const narrative = narrativeParts.join(' ');

  const sanctions = success ? params.successSanction : params.failureSanction ?? DEFAULT_FAILURE_SANCTION;

  const outcome = {
    success,
    reputationChange: totalReputationChange,
    financesChange: totalBudgetChange,
    moraleChange: totalMoraleChange,
    heatChange: totalHeatChange,
    riskLevel,
    sanctions: success ? sanctions ?? undefined : sanctions,
    narrative,
    ongoingConsequences: ongoingConsequences.length > 0 ? ongoingConsequences : undefined,
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
    case 'sobornoJugador':
      return 'El crack rival se borró misteriosamente y el barrio canta nuestra picardía.';
    case 'manipularCesped':
      return 'El tapete amaneció áspero para el rival y seda para los nuestros; magia urbana pura.';
    case 'espionajeAnalitico':
      return 'Los datos robados iluminaron el tablero táctico; parecíamos adivinos del barrio.';
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
    case 'sobornoJugador':
      return 'El soborno salió en portada y ahora medio país nos señala con el dedo.';
    case 'manipularCesped':
      return 'Los aspersores traicionaron el plan y la queja rival nos deja como tramposos de barrio.';
    case 'espionajeAnalitico':
      return 'El hackeo quedó registrado y los técnicos nos exponen en directo.';
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
