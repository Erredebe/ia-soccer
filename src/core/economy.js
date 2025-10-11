// @ts-check
/**
 * Utilidades económicas del simulador.
 * @module core/economy
 */

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').PlayerId} PlayerId */
/** @typedef {import('../types.js').TransferOffer} TransferOffer */
/** @typedef {import('../types.js').MatchResult} MatchResult */
/** @typedef {import('../types.js').MatchdayFinancials} MatchdayFinancials */
/** @typedef {import('../types.js').SponsorContract} SponsorContract */

const MONTHLY_MATCHES = 4;

/**
 * Genera una copia con los gastos semanales aplicados, considerando personal y academia.
 * @param {ClubState} club
 * @returns {ClubState}
 */
export function applyWeeklyExpenses(club) {
  const operating = club.operatingExpenses ?? {
    maintenance: 0,
    staff: 0,
    academy: 0,
    medical: 0,
  };
  const weeklyOperatingCost =
    operating.maintenance + operating.staff + operating.academy + operating.medical;
  const updatedBudget = club.budget - club.weeklyWageBill - weeklyOperatingCost;
  return {
    ...club,
    budget: updatedBudget,
  };
}

/**
 * Determina si un patrocinio debe pagar en la jornada actual.
 * @param {SponsorContract} sponsor
 * @param {number} currentMatchDay
 */
function sponsorDue(sponsor, currentMatchDay) {
  const lastPaid = sponsor.lastPaidMatchDay ?? -1;
  if (sponsor.frequency === 'match') {
    return lastPaid !== currentMatchDay;
  }
  if (sponsor.frequency === 'monthly') {
    return currentMatchDay - lastPaid >= MONTHLY_MATCHES;
  }
  // annual
  return currentMatchDay - lastPaid >= 40;
}

/**
 * Calcula la asistencia estimada para la jornada.
 * @param {ClubState} club
 * @param {MatchResult} match
 */
function calculateAttendance(club, match) {
  const infrastructure = club.infrastructure ?? {
    stadiumLevel: 1,
    academyLevel: 0,
    medicalLevel: 0,
    trainingLevel: 1,
  };
  const reputationBoost = 0.4 + Math.min(0.5, club.reputation / 200);
  const stadiumBoost = 1 + (infrastructure.stadiumLevel - 1) * 0.08;
  const excitement = match.goalsFor + match.goalsAgainst >= 3 ? 1.1 : 1;
  const moraleBoost = Math.max(0.9, Math.min(1.1, match.statistics.possession.for / 50));
  const rawAttendance = club.stadiumCapacity * reputationBoost * stadiumBoost * excitement * moraleBoost;
  return Math.round(Math.min(club.stadiumCapacity, rawAttendance));
}

/**
 * Calcula los ingresos y gastos desglosados de la jornada.
 * @param {ClubState} club
 * @param {MatchResult} match
 * @returns {MatchdayFinancials}
 */
export function calculateMatchdayFinances(club, match) {
  const notes = [];
  const attendance = calculateAttendance(club, match);
  const ticketPrice = 25 + (club.infrastructure?.stadiumLevel ?? 1) * 1.5;
  const ticketIncome = Math.round(attendance * ticketPrice);

  let sponsorIncome = 0;
  const sponsors = (club.sponsors ?? []).map((sponsor) => ({ ...sponsor }));
  const currentMatchDay = club.league?.matchDay ?? 0;
  for (const sponsor of sponsors) {
    if (sponsorDue(sponsor, currentMatchDay)) {
      sponsorIncome += sponsor.value;
      sponsor.lastPaidMatchDay = currentMatchDay;
      notes.push(`Patrocinio recibido: ${sponsor.name} aporta ${sponsor.value.toLocaleString()}€.`);
    }
  }

  let tvIncome = 0;
  if (club.tvDeal) {
    tvIncome += club.tvDeal.perMatch;
    if (match.goalsFor > match.goalsAgainst) {
      tvIncome += club.tvDeal.bonusWin;
    } else if (match.goalsFor === match.goalsAgainst) {
      tvIncome += club.tvDeal.bonusDraw;
    }
  }

  let merchandisingIncome = 0;
  if (club.merchandising) {
    merchandisingIncome += club.merchandising.base;
    if (match.goalsFor > match.goalsAgainst) {
      merchandisingIncome += club.merchandising.bonusWin;
    }
    if (match.manOfTheMatch) {
      merchandisingIncome += club.merchandising.bonusStarPlayer;
    }
  }

  const prizeIncome = match.goalsFor > match.goalsAgainst ? 15000 : match.goalsFor === match.goalsAgainst ? 6000 : 2500;

  const incomeBreakdown = {
    taquilla: ticketIncome,
    patrocinio: sponsorIncome,
    tv: tvIncome,
    merchandising: merchandisingIncome,
    premios: prizeIncome,
  };

  const income = Object.values(incomeBreakdown).reduce((acc, value) => acc + value, 0);

  const operating = club.operatingExpenses ?? {
    maintenance: Math.round(club.stadiumCapacity * 0.8),
    staff: 25000,
    academy: 12000,
    medical: 8000,
  };

  const injuryCosts = match.statistics.injuries.for * 5000;
  if (injuryCosts > 0) {
    notes.push('Los fisios han pasado factura tras las lesiones de la jornada.');
  }

  const expenseBreakdown = {
    salarios: club.weeklyWageBill,
    mantenimiento: operating.maintenance,
    personal: operating.staff,
    cantera: operating.academy,
    serviciosMedicos: operating.medical + injuryCosts,
  };

  const expenses = Object.values(expenseBreakdown).reduce((acc, value) => acc + value, 0);
  const net = income - expenses;

  if (net < 0) {
    notes.push('Las cuentas tiemblan: toca vigilar el gasto o vender a alguna estrella.');
  } else {
    notes.push('Balance positivo: la directiva sonríe (por ahora).');
  }

  return {
    income,
    expenses,
    net,
    incomeBreakdown,
    expenseBreakdown,
    notes,
    attendance,
    updatedSponsors: sponsors,
  };
}

/**
 * Procesa una oferta de transferencia actualizando plantilla y caja.
 * @param {ClubState} club
 * @param {PlayerId} playerId
 * @param {TransferOffer} offer
 * @returns {{ updatedClub: ClubState; narrative: string[] }}
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
 * Ajusta el presupuesto del club tras aplicar el balance económico de la jornada.
 * @param {ClubState} club Estado original del club.
 * @param {number} financesDelta Diferencia neta de la jornada.
 * @returns {ClubState}
 */
export function adjustBudgetAfterMatch(club, financesDelta) {
  return {
    ...club,
    budget: club.budget + financesDelta,
  };
}
