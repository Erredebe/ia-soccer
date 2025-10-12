// @ts-check
/**
 * Tipos JSDoc para el simulador canallesco. Aunque son comentarios, sirven para editores
 * y para mantener la documentación viva sin depender de compilaciones TypeScript.
 * @module types
 */

/** @typedef {import('./core/types.js').CupState} CupState */
/** @typedef {import('./core/types.js').CupRoundId} CupRoundId */
/** @typedef {import('./core/types.js').CupProgression} CupProgression */
/** @typedef {import('./core/types.js').CupHistoryEntry} CupHistoryEntry */

/**
 * Definición del tipo `PlayerId`.
 * @typedef {string} PlayerId
 */

/**
 * Definición del tipo `Position`.
 * @typedef {"GK" | "DEF" | "MID" | "FWD"} Position
 */

/**
 * Definición del tipo `PlayerAttributes`.
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
 * Definición del tipo `Contract`.
 * @typedef {Object} Contract
 * @property {number} salary
 * @property {number} duration
 * @property {number=} releaseClause
 */

/**
 * Definición del tipo `PlayerAvailability`.
 * @typedef {Object} PlayerAvailability
 * @property {number} injuryMatches Restantes para volver tras lesión (0 si está disponible)
 * @property {number} suspensionMatches Partidos de sanción pendientes
 */

/**
 * Definición del tipo `PlayerSeasonLog`.
 * @typedef {Object} PlayerSeasonLog
 * @property {number} goals
 * @property {number} assists
 * @property {number} yellowCards
 * @property {number} redCards
 * @property {number} matches
 * @property {number} minutes
 * @property {number} injuries
 * @property {number} cleanSheets
 */

/**
 * Definición del tipo `Player`.
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
 * @property {PlayerAvailability=} availability
 * @property {PlayerSeasonLog=} seasonLog
 * @property {string} originalName
 * @property {string=} nickname
 */

/**
 * Definición del tipo `ClubObjectives`.
 * @typedef {Object} ClubObjectives
 * @property {number=} minPosition
 * @property {boolean=} cupRun
 * @property {CupRoundId=} cupRoundTarget
*/

/**
 * Definición del tipo `LeagueStanding`.
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
 * Definición del tipo `LeagueState`.
 * @typedef {Object} LeagueState
 * @property {string} name
 * @property {number} matchDay
 * @property {LeagueStanding[]} table
 * @property {string[]=} rivals
 * @property {number=} size
 * @property {number=} totalMatchdays
 * @property {string=} difficulty
 * @property {number=} difficultyMultiplier
 */

/**
 * Definición del tipo `ClubRecord`.
 * @typedef {Object} ClubRecord
 * @property {number} season
 * @property {number} matchday
 * @property {string} opponent
 * @property {number} goalsFor
 * @property {number} goalsAgainst
 * @property {number} goalDifference
 * @property {number} totalGoals
 */

/**
 * Definición del tipo `ClubRecords`.
 * @typedef {Object} ClubRecords
 * @property {ClubRecord=} biggestWin
 * @property {ClubRecord=} heaviestDefeat
 * @property {ClubRecord=} goalFestival
 */

/**
 * Definición del tipo `ClubHistoricalStats`.
 * @typedef {Object} ClubHistoricalStats
 * @property {number} titles
 * @property {number} lastTitleSeason
 * @property {ClubRecords} records
 */

/**
 * Definición del tipo `ClubSeasonStats`.
 * @typedef {Object} ClubSeasonStats
 * @property {number} matches
 * @property {number} wins
 * @property {number} draws
 * @property {number} losses
 * @property {number} goalsFor
 * @property {number} goalsAgainst
 * @property {number} possessionFor
 * @property {number} unbeatenRun
 * @property {number} bestUnbeatenRun
 * @property {ClubHistoricalStats} history
 */

/**
 * Definición del tipo `TransferTarget`.
 * @typedef {Object} TransferTarget
 * @property {string} id
 * @property {Player} player
 * @property {number} price
 * @property {string} origin
 */

/**
 * Definición del tipo `MatchViewMode`.
 * @typedef {"quick" | "text"} MatchViewMode
 */

/**
 * Definición del tipo `PressingLevel`.
 * @typedef {"low" | "medium" | "high"} PressingLevel
 */

/**
 * Definición del tipo `TempoLevel`.
 * @typedef {"slow" | "balanced" | "fast"} TempoLevel
 */

/**
 * Definición del tipo `WidthLevel`.
 * @typedef {"narrow" | "balanced" | "wide"} WidthLevel
 */

/**
 * Definición del tipo `TacticalInstructions`.
 * @typedef {Object} TacticalInstructions
 * @property {PressingLevel=} pressing
 * @property {TempoLevel=} tempo
 * @property {WidthLevel=} width
 * @property {boolean=} counterAttack
 * @property {boolean=} playThroughMiddle
 */

/**
 * Definición del tipo `MatchSubstitution`.
 * @typedef {Object} MatchSubstitution
 * @property {PlayerId} out
 * @property {PlayerId} in
 * @property {string=} reason
 */

/**
 * Definición del tipo `MatchAdjustment`.
 * @typedef {Object} MatchAdjustment
 * @property {number=} minute
 * @property {"defensive" | "balanced" | "attacking" | string=} tactic
 * @property {string=} formation
 * @property {TacticalInstructions=} instructions
 * @property {MatchSubstitution[]=} substitutions
 */

/**
 * Definición del tipo `MatchConfig`.
 * @typedef {Object} MatchConfig
 * @property {boolean} home
 * @property {number} opponentStrength
 * @property {number=} difficultyMultiplier
 * @property {"defensive" | "balanced" | "attacking" | string} tactic
 * @property {string} formation
 * @property {PlayerId[]} startingLineup
 * @property {PlayerId[]} substitutes
 * @property {TacticalInstructions=} instructions
 * @property {MatchAdjustment=} halftimeAdjustments
 * @property {MatchAdjustment[]=} inMatchAdjustments
 * @property {MatchViewMode=} viewMode
 * @property {(number | string)=} seed
 */

/**
 * Definición del tipo `MatchEvent`.
 * @typedef {Object} MatchEvent
 * @property {number} minute
 * @property {string} type
 * @property {string} description
 * @property {PlayerId=} playerId
 * @property {PlayerId=} relatedPlayerId
 * @property {string=} severity
 * @property {number=} cardCount
 */

/**
 * Definición del tipo `PlayerContribution`.
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
 * Definición del tipo `MatchStatistics`.
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
 * Definición del tipo `MatchResult`.
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
 * @property {'league' | 'cup'=} competition
 * @property {CupRoundId=} cupRoundId
 * @property {number=} seed
*/

/**
 * Definición del tipo `CanallaDecisionType`.
 * @typedef {"sobornoArbitro" | "filtrarRumor" | "fiestaIlegal" | "presionarFederacion"} CanallaDecisionType
 */

/**
 * Definición del tipo `CanallaDecision`.
 * @typedef {Object} CanallaDecision
 * @property {CanallaDecisionType} type
 * @property {"baja" | "media" | "alta"} intensity
 */

/**
 * Definición del tipo `DecisionOutcome`.
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
 * Definición del tipo `SponsorContract`.
 * @typedef {Object} SponsorContract
 * @property {string} name
 * @property {number} value
 * @property {"match" | "monthly" | "annual"} frequency
 * @property {number=} lastPaidMatchDay
 */

/**
 * Definición del tipo `TVDeal`.
 * @typedef {Object} TVDeal
 * @property {string} name
 * @property {number} perMatch
 * @property {number} bonusWin
 * @property {number} bonusDraw
 */

/**
 * Definición del tipo `MerchandisingPlan`.
 * @typedef {Object} MerchandisingPlan
 * @property {string} brand
 * @property {number} base
 * @property {number} bonusWin
 * @property {number} bonusStarPlayer
 */

/**
 * Definición del tipo `InfrastructureState`.
 * @typedef {Object} InfrastructureState
 * @property {number} stadiumLevel
 * @property {number} academyLevel
 * @property {number} medicalLevel
 * @property {number} trainingLevel
 */

/**
 * Definición del tipo `OperatingExpenses`.
 * @typedef {Object} OperatingExpenses
 * @property {number} maintenance
 * @property {number} staff
 * @property {number} academy
 * @property {number} medical
 */

/**
 * Definición del tipo `MatchdayFinancials`.
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
 * Definición del tipo `ClubState`.
 * @typedef {Object} ClubState
 * @property {string} name
 * @property {string} city
 * @property {string} stadiumName
 * @property {number} budget
 * @property {number} stadiumCapacity
 * @property {number} reputation
 * @property {string} primaryColor
 * @property {string} secondaryColor
 * @property {string=} logoUrl
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
 * @property {ClubSeasonStats=} seasonStats
 * @property {CupState=} cup
 */

/**
 * Definición del tipo `MatchDayReport`.
 * @typedef {Object} MatchDayReport
 * @property {MatchResult} match
 * @property {DecisionOutcome=} decisionOutcome
 * @property {number} financesDelta
 * @property {MatchdayFinancials=} finances
 * @property {ClubState} updatedClub
 * @property {'league' | 'cup'=} competition
 * @property {CupProgression=} cupProgress
*/

/**
 * Definición del tipo `MatchHistoryEntry`.
 * @typedef {Object} MatchHistoryEntry
 * @property {string} id
 * @property {number} season
 * @property {number} matchday
 * @property {string} opponent
 * @property {MatchDayReport} report
 * @property {DecisionOutcome=} decisionOutcome
 * @property {{ seedInputValue?: string }=} metadata
 * @property {'league' | 'cup'=} competition
 * @property {CupRoundId=} cupRoundId
 * @property {string=} cupRoundName
 * @property {number} timestamp
*/

/**
 * Definición del tipo `SavedGameBlob`.
 * @typedef {Object} SavedGameBlob
 * @property {number} version
 * @property {number} timestamp
 * @property {ClubState} club
 * @property {LeagueState} league
 * @property {MatchConfig} config
 * @property {TransferTarget[]} transferMarket
 * @property {MatchHistoryEntry[]=} history
 */

/**
 * Definición del tipo `TransferOffer`.
 * @typedef {Object} TransferOffer
 * @property {number} amount
 * @property {string} fromClub
 * @property {Contract} contract
 * @property {number=} signOnBonus
 */

export {};
