// @ts-check
/**
 * Motor de simulación de partidos para el chiringuito canalla.
 * Implementación en JavaScript puro con tipados vía JSDoc.
 * @module core/engine
 */

import { calculateMatchdayFinances } from './economy.js';
import { createEmptySeasonLog, createSeasonStats } from './data.js';
import { buildMatchVisualization2D } from './visualization.js';

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').MatchDayReport} MatchDayReport */
/** @typedef {import('../types.js').MatchEvent} MatchEvent */
/** @typedef {import('../types.js').MatchResult} MatchResult */
/** @typedef {import('../types.js').PlayerContribution} PlayerContribution */
/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */
/** @typedef {import('../types.js').DecisionOutcome} DecisionOutcome */
/** @typedef {import('../types.js').Player} Player */
/** @typedef {import('../types.js').TacticalInstructions} TacticalInstructions */
/** @typedef {import('../types.js').MatchAdjustment} MatchAdjustment */

/**
 * Definición del tipo `MatchSimulationOptions`.
 * @typedef {Object} MatchSimulationOptions
 * @property {() => number=} rng
 * @property {CanallaDecision=} decision
 * @property {DecisionOutcome=} decisionOutcome
 * @property {number | string=} seed
 */

const MATCH_MINUTES = Array.from({ length: 18 }, (_, index) => (index + 1) * 5);
const MAX_SUBSTITUTIONS = 5;
const DEFAULT_INSTRUCTIONS = {
  pressing: 'medium',
  tempo: 'balanced',
  width: 'balanced',
  counterAttack: false,
  playThroughMiddle: true,
};

/**
 * Convierte cualquier tipo de semilla en un entero sin signo reproducible.
 * @param {number | string} seed Semilla inicial numérica o textual.
 */
function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  if (typeof seed === 'string') {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return hash >>> 0;
  }
  return Math.floor(Math.random() * 1_000_000_000) >>> 0;
}

/**
 * Crea un generador Mulberry32 determinista a partir de una semilla amigable.
 * @param {number | string} seed Semilla que define la secuencia pseudoaleatoria.
 */
function createSeededRng(seed) {
  let t = hashSeed(seed) + 0x6d2b79f5;
  return function seeded() {
    t += 0x6d2b79f5;
    let value = t;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Determina si un futbolista actúa como guardameta.
 * @param {Player} player Jugador a evaluar.
 */
function isGoalkeeper(player) {
  return player.position === 'GK';
}

/**
 * Incrementa de forma segura un contador numérico en un registro arbitrario.
 * @param {Record<string, number>} record Diccionario donde acumular.
 * @param {string} key Clave del contador a modificar.
 * @param {number} value Incremento que se desea sumar.
 */
function accumulate(record, key, value) {
  record[key] = (record[key] ?? 0) + value;
}

/**
 * Acota un valor numérico dentro de un intervalo específico.
 * @template T extends number
 * @param {T} value Valor original.
 * @param {T} min Límite inferior permitido.
 * @param {T} max Límite superior permitido.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calcula la media de un atributo de todos los jugadores recibidos.
 * @param {Player[]} players Plantilla sobre la que operar.
 * @param {keyof Player['attributes']} key Atributo que se desea promediar.
 */
function averageAttribute(players, key) {
  if (players.length === 0) {
    return 0;
  }
  const total = players.reduce((sum, player) => sum + player.attributes[key], 0);
  return total / players.length;
}

/**
 * Calcula la moral media del grupo indicado.
 * @param {Player[]} players Plantilla sobre la que medir el ánimo.
 */
function averageMorale(players) {
  if (players.length === 0) {
    return 0;
  }
  const total = players.reduce((sum, player) => sum + player.morale, 0);
  return total / players.length;
}

/**
 * Transforma la táctica seleccionada en un modificador numérico de rendimiento.
 * @param {MatchConfig['tactic']} tactic Estilo táctico del club.
 */
function tacticModifier(tactic) {
  switch (tactic) {
    case 'defensive':
      return 0.92;
    case 'attacking':
      return 1.05;
    case 'balanced':
      return 1;
    default:
      return 1;
  }
}

/**
 * Devuelve el perfil ofensivo/defensivo asociado a una formación.
 * @param {string} formation Cadena con la disposición táctica (4-4-2, 3-5-2...).
 */
function formationProfile(formation) {
  switch (formation) {
    case '4-3-3':
      return { attack: 1.06, defense: 0.96, creativity: 1.1 };
    case '3-5-2':
      return { attack: 1.03, defense: 0.98, creativity: 1.05 };
    case '5-3-2':
      return { attack: 0.96, defense: 1.08, creativity: 0.95 };
    case '4-2-3-1':
      return { attack: 1.02, defense: 1.0, creativity: 1.08 };
    case '4-1-4-1':
      return { attack: 0.99, defense: 1.04, creativity: 1.02 };
    case '4-4-2':
    default:
      return { attack: 1.0, defense: 1.02, creativity: 1.0 };
  }
}

/**
 * Calcula una puntuación de fuerza global del club para ponderar la simulación.
 * @param {Player[]} players Jugadores involucrados en el partido.
 * @param {MatchConfig} config Configuración táctica seleccionada.
 * @param {number} [moraleBoost] Bonificación temporal de moral.
 */
function calculateClubStrength(players, config, moraleBoost = 0) {
  const shape = formationProfile(config.formation ?? '4-4-2');
  const attackBase = (averageAttribute(players, 'passing') + averageAttribute(players, 'shooting')) / 2;
  const defenseBase = (averageAttribute(players, 'defending') + averageAttribute(players, 'stamina')) / 2;
  const leadership = averageAttribute(players, 'leadership');
  const creativity = averageAttribute(players, 'dribbling') * 0.05 * shape.creativity;
  const morale = averageMorale(players) + moraleBoost;
  const homeBoost = config.home ? 5 : 0;
  const tacticBonus = tacticModifier(config.tactic) * 10;

  const attack = attackBase * shape.attack;
  const defense = defenseBase * shape.defense;

  return attack * 0.4 + defense * 0.3 + leadership * 0.1 + morale * 0.1 + homeBoost + tacticBonus + creativity;
}

/**
 * Construye las primeras líneas de la crónica del encuentro.
 * @param {MatchConfig} config Configuración del partido.
 * @param {ClubState} club Club protagonista.
 * @returns {string[]} Mensajes introductorios para la narrativa.
 */
function narrativeIntro(config, club) {
  const place = config.home ? 'en el templo propio' : 'visitando campo ajeno';
  const rawOpponent = typeof config.opponentName === 'string' ? config.opponentName.trim() : '';
  const opponentLabel = rawOpponent.length > 0 ? rawOpponent : 'Rival misterioso';
  return [
    `La banda del ${club.name} salta al verde ${place}, con la grada lista para repartir cera verbal ante ${opponentLabel}.`,
  ];
}

/**
 * Escoge al jugador del partido entre las mejores actuaciones.
 * @param {PlayerContribution[]} contributions Calificaciones individuales registradas.
 * @param {() => number} rng Generador aleatorio que desempata entre candidatos.
 * @returns {PlayerContribution | undefined} MVP seleccionado si existe.
 */
function pickManOfTheMatch(contributions, rng) {
  if (contributions.length === 0) {
    return undefined;
  }
  const sorted = [...contributions].sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, 3);
  const index = Math.floor(rng() * top.length);
  return top[index];
}

/**
 * Obtiene las plantillas iniciales y suplentes a partir de la configuración.
 * @param {ClubState} club Club que disputa el encuentro.
 * @param {MatchConfig} config Configuración táctica y de alineación.
 */
function getMatchSquads(club, config) {
  const map = new Map(club.squad.map((player) => [player.id, player]));
  const starters = (config.startingLineup ?? [])
    .map((id) => map.get(id))
    .filter((player) => Boolean(player));
  const starterIds = new Set(starters.map((player) => player.id));
  const substitutes = (config.substitutes ?? [])
    .map((id) => map.get(id))
    .filter((player) => player && !starterIds.has(player.id));

  return {
    starters,
    substitutes,
  };
}

/**
 * Fusiona las instrucciones recibidas con los valores por defecto del motor.
 * @param {TacticalInstructions | undefined} instructions Indicaciones originales.
 * @returns {Required<TacticalInstructions>} Instrucciones completas y normalizadas.
 */
function mergeInstructions(instructions) {
  return { ...DEFAULT_INSTRUCTIONS, ...(instructions ?? {}) };
}

/**
 * Traduce unas instrucciones tácticas en modificadores numéricos para la simulación.
 * @param {Required<TacticalInstructions>} instructions Ordenes tácticas finalizadas.
 */
function instructionProfile(instructions) {
  const pressing = instructions.pressing ?? 'medium';
  const tempo = instructions.tempo ?? 'balanced';
  const width = instructions.width ?? 'balanced';
  let chanceBias = 0;
  let possessionBias = 0;
  let foulRisk = 0.06;
  let passAccuracy = 0;
  let passAttempts = 0;
  let defenseBias = 0;
  let fatigueMultiplier = 1;

  if (pressing === 'high') {
    chanceBias += 0.04;
    foulRisk += 0.05;
    fatigueMultiplier += 0.12;
    possessionBias += 0.04;
  } else if (pressing === 'low') {
    chanceBias -= 0.03;
    foulRisk -= 0.03;
    defenseBias += 0.02;
    fatigueMultiplier -= 0.08;
  }

  if (tempo === 'fast') {
    chanceBias += 0.03;
    passAccuracy -= 0.04;
    passAttempts += 3;
    fatigueMultiplier += 0.08;
  } else if (tempo === 'slow') {
    chanceBias -= 0.02;
    passAccuracy += 0.05;
    passAttempts -= 2;
  }

  if (width === 'wide') {
    chanceBias += 0.02;
    defenseBias -= 0.02;
  } else if (width === 'narrow') {
    chanceBias -= 0.01;
    defenseBias += 0.03;
  }

  if (instructions.counterAttack) {
    chanceBias += 0.03;
    possessionBias -= 0.03;
  }

  if (instructions.playThroughMiddle) {
    passAccuracy += 0.02;
    possessionBias += 0.01;
  }

  return {
    chanceBias,
    possessionBias,
    foulRisk,
    passAccuracy,
    passAttempts,
    defenseBias,
    fatigueMultiplier,
  };
}

/**
 * Crea un objeto de estadísticas partido vacío listo para ir rellenando cifras.
 * @returns {import('../types.js').MatchStatistics}
 */
function createEmptyStatistics() {
  return {
    possession: { for: 0, against: 0 },
    shots: { for: 0, against: 0, onTargetFor: 0, onTargetAgainst: 0 },
    expectedGoals: { for: 0, against: 0 },
    passes: { completedFor: 0, attemptedFor: 0, completedAgainst: 0, attemptedAgainst: 0 },
    fouls: { for: 0, against: 0 },
    cards: { yellowFor: 0, yellowAgainst: 0, redFor: 0, redAgainst: 0 },
    injuries: { for: 0, against: 0 },
    saves: { for: 0, against: 0 },
  };
}

/**
 * Garantiza que exista una contribución registrada para un jugador concreto.
 * @param {Map<string, PlayerContribution>} contributions Tabla de contribuciones acumuladas.
 * @param {string} playerId Identificador del jugador buscado.
 * @param {number} [base] Nota inicial opcional.
 */
function ensureContribution(contributions, playerId, base = 6) {
  if (!contributions.has(playerId)) {
    contributions.set(playerId, {
      playerId,
      rating: base,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      passesAttempted: 0,
      passesCompleted: 0,
      tackles: 0,
      saves: 0,
      minutesPlayed: 0,
    });
  }
  return contributions.get(playerId);
}

/**
 * Suma minutos jugados a toda una lista de jugadores a la vez.
 * @param {Map<string, PlayerContribution>} contributions Tabla de actuaciones.
 * @param {Player[]} players Participantes afectados.
 * @param {number} minutes Minutos a añadir.
 */
function addMinutesPlayed(contributions, players, minutes) {
  for (const player of players) {
    const contribution = ensureContribution(contributions, player.id);
    contribution.minutesPlayed = (contribution.minutesPlayed ?? 0) + minutes;
  }
}

/**
 * Selecciona un jugador ponderando por uno de sus atributos.
 * @param {Player[]} players Candidatos disponibles.
 * @param {keyof Player['attributes']} attribute Atributo utilizado como peso.
 * @param {() => number} rng Generador aleatorio.
 */
function selectPlayerWeighted(players, attribute, rng) {
  const total = players.reduce((sum, player) => sum + (player.attributes[attribute] || 1), 0);
  if (total <= 0) {
    return players[Math.floor(rng() * players.length)] ?? players[0];
  }
  const pick = rng() * total;
  let cumulative = 0;
  for (const player of players) {
    cumulative += player.attributes[attribute] || 1;
    if (pick <= cumulative) {
      return player;
    }
  }
  return players[players.length - 1];
}

/**
 * Ejecuta un cambio de jugadores actualizando eventos, comentarios y actuaciones.
 * @param {Player[]} lineup Once sobre el césped.
 * @param {Player[]} bench Banquillo disponible.
 * @param {Map<string, PlayerContribution>} contributions Tabla de actuaciones.
 * @param {MatchEvent[]} events Registro de eventos del partido.
 * @param {string[]} commentary Comentarios narrativos.
 * @param {number} minute Minuto en el que sucede el cambio.
 * @param {string} reason Motivo declarado de la sustitución.
 * @param {string} outId Jugador que se retira.
 * @param {string} inId Jugador que entra.
 */
function performSubstitution(lineup, bench, contributions, events, commentary, minute, reason, outId, inId) {
  const outIndex = lineup.findIndex((player) => player.id === outId);
  const inIndex = bench.findIndex((player) => player.id === inId);
  if (outIndex === -1 || inIndex === -1) {
    return false;
  }

  const outgoing = lineup[outIndex];
  const incoming = bench.splice(inIndex, 1)[0];
  lineup[outIndex] = incoming;

  ensureContribution(contributions, incoming.id, 5.5);
  ensureContribution(contributions, outgoing.id);

  events.push({
    minute,
    type: 'cambio',
    description: `Minuto ${minute}: se marcha ${outgoing.name} y entra ${incoming.name} (${reason}).`,
    playerId: incoming.id,
    relatedPlayerId: outgoing.id,
  });
  commentary.push(`(${minute}') ${incoming.name} recibe la última arenga y salta al césped.`);
  return true;
}

/**
 * Gestiona la entrada del portero suplente tras una expulsión.
 * @param {Player[]} lineup
 * @param {Player[]} bench
 * @param {Map<string, PlayerContribution>} contributions
 * @param {MatchEvent[]} events
 * @param {string[]} commentary
 * @param {number} minute
 */
function handleGoalkeeperEmergency(lineup, bench, contributions, events, commentary, minute) {
  const targetCount = lineup.length;
  const benchIndex = bench.findIndex((player) => player.position === 'GK');
  if (benchIndex === -1) {
    commentary.push(`(${minute}') El banquillo no tenía guardameta: tocará improvisar bajo palos.`);
    return;
  }

  const incoming = bench.splice(benchIndex, 1)[0];
  ensureContribution(contributions, incoming.id, 5.8);

  let sacrificed;
  if (lineup.length > 0 && lineup.length >= targetCount) {
    const fieldIndex = lineup.findIndex((player) => player.position !== 'GK');
    const removalIndex = fieldIndex === -1 ? lineup.length - 1 : fieldIndex;
    sacrificed = lineup.splice(removalIndex, 1)[0];
  }

  lineup.push(incoming);

  events.push({
    minute,
    type: 'cambio',
    description:
      sacrificed
        ? `Minuto ${minute}: ${incoming.name} entra para ocupar la portería; ${sacrificed.name} deja su sitio tras la roja.`
        : `Minuto ${minute}: ${incoming.name} toma los guantes tras la expulsión del portero titular.`,
    playerId: incoming.id,
    relatedPlayerId: sacrificed?.id,
  });
  commentary.push(
    sacrificed
      ? `(${minute}') ${incoming.name} salta de urgencia a la meta mientras ${sacrificed?.name ?? 'un compañero'} paga el pato.`
      : `(${minute}') ${incoming.name} salta de urgencia a la meta tras la roja.`
  );
}

/**
 * Aplica un ajuste táctico programado sobre el flujo del partido.
 * @param {MatchAdjustment} adjustment Instrucciones que deben ejecutarse.
 * @param {Player[]} lineup Once actual.
 * @param {Player[]} bench Banquillo disponible.
 * @param {Map<string, PlayerContribution>} contributions Registro de actuaciones.
 * @param {MatchEvent[]} events Línea temporal de eventos.
 * @param {string[]} commentary Frases narrativas acumuladas.
 * @param {number} minute Minuto en el que se ejecuta la orden.
 * @param {() => number} rng Generador aleatorio de apoyo.
 * @param {{ tactic: string; formation: string; instructions: Required<TacticalInstructions>; substitutionsUsed: number }} state Estado táctico actual del club.
 */
function applyAdjustment(
  adjustment,
  lineup,
  bench,
  contributions,
  events,
  commentary,
  minute,
  rng,
  state
) {
  if (adjustment.tactic) {
    state.tactic = adjustment.tactic;
    commentary.push(`(${minute}') El míster mueve el joystick táctico: ${adjustment.tactic.toUpperCase()}.`);
  }
  if (adjustment.formation) {
    state.formation = adjustment.formation;
    commentary.push(`(${minute}') Nuevo dibujo sobre la alfombra: ${adjustment.formation}.`);
  }
  if (adjustment.instructions) {
    state.instructions = mergeInstructions({ ...state.instructions, ...adjustment.instructions });
    commentary.push(`(${minute}') Se grita desde la banda una pizarra distinta, la grada murmura.`);
  }
  if (adjustment.substitutions && state.substitutionsUsed < MAX_SUBSTITUTIONS) {
    for (const change of adjustment.substitutions) {
      if (state.substitutionsUsed >= MAX_SUBSTITUTIONS) {
        break;
      }
      const success = performSubstitution(
        lineup,
        bench,
        contributions,
        events,
        commentary,
        minute,
        change.reason ?? 'ajuste táctico',
        change.out,
        change.in
      );
      if (success) {
        state.substitutionsUsed += 1;
      }
    }
  }
}

/**
 * Intenta encontrar un sustituto automático por lesión.
 * @param {Player[]} lineup
 * @param {Player[]} bench
 * @param {Player} injured
 */
function pickReplacement(lineup, bench, injured) {
  if (bench.length === 0) {
    return undefined;
  }
  const sameRole = bench.find((player) => player.position === injured.position);
  if (sameRole) {
    return sameRole.id;
  }
  const similar = bench.slice().sort((a, b) => b.attributes.pace - a.attributes.pace)[0];
  return similar?.id;
}

/**
 * Ejecuta la simulación completa de un partido para el club proporcionado.
 * @param {ClubState} club Información detallada del club canalla.
 * @param {MatchConfig} config Configuración del partido y alineaciones.
 * @param {MatchSimulationOptions} [options] Opciones adicionales como RNG o decisiones.
 * @returns {MatchResult} Resultado del encuentro con estadísticas y narrativa.
 */
export function simulateMatch(club, config, options = {}) {
  const seedValue = options.seed !== undefined ? hashSeed(options.seed) : undefined;
  const seededRng = options.seed !== undefined ? createSeededRng(options.seed) : undefined;
  const rng = options.rng ?? seededRng ?? Math.random;
  const decisionOutcome = options.decisionOutcome;
  const decisionEffectsPending = Boolean(decisionOutcome) && decisionOutcome.appliedToClub !== true;
  const moraleBoost =
    decisionEffectsPending && decisionOutcome?.success ? decisionOutcome.moraleChange : 0;
  const intimidation =
    decisionEffectsPending && decisionOutcome?.success ? decisionOutcome.reputationChange * 0.2 : 0;

  const { starters, substitutes } = getMatchSquads(club, config);
  const lineup = starters.length > 0 ? [...starters] : [...club.squad.slice(0, 11)];
  const bench = starters.length > 0 ? [...substitutes] : [...club.squad.slice(11)];
  const initialLineup = [...lineup];
  const playerMap = new Map(club.squad.map((player) => [player.id, player]));

  const adjustmentState = {
    tactic: config.tactic ?? 'balanced',
    formation: config.formation ?? '4-4-2',
    instructions: mergeInstructions(config.instructions),
    substitutionsUsed: 0,
  };

  const scheduledAdjustments = [];
  if (config.halftimeAdjustments) {
    scheduledAdjustments.push({
      ...config.halftimeAdjustments,
      minute: config.halftimeAdjustments.minute ?? 50,
    });
  }
  for (const adjustment of config.inMatchAdjustments ?? []) {
    scheduledAdjustments.push({
      ...adjustment,
      minute: adjustment.minute ?? 70,
    });
  }
  const appliedAdjustments = new Set();

  const statistics = createEmptyStatistics();
  const commentary = [];
  const events = narrativeIntro(config, club).map((line) => ({ minute: 0, type: 'intro', description: line }));

  const contributions = new Map();
  const yellowCards = new Map();
  const redCards = new Set();
  for (const player of lineup) {
    ensureContribution(contributions, player.id, 6.2);
  }
  for (const player of bench) {
    ensureContribution(contributions, player.id, 5.4);
  }

  const difficultyMultiplier =
    typeof config.difficultyMultiplier === 'number' && Number.isFinite(config.difficultyMultiplier)
      ? clamp(config.difficultyMultiplier, 0.2, 2)
      : 1;

  const initialStrength = calculateClubStrength(
    lineup,
    { ...config, tactic: adjustmentState.tactic, formation: adjustmentState.formation },
    moraleBoost
  );
  const opponentStrength = config.opponentStrength * difficultyMultiplier + intimidation;

  let goalsFor = 0;
  let goalsAgainst = 0;
  let substitutionsUsed = 0;
  let lastMinute = 0;

  const passingQuality = averageAttribute(lineup, 'passing') / 100;

  for (const minute of MATCH_MINUTES) {
    const delta = minute - lastMinute;
    addMinutesPlayed(contributions, lineup, delta);
    lastMinute = minute;

    adjustmentState.substitutionsUsed = substitutionsUsed;
    for (let index = 0; index < scheduledAdjustments.length; index += 1) {
      const adjustment = scheduledAdjustments[index];
      if (!adjustment) {
        continue;
      }
      const key = `${index}`;
      if (!appliedAdjustments.has(key) && (adjustment.minute ?? 90) <= minute) {
        applyAdjustment(
          adjustment,
          lineup,
          bench,
          contributions,
          events,
          commentary,
          minute,
          rng,
          adjustmentState
        );
        substitutionsUsed = adjustmentState.substitutionsUsed;
        appliedAdjustments.add(key);
      }
    }

    const strengthNow = calculateClubStrength(
      lineup,
      { ...config, tactic: adjustmentState.tactic, formation: adjustmentState.formation },
      moraleBoost
    );
    const strengthDiff = strengthNow - opponentStrength;
    const instructionsImpact = instructionProfile(adjustmentState.instructions);
    const tacticBias = adjustmentState.tactic === 'attacking' ? 0.05 : adjustmentState.tactic === 'defensive' ? -0.04 : 0;
    const defenseAdjustment = adjustmentState.tactic === 'defensive' ? 0.05 : adjustmentState.tactic === 'attacking' ? -0.03 : 0;
    const segmentPossession = clamp(
      50 + strengthDiff * 0.35 + instructionsImpact.possessionBias * 100 + tacticBias * 40,
      25,
      75
    );
    statistics.possession.for += segmentPossession;
    statistics.possession.against += 100 - segmentPossession;

    const passAttempts = Math.max(
      8,
      Math.round(18 + instructionsImpact.passAttempts + passingQuality * 12)
    );
    const passAccuracy = clamp(0.7 + passingQuality * 0.2 + instructionsImpact.passAccuracy, 0.55, 0.92);
    const passesCompleted = Math.min(passAttempts, Math.round(passAttempts * passAccuracy));
    statistics.passes.attemptedFor += passAttempts;
    statistics.passes.completedFor += passesCompleted;

    const opponentPassAttempts = Math.max(6, Math.round(16 - strengthDiff * 0.05));
    const opponentPassAccuracy = clamp(0.68 - strengthDiff * 0.002 - defenseAdjustment, 0.5, 0.9);
    const opponentPassesCompleted = Math.min(
      opponentPassAttempts,
      Math.round(opponentPassAttempts * opponentPassAccuracy)
    );
    statistics.passes.attemptedAgainst += opponentPassAttempts;
    statistics.passes.completedAgainst += opponentPassesCompleted;

    const totalWeight = lineup.reduce((sum, player) => sum + player.attributes.passing, 0) || lineup.length;
    for (const player of lineup) {
      const weight = player.attributes.passing / totalWeight;
      const playerAttempts = Math.round(passAttempts * weight);
      const playerCompleted = Math.min(playerAttempts, Math.round(passesCompleted * weight));
      const contribution = ensureContribution(contributions, player.id);
      contribution.passesAttempted = (contribution.passesAttempted ?? 0) + playerAttempts;
      contribution.passesCompleted = (contribution.passesCompleted ?? 0) + playerCompleted;
      contribution.rating += playerCompleted * 0.01;
    }

    const fatigueRisk = Math.max(0.02, minute / 130) * instructionsImpact.fatigueMultiplier;
    const injuryRoll = rng();
    if (injuryRoll < 0.04 + fatigueRisk) {
      const injured = selectPlayerWeighted(lineup, 'stamina', rng);
      if (injured) {
        statistics.injuries.for += 1;
        const contribution = ensureContribution(contributions, injured.id);
        contribution.rating -= 0.8;
        const replacementId =
          adjustmentState.substitutionsUsed < MAX_SUBSTITUTIONS ? pickReplacement(lineup, bench, injured) : undefined;
        events.push({
          minute,
          type: 'lesion',
          description: `Minuto ${minute}: ${injured.name} cae con dolor; los fisios entran a todo trapo.`,
          playerId: injured.id,
          severity: injuryRoll < 0.02 ? 'grave' : 'media',
        });
        commentary.push(`(${minute}') ${injured.name} no puede seguir, la grada contiene el aliento.`);
        const idx = lineup.findIndex((player) => player.id === injured.id);
        if (idx !== -1) {
          lineup.splice(idx, 1);
        }
        if (replacementId && adjustmentState.substitutionsUsed < MAX_SUBSTITUTIONS) {
          const success = performSubstitution(
            lineup,
            bench,
            contributions,
            events,
            commentary,
            minute,
            'lesión',
            injured.id,
            replacementId
          );
          if (success) {
            adjustmentState.substitutionsUsed += 1;
            substitutionsUsed = adjustmentState.substitutionsUsed;
          }
        }
      }
    }

    const cardRoll = rng();
    if (cardRoll < 0.12 + instructionsImpact.foulRisk && lineup.length > 0) {
      const offender = selectPlayerWeighted(lineup, 'defending', rng);
      if (offender) {
        statistics.fouls.for += 1;
        const contribution = ensureContribution(contributions, offender.id);
        let expelled = false;
        let doubleYellow = false;
        if (cardRoll < 0.03) {
          expelled = true;
        } else {
          const currentCount = (yellowCards.get(offender.id) ?? 0) + 1;
          yellowCards.set(offender.id, currentCount);
          statistics.cards.yellowFor += 1;
          contribution.rating -= 0.4;
          const description =
            currentCount === 1
              ? `Minuto ${minute}: ${offender.name} ve la amarilla por cortar una contra con alevosía.`
              : `Minuto ${minute}: ${offender.name} recibe la segunda amarilla y está al borde de la expulsión.`;
          events.push({
            minute,
            type: 'tarjeta',
            description,
            playerId: offender.id,
            cardCount: currentCount,
          });
          if (currentCount >= 2) {
            statistics.cards.yellowFor += 1;
            expelled = true;
            doubleYellow = true;
          }
        }

        if (expelled) {
          statistics.cards.redFor += 1;
          contribution.rating -= doubleYellow ? 1.1 : 1.5;
          redCards.add(offender.id);
          const description = doubleYellow
            ? `Minuto ${minute}: ${offender.name} se marcha expulsado tras doble amarilla.`
            : `Minuto ${minute}: ${offender.name} se va a las duchas antes de tiempo; roja directa.`;
          events.push({
            minute,
            type: doubleYellow ? 'doble_amarilla' : 'expulsion',
            description,
            playerId: offender.id,
            cardCount: doubleYellow ? yellowCards.get(offender.id) : undefined,
          });
          commentary.push(
            doubleYellow
              ? `(${minute}') ${offender.name} pierde la cabeza y ve la segunda amarilla.`
              : `(${minute}') ¡Expulsado ${offender.name}! El partido cambia de guion.`
          );
          const idx = lineup.findIndex((player) => player.id === offender.id);
          if (idx !== -1) {
            lineup.splice(idx, 1);
          }
          if (isGoalkeeper(offender)) {
            handleGoalkeeperEmergency(lineup, bench, contributions, events, commentary, minute);
          }
        }
      }
    }

    const opponentFoulRoll = rng();
    if (opponentFoulRoll < 0.1) {
      statistics.fouls.against += 1;
      if (opponentFoulRoll < 0.02) {
        statistics.cards.redAgainst += 1;
        events.push({
          minute,
          type: 'expulsion_rival',
          description: `Minuto ${minute}: el rival se queda con uno menos tras una entrada criminal.`,
        });
        commentary.push(`(${minute}') ¡Roja para el rival! El partido se pone de cara.`);
      } else if (opponentFoulRoll < 0.06) {
        statistics.cards.yellowAgainst += 1;
        events.push({
          minute,
          type: 'tarjeta_rival',
          description: `Minuto ${minute}: amarilla para el rival por cortar nuestro avance.`,
        });
      }
    }

    const baseChance = clamp(0.2 + strengthDiff / 170 + instructionsImpact.chanceBias + tacticBias, 0.05, 0.65);
    const opponentChance = clamp(
      0.18 - strengthDiff / 200 - instructionsImpact.defenseBias + defenseAdjustment,
      0.04,
      0.6
    );

    if (lineup.length > 0 && rng() < baseChance) {
      const shooter = selectPlayerWeighted(lineup, 'shooting', rng);
      const contribution = ensureContribution(contributions, shooter.id);
      contribution.shots = (contribution.shots ?? 0) + 1;
      const shotQuality = clamp(0.32 + strengthDiff / 200 + tacticBias, 0.1, 0.8);
      const onTarget = rng() < shotQuality + 0.15;
      if (onTarget) {
        contribution.shotsOnTarget = (contribution.shotsOnTarget ?? 0) + 1;
      }
      const xg = clamp(
        shotQuality + (adjustmentState.instructions.playThroughMiddle ? 0.05 : 0),
        0.05,
        0.95
      );
      statistics.expectedGoals.for += xg;
      if (onTarget && rng() < xg) {
        goalsFor += 1;
        contribution.goals = (contribution.goals ?? 0) + 1;
        contribution.rating += 1.25;
        const assistantCandidates = lineup.filter((player) => player.id !== shooter.id);
        if (assistantCandidates.length > 0) {
          const assistant = selectPlayerWeighted(assistantCandidates, 'passing', rng);
          const assistContribution = ensureContribution(contributions, assistant.id);
          assistContribution.assists = (assistContribution.assists ?? 0) + 1;
          assistContribution.rating += 0.7;
          events.push({
            minute,
            type: 'gol',
            description: `Minuto ${minute}: ${shooter.name} fusila tras pase dulce de ${assistant.name}.`,
            playerId: shooter.id,
            relatedPlayerId: assistant.id,
          });
          commentary.push(`(${minute}') ¡GOOOL! ${shooter.name} rompe la red con asistencia de ${assistant.name}.`);
        } else {
          events.push({
            minute,
            type: 'gol',
            description: `Minuto ${minute}: ${shooter.name} la mandó a guardar con la puntera canallesca.`,
            playerId: shooter.id,
          });
          commentary.push(`(${minute}') ${shooter.name} levanta al estadio con un remate seco.`);
        }
      } else {
        if (onTarget) {
          statistics.saves.against += 1;
          events.push({
            minute,
            type: 'atajada',
            description: `Minuto ${minute}: el meta rival voló para negarle el gol a ${shooter.name}.`,
            playerId: shooter.id,
          });
          commentary.push(`(${minute}') ${shooter.name} probó de lejos, pero el portero rival se vistió de héroe.`);
        } else {
          events.push({
            minute,
            type: 'ocasión',
            description: `Minuto ${minute}: ${shooter.name} la tuvo, pero se fue besando el poste.`,
            playerId: shooter.id,
          });
        }
      }
      statistics.shots.for += 1;
      if (onTarget) {
        statistics.shots.onTargetFor += 1;
      }
    }

    if (rng() < opponentChance) {
      statistics.shots.against += 1;
      const opponentXg = clamp(0.28 - strengthDiff / 220 - defenseAdjustment, 0.08, 0.7);
      statistics.expectedGoals.against += opponentXg;
      const onTarget = rng() < opponentXg + 0.1;
      if (onTarget) {
        statistics.shots.onTargetAgainst += 1;
      }
      const goalkeeper = lineup.find((player) => player.position === 'GK') ?? lineup[0];
      const keeperContribution = goalkeeper ? ensureContribution(contributions, goalkeeper.id) : undefined;
      if (onTarget && rng() < opponentXg) {
        goalsAgainst += 1;
        events.push({
          minute,
          type: 'gol_en_contra',
          description: `Minuto ${minute}: el rival aprovecha un despiste y nos clava el empate.`,
        });
        commentary.push(`(${minute}') Latigazo rival y cara de póker en la zaga.`);
        if (keeperContribution) {
          keeperContribution.rating -= 0.6;
        }
      } else if (onTarget) {
        statistics.saves.for += 1;
        if (keeperContribution) {
          keeperContribution.saves = (keeperContribution.saves ?? 0) + 1;
          keeperContribution.rating += 0.3;
        }
        events.push({
          minute,
          type: 'atajada_portero',
          description: `Minuto ${minute}: nuestro guardameta voló para mantener la puerta a salvo.`,
        });
        commentary.push(`(${minute}') ¡Paradón de ${goalkeeper?.name ?? 'nuestro meta'}!`);
      } else {
        events.push({
          minute,
          type: 'ocasión_rival',
          description: `Minuto ${minute}: el rival la mandó a la grada, sus ultras se agarran la cabeza.`,
        });
      }
    }

    const penaltyRoll = rng();
    if (penaltyRoll < 0.04 + instructionsImpact.foulRisk * 0.5) {
      const penaltyForUs = penaltyRoll < 0.02 + tacticBias;
      const taker = selectPlayerWeighted(lineup, 'shooting', rng);
      if (penaltyForUs && taker) {
        statistics.fouls.against += 1;
        const contribution = ensureContribution(contributions, taker.id);
        statistics.shots.for += 1;
        statistics.shots.onTargetFor += 1;
        const scored = rng() < 0.78 + tacticBias;
        statistics.expectedGoals.for += 0.79;
        if (scored) {
          goalsFor += 1;
          contribution.goals = (contribution.goals ?? 0) + 1;
          contribution.rating += 1;
          events.push({
            minute,
            type: 'penalti',
            description: `Minuto ${minute}: penalti claro y ${taker.name} no perdona desde los once metros.`,
            playerId: taker.id,
          });
          commentary.push(`(${minute}') ¡Penalti convertido por ${taker.name}!`);
        } else {
          statistics.saves.against += 1;
          events.push({
            minute,
            type: 'penalti_fallado',
            description: `Minuto ${minute}: ${taker.name} se topa con el portero, penalti desperdiciado.`,
            playerId: taker.id,
          });
          contribution.rating -= 0.6;
        }
      } else {
        statistics.fouls.for += 1;
        statistics.shots.against += 1;
        statistics.shots.onTargetAgainst += 1;
        statistics.expectedGoals.against += 0.79;
        const keeper = lineup.find((player) => player.position === 'GK');
        const keeperContribution = keeper ? ensureContribution(contributions, keeper.id) : undefined;
        const conceded = rng() < 0.76 - defenseAdjustment;
        if (conceded) {
          goalsAgainst += 1;
          events.push({
            minute,
            type: 'penalti_en_contra',
            description: `Minuto ${minute}: el árbitro señala penalti dudoso y el rival lo clava.`,
          });
          commentary.push(`(${minute}') Polémica máxima: penalti en contra que se transforma en gol.`);
        } else {
          statistics.saves.for += 1;
          if (keeperContribution) {
            keeperContribution.saves = (keeperContribution.saves ?? 0) + 1;
            keeperContribution.rating += 0.4;
          }
          events.push({
            minute,
            type: 'penalti_atrapado',
            description: `Minuto ${minute}: el portero detiene el penalti y la grada explota de alegría.`,
          });
        }
      }
    }
  }

  if (lastMinute < 90 && lineup.length > 0) {
    addMinutesPlayed(contributions, lineup, 90 - lastMinute);
  }

  const finalNarrative = narrativeIntro(config, club);
  const finalOpponentName =
    typeof config.opponentName === 'string' && config.opponentName.trim().length > 0
      ? config.opponentName.trim()
      : 'Rival misterioso';
  const strengthDiffFinal = initialStrength - opponentStrength;
  finalNarrative.push(
    strengthDiffFinal > 5
      ? 'El rival se hizo pequeño como balón de playa en tormenta.'
      : strengthDiffFinal < -5
      ? 'Costó horrores frenar la avalancha rival; sudor frío y uñas comidas.'
      : 'Partido tenso, digno de sobremesa con tertulianos gritones.'
  );
  finalNarrative.push(`Marcador final: ${club.name} ${goalsFor}-${goalsAgainst} ${finalOpponentName} con mala baba.`);
  finalNarrative.push(
    `Posesión: ${Math.round(statistics.possession.for / MATCH_MINUTES.length)}% vs ${Math.round(
      statistics.possession.against / MATCH_MINUTES.length
    )}%.`
  );
  finalNarrative.push(
    `Tiros a puerta: ${statistics.shots.onTargetFor} - ${statistics.shots.onTargetAgainst}. xG estimado ${statistics.expectedGoals.for.toFixed(
      2
    )} contra ${statistics.expectedGoals.against.toFixed(2)}.`
  );
  if (statistics.injuries.for > 0) {
    finalNarrative.push('Hubo sustos en la enfermería, tocará cruzar los dedos para el parte médico.');
  }

  const contributionsList = Array.from(contributions.values()).map((contribution) => ({
    ...contribution,
    rating: Number(contribution.rating.toFixed(2)),
    passesAttempted: Math.round(contribution.passesAttempted ?? 0),
    passesCompleted: Math.round(contribution.passesCompleted ?? 0),
    shots: Math.round(contribution.shots ?? 0),
    shotsOnTarget: Math.round(contribution.shotsOnTarget ?? 0),
    tackles: Math.round(contribution.tackles ?? 0),
    saves: Math.round(contribution.saves ?? 0),
    minutesPlayed: Math.round(contribution.minutesPlayed ?? 0),
  }));

  const man = pickManOfTheMatch(contributionsList, rng);
  if (man) {
    finalNarrative.push(`MVP canalla: ${playerMap.get(man.playerId)?.name ?? man.playerId}, magia pura todo el encuentro.`);
  }

  statistics.possession.for = Math.round(statistics.possession.for / MATCH_MINUTES.length);
  statistics.possession.against = Math.round(statistics.possession.against / MATCH_MINUTES.length);
  statistics.expectedGoals.for = Number(statistics.expectedGoals.for.toFixed(2));
  statistics.expectedGoals.against = Number(statistics.expectedGoals.against.toFixed(2));

  const matchEvents = events.filter((event) => event.type !== 'intro');
  const visualization2d = (config.viewMode ?? 'quick') === '2d'
    ? buildMatchVisualization2D({
        events: matchEvents,
        lineup: initialLineup,
        playerMap,
        formation: config.formation,
      })
    : undefined;

  return {
    goalsFor,
    goalsAgainst,
    events: matchEvents,
    manOfTheMatch: man?.playerId,
    narrative: finalNarrative,
    contributions: contributionsList,
    statistics,
    commentary,
    viewMode: config.viewMode ?? 'quick',
    seed: seedValue,
    visualization2d,
  };
}

/**
 * Simula una jornada completa, incluyendo partido, impacto de decisiones y finanzas.
 * @param {ClubState} club Estado actual del club.
 * @param {MatchConfig} config Configuración del partido a disputar.
 * @param {MatchSimulationOptions} [options] Parámetros extra como decisiones o semillas.
 * @returns {MatchDayReport} Informe detallado tras la jornada.
 */
export function playMatchDay(club, config, options = {}) {
  const decisionOutcomeInput = options.decisionOutcome;
  const decisionOutcome = decisionOutcomeInput ? { ...decisionOutcomeInput } : undefined;
  const match = simulateMatch(club, config, { ...options, decisionOutcome });
  const finances = calculateMatchdayFinances(club, match);
  const staffImpact = finances.staffImpact ?? { budget: 0, reputation: 0, morale: 0, narratives: [] };
  const decisionEffectsPending = Boolean(decisionOutcome) && decisionOutcome.appliedToClub !== true;
  let reputationUpdate = decisionEffectsPending ? decisionOutcome?.reputationChange ?? 0 : 0;
  let moraleUpdate = decisionEffectsPending ? decisionOutcome?.moraleChange ?? 0 : 0;
  reputationUpdate += staffImpact.reputation ?? 0;
  moraleUpdate += staffImpact.morale ?? 0;

  const resultMorale = match.goalsFor > match.goalsAgainst ? 6 : match.goalsFor === match.goalsAgainst ? 1 : -6;
  const contributionMap = new Map(match.contributions.map((contribution) => [contribution.playerId, contribution]));
  const eventsByPlayer = new Map();
  /** @type {Record<string, number>} */
  const goalsByPlayer = {};
  /** @type {Record<string, number>} */
  const assistsByPlayer = {};
  /** @type {Record<string, number>} */
  const yellowCardsByPlayer = {};
  /** @type {Record<string, number>} */
  const redCardsByPlayer = {};
  /** @type {Record<string, number>} */
  const doubleYellowsByPlayer = {};
  const injuryByPlayer = new Map();

  for (const event of match.events) {
    if (event.playerId) {
      const list = eventsByPlayer.get(event.playerId) ?? [];
      list.push(event);
      eventsByPlayer.set(event.playerId, list);
    }
    switch (event.type) {
      case 'gol':
        if (event.playerId) {
          accumulate(goalsByPlayer, event.playerId, 1);
        }
        if (event.relatedPlayerId) {
          accumulate(assistsByPlayer, event.relatedPlayerId, 1);
        }
        break;
      case 'tarjeta':
        if (event.playerId) {
          accumulate(yellowCardsByPlayer, event.playerId, 1);
        }
        break;
      case 'doble_amarilla':
        if (event.playerId) {
          accumulate(redCardsByPlayer, event.playerId, 1);
          accumulate(doubleYellowsByPlayer, event.playerId, 1);
        }
        break;
      case 'expulsion':
        if (event.playerId) {
          accumulate(redCardsByPlayer, event.playerId, 1);
        }
        break;
      case 'lesion':
        if (event.playerId) {
          injuryByPlayer.set(event.playerId, event.severity ?? 'leve');
        }
        break;
      default:
        break;
    }
  }

  const baseSeasonStats = club.seasonStats ? { ...club.seasonStats } : createSeasonStats();
  baseSeasonStats.matches += 1;
  baseSeasonStats.goalsFor += match.goalsFor;
  baseSeasonStats.goalsAgainst += match.goalsAgainst;
  baseSeasonStats.possessionFor += match.statistics.possession.for;
  if (match.goalsFor > match.goalsAgainst) {
    baseSeasonStats.wins += 1;
    baseSeasonStats.unbeatenRun += 1;
  } else if (match.goalsFor === match.goalsAgainst) {
    baseSeasonStats.draws += 1;
    baseSeasonStats.unbeatenRun += 1;
  } else {
    baseSeasonStats.losses += 1;
    baseSeasonStats.unbeatenRun = 0;
  }
  baseSeasonStats.bestUnbeatenRun = Math.max(baseSeasonStats.bestUnbeatenRun, baseSeasonStats.unbeatenRun);

  const updatedSquad = club.squad.map((player) => {
    const contribution = contributionMap.get(player.id);
    const minutes = contribution?.minutesPlayed ?? 0;
    const played = minutes > 0;

    let moraleShift = moraleUpdate;
    if (played) {
      moraleShift += resultMorale;
      if ((contribution?.rating ?? 6) >= 7.5) {
        moraleShift += 2;
      } else if ((contribution?.rating ?? 6) <= 5.5) {
        moraleShift -= 2;
      }
    } else {
      moraleShift += resultMorale * 0.3 - 1.2;
    }

    const playerEvents = eventsByPlayer.get(player.id) ?? [];
    if (playerEvents.some((event) => event.type === 'expulsion' || event.type === 'doble_amarilla')) {
      moraleShift -= 4;
    }

    let fitnessShift = -minutes * 0.12;
    if (!played) {
      fitnessShift += 5;
    }
    const injured = playerEvents.some((event) => event.type === 'lesion');
    if (injured) {
      fitnessShift -= 30;
    }

    const availability = {
      injuryMatches: player.availability?.injuryMatches ?? 0,
      suspensionMatches: player.availability?.suspensionMatches ?? 0,
    };

    if (played) {
      availability.injuryMatches = 0;
      availability.suspensionMatches = 0;
    } else {
      if (availability.injuryMatches > 0) {
        availability.injuryMatches = Math.max(0, availability.injuryMatches - 1);
      }
      if (availability.suspensionMatches > 0) {
        availability.suspensionMatches = Math.max(0, availability.suspensionMatches - 1);
      }
    }

    if (injured) {
      const severity = injuryByPlayer.get(player.id) ?? 'leve';
      const penalty = severity === 'grave' ? 3 : severity === 'media' ? 2 : 1;
      availability.injuryMatches = Math.max(availability.injuryMatches, penalty);
    }

    const reds = redCardsByPlayer[player.id] ?? 0;
    const doubles = doubleYellowsByPlayer[player.id] ?? 0;
    if (reds > 0) {
      const suspension = doubles > 0 ? 1 : Math.min(3, reds * 2);
      availability.suspensionMatches = Math.max(availability.suspensionMatches, suspension);
    }

    const log = {
      ...createEmptySeasonLog(),
      ...(player.seasonLog ?? {}),
    };

    if (played) {
      log.matches += 1;
      log.minutes += minutes;
      log.goals += contribution?.goals ?? 0;
      log.assists += contribution?.assists ?? 0;
      if (isGoalkeeper(player) && match.goalsAgainst === 0 && minutes >= 75) {
        log.cleanSheets += 1;
      }
    }

    const yellows = yellowCardsByPlayer[player.id] ?? 0;
    const goals = goalsByPlayer[player.id] ?? 0;
    const assists = assistsByPlayer[player.id] ?? 0;
    if (goals > 0 && !played) {
      log.goals += goals;
    }
    if (assists > 0 && !played) {
      log.assists += assists;
    }
    log.yellowCards += yellows;
    log.redCards += reds;
    if (injured) {
      log.injuries += 1;
    }

    const totalYellow = log.yellowCards;
    if (yellows > 0 && totalYellow > 0 && totalYellow % 5 === 0) {
      availability.suspensionMatches = Math.max(availability.suspensionMatches, 1);
    }

    let updatedAttributes = { ...player.attributes };
    const rating = contribution?.rating ?? 6;
    if (played && rating >= 7.8) {
      updatedAttributes.passing = clamp(updatedAttributes.passing + 1, 30, 99);
      if (player.position === 'FWD' || player.position === 'MID') {
        updatedAttributes.shooting = clamp(updatedAttributes.shooting + 1, 30, 99);
      }
      if (player.position === 'DEF') {
        updatedAttributes.defending = clamp(updatedAttributes.defending + 1, 30, 99);
      }
    } else if (played && rating <= 5.2) {
      updatedAttributes.stamina = clamp(updatedAttributes.stamina - 1, 25, 99);
      updatedAttributes.passing = clamp(updatedAttributes.passing - 1, 25, 99);
    }

    if (player.age <= 24 && played && rating >= 7.2) {
      updatedAttributes.dribbling = clamp(updatedAttributes.dribbling + 1, 30, 99);
    }

    if (player.age >= 32 && played && minutes >= 70) {
      updatedAttributes.pace = clamp(updatedAttributes.pace - 1, 20, 99);
      updatedAttributes.stamina = clamp(updatedAttributes.stamina - 1, 20, 99);
    }

    return {
      ...player,
      morale: clamp(player.morale + moraleShift, -100, 100),
      fitness: clamp(player.fitness + fitnessShift, 0, 100),
      availability,
      seasonLog: log,
      attributes: updatedAttributes,
    };
  });

  const updatedClub = {
    ...club,
    budget: club.budget + finances.net,
    reputation: clamp(club.reputation + reputationUpdate, -100, 100),
    squad: updatedSquad,
    sponsors: finances.updatedSponsors ?? club.sponsors,
    seasonStats: baseSeasonStats,
  };

  if (staffImpact.narratives.length > 0) {
    match.narrative = [...match.narrative, ...staffImpact.narratives];
  }

  if (decisionOutcome) {
    decisionOutcome.appliedToClub = true;
  }

  return {
    match,
    decisionOutcome,
    financesDelta: finances.net,
    finances,
    updatedClub,
  };
}
