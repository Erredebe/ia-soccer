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
 * @typedef {Object} LeagueStanding
 * @property {string} club
 * @property {number} played
 * @property {number} wins
 * @property {number} draws
 * @property {number} losses
 * @property {number} goalsFor
 * @property {number} goalsAgainst
 * @property {number} points
 */

/**
 * @typedef {Object} LeagueState
 * @property {string} name
 * @property {number} matchDay
 * @property {LeagueStanding[]} table
 */

/**
 * @typedef {Object} TransferTarget
 * @property {string} id
 * @property {Player} player
 * @property {number} price
 * @property {string} origin
 */

/** @typedef {"quick" | "text"} MatchViewMode */

/** @typedef {"low" | "medium" | "high"} PressingLevel */

/** @typedef {"slow" | "balanced" | "fast"} TempoLevel */

/** @typedef {"narrow" | "balanced" | "wide"} WidthLevel */

/**
 * @typedef {Object} TacticalInstructions
 * @property {PressingLevel=} pressing
 * @property {TempoLevel=} tempo
 * @property {WidthLevel=} width
 * @property {boolean=} counterAttack
 * @property {boolean=} playThroughMiddle
 */

/**
 * @typedef {Object} MatchSubstitution
 * @property {PlayerId} out
 * @property {PlayerId} in
 * @property {string=} reason
 */

/**
 * @typedef {Object} MatchAdjustment
 * @property {number=} minute
 * @property {"defensive" | "balanced" | "attacking" | string=} tactic
 * @property {string=} formation
 * @property {TacticalInstructions=} instructions
 * @property {MatchSubstitution[]=} substitutions
 */

/**
 * @typedef {Object} MatchConfig
 * @property {boolean} home
 * @property {number} opponentStrength
 * @property {"defensive" | "balanced" | "attacking" | string} tactic
 * @property {string} formation
 * @property {PlayerId[]} startingLineup
 * @property {PlayerId[]} substitutes
 * @property {TacticalInstructions=} instructions
 * @property {MatchAdjustment=} halftimeAdjustments
 * @property {MatchAdjustment[]=} inMatchAdjustments
 * @property {MatchViewMode=} viewMode
 */

/**
 * @typedef {Object} MatchEvent
 * @property {number} minute
 * @property {string} type
 * @property {string} description
 * @property {PlayerId=} playerId
 * @property {PlayerId=} relatedPlayerId
 * @property {string=} severity
 */

/**
 * @typedef {Object} PlayerContribution
 * @property {PlayerId} playerId
 * @property {number} rating
 * @property {number=} goals
 * @property {number=} assists
 * @property {number=} shots
 * @property {number=} shotsOnTarget
 * @property {number=} passesCompleted
 * @property {number=} passesAttempted
 * @property {number=} tackles
 * @property {number=} saves
 * @property {number=} minutesPlayed
 */

/**
 * @typedef {Object} MatchStatistics
 * @property {{ for: number; against: number }} possession
 * @property {{ for: number; against: number; onTargetFor: number; onTargetAgainst: number }} shots
 * @property {{ for: number; against: number }} expectedGoals
 * @property {{ completedFor: number; attemptedFor: number; completedAgainst: number; attemptedAgainst: number }} passes
 * @property {{ for: number; against: number }} fouls
 * @property {{ yellowFor: number; yellowAgainst: number; redFor: number; redAgainst: number }} cards
 * @property {{ for: number; against: number }} injuries
 * @property {{ for: number; against: number }} saves
 */

/**
 * @typedef {Object} MatchResult
 * @property {number} goalsFor
 * @property {number} goalsAgainst
 * @property {MatchEvent[]} events
 * @property {PlayerId=} manOfTheMatch
 * @property {string[]} narrative
 * @property {PlayerContribution[]} contributions
 * @property {MatchStatistics} statistics
 * @property {string[]} commentary
 * @property {MatchViewMode} viewMode
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
 * @property {boolean=} appliedToClub
 */

/**
 * @typedef {Object} SponsorContract
 * @property {string} name
 * @property {number} value
 * @property {"match" | "monthly" | "annual"} frequency
 * @property {number=} lastPaidMatchDay
 */

/**
 * @typedef {Object} TVDeal
 * @property {string} name
 * @property {number} perMatch
 * @property {number} bonusWin
 * @property {number} bonusDraw
 */

/**
 * @typedef {Object} MerchandisingPlan
 * @property {string} brand
 * @property {number} base
 * @property {number} bonusWin
 * @property {number} bonusStarPlayer
 */

/**
 * @typedef {Object} InfrastructureState
 * @property {number} stadiumLevel
 * @property {number} academyLevel
 * @property {number} medicalLevel
 * @property {number} trainingLevel
 */

/**
 * @typedef {Object} OperatingExpenses
 * @property {number} maintenance
 * @property {number} staff
 * @property {number} academy
 * @property {number} medical
 */

/**
 * @typedef {Object} MatchdayFinancials
 * @property {number} income
 * @property {number} expenses
 * @property {number} net
 * @property {Record<string, number>} incomeBreakdown
 * @property {Record<string, number>} expenseBreakdown
 * @property {string[]} notes
 * @property {number=} attendance
 * @property {SponsorContract[]=} updatedSponsors
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
 * @property {LeagueState} league
 * @property {SponsorContract[]=} sponsors
 * @property {TVDeal=} tvDeal
 * @property {MerchandisingPlan=} merchandising
 * @property {InfrastructureState=} infrastructure
 * @property {OperatingExpenses=} operatingExpenses
 */

/**
 * @typedef {Object} MatchDayReport
 * @property {MatchResult} match
 * @property {DecisionOutcome=} decisionOutcome
 * @property {number} financesDelta
 * @property {MatchdayFinancials=} finances
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
