// @ts-check
/**
 * Tipos específicos de la competición copera y definiciones compartidas.
 * @module core/cup-types
 */

/**
 * Identificadores de ronda de copa soportados.
 * @typedef {"roundOf16" | "quarterFinal" | "semiFinal" | "final"} CupRoundId
 */

/**
 * Representa la definición base de una ronda eliminatoria.
 * @typedef {Object} CupRoundDefinition
 * @property {CupRoundId} id Identificador estable de la ronda.
 * @property {string} name Nombre descriptivo mostrado en la interfaz.
 * @property {number} size Número de clubes participantes en la ronda.
 * @property {number} reward Premio económico por avanzar desde esta ronda.
 * @property {number} consolationReward Ingreso garantizado incluso si se cae en la ronda.
 * @property {number} reputationWin Reputación ganada al superar la ronda.
 * @property {number} reputationEliminated Impacto en reputación al quedar fuera.
 * @property {number=} championBonus Prima adicional por conquistar la copa.
 */

/** @type {readonly CupRoundDefinition[]} */
export const CUP_ROUND_DEFINITIONS = Object.freeze([
  {
    id: 'roundOf16',
    name: 'Octavos de final',
    size: 16,
    reward: 45000,
    consolationReward: 18000,
    reputationWin: 4,
    reputationEliminated: -3,
  },
  {
    id: 'quarterFinal',
    name: 'Cuartos de final',
    size: 8,
    reward: 70000,
    consolationReward: 28000,
    reputationWin: 6,
    reputationEliminated: -4,
  },
  {
    id: 'semiFinal',
    name: 'Semifinales',
    size: 4,
    reward: 110000,
    consolationReward: 45000,
    reputationWin: 10,
    reputationEliminated: -6,
  },
  {
    id: 'final',
    name: 'Final',
    size: 2,
    reward: 180000,
    consolationReward: 75000,
    reputationWin: 16,
    reputationEliminated: -8,
    championBonus: 120000,
  },
]);

/**
 * Emparejamiento dentro de una ronda eliminatoria.
 * @typedef {Object} CupTie
 * @property {string} id Identificador único dentro de la ronda.
 * @property {string|null} home Club local (puede ser nulo hasta el sorteo).
 * @property {string|null} away Club visitante (puede ser nulo hasta el sorteo).
 * @property {number|null} homeGoals Goles del local registrados tras la disputa.
 * @property {number|null} awayGoals Goles del visitante registrados tras la disputa.
 * @property {boolean} played Indica si la eliminatoria ya se jugó.
 * @property {string|null} winner Nombre del club clasificado.
 * @property {boolean} includesClub Verdadero si el club del jugador participa.
 * @property {'pending' | 'scheduled' | 'played'} status Estado interno de la eliminatoria.
 */

/**
 * Información agregada de cada ronda de copa.
 * @typedef {Object} CupRound
 * @property {CupRoundId} id Identificador de la ronda.
 * @property {string} name Nombre visible para la interfaz.
 * @property {number} reward Premio económico por superar la ronda.
 * @property {CupTie[]} ties Emparejamientos configurados para la ronda.
 * @property {boolean} drawCompleted Indica si el sorteo se realizó.
 * @property {boolean} finished Señala si todas las eliminatorias se resolvieron.
 * @property {string[]} drawNarrative Mensajes descriptivos del último sorteo.
 */

/**
 * Próximo partido copero del club.
 * @typedef {Object} CupFixture
 * @property {string} tieId Identificador de la eliminatoria asignada.
 * @property {CupRoundId} roundId Ronda a la que pertenece el partido.
 * @property {string} roundName Nombre de la ronda.
 * @property {string} opponent Rival asignado.
 * @property {boolean} home Verdadero si se juega como local.
 */

/**
 * Entrada histórica para narrar avances o eliminaciones en copa.
 * @typedef {Object} CupHistoryEntry
 * @property {CupRoundId} roundId Ronda referenciada.
 * @property {string} roundName Nombre amigable de la ronda.
 * @property {'victory' | 'eliminated' | 'champion'} outcome Resultado para el club.
 * @property {number} prize Ingreso económico asociado al hito.
 * @property {number} reputationDelta Variación de reputación conseguida.
 * @property {string[]} narrative Mensajes generados tras la jornada copera.
 */

/**
 * Resultado de actualizar la copa tras disputar una eliminatoria.
 * @typedef {Object} CupProgression
 * @property {CupState} cup Nuevo estado de la copa tras aplicar el resultado.
 * @property {CupHistoryEntry} historyEntry Registro generado para el historial.
 * @property {CupFixture|null} nextFixture Próximo cruce si seguimos vivos.
 */

/**
 * Estado completo de la copa para el club.
 * @typedef {Object} CupState
 * @property {string} name Nombre de la competición.
 * @property {number} edition Número de edición vigente.
 * @property {CupRound[]} rounds Rondas configuradas para la temporada.
 * @property {number} currentRoundIndex Índice de la ronda actual en el arreglo de rondas.
 * @property {'idle' | 'awaiting-draw' | 'awaiting-match' | 'eliminated' | 'champions'} status Estado global.
 * @property {string[]} pendingParticipants Bombos pendientes del próximo sorteo.
 * @property {CupFixture|null} nextFixture Próxima eliminatoria asignada al club.
 * @property {CupHistoryEntry[]} history Trayectoria acumulada en la copa vigente.
 */

export {}; 
