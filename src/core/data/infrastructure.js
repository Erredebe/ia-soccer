// @ts-check
/**
 * Constantes y utilidades para la infraestructura del club.
 * @module core/data/infrastructure
 */

const INFRASTRUCTURE_MAX_LEVEL = 5;
const BASE_STADIUM_CAPACITY = 20000;
const STADIUM_CAPACITY_PER_LEVEL = 1500;
const BASE_OPERATING_COSTS = Object.freeze({
  maintenance: 32000,
  staff: 24000,
  academy: 10000,
  medical: 9000,
});

export const INFRASTRUCTURE_BLUEPRINT = Object.freeze({
  stadium: {
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 250000,
    costGrowth: 1.45,
    maintenancePerLevel: 4200,
  },
  training: {
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 180000,
    costGrowth: 1.4,
    staffPerLevel: 2600,
  },
  medical: {
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 160000,
    costGrowth: 1.38,
    medicalPerLevel: 2300,
  },
  academy: {
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 140000,
    costGrowth: 1.35,
    academyPerLevel: 2100,
  },
});

export const INFRASTRUCTURE_ORDER = Object.freeze(['stadium', 'training', 'medical', 'academy']);

export function clampInfrastructureLevel(type, value) {
  const blueprint = INFRASTRUCTURE_BLUEPRINT[type];
  const numeric = Number.isFinite(value) ? Math.trunc(Number(value)) : 0;
  const maxLevel = blueprint?.maxLevel ?? INFRASTRUCTURE_MAX_LEVEL;
  return Math.max(0, Math.min(maxLevel, numeric));
}

export function calculateStadiumCapacity(level = 0) {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.trunc(level)) : 0;
  return BASE_STADIUM_CAPACITY + safeLevel * STADIUM_CAPACITY_PER_LEVEL;
}

export function calculateInfrastructureUpgradeCost(type, level) {
  const blueprint = INFRASTRUCTURE_BLUEPRINT[type];
  if (!blueprint) {
    return Infinity;
  }
  const safeLevel = Math.max(1, Math.trunc(level));
  return Math.round(blueprint.baseCost * Math.pow(blueprint.costGrowth, safeLevel - 1));
}

export function calculateOperatingExpensesForInfrastructure(infrastructure) {
  const stadiumLevel = clampInfrastructureLevel('stadium', infrastructure?.stadiumLevel ?? 0);
  const trainingLevel = clampInfrastructureLevel('training', infrastructure?.trainingLevel ?? 0);
  const medicalLevel = clampInfrastructureLevel('medical', infrastructure?.medicalLevel ?? 0);
  const academyLevel = clampInfrastructureLevel('academy', infrastructure?.academyLevel ?? 0);

  return {
    maintenance:
      BASE_OPERATING_COSTS.maintenance + stadiumLevel * (INFRASTRUCTURE_BLUEPRINT.stadium.maintenancePerLevel ?? 0),
    staff: BASE_OPERATING_COSTS.staff + trainingLevel * (INFRASTRUCTURE_BLUEPRINT.training.staffPerLevel ?? 0),
    medical: BASE_OPERATING_COSTS.medical + medicalLevel * (INFRASTRUCTURE_BLUEPRINT.medical.medicalPerLevel ?? 0),
    academy: BASE_OPERATING_COSTS.academy + academyLevel * (INFRASTRUCTURE_BLUEPRINT.academy.academyPerLevel ?? 0),
  };
}

export function createExampleInfrastructure() {
  return { stadiumLevel: 2, academyLevel: 1, medicalLevel: 1, trainingLevel: 2 };
}

export function createExampleOperatingExpenses(infrastructure = createExampleInfrastructure()) {
  return calculateOperatingExpensesForInfrastructure(infrastructure);
}

export {
  INFRASTRUCTURE_MAX_LEVEL,
  BASE_STADIUM_CAPACITY,
  STADIUM_CAPACITY_PER_LEVEL,
  BASE_OPERATING_COSTS,
};

