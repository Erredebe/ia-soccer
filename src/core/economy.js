/**
 * Utilidades económicas del simulador.
 * @module core/economy
 */

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').PlayerId} PlayerId */
/** @typedef {import('../types.js').TransferOffer} TransferOffer */

/**
 * @typedef {Object} EconomyImpact
 * @property {ClubState} updatedClub
 * @property {string[]} narrative
 */

/**
 * @param {ClubState} club
 * @returns {ClubState}
 */
export function applyWeeklyExpenses(club) {
  const updatedBudget = club.budget - club.weeklyWageBill;
  return {
    ...club,
    budget: updatedBudget,
  };
}

/**
 * @param {ClubState} club
 * @param {PlayerId} playerId
 * @param {TransferOffer} offer
 * @returns {EconomyImpact}
 */
export function processTransferOffer(club, playerId, offer) {
  const player = club.squad.find((p) => p.id === playerId);
  if (!player) {
    return {
      updatedClub: club,
      narrative: ['El fax nunca llegó: oferta rechazada porque el jugador ni aparece en plantilla.'],
    };
  }

  const remainingSquad = club.squad.filter((p) => p.id !== playerId);
  const updatedBudget = club.budget + offer.amount - (offer.signOnBonus ?? 0);

  const updatedClub = {
    ...club,
    budget: updatedBudget,
    squad: remainingSquad,
  };

  const narrative = [
    `Venta cerrada: ${player.name} se marcha por ${offer.amount.toLocaleString()}€, dejando caja y hueco para cantera.`,
  ];

  return { updatedClub, narrative };
}

/**
 * @param {ClubState} club
 * @param {number} financesDelta
 * @returns {ClubState}
 */
export function adjustBudgetAfterMatch(club, financesDelta) {
  return {
    ...club,
    budget: club.budget + financesDelta,
  };
}
