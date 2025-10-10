import { CanallaDecision, ClubState, MatchConfig, Player } from "../types.js";

function createPlayer(partial: Partial<Player> & Pick<Player, "id" | "name" | "position">): Player {
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

export function createExampleClub(): ClubState {
  const squad: Player[] = [
    createPlayer({
      id: "portero-legendario",
      name: "Paco 'El Gato' Calderón",
      position: "GK",
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
      id: "lateral-callejero",
      name: "Romario del Bulevar",
      position: "DEF",
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
      id: "cerebro-tabernas",
      name: "Isco de Lavapiés",
      position: "MID",
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
      id: "killer-picaro",
      name: "Chino Benítez",
      position: "FWD",
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
      id: "canterano-osado",
      name: "Perla del Bar Manolo",
      position: "MID",
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
  ];

  return {
    name: "Atlético Bar Callejero",
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

export function createDefaultMatchConfig(): MatchConfig {
  return {
    home: true,
    opponentStrength: 68,
    tactic: "balanced",
  };
}

export function listCanallaDecisions(): CanallaDecision[] {
  return [
    { type: "sobornoArbitro", intensity: "alta" },
    { type: "filtrarRumor", intensity: "media" },
    { type: "fiestaIlegal", intensity: "media" },
    { type: "presionarFederacion", intensity: "baja" },
  ];
}
