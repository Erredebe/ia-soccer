export type PlayerId = string;

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerAttributes {
  pace: number;
  stamina: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defending: number;
  leadership: number;
  potential: number;
}

export interface Contract {
  salary: number;
  duration: number;
  releaseClause?: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  age: number;
  position: Position;
  attributes: PlayerAttributes;
  morale: number;
  fitness: number;
  salary: number;
  contract: Contract;
}

export interface ClubObjectives {
  minPosition?: number;
  cupRun?: boolean;
}

export interface ClubState {
  name: string;
  budget: number;
  stadiumCapacity: number;
  reputation: number;
  squad: Player[];
  season: number;
  objectives: ClubObjectives;
  weeklyWageBill: number;
}

export interface MatchConfig {
  home: boolean;
  opponentStrength: number;
  tactic: "defensive" | "balanced" | "attacking" | string;
}

export interface MatchEvent {
  minute: number;
  type: string;
  description: string;
}

export interface PlayerContribution {
  playerId: PlayerId;
  rating: number;
  goals?: number;
  assists?: number;
}

export interface MatchResult {
  goalsFor: number;
  goalsAgainst: number;
  events: MatchEvent[];
  manOfTheMatch?: PlayerId;
  narrative: string[];
  contributions: PlayerContribution[];
}

export type CanallaDecisionType =
  | "sobornoArbitro"
  | "filtrarRumor"
  | "fiestaIlegal"
  | "presionarFederacion";

export interface CanallaDecision {
  type: CanallaDecisionType;
  intensity: "baja" | "media" | "alta";
}

export interface DecisionOutcome {
  success: boolean;
  reputationChange: number;
  financesChange: number;
  moraleChange: number;
  riskLevel: number;
  sanctions?: string;
  narrative: string;
}

export interface MatchDayReport {
  match: MatchResult;
  decisionOutcome?: DecisionOutcome;
  financesDelta: number;
  updatedClub: ClubState;
}

export interface TransferOffer {
  amount: number;
  fromClub: string;
  contract: Contract;
  signOnBonus?: number;
}
