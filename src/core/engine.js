/**
 * Motor de simulación de partidos para el chiringuito canalla.
 * Implementación en JavaScript puro con tipados vía JSDoc.
 * @module core/engine
 */

import { calculateMatchdayFinances } from './economy.js';

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
 * @typedef {Object} MatchSimulationOptions
 * @property {() => number=} rng
 * @property {CanallaDecision=} decision
 * @property {DecisionOutcome=} decisionOutcome
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
 * @template T extends number
 * @param {T} value
 * @param {T} min
 * @param {T} max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * @param {Player[]} players
 * @param {keyof Player['attributes']} key
 */
function averageAttribute(players, key) {
  if (players.length === 0) {
    return 0;
  }
  const total = players.reduce((sum, player) => sum + player.attributes[key], 0);
  return total / players.length;
}

/** @param {Player[]} players */
function averageMorale(players) {
  if (players.length === 0) {
    return 0;
  }
  const total = players.reduce((sum, player) => sum + player.morale, 0);
  return total / players.length;
}

/** @param {MatchConfig['tactic']} tactic */
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
 * @param {string} formation
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
 * @param {Player[]} players
 * @param {MatchConfig} config
 * @param {number} [moraleBoost]
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
 * @param {MatchConfig} config
 * @param {ClubState} club
 * @returns {string[]}
 */
function narrativeIntro(config, club) {
  const place = config.home ? 'en el templo propio' : 'visitando campo ajeno';
  return [
    `La banda del ${club.name} salta al verde ${place}, con la grada lista para repartir cera verbal.`,
  ];
}

/**
 * @param {PlayerContribution[]} contributions
 * @param {() => number} rng
 * @returns {PlayerContribution | undefined}
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
 * @param {ClubState} club
 * @param {MatchConfig} config
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
 * @param {TacticalInstructions | undefined} instructions
 * @returns {Required<TacticalInstructions>}
 */
function mergeInstructions(instructions) {
  return { ...DEFAULT_INSTRUCTIONS, ...(instructions ?? {}) };
}

/**
 * @param {Required<TacticalInstructions>} instructions
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
 * @param {Map<string, PlayerContribution>} contributions
 * @param {string} playerId
 * @param {number} [base]
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
 * @param {Map<string, PlayerContribution>} contributions
 * @param {Player[]} players
 * @param {number} minutes
 */
function addMinutesPlayed(contributions, players, minutes) {
  for (const player of players) {
    const contribution = ensureContribution(contributions, player.id);
    contribution.minutesPlayed = (contribution.minutesPlayed ?? 0) + minutes;
  }
}

/**
 * @param {Player[]} players
 * @param {keyof Player['attributes']} attribute
 * @param {() => number} rng
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
 * @param {Player[]} lineup
 * @param {Player[]} bench
 * @param {Map<string, PlayerContribution>} contributions
 * @param {MatchEvent[]} events
 * @param {string[]} commentary
 * @param {number} minute
 * @param {string} reason
 * @param {string} outId
 * @param {string} inId
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
 * @param {MatchAdjustment} adjustment
 * @param {Player[]} lineup
 * @param {Player[]} bench
 * @param {Map<string, PlayerContribution>} contributions
 * @param {MatchEvent[]} events
 * @param {string[]} commentary
 * @param {number} minute
 * @param {() => number} rng
 * @param {{ tactic: string; formation: string; instructions: Required<TacticalInstructions>; substitutionsUsed: number }} state
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
 * @param {ClubState} club
 * @param {MatchConfig} config
 * @param {MatchSimulationOptions} [options]
 * @returns {MatchResult}
 */
export function simulateMatch(club, config, options = {}) {
  const rng = options.rng ?? Math.random;
  const decisionOutcome = options.decisionOutcome;
  const decisionEffectsPending = Boolean(decisionOutcome) && decisionOutcome.appliedToClub !== true;
  const moraleBoost =
    decisionEffectsPending && decisionOutcome?.success ? decisionOutcome.moraleChange : 0;
  const intimidation =
    decisionEffectsPending && decisionOutcome?.success ? decisionOutcome.reputationChange * 0.2 : 0;

  const { starters, substitutes } = getMatchSquads(club, config);
  const lineup = starters.length > 0 ? [...starters] : [...club.squad.slice(0, 11)];
  const bench = starters.length > 0 ? [...substitutes] : [...club.squad.slice(11)];
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
  for (const player of lineup) {
    ensureContribution(contributions, player.id, 6.2);
  }
  for (const player of bench) {
    ensureContribution(contributions, player.id, 5.4);
  }

  const initialStrength = calculateClubStrength(
    lineup,
    { ...config, tactic: adjustmentState.tactic, formation: adjustmentState.formation },
    moraleBoost
  );
  const opponentStrength = config.opponentStrength + intimidation;

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
    if (cardRoll < 0.12 + instructionsImpact.foulRisk) {
      const offender = selectPlayerWeighted(lineup, 'defending', rng);
      if (offender) {
        statistics.fouls.for += 1;
        const contribution = ensureContribution(contributions, offender.id);
        const redCard = cardRoll < 0.03;
        if (redCard) {
          statistics.cards.redFor += 1;
          contribution.rating -= 1.5;
          events.push({
            minute,
            type: 'expulsion',
            description: `Minuto ${minute}: ${offender.name} se va a las duchas antes de tiempo; roja directa.`,
            playerId: offender.id,
          });
          commentary.push(`(${minute}') ¡Expulsado ${offender.name}! El partido cambia de guion.`);
          const idx = lineup.findIndex((player) => player.id === offender.id);
          if (idx !== -1) {
            lineup.splice(idx, 1);
          }
        } else {
          statistics.cards.yellowFor += 1;
          contribution.rating -= 0.4;
          events.push({
            minute,
            type: 'tarjeta',
            description: `Minuto ${minute}: ${offender.name} ve la amarilla por cortar una contra con alevosía.`,
            playerId: offender.id,
          });
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
  const strengthDiffFinal = initialStrength - opponentStrength;
  finalNarrative.push(
    strengthDiffFinal > 5
      ? 'El rival se hizo pequeño como balón de playa en tormenta.'
      : strengthDiffFinal < -5
      ? 'Costó horrores frenar la avalancha rival; sudor frío y uñas comidas.'
      : 'Partido tenso, digno de sobremesa con tertulianos gritones.'
  );
  finalNarrative.push(`Marcador final: ${club.name} ${goalsFor}-${goalsAgainst} rival sin nombre pero con mala baba.`);
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

  return {
    goalsFor,
    goalsAgainst,
    events: events.filter((event) => event.type !== 'intro'),
    manOfTheMatch: man?.playerId,
    narrative: finalNarrative,
    contributions: contributionsList,
    statistics,
    commentary,
    viewMode: config.viewMode ?? 'quick',
  };
}

/**
 * @param {ClubState} club
 * @param {MatchConfig} config
 * @param {MatchSimulationOptions} [options]
 * @returns {MatchDayReport}
 */
export function playMatchDay(club, config, options = {}) {
  const decisionOutcomeInput = options.decisionOutcome;
  const decisionOutcome = decisionOutcomeInput ? { ...decisionOutcomeInput } : undefined;
  const match = simulateMatch(club, config, { ...options, decisionOutcome });
  const finances = calculateMatchdayFinances(club, match);
  const decisionEffectsPending = Boolean(decisionOutcome) && decisionOutcome.appliedToClub !== true;
  const reputationUpdate = decisionEffectsPending ? decisionOutcome?.reputationChange ?? 0 : 0;
  const moraleUpdate = decisionEffectsPending ? decisionOutcome?.moraleChange ?? 0 : 0;

  const resultMorale = match.goalsFor > match.goalsAgainst ? 6 : match.goalsFor === match.goalsAgainst ? 1 : -6;
  const contributionMap = new Map(match.contributions.map((contribution) => [contribution.playerId, contribution]));
  const eventsByPlayer = new Map();
  for (const event of match.events) {
    if (!event.playerId) {
      continue;
    }
    const list = eventsByPlayer.get(event.playerId) ?? [];
    list.push(event);
    eventsByPlayer.set(event.playerId, list);
  }

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

    if (eventsByPlayer.get(player.id)?.some((event) => event.type === 'expulsion')) {
      moraleShift -= 4;
    }

    let fitnessShift = -minutes * 0.12;
    if (!played) {
      fitnessShift += 5;
    }
    const injured = eventsByPlayer.get(player.id)?.some((event) => event.type === 'lesion');
    if (injured) {
      fitnessShift -= 30;
    }

    return {
      ...player,
      morale: clamp(player.morale + moraleShift, -100, 100),
      fitness: clamp(player.fitness + fitnessShift, 0, 100),
    };
  });

  const updatedClub = {
    ...club,
    budget: club.budget + finances.net,
    reputation: clamp(club.reputation + reputationUpdate, -100, 100),
    squad: updatedSquad,
    sponsors: finances.updatedSponsors ?? club.sponsors,
  };

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
