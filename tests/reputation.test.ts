import { describe, expect, it } from "vitest";

import { createExampleClub } from "../src/core/data.js";
import { resolveCanallaDecision } from "../src/core/reputation.js";

const alwaysSuccess = () => 0.01;
const alwaysFail = () => 0.99;

describe("resolveCanallaDecision", () => {
  it("mejora la moral y reputación cuando sale bien", () => {
    const club = createExampleClub();
    const { outcome, updatedClub } = resolveCanallaDecision(
      club,
      { type: "filtrarRumor", intensity: "media" },
      alwaysSuccess
    );

    expect(outcome.success).toBe(true);
    expect(outcome.reputationChange).toBeGreaterThan(0);
    expect(updatedClub.reputation).toBeGreaterThan(club.reputation);
  });

  it("castiga duramente cuando se descubre la jugada", () => {
    const club = createExampleClub();
    const { outcome, updatedClub } = resolveCanallaDecision(
      club,
      { type: "sobornoArbitro", intensity: "alta" },
      alwaysFail
    );

    expect(outcome.success).toBe(false);
    expect(outcome.reputationChange).toBeLessThan(0);
    expect(outcome.sanctions).toBeTypeOf("string");
    expect(updatedClub.budget).toBeLessThan(club.budget);
  });
});
