import { describe, expect, it } from "vitest";

import { simulateMatch } from "../src/core/engine.js";
import { createDefaultMatchConfig, createExampleClub } from "../src/core/data.js";
import type { DecisionOutcome } from "../src/types.js";

function createDeterministicRng(sequence: number[]): () => number {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}

describe("simulateMatch", () => {
  it("genera eventos y narrativa coherente", () => {
    const club = createExampleClub();
    const config = createDefaultMatchConfig();
    const rng = createDeterministicRng([0.1, 0.4, 0.6, 0.2, 0.7]);
    const result = simulateMatch(club, config, { rng });

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.narrative[0]).toContain(club.name);
    expect(result.goalsFor).toBeGreaterThanOrEqual(0);
    expect(result.goalsAgainst).toBeGreaterThanOrEqual(0);
  });

  it("aplica el impulso de decisiones canallas exitosas", () => {
    const club = createExampleClub();
    const config = createDefaultMatchConfig();
    const rng = createDeterministicRng([0.05, 0.3, 0.3, 0.4, 0.2, 0.1]);
    const decisionOutcome: DecisionOutcome = {
      success: true,
      reputationChange: 10,
      financesChange: 5000,
      moraleChange: 15,
      riskLevel: 80,
      narrative: "",
    };

    const result = simulateMatch(club, config, { rng, decisionOutcome });
    expect(result.narrative.join(" ")).toContain("Marcador final");
    expect(result.events.some((event) => event.type === "gol")).toBe(true);
  });
});
