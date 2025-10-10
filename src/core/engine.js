/**
 * Motor de simulación de partidos para el chiringuito canalla.
 * Implementación en JavaScript puro con tipados vía JSDoc.
 * @module core/engine
 */

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').MatchDayReport} MatchDayReport */
/** @typedef {import('../types.js').MatchEvent} MatchEvent */
/** @typedef {import('../types.js').MatchResult} MatchResult */
/** @typedef {import('../types.js').PlayerContribution} PlayerContribution */
/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */
/** @typedef {import('../types.js').DecisionOutcome} DecisionOutcome */
/** @typedef {import('../types.js').Player} Player */

/**
 * @typedef {Object} MatchSimulationOptions
 * @property {() => number=} rng
 * @property {CanallaDecision=} decision
 * @property {DecisionOutcome=} decisionOutcome
 */

const MINUTE_SEGMENTS = [5, 12, 20, 28, 35, 42, 50, 58, 65, 72, 80, 88];

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
 * @param {ClubState} club
 * @param {MatchConfig} config
 * @param {MatchSimulationOptions} [options]
 * @returns {MatchResult}
 */
export function simulateMatch(club, config, options = {}) {
  const rng = options.rng ?? Math.random;
  const moraleBoost = options.decisionOutcome?.success ? options.decisionOutcome.moraleChange : 0;
  const intimidation = options.decisionOutcome?.success ? options.decisionOutcome.reputationChange * 0.2 : 0;

  const { starters, substitutes } = getMatchSquads(club, config);
  const lineup = starters.length > 0 ? starters : club.squad;
  const clubStrength = calculateClubStrength(lineup, config, moraleBoost);
  const opponentStrength = config.opponentStrength + intimidation;
  const strengthDiff = clubStrength - opponentStrength;

  let goalsFor = 0;
  let goalsAgainst = 0;
  /** @type {MatchEvent[]} */
  const events = [];
  /** @type {PlayerContribution[]} */
  const contributions = lineup.map((player) => ({
    playerId: player.id,
    rating: 5 + rng() * 4,
  }));

  const benchContributions = (starters.length > 0 ? substitutes : []).map((player) => ({
    playerId: player.id,
    rating: 5,
  }));

  contributions.push(...benchContributions);

  for (const minute of MINUTE_SEGMENTS) {
    const segmentModifier = strengthDiff / 150;
    const baseChance = 0.25 + segmentModifier;
    if (rng() < baseChance) {
      const isGoalFor = rng() < 0.5 + strengthDiff / 200;
      if (isGoalFor) {
        goalsFor += 1;
        const scorer = lineup[Math.floor(rng() * lineup.length)];
        const assistant = lineup[Math.floor(rng() * lineup.length)];
        events.push({
          minute,
          type: 'gol',
          description: `Minuto ${minute}: ${scorer.name} la mandó a guardar con la puntera canallesca.`,
        });
        const contribution = contributions.find((c) => c.playerId === scorer.id);
        if (contribution) {
          contribution.goals = (contribution.goals ?? 0) + 1;
          contribution.rating += 1.2;
        }
        const assistContribution = contributions.find((c) => c.playerId === assistant.id);
        if (assistContribution) {
          assistContribution.assists = (assistContribution.assists ?? 0) + 1;
          assistContribution.rating += 0.6;
        }
      } else {
        goalsAgainst += 1;
        events.push({
          minute,
          type: 'gol_en_contra',
          description: `Minuto ${minute}: nos cascaron uno; el colegiado miró a otro lado mientras la defensa tomaba café.`,
        });
      }
    } else if (rng() < 0.2) {
      events.push({
        minute,
        type: 'tarjeta',
        description: `Minuto ${minute}: el árbitro repartió tarjetas como churros en San Ginés.`,
      });
    }
  }

  const tensionEventChance = options.decision?.type === 'sobornoArbitro' ? 0.4 : 0.2;
  if (rng() < tensionEventChance) {
    events.push({
      minute: 90,
      type: 'polémica',
      description: 'Final picante: ruedas de prensa cargaditas de indirectas y micrófonos volando.',
    });
  }

  const narrative = [
    ...narrativeIntro(config, club),
    strengthDiff > 5
      ? 'El rival se hizo pequeño como balón de playa en tormenta.'
      : strengthDiff < -5
      ? 'Costó horrores frenar la avalancha rival; sudor frío y uñas comidas.'
      : 'Partido tenso, digno de sobremesa con tertulianos gritones.',
    `Marcador final: ${club.name} ${goalsFor}-${goalsAgainst} rival sin nombre pero con mala baba.`,
  ];

  const man = pickManOfTheMatch(contributions, rng);
  if (man) {
    narrative.push(`MVP canalla: ${man.playerId}, se salió del mapa con más magia que un trilero en Sol.`);
  }

  return {
    goalsFor,
    goalsAgainst,
    events,
    manOfTheMatch: man?.playerId,
    narrative,
    contributions,
  };
}

/**
 * @param {ClubState} club
 * @param {MatchConfig} config
 * @param {MatchSimulationOptions} [options]
 * @returns {MatchDayReport}
 */
export function playMatchDay(club, config, options = {}) {
  const match = simulateMatch(club, config, options);
  const financesDelta = calculateMatchFinances(club, match);
  const reputationUpdate = options.decisionOutcome?.reputationChange ?? 0;
  const moraleUpdate = options.decisionOutcome?.moraleChange ?? 0;

  const starterIds = new Set(config.startingLineup ?? []);
  const subIds = new Set(config.substitutes ?? []);
  const startersCount = starterIds.size || club.squad.length;
  const subsCount = subIds.size || club.squad.length;
  const starterMorale = moraleUpdate / Math.max(1, startersCount);
  const benchMorale = moraleUpdate / Math.max(1, subsCount * 2);
  const restMorale = moraleUpdate / Math.max(1, club.squad.length * 3);
  const fatigueBonus = options.decisionOutcome?.moraleChange ?? 0;

  const updatedClub = {
    ...club,
    budget: club.budget + financesDelta,
    reputation: Math.max(-100, Math.min(100, club.reputation + reputationUpdate)),
    squad: club.squad.map((player) => ({
      ...player,
      morale: clamp(
        player.morale + (starterIds.has(player.id) ? starterMorale : subIds.has(player.id) ? benchMorale : restMorale),
        -100,
        100
      ),
      fitness: clamp(
        player.fitness - (starterIds.has(player.id) ? 8 : subIds.has(player.id) ? 4 : 1) + fatigueBonus * 0.3,
        0,
        100
      ),
    })),
  };

  return {
    match,
    decisionOutcome: options.decisionOutcome,
    financesDelta,
    updatedClub,
  };
}

/**
 * @param {ClubState} club
 * @param {MatchResult} match
 */
function calculateMatchFinances(club, match) {
  const baseAttendance = club.stadiumCapacity * (0.4 + Math.min(0.5, club.reputation / 200));
  const excitement = match.goalsFor + match.goalsAgainst > 3 ? 1.2 : 1;
  const ticketPrice = 25;
  const income = baseAttendance * ticketPrice * excitement;
  const bonuses = match.goalsFor > match.goalsAgainst ? 7500 : match.goalsFor === match.goalsAgainst ? 3500 : 1500;
  return Math.round(income + bonuses - club.weeklyWageBill);
}
