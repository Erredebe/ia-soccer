import { CanallaDecision, ClubState, DecisionOutcome } from "../types.js";

export interface DecisionResolution {
  outcome: DecisionOutcome;
  updatedClub: ClubState;
}

interface DecisionParameters {
  baseSuccess: number;
  reputationSuccess: number;
  reputationFailure: number;
  moraleSuccess: number;
  moraleFailure: number;
  cost: number;
  fine: number;
}

const DECISION_MAP: Record<CanallaDecision["type"], DecisionParameters> = {
  sobornoArbitro: {
    baseSuccess: 0.35,
    reputationSuccess: 6,
    reputationFailure: -18,
    moraleSuccess: 8,
    moraleFailure: -12,
    cost: -25000,
    fine: 60000,
  },
  filtrarRumor: {
    baseSuccess: 0.55,
    reputationSuccess: 3,
    reputationFailure: -9,
    moraleSuccess: 5,
    moraleFailure: -6,
    cost: -4000,
    fine: 15000,
  },
  fiestaIlegal: {
    baseSuccess: 0.4,
    reputationSuccess: 4,
    reputationFailure: -14,
    moraleSuccess: 12,
    moraleFailure: -15,
    cost: -8000,
    fine: 20000,
  },
  presionarFederacion: {
    baseSuccess: 0.45,
    reputationSuccess: 7,
    reputationFailure: -10,
    moraleSuccess: 3,
    moraleFailure: -5,
    cost: -5000,
    fine: 25000,
  },
};

const INTENSITY_MODIFIER: Record<CanallaDecision["intensity"], number> = {
  baja: -0.08,
  media: 0,
  alta: 0.12,
};

export function resolveCanallaDecision(
  club: ClubState,
  decision: CanallaDecision,
  rng: () => number = Math.random
): DecisionResolution {
  const params = DECISION_MAP[decision.type];
  const intensity = INTENSITY_MODIFIER[decision.intensity];
  const successThreshold = params.baseSuccess + intensity;
  const success = rng() < successThreshold;

  const reputationChange = success ? params.reputationSuccess : params.reputationFailure;
  const moraleChange = success ? params.moraleSuccess : params.moraleFailure;
  const financesChange = success ? params.cost : params.cost - params.fine;

  const narrative = success
    ? generarNarrativaExito(decision)
    : generarNarrativaDesastre(decision);

  const updatedClub: ClubState = {
    ...club,
    budget: club.budget + financesChange,
    reputation: Math.max(-100, Math.min(100, club.reputation + reputationChange)),
    squad: club.squad.map((player) => ({
      ...player,
      morale: Math.max(-100, Math.min(100, player.morale + moraleChange / club.squad.length)),
    })),
  };

  const outcome: DecisionOutcome = {
    success,
    reputationChange,
    financesChange,
    moraleChange,
    riskLevel: Math.max(0, Math.min(100, Math.round((successThreshold + (success ? 0 : 0.2)) * 100))),
    sanctions: success ? undefined : "La prensa ha pillado el pastel; posible sanción en el próximo comité.",
    narrative,
  };

  return { outcome, updatedClub };
}

function generarNarrativaExito(decision: CanallaDecision): string {
  switch (decision.type) {
    case "sobornoArbitro":
      return "El sobre llegó con lacito y el árbitro pitó como si llevara camiseta del club.";
    case "filtrarRumor":
      return "El rumor explotó en los corrillos de radio; el rival llegó con la cabeza hecha trizas.";
    case "fiestaIlegal":
      return "La farra clandestina terminó en química perfecta; la plantilla se siente familia mafiosa.";
    case "presionarFederacion":
      return "La llamada nocturna surtió efecto; el calendario se puso blandito como flan.";
  }
}

function generarNarrativaDesastre(decision: CanallaDecision): string {
  switch (decision.type) {
    case "sobornoArbitro":
      return "El maletín tenía cámara oculta; ahora los tertulianos se huelen el chanchullo.";
    case "filtrarRumor":
      return "El rumor se volvió boomerang; los socios montaron bronca en la puerta 18.";
    case "fiestaIlegal":
      return "La fiesta acabó en comisaría y con videos filtrados; la moral cayó como acciones tóxicas.";
    case "presionarFederacion":
      return "Los papeles salieron a la luz; federativos enfadados y llamadas perdidas al amanecer.";
  }
}
