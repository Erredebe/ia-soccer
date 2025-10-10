import { ClubState, PlayerId, TransferOffer } from "../types.js";

export interface EconomyImpact {
  updatedClub: ClubState;
  narrative: string[];
}

export function applyWeeklyExpenses(club: ClubState): ClubState {
  const updatedBudget = club.budget - club.weeklyWageBill;
  return {
    ...club,
    budget: updatedBudget,
  };
}

export function processTransferOffer(
  club: ClubState,
  playerId: PlayerId,
  offer: TransferOffer
): EconomyImpact {
  const player = club.squad.find((p) => p.id === playerId);
  if (!player) {
    return {
      updatedClub: club,
      narrative: ["El fax nunca llegó: oferta rechazada porque el jugador ni aparece en plantilla."],
    };
  }

  const remainingSquad = club.squad.filter((p) => p.id !== playerId);
  const updatedBudget = club.budget + offer.amount - (offer.signOnBonus ?? 0);

  const updatedClub: ClubState = {
    ...club,
    budget: updatedBudget,
    squad: remainingSquad,
  };

  const narrative = [
    `Venta cerrada: ${player.name} se marcha por ${offer.amount.toLocaleString()}€, dejando caja y hueco para cantera.`,
  ];

  return { updatedClub, narrative };
}

export function adjustBudgetAfterMatch(club: ClubState, financesDelta: number): ClubState {
  return {
    ...club,
    budget: club.budget + financesDelta,
  };
}
