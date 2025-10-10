/**
 * Datos de ejemplo y utilidades para poblar el simulador.
 * @module core/data
 */

/** @typedef {import('../types.js').Player} Player */
/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */

/**
 * @param {Partial<Player> & Pick<Player, 'id' | 'name' | 'position'>} partial
 * @returns {Player}
 */
function createPlayer(partial) {
  return {
    id: partial.id,
    name: partial.name,
    position: partial.position,
    age: partial.age ?? 27,
    attributes: {
      pace: partial.attributes?.pace ?? 65,
      stamina: partial.attributes?.stamina ?? 68,
      dribbling: partial.attributes?.dribbling ?? 66,
      passing: partial.attributes?.passing ?? 64,
      shooting: partial.attributes?.shooting ?? 60,
      defending: partial.attributes?.defending ?? 60,
      leadership: partial.attributes?.leadership ?? 58,
      potential: partial.attributes?.potential ?? 72,
    },
    morale: partial.morale ?? 10,
    fitness: partial.fitness ?? 80,
    salary: partial.salary ?? 10000,
    contract: partial.contract ?? {
      salary: partial.salary ?? 10000,
      duration: 3,
      releaseClause: 5000000,
    },
  };
}

/** @returns {ClubState} */
export function createExampleClub() {
  /** @type {Player[]} */
  const squad = [
    createPlayer({
      id: 'portero-legendario',
      name: "Paco 'El Gato' Calderón",
      position: 'GK',
      attributes: {
        pace: 50,
        stamina: 70,
        dribbling: 45,
        passing: 62,
        shooting: 35,
        defending: 78,
        leadership: 82,
        potential: 68,
      },
      morale: 25,
    }),
    createPlayer({
      id: 'portero-de-riego',
      name: 'Pipiolo del Aspersor',
      position: 'GK',
      attributes: {
        pace: 48,
        stamina: 68,
        dribbling: 40,
        passing: 55,
        shooting: 32,
        defending: 72,
        leadership: 55,
        potential: 62,
      },
      morale: 14,
    }),
    createPlayer({
      id: 'lateral-callejero',
      name: 'Romario del Bulevar',
      position: 'DEF',
      attributes: {
        pace: 78,
        stamina: 80,
        dribbling: 62,
        passing: 68,
        shooting: 52,
        defending: 74,
        leadership: 60,
        potential: 76,
      },
      morale: 15,
    }),
    createPlayer({
      id: 'central-cemento',
      name: 'Ezequiel Mampostería',
      position: 'DEF',
      attributes: {
        pace: 64,
        stamina: 77,
        dribbling: 52,
        passing: 60,
        shooting: 45,
        defending: 82,
        leadership: 70,
        potential: 74,
      },
      morale: 17,
    }),
    createPlayer({
      id: 'lateral-chispa',
      name: 'Chispita del Callejón',
      position: 'DEF',
      attributes: {
        pace: 82,
        stamina: 78,
        dribbling: 66,
        passing: 70,
        shooting: 50,
        defending: 69,
        leadership: 57,
        potential: 79,
      },
      morale: 16,
    }),
    createPlayer({
      id: 'central-vieja-guardia',
      name: 'Capo del Callejón',
      position: 'DEF',
      attributes: {
        pace: 58,
        stamina: 73,
        dribbling: 50,
        passing: 66,
        shooting: 48,
        defending: 80,
        leadership: 84,
        potential: 70,
      },
      morale: 21,
    }),
    createPlayer({
      id: 'pivote-canchero',
      name: 'Moro del Mercado',
      position: 'MID',
      attributes: {
        pace: 67,
        stamina: 76,
        dribbling: 64,
        passing: 74,
        shooting: 58,
        defending: 72,
        leadership: 66,
        potential: 78,
      },
      morale: 18,
    }),
    createPlayer({
      id: 'cerebro-tabernas',
      name: 'Isco de Lavapiés',
      position: 'MID',
      attributes: {
        pace: 68,
        stamina: 72,
        dribbling: 82,
        passing: 85,
        shooting: 70,
        defending: 55,
        leadership: 65,
        potential: 80,
      },
      morale: 18,
    }),
    createPlayer({
      id: 'enganche-malandra',
      name: 'Buba el Trilero',
      position: 'MID',
      attributes: {
        pace: 70,
        stamina: 68,
        dribbling: 84,
        passing: 86,
        shooting: 72,
        defending: 50,
        leadership: 59,
        potential: 83,
      },
      morale: 19,
    }),
    createPlayer({
      id: 'canterano-osado',
      name: 'Perla del Bar Manolo',
      position: 'MID',
      attributes: {
        pace: 72,
        stamina: 74,
        dribbling: 70,
        passing: 73,
        shooting: 60,
        defending: 60,
        leadership: 55,
        potential: 88,
      },
      morale: 12,
    }),
    createPlayer({
      id: 'volante-gambeta',
      name: 'Zurdo del Pasaje',
      position: 'MID',
      attributes: {
        pace: 76,
        stamina: 71,
        dribbling: 80,
        passing: 77,
        shooting: 69,
        defending: 58,
        leadership: 60,
        potential: 81,
      },
      morale: 20,
    }),
    createPlayer({
      id: 'killer-picaro',
      name: 'Chino Benítez',
      position: 'FWD',
      attributes: {
        pace: 84,
        stamina: 75,
        dribbling: 77,
        passing: 66,
        shooting: 85,
        defending: 40,
        leadership: 58,
        potential: 82,
      },
      morale: 22,
    }),
    createPlayer({
      id: 'delantero-tanque',
      name: 'Búfalo de Chamberí',
      position: 'FWD',
      attributes: {
        pace: 70,
        stamina: 74,
        dribbling: 68,
        passing: 62,
        shooting: 83,
        defending: 48,
        leadership: 63,
        potential: 79,
      },
      morale: 13,
    }),
    createPlayer({
      id: 'delantero-ruido',
      name: 'Cumbia Martínez',
      position: 'FWD',
      attributes: {
        pace: 86,
        stamina: 76,
        dribbling: 81,
        passing: 64,
        shooting: 78,
        defending: 42,
        leadership: 56,
        potential: 85,
      },
      morale: 16,
    }),
    createPlayer({
      id: 'extremo-chamuyo',
      name: 'Rayo de la Verbena',
      position: 'FWD',
      attributes: {
        pace: 88,
        stamina: 79,
        dribbling: 83,
        passing: 69,
        shooting: 76,
        defending: 44,
        leadership: 54,
        potential: 84,
      },
      morale: 18,
    }),
    createPlayer({
      id: 'comodin-polivalente',
      name: 'Lucho Multipass',
      position: 'MID',
      attributes: {
        pace: 74,
        stamina: 82,
        dribbling: 71,
        passing: 75,
        shooting: 63,
        defending: 68,
        leadership: 67,
        potential: 77,
      },
      morale: 17,
    }),
    createPlayer({
      id: 'central-juvenil',
      name: 'Chaval de la Pista',
      position: 'DEF',
      attributes: {
        pace: 72,
        stamina: 70,
        dribbling: 55,
        passing: 60,
        shooting: 50,
        defending: 74,
        leadership: 50,
        potential: 86,
      },
      morale: 10,
    }),
  ];

  return {
    name: 'Atlético Bar Callejero',
    budget: 1200000,
    stadiumCapacity: 23000,
    reputation: 5,
    squad,
    season: 1,
    objectives: {
      minPosition: 8,
      cupRun: true,
    },
    weeklyWageBill: squad.reduce((acc, player) => acc + player.salary / 4, 0),
  };
}

/** @returns {MatchConfig} */
export function createDefaultMatchConfig() {
  return {
    home: true,
    opponentStrength: 68,
    tactic: 'balanced',
    formation: '4-4-2',
    startingLineup: [],
    substitutes: [],
  };
}

/**
 * Genera una alineación básica tomando los primeros jugadores disponibles.
 * @param {ClubState} club
 */
export function createDefaultLineup(club) {
  const starters = club.squad.slice(0, 11).map((player) => player.id);
  const substitutes = club.squad.slice(11, 16).map((player) => player.id);
  return { starters, substitutes };
}

/** @returns {CanallaDecision[]} */
export function listCanallaDecisions() {
  return [
    { type: 'sobornoArbitro', intensity: 'alta' },
    { type: 'filtrarRumor', intensity: 'media' },
    { type: 'fiestaIlegal', intensity: 'media' },
    { type: 'presionarFederacion', intensity: 'baja' },
  ];
}
