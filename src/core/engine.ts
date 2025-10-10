import {
  CanallaDecision,
  ClubState,
  DecisionOutcome,
  MatchConfig,
  MatchDayReport,
  MatchEvent,
  MatchResult,
  PlayerContribution,
} from "../types.js";

export interface MatchSimulationOptions {
  rng?: () => number;
  decision?: CanallaDecision;
  decisionOutcome?: DecisionOutcome;
}

const MINUTE_SEGMENTS = [5, 12, 20, 28, 35, 42, 50, 58, 65, 72, 80, 88];

function averageAttribute(club: ClubState, key: keyof ClubState["squad"][number]["attributes"]): number {
  const total = club.squad.reduce((sum, player) => sum + player.attributes[key], 0);
  return total / club.squad.length;
}

function averageMorale(club: ClubState): number {
  const total = club.squad.reduce((sum, player) => sum + player.morale, 0);
  return total / club.squad.length;
}

function tacticModifier(tactic: MatchConfig["tactic"]): number {
  switch (tactic) {
    case "defensive":
      return 0.92;
    case "attacking":
      return 1.05;
    case "balanced":
      return 1;
    default:
      return 1;
  }
}

function calculateClubStrength(club: ClubState, config: MatchConfig, moraleBoost = 0): number {
  const attack = (averageAttribute(club, "passing") + averageAttribute(club, "shooting")) / 2;
  const defense = (averageAttribute(club, "defending") + averageAttribute(club, "stamina")) / 2;
  const leadership = averageAttribute(club, "leadership");
  const morale = averageMorale(club) + moraleBoost;
  const homeBoost = config.home ? 5 : 0;
  const tacticBonus = tacticModifier(config.tactic) * 10;

  return attack * 0.4 + defense * 0.3 + leadership * 0.1 + morale * 0.1 + homeBoost + tacticBonus;
}

function narrativeIntro(config: MatchConfig, club: ClubState): string[] {
  const place = config.home ? "en el templo propio" : "visitando campo ajeno";
  return [
    `La banda del ${club.name} salta al verde ${place}, con la grada lista para repartir cera verbal.`,
  ];
}

function pickManOfTheMatch(contributions: PlayerContribution[], rng: () => number): PlayerContribution | undefined {
  if (contributions.length === 0) {
    return undefined;
  }
  const sorted = [...contributions].sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, 3);
  const index = Math.floor(rng() * top.length);
  return top[index];
}

export function simulateMatch(
  club: ClubState,
  config: MatchConfig,
  options: MatchSimulationOptions = {}
): MatchResult {
  const rng = options.rng ?? Math.random;
  const moraleBoost = options.decisionOutcome?.success ? options.decisionOutcome.moraleChange : 0;
  const intimidation = options.decisionOutcome?.success ? options.decisionOutcome.reputationChange * 0.2 : 0;

  const clubStrength = calculateClubStrength(club, config, moraleBoost);
  const opponentStrength = config.opponentStrength + intimidation;
  const strengthDiff = clubStrength - opponentStrength;

  let goalsFor = 0;
  let goalsAgainst = 0;
  const events: MatchEvent[] = [];
  const contributions: PlayerContribution[] = club.squad.map((player) => ({
    playerId: player.id,
    rating: 5 + rng() * 4,
  }));

  for (const minute of MINUTE_SEGMENTS) {
    const segmentModifier = strengthDiff / 150;
    const baseChance = 0.25 + segmentModifier;
    if (rng() < baseChance) {
      const isGoalFor = rng() < 0.5 + strengthDiff / 200;
      if (isGoalFor) {
        goalsFor += 1;
        const scorer = club.squad[Math.floor(rng() * club.squad.length)];
        const assistant = club.squad[Math.floor(rng() * club.squad.length)];
        events.push({
          minute,
          type: "gol",
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
          type: "gol_en_contra",
          description: `Minuto ${minute}: nos cascaron uno; el colegiado miró a otro lado mientras la defensa tomaba café.`,
        });
      }
    } else if (rng() < 0.2) {
      events.push({
        minute,
        type: "tarjeta",
        description: `Minuto ${minute}: el árbitro repartió tarjetas como churros en San Ginés.`,
      });
    }
  }

  const tensionEventChance = options.decision?.type === "sobornoArbitro" ? 0.4 : 0.2;
  if (rng() < tensionEventChance) {
    events.push({
      minute: 90,
      type: "polémica",
      description: `Final picante: ruedas de prensa cargaditas de indirectas y micrófonos volando.`,
    });
  }

  const narrative = [
    ...narrativeIntro(config, club),
    strengthDiff > 5
      ? "El rival se hizo pequeño como balón de playa en tormenta."
      : strengthDiff < -5
      ? "Costó horrores frenar la avalancha rival; sudor frío y uñas comidas."
      : "Partido tenso, digno de sobremesa con tertulianos gritones.",
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

export function playMatchDay(
  club: ClubState,
  config: MatchConfig,
  options: MatchSimulationOptions = {}
): MatchDayReport {
  const match = simulateMatch(club, config, options);
  const financesDelta = calculateMatchFinances(club, match);
  const reputationUpdate = options.decisionOutcome?.reputationChange ?? 0;
  const moraleUpdate = options.decisionOutcome?.moraleChange ?? 0;

  const updatedClub: ClubState = {
    ...club,
    budget: club.budget + financesDelta,
    reputation: Math.max(-100, Math.min(100, club.reputation + reputationUpdate)),
    squad: club.squad.map((player) => ({
      ...player,
      morale: Math.max(-100, Math.min(100, player.morale + moraleUpdate / club.squad.length)),
      fitness: Math.max(
        0,
        player.fitness - 5 + (options.decisionOutcome?.moraleChange ?? 0) * 0.5
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

function calculateMatchFinances(club: ClubState, match: MatchResult): number {
  const baseAttendance = club.stadiumCapacity * (0.4 + Math.min(0.5, club.reputation / 200));
  const excitement = match.goalsFor + match.goalsAgainst > 3 ? 1.2 : 1;
  const ticketPrice = 25;
  const income = baseAttendance * ticketPrice * excitement;
  const bonuses = match.goalsFor > match.goalsAgainst ? 7500 : match.goalsFor === match.goalsAgainst ? 3500 : 1500;
  return Math.round(income + bonuses - club.weeklyWageBill);
}
