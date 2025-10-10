/**
 * Tipos JSDoc para el simulador canallesco. Aunque son comentarios, sirven para editores
 * y para mantener la documentación viva sin depender de compilaciones TypeScript.
 * @module types
 */

/** @typedef {string} PlayerId */

/** @typedef {"GK" | "DEF" | "MID" | "FWD"} Position */

/**
 * @typedef {Object} PlayerAttributes
 * @property {number} pace
 * @property {number} stamina
 * @property {number} dribbling
 * @property {number} passing
 * @property {number} shooting
 * @property {number} defending
 * @property {number} leadership
 * @property {number} potential
 */

/**
 * @typedef {Object} Contract
 * @property {number} salary
 * @property {number} duration
 * @property {number=} releaseClause
 */

/**
 * @typedef {Object} Player
 * @property {PlayerId} id
 * @property {string} name
 * @property {number} age
 * @property {Position} position
 * @property {PlayerAttributes} attributes
 * @property {number} morale
 * @property {number} fitness
 * @property {number} salary
 * @property {Contract} contract
 */

/**
 * @typedef {Object} ClubObjectives
 * @property {number=} minPosition
 * @property {boolean=} cupRun
 */

/**
 * @typedef {Object} ClubState
 * @property {string} name
 * @property {number} budget
 * @property {number} stadiumCapacity
 * @property {number} reputation
 * @property {Player[]} squad
 * @property {number} season
 * @property {ClubObjectives} objectives
 * @property {number} weeklyWageBill
 */

/**
 * @typedef {Object} MatchConfig
 * @property {boolean} home
 * @property {number} opponentStrength
 * @property {"defensive" | "balanced" | "attacking" | string} tactic
 * @property {string} formation
 * @property {PlayerId[]} startingLineup
 * @property {PlayerId[]} substitutes
 */

/**
 * @typedef {Object} MatchEvent
 * @property {number} minute
 * @property {string} type
 * @property {string} description
 */

/**
 * @typedef {Object} PlayerContribution
 * @property {PlayerId} playerId
 * @property {number} rating
 * @property {number=} goals
 * @property {number=} assists
 */

/**
 * @typedef {Object} MatchResult
 * @property {number} goalsFor
 * @property {number} goalsAgainst
 * @property {MatchEvent[]} events
 * @property {PlayerId=} manOfTheMatch
 * @property {string[]} narrative
 * @property {PlayerContribution[]} contributions
 */

/** @typedef {"sobornoArbitro" | "filtrarRumor" | "fiestaIlegal" | "presionarFederacion"} CanallaDecisionType */

/**
 * @typedef {Object} CanallaDecision
 * @property {CanallaDecisionType} type
 * @property {"baja" | "media" | "alta"} intensity
 */

/**
 * @typedef {Object} DecisionOutcome
 * @property {boolean} success
 * @property {number} reputationChange
 * @property {number} financesChange
 * @property {number} moraleChange
 * @property {number} riskLevel
 * @property {string=} sanctions
 * @property {string} narrative
 */

/**
 * @typedef {Object} MatchDayReport
 * @property {MatchResult} match
 * @property {DecisionOutcome=} decisionOutcome
 * @property {number} financesDelta
 * @property {ClubState} updatedClub
 */

/**
 * @typedef {Object} TransferOffer
 * @property {number} amount
 * @property {string} fromClub
 * @property {Contract} contract
 * @property {number=} signOnBonus
 */

export {};
