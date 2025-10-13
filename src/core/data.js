// @ts-check
/**
 * Datos de ejemplo y utilidades para poblar el simulador.
 * @module core/data
 */

import { CUP_ROUND_DEFINITIONS } from './types.js';

/** @typedef {import('../types.js').Player} Player */
/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').CanallaDecision} CanallaDecision */
/** @typedef {import('../types.js').LeagueState} LeagueState */
/** @typedef {import('../types.js').LeagueStanding} LeagueStanding */
/** @typedef {import('../types.js').TransferTarget} TransferTarget */
/** @typedef {import('../types.js').MatchResult} MatchResult */
/** @typedef {import('../types.js').TacticalInstructions} TacticalInstructions */
/** @typedef {import('../types.js').SponsorContract} SponsorContract */
/** @typedef {import('../types.js').TVDeal} TVDeal */
/** @typedef {import('../types.js').MerchandisingPlan} MerchandisingPlan */
/** @typedef {import('../types.js').InfrastructureState} InfrastructureState */
/** @typedef {import('../types.js').OperatingExpenses} OperatingExpenses */
/** @typedef {import('../types.js').StaffMember} StaffMember */
/** @typedef {import('../types.js').ClubStaffState} ClubStaffState */
/** @typedef {import('../types.js').StaffImpact} StaffImpact */
/** @typedef {import('../types.js').StaffRole} StaffRole */
/** @typedef {import('../types.js').SponsorOffer} SponsorOffer */
/** @typedef {import('../types.js').TVDealOffer} TVDealOffer */
/** @typedef {import('./types.js').CupState} CupState */
/** @typedef {import('./types.js').CupRound} CupRound */
/** @typedef {import('./types.js').CupTie} CupTie */
/** @typedef {import('./types.js').CupFixture} CupFixture */
/** @typedef {import('./types.js').CupRoundDefinition} CupRoundDefinition */
/** @typedef {import('./types.js').CupProgression} CupProgression */

export const MIN_LEAGUE_SIZE = 8;
export const MAX_LEAGUE_SIZE = 20;
export const DEFAULT_LEAGUE_SIZE = 12;
export const DEFAULT_LEAGUE_DIFFICULTY = 'canalla';

export const LEAGUE_DIFFICULTIES = Object.freeze([
  { id: 'relajada', label: 'Relajada', multiplier: 0.85 },
  { id: 'canalla', label: 'Canalla', multiplier: 1 },
  { id: 'legendaria', label: 'Legendaria', multiplier: 1.2 },
]);

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function generateOfferId(prefix) {
  const random = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now().toString(36)}-${random.toString(36)}`;
}

/**
 * Resume el momento competitivo reciente del club.
 * @param {MatchResult[]} results
 */
function summariseRecentPerformance(results) {
  const sample = results.slice(-5);
  let formScore = 0;
  let goalDelta = 0;
  for (const result of sample) {
    if (!result) {
      continue;
    }
    if (result.goalsFor > result.goalsAgainst) {
      formScore += 3;
    } else if (result.goalsFor === result.goalsAgainst) {
      formScore += 1;
    } else {
      formScore -= 1;
    }
    goalDelta += result.goalsFor - result.goalsAgainst;
  }
  return {
    matches: sample.length,
    formScore,
    goalDelta,
    average: sample.length > 0 ? formScore / sample.length : 0,
  };
}

const INFRASTRUCTURE_MAX_LEVEL = 5;
const BASE_STADIUM_CAPACITY = 20000;
const STADIUM_CAPACITY_PER_LEVEL = 1500;
const BASE_OPERATING_COSTS = Object.freeze({
  maintenance: 32000,
  staff: 24000,
  academy: 10000,
  medical: 9000,
});

const SPONSOR_NAME_CATALOG = Object.freeze({
  purista: ['Cooperativa', 'Fundación', 'Colectivo', 'Red cultural', 'Ruta Gastronómica'],
  equilibrado: ['Bodega Urbana', 'Startup Analítica', 'Mercado Fusión', 'Laboratorio Deportivo', 'Red Social Futbolera'],
  canalla: ['Casa de Apuestas', 'Criptocasino', 'Marisquería Nocturna', 'After clandestino', 'Bingo 24h'],
});

const TV_BRAND_CATALOG = Object.freeze({
  purista: ['Televisión Pública', 'Canal Cultural', 'Cadena Vecinal'],
  equilibrado: ['Stream Fut', 'Deporte Total+', 'Canal Esférico'],
  canalla: ['Late Night Sports', 'Canalla Prime', 'FutTube X'],
});

const COMMERCIAL_PROFILE_DATA = Object.freeze({
  purista: {
    clauses: (club) => [
      `Acciones comunitarias mensuales en ${club.city}.`,
      'Uniformes con mensaje social en la manga.',
    ],
  },
  equilibrado: {
    clauses: (club) => [
      'Campañas cruzadas en redes emergentes.',
      `Eventos híbridos con fans del ${club.name}.`,
    ],
  },
  canalla: {
    clauses: () => [
      'Activaciones nocturnas antes de partidos clave.',
      'Bonificaciones por titulares picantes en prensa.',
    ],
  },
});

const SPONSOR_PROFILE_DEFINITIONS = Object.freeze([
  {
    profile: 'purista',
    frequency: 'annual',
    multiplier: 0.95,
    upfrontFactor: 0.12,
    reputation: { accept: 4, reject: -1 },
    durationMatches: 40,
    summary: (club) =>
      `Una cooperativa de ${club.city} quiere asociarse a la causa y presume de fútbol de barrio.`,
  },
  {
    profile: 'equilibrado',
    frequency: 'monthly',
    multiplier: 1.05,
    upfrontFactor: 0.18,
    reputation: { accept: 1, reject: 0 },
    durationMatches: 32,
    summary: () => 'Marca emergente busca club valiente para explorar formatos digitales y acciones exprés.',
  },
  {
    profile: 'canalla',
    frequency: 'match',
    multiplier: 1.18,
    upfrontFactor: 0.26,
    reputation: { accept: -3, reject: 2 },
    durationMatches: 24,
    summary: () => 'Patrocinador descarado promete ingresos suculentos... a cambio de abrazar la picardía.',
  },
]);

const TV_DEAL_PROFILE_DEFINITIONS = Object.freeze([
  {
    profile: 'purista',
    upfrontFactor: 0.15,
    multiplier: 0.9,
    reputation: { accept: 3, reject: -1 },
    durationSeasons: 1,
    summary: (club) =>
      `La televisión pública de ${club.city} ofrece retransmisiones cuidadas y foco en la cantera.`,
  },
  {
    profile: 'equilibrado',
    upfrontFactor: 0.22,
    multiplier: 1.05,
    reputation: { accept: 1, reject: 0 },
    durationSeasons: 2,
    summary: () => 'Plataforma híbrida mezcla directos clásicos con métricas en vivo para la grada digital.',
  },
  {
    profile: 'canalla',
    upfrontFactor: 0.3,
    multiplier: 1.18,
    reputation: { accept: -2, reject: 2 },
    durationSeasons: 1,
    summary: () => 'Cadena nocturna promete audiencias globales a cambio de espectáculo y drama semanal.',
  },
]);

function pickLabel(entries, rng) {
  if (entries.length === 0) {
    return '';
  }
  const index = Math.floor((rng?.() ?? Math.random()) * entries.length);
  return entries[Math.max(0, Math.min(entries.length - 1, index))];
}

function buildSponsorName(profile, club, rng) {
  const base = pickLabel(SPONSOR_NAME_CATALOG[profile] ?? [], rng);
  if (!base) {
    return `${club.name} Sponsor`; // fallback
  }
  if (profile === 'purista') {
    return `${base} ${club.city}`;
  }
  if (profile === 'equilibrado') {
    return `${base} ${club.name}`;
  }
  return `${base} ${club.city}`;
}

function buildTvBrand(profile, club, rng) {
  const base = pickLabel(TV_BRAND_CATALOG[profile] ?? [], rng);
  if (!base) {
    return `${club.name} TV`;
  }
  if (profile === 'purista') {
    return `${base} ${club.city}`;
  }
  if (profile === 'equilibrado') {
    return `${base} Live`;
  }
  return `${base} Show`;
}

/**
 * Blueprint de mejoras de infraestructura disponibles.
 */
export const INFRASTRUCTURE_BLUEPRINT = Object.freeze({
  stadium: {
    id: 'stadium',
    levelKey: 'stadiumLevel',
    label: 'Grada',
    description: 'Amplía el aforo y mejora la experiencia de la hinchada.',
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 350000,
    costGrowth: 1.6,
    maintenancePerLevel: 5000,
  },
  training: {
    id: 'training',
    levelKey: 'trainingLevel',
    label: 'Centro de entrenamiento',
    description: 'Refuerza la preparación física y la progresión semanal.',
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 240000,
    costGrowth: 1.5,
    staffPerLevel: 2000,
  },
  medical: {
    id: 'medical',
    levelKey: 'medicalLevel',
    label: 'Área médica',
    description: 'Reduce lesiones prolongadas y acelera la recuperación.',
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 210000,
    costGrowth: 1.45,
    medicalPerLevel: 3000,
  },
  academy: {
    id: 'academy',
    levelKey: 'academyLevel',
    label: 'Cantera',
    description: 'Nutre al primer equipo con canteranos ilusionantes.',
    maxLevel: INFRASTRUCTURE_MAX_LEVEL,
    baseCost: 180000,
    costGrowth: 1.45,
    academyPerLevel: 6000,
  },
});

export const INFRASTRUCTURE_ORDER = Object.freeze(['stadium', 'training', 'medical', 'academy']);

export const STAFF_ROLE_INFO = Object.freeze({
  coach: { id: 'coach', label: 'Entrenador/a jefe', summary: 'Charla táctica y gestión del vestuario.' },
  scout: { id: 'scout', label: 'Ojeador/a clandestino/a', summary: 'Detecta talento y negocia desde la barra.' },
  analyst: { id: 'analyst', label: 'Analista de datos', summary: 'Convierte hojas de cálculo en narrativa canalla.' },
  physio: { id: 'physio', label: 'Fisios de barrio', summary: 'Recupera tocados con métodos poco ortodoxos.' },
  motivator: { id: 'motivator', label: 'Animador/a de grada', summary: 'Mantiene la fiesta y el ánimo en ebullición.' },
  pressOfficer: { id: 'pressOfficer', label: 'Jefe/a de prensa', summary: 'Apaga incendios con titulares y vermut.' },
});

/** @type {readonly StaffMember[]} */
export const STAFF_CATALOG = Object.freeze([
  {
    id: 'staff-maestra-pizarra',
    role: 'coach',
    name: "Marga 'La Pizarra' Romero",
    description: 'Diseña esquemas imposibles y exprime al vestuario con humor barriobajero.',
    salary: 22000,
    hiringCost: 85000,
    dismissalCost: 20000,
    effects: [
      {
        target: 'morale',
        value: 3,
        frequency: 'match',
        narrative: '{{name}} enchufa la charla táctica: la moral del vestuario sube +3.',
      },
    ],
  },
  {
    id: 'staff-ojeador-puente',
    role: 'scout',
    name: "Teo 'Puente' Delgado",
    description: 'Merodea mercadillos y conoce a cada representante del barrio.',
    salary: 16000,
    hiringCost: 62000,
    dismissalCost: 15000,
    effects: [
      {
        target: 'budget',
        value: 2200,
        frequency: 'match',
        narrative: '{{name}} trae comisiones discretas: entran +2.200€ de chanchullos.',
      },
      {
        target: 'reputation',
        value: -1,
        frequency: 'match',
        narrative: 'Los tejemanejes de {{name}} levantan cejas entre la prensa (reputación −1).',
      },
    ],
  },
  {
    id: 'staff-analista-datos',
    role: 'analyst',
    name: 'Irene Datos',
    description: 'Convierte hojas de cálculo en relatos épicos para la grada.',
    salary: 15000,
    hiringCost: 68000,
    dismissalCost: 17000,
    effects: [
      {
        target: 'reputation',
        value: 2,
        frequency: 'match',
        narrative: '{{name}} viraliza estadísticas canallas: reputación +2.',
      },
    ],
  },
  {
    id: 'staff-fisio-habanera',
    role: 'physio',
    name: 'Lucho Bendita',
    description: 'Masajista milagroso que rebaja facturas con brebajes caseros.',
    salary: 14000,
    hiringCost: 54000,
    dismissalCost: 12000,
    effects: [
      {
        target: 'budget',
        value: 1500,
        frequency: 'match',
        narrative: '{{name}} ahorra en camillas y botiquín (+1.500€).',
      },
    ],
  },
  {
    id: 'staff-motivadora-batucada',
    role: 'motivator',
    name: 'Rocío Batucada',
    description: 'Organiza batucadas clandestinas para mantener la llama del grupo.',
    salary: 9000,
    hiringCost: 38000,
    dismissalCost: 8000,
    effects: [
      {
        target: 'morale',
        value: 2,
        frequency: 'match',
        narrative: '{{name}} monta fiesta nocturna: moral +2.',
      },
      {
        target: 'budget',
        value: -600,
        frequency: 'match',
        narrative: 'Los saraos de {{name}} cuestan 600€ en refrescos premium.',
      },
    ],
  },
  {
    id: 'staff-pr-capote',
    role: 'pressOfficer',
    name: 'Carla Capote',
    description: 'Camina entre micrófonos y tapas para maquillar escándalos.',
    salary: 11000,
    hiringCost: 42000,
    dismissalCost: 9000,
    effects: [
      {
        target: 'reputation',
        value: 2,
        frequency: 'match',
        narrative: '{{name}} maneja titulares con mano izquierda: reputación +2.',
      },
      {
        target: 'budget',
        value: -800,
        frequency: 'match',
        narrative: '{{name}} invita a la prensa a vermut (−800€).',
      },
    ],
  },
]);

const STAFF_MAP = new Map(STAFF_CATALOG.map((member) => [member.id, member]));
const DEFAULT_STAFF_ROSTER = Object.freeze([
  'staff-maestra-pizarra',
  'staff-ojeador-puente',
  'staff-fisio-habanera',
]);

function coerceStaffId(entry) {
  if (typeof entry === 'string') {
    return entry.trim();
  }
  if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
    return entry.id.trim();
  }
  return '';
}

export function getStaffDefinition(staffId) {
  if (typeof staffId !== 'string') {
    return null;
  }
  return STAFF_MAP.get(staffId) ?? null;
}

export function createExampleStaffState() {
  const roster = DEFAULT_STAFF_ROSTER.filter((id) => STAFF_MAP.has(id));
  const rosterSet = new Set(roster);
  const available = STAFF_CATALOG.map((member) => member.id).filter((id) => !rosterSet.has(id));
  return { roster, available };
}

export function normaliseStaffState(value) {
  const baseline = createExampleStaffState();
  const input = value && typeof value === 'object' ? value : {};
  const rawRoster = Array.isArray(input.roster) ? input.roster : [];
  const filteredRoster = rawRoster
    .map((entry) => coerceStaffId(entry))
    .filter((id) => STAFF_MAP.has(id));
  const roster = filteredRoster.length > 0
    ? [...new Set(filteredRoster)]
    : Array.isArray(input.roster) && input.roster.length === 0
      ? []
      : [...baseline.roster];
  const rosterSet = new Set(roster);

  const rawAvailable = Array.isArray(input.available) ? input.available : [];
  const filteredAvailable = rawAvailable
    .map((entry) => coerceStaffId(entry))
    .filter((id) => STAFF_MAP.has(id) && !rosterSet.has(id));
  const fallbackAvailable = STAFF_CATALOG.map((member) => member.id).filter((id) => !rosterSet.has(id));
  const available = [...new Set([...filteredAvailable, ...fallbackAvailable])];

  return { roster, available };
}

export function listStaffMembers(ids = []) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids
    .map((entry) => getStaffDefinition(coerceStaffId(entry)))
    .filter((member) => member !== null);
}

export function calculateStaffWeeklyCost(staffState) {
  const rosterIds = Array.isArray(staffState?.roster) ? staffState.roster : [];
  const members = listStaffMembers(rosterIds);
  return members.reduce((sum, member) => sum + Math.round(member.salary / 4), 0);
}

export function resolveStaffMatchImpact(staffState) {
  /** @type {StaffImpact} */
  const impact = { budget: 0, reputation: 0, morale: 0, narratives: [] };
  const rosterIds = Array.isArray(staffState?.roster) ? staffState.roster : [];
  const members = listStaffMembers(rosterIds);
  members.forEach((member) => {
    member.effects.forEach((effect) => {
      if (!effect || effect.frequency !== 'match' || !Number.isFinite(effect.value)) {
        return;
      }
      const value = Number(effect.value);
      switch (effect.target) {
        case 'budget':
          impact.budget += value;
          break;
        case 'reputation':
          impact.reputation += value;
          break;
        case 'morale':
          impact.morale += value;
          break;
        default:
          break;
      }
      if (effect.narrative) {
        const text = effect.narrative.replace(/\{\{name\}\}/g, member.name);
        impact.narratives.push(text);
      }
    });
  });
  return impact;
}

export function clampInfrastructureLevel(type, value) {
  const blueprint = INFRASTRUCTURE_BLUEPRINT[type];
  const numeric = Number.isFinite(value) ? Math.trunc(Number(value)) : 0;
  const maxLevel = blueprint?.maxLevel ?? INFRASTRUCTURE_MAX_LEVEL;
  return Math.max(0, Math.min(maxLevel, numeric));
}

function generateProspectId(rng, index = 0) {
  const randomSegment = Math.floor(Math.max(0, rng()) * 1e6)
    .toString(36)
    .padStart(4, '0');
  return `academy-${Date.now().toString(36)}-${index.toString(36)}-${randomSegment}`;
}

function clampAttributeValue(value) {
  const numeric = Number.isFinite(value) ? Number(value) : 0;
  return Math.max(25, Math.min(99, Math.round(numeric)));
}

function pickAcademyPosition(rng) {
  const positions = ['GK', 'DEF', 'MID', 'FWD'];
  const index = Math.max(0, Math.min(positions.length - 1, Math.floor(rng() * positions.length)));
  return positions[index];
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

export function createAcademyProspect(level = 1, options = {}) {
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const position = options.position ?? pickAcademyPosition(rng);
  const identity = generateRandomPlayerIdentity({ rng });
  const age = 17 + Math.floor(rng() * 3);
  const morale = clampAttributeValue(32 + level * 5 + rng() * 8);
  const baseAttribute = 50 + level * 4;
  const spread = 14 - Math.min(6, level);
  const rollAttribute = (offset = 0) =>
    clampAttributeValue(baseAttribute + offset + (rng() - 0.5) * spread * 2);

  return createPlayer({
    id: options.id ?? generateProspectId(rng),
    name: identity.name,
    nickname: identity.nickname,
    position,
    age,
    morale,
    salary: Math.round(6000 + level * 1200 + rng() * 800),
    attributes: {
      pace: rollAttribute(position === 'FWD' ? 6 : position === 'DEF' ? -4 : 0),
      stamina: rollAttribute(2),
      dribbling: rollAttribute(position === 'MID' ? 5 : 0),
      passing: rollAttribute(position === 'MID' ? 6 : position === 'FWD' ? 2 : 0),
      shooting: rollAttribute(position === 'FWD' ? 6 : 0),
      defending: rollAttribute(position === 'DEF' ? 6 : position === 'GK' ? 4 : -2),
      leadership: clampAttributeValue(38 + level * 4 + rng() * 10),
      potential: clampAttributeValue(70 + level * 6 + rng() * 8),
    },
  });
}

export function createAcademyProspects(level = 1, options = {}) {
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const baseCount = Math.max(1, Math.trunc(options.count ?? Math.ceil(level / 2)));
  const prospects = [];
  for (let index = 0; index < baseCount; index += 1) {
    prospects.push(createAcademyProspect(level, { rng, id: generateProspectId(rng, index) }));
  }
  return prospects;
}

export function calculateTotalMatchdays(rivalCount = DEFAULT_LEAGUE_SIZE - 1) {
  if (!Number.isFinite(rivalCount) || rivalCount <= 0) {
    return calculateTotalMatchdays(DEFAULT_LEAGUE_SIZE - 1);
  }
  const sanitized = Math.max(1, Math.trunc(rivalCount));
  return sanitized * 2;
}

export const DEFAULT_TOTAL_MATCHDAYS = calculateTotalMatchdays();

function resolveLeagueSizeCandidate(candidate, rivals = []) {
  if (Number.isFinite(candidate)) {
    return clampNumber(Math.trunc(candidate), MIN_LEAGUE_SIZE, MAX_LEAGUE_SIZE);
  }
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isFinite(parsed)) {
      return clampNumber(Math.trunc(parsed), MIN_LEAGUE_SIZE, MAX_LEAGUE_SIZE);
    }
  }
  const rivalCount = Array.isArray(rivals) ? rivals.filter((name) => typeof name === 'string' && name.trim().length > 0).length : 0;
  const fallback = rivalCount > 0 ? rivalCount + 1 : DEFAULT_LEAGUE_SIZE;
  return clampNumber(Math.trunc(fallback), MIN_LEAGUE_SIZE, MAX_LEAGUE_SIZE);
}

export function resolveLeagueDifficulty(input) {
  const fallback = LEAGUE_DIFFICULTIES.find((entry) => entry.id === DEFAULT_LEAGUE_DIFFICULTY);
  if (!input || typeof input !== 'string') {
    return fallback ?? LEAGUE_DIFFICULTIES[0];
  }
  const match = LEAGUE_DIFFICULTIES.find((entry) => entry.id === input.trim());
  return match ?? (fallback ?? LEAGUE_DIFFICULTIES[0]);
}
export const DEFAULT_CLUB_NAME = 'Atlético Bar Callejero';
export const DEFAULT_STADIUM_NAME = 'Campo del Callejón';
export const DEFAULT_CLUB_CITY = 'Lavapiés';
export const DEFAULT_PRIMARY_COLOR = '#1d4ed8';
export const DEFAULT_SECONDARY_COLOR = '#bfdbfe';
export const DEFAULT_CLUB_LOGO = 'assets/club-crest.svg';

const RANDOM_FIRST_NAMES = Object.freeze([
  'Pilar',
  'Rocío',
  'Nerea',
  'Marina',
  'Diego',
  'Iván',
  'Bruno',
  'Gael',
  'Lucía',
  'Jimena',
  'Irene',
  'Lola',
  'Mateo',
  'Simón',
  'Álex',
  'Ariadna',
  'Sergio',
  'Mario',
  'Candela',
  'Mara',
]);

const RANDOM_LAST_NAMES = Object.freeze([
  'del Pasaje',
  'del Puerto',
  'Martínez',
  'Calderón',
  'Barrial',
  'Delgado',
  'Campoy',
  'Benítez',
  'de Lavapiés',
  'Manzanedo',
  'Villaverde',
  'Carvajal',
  'Gutiérrez',
  'Castaño',
  'Serrano',
  'Coronado',
  'Pizarro',
  'Gallego',
  'Ibáñez',
  'Chamartín',
]);

const RANDOM_NICKNAMES = Object.freeze([
  'El Relámpago',
  'La Zurdita',
  'El Callejero',
  'La Muralla',
  'El Duende',
  'La Pantera',
  'El Motor',
  'La Brújula',
  'El Tango',
  'La Gambeta',
  'El Trueno',
  'La Joya',
  'El Eje',
  'La Tormenta',
  'El Callejón',
  'La Bala',
  'El Cóndor',
  'La Cantera',
  'El Chispa',
  'La Cometa',
]);

export const LEAGUE_RIVAL_CATALOG = Object.freeze([
  'Club Verbena del Sur',
  'Rayo Chulapo',
  'CD Barras Bravas',
  'Real Canilla',
  'Unión del Callejón',
  'Bohemios de Lavapiés',
  'Atlético del Puerto',
  'Murga del Norte',
  'Paseo de la Fama FC',
  'Peña Rockanrolera',
  'Furias del Barrio',
  'Tren Nocturno FC',
  'Club Caverna Latina',
  'Atlético de los Faroles',
  'Rock & Goal United',
  'Cervecería Old School',
  'Rockets del Manzanares',
  'Puente de Hierro CF',
  'Callejón del Jazz',
  'Toreros Eléctricos',
  'Piratas de Malasaña',
  'Real Bares FC',
  'Muralla del Carmen',
  'Forajidos del Retiro',
  'Barrio Salvaje',
  'Canallas del Alba',
  'Taxis Nocturnos CF',
  'Ola Funky SC',
  'Patines del Arenal',
  'Cósmicos del Ensanche',
]);

/**
 * Devuelve una copia barajada de la lista de rivales sin mutar la original.
 * @param {readonly string[]} [rivals]
 * @param {() => number} [rng]
 * @returns {string[]}
 */
export function shuffleLeagueRivals(rivals = LEAGUE_RIVAL_CATALOG, rng = Math.random) {
  const clean = Array.isArray(rivals)
    ? rivals
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter((name) => name.length > 0)
    : [];
  const unique = [];
  clean.forEach((name) => {
    if (!unique.includes(name)) {
      unique.push(name);
    }
  });
  const shuffled = [...unique];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const temp = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = temp;
  }
  return shuffled;
}

/**
 * Selecciona un subconjunto aleatorio de rivales evitando duplicados y exclusiones.
 * @param {number} [count]
 * @param {{ catalog?: readonly string[]; rng?: () => number; exclude?: readonly string[] }} [options]
 * @returns {string[]}
 */
export function selectRandomLeagueRivals(count = 11, options = {}) {
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }
  const catalog = Array.isArray(options.catalog) && options.catalog.length > 0 ? options.catalog : LEAGUE_RIVAL_CATALOG;
  const exclude = Array.isArray(options.exclude) ? options.exclude : [];
  const filtered = catalog
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter((name) => name.length > 0 && !exclude.includes(name));
  if (filtered.length === 0) {
    return [];
  }
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const shuffled = shuffleLeagueRivals(filtered, rng);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Normaliza una lista de rivales asegurando cantidad fija y sin duplicados.
 * @param {string[] | undefined} rivals
 * @param {{ count?: number; catalog?: readonly string[]; rng?: () => number; exclude?: readonly string[] }} [options]
 * @returns {string[]}
 */
export function normaliseLeagueRivals(rivals, options = {}) {
  const defaultTarget = DEFAULT_LEAGUE_SIZE - 1;
  const target = Number.isFinite(options.count) && options.count
    ? Math.max(1, Math.trunc(options.count))
    : defaultTarget;
  const catalog = Array.isArray(options.catalog) ? options.catalog : LEAGUE_RIVAL_CATALOG;
  const exclude = Array.isArray(options.exclude) ? options.exclude : [];
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;

  /** @type {string[]} */
  const manual = Array.isArray(rivals)
    ? rivals
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter((name) => name.length > 0 && !exclude.includes(name))
    : [];
  const normalised = [];
  manual.forEach((name) => {
    if (!normalised.includes(name)) {
      normalised.push(name);
    }
  });

  if (normalised.length >= target) {
    return normalised.slice(0, target);
  }

  const remaining = target - normalised.length;
  const available = catalog.filter((name) => !normalised.includes(name) && !exclude.includes(name));
  const randomFill = selectRandomLeagueRivals(remaining, {
    catalog: available.length > 0 ? available : catalog,
    rng,
    exclude,
  });
  randomFill.forEach((name) => {
    if (!normalised.includes(name) && !exclude.includes(name)) {
      normalised.push(name);
    }
  });

  while (normalised.length < target) {
    normalised.push(`Rival invitado ${normalised.length + 1}`);
  }

  return normalised.slice(0, target);
}

const DEFAULT_CUP_SIZE = 8;
const MIN_CUP_SIZE = 4;
const MAX_CUP_SIZE = 16;
const DEFAULT_CUP_NAME = 'Copa Callejera de Lavapiés';

function clampCupSize(size) {
  if (!Number.isFinite(size)) {
    return DEFAULT_CUP_SIZE;
  }
  const truncated = Math.max(MIN_CUP_SIZE, Math.min(MAX_CUP_SIZE, Math.trunc(size)));
  const exponents = [4, 8, 16];
  let closest = exponents[0];
  for (const candidate of exponents) {
    if (Math.abs(candidate - truncated) < Math.abs(closest - truncated)) {
      closest = candidate;
    }
  }
  return closest;
}

function shuffleParticipants(values, rng = Math.random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
  }
  return copy;
}

function createCupTieFromDefinition(roundId, index) {
  return {
    id: `${roundId}-${index + 1}`,
    home: null,
    away: null,
    homeGoals: null,
    awayGoals: null,
    played: false,
    winner: null,
    includesClub: false,
    status: 'pending',
  };
}

/**
 * Construye la estructura base de una ronda eliminatoria.
 * @param {CupRoundDefinition} definition
 * @returns {CupRound}
 */
export function createCupRound(definition) {
  const tieCount = Math.max(1, Math.floor(definition.size / 2));
  const ties = Array.from({ length: tieCount }, (_, index) => createCupTieFromDefinition(definition.id, index));
  return {
    id: definition.id,
    name: definition.name,
    reward: definition.reward,
    ties,
    drawCompleted: false,
    finished: false,
    drawNarrative: [],
  };
}

function findRoundDefinition(roundId) {
  return CUP_ROUND_DEFINITIONS.find((entry) => entry.id === roundId);
}

function resolveCupDefinitions(participantCount) {
  return CUP_ROUND_DEFINITIONS.filter((definition) => definition.size <= participantCount);
}

function normaliseCupParticipants(clubName, count, participants, options = {}) {
  const base = Array.isArray(participants) ? participants : [];
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const desired = Math.max(1, count - 1);
  const uniqueBase = base
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter((name) => name.length > 0 && name !== clubName);
  const filled = normaliseLeagueRivals(uniqueBase, {
    count: desired,
    catalog: options.catalog,
    exclude: [clubName],
    rng,
  });
  return [clubName, ...filled];
}

function describeDrawForClub(roundName, clubName, fixture) {
  if (!fixture) {
    return `Sorteo de ${roundName}: el ${clubName} ya no figura en el bombo.`;
  }
  const venue = fixture.home ? 'como locales' : 'a domicilio';
  return `Sorteo de ${roundName}: el ${clubName} se mide a ${fixture.opponent} ${venue}.`;
}

function simulateNeutralTie(home, away, rng) {
  const homeGoals = Math.floor(rng() * 4);
  const awayGoals = Math.floor(rng() * 4);
  let winner;
  if (homeGoals === awayGoals) {
    winner = rng() < 0.5 ? home : away;
  } else {
    winner = homeGoals > awayGoals ? home : away;
  }
  return { homeGoals, awayGoals, winner };
}

/**
 * Genera una copa estándar con rondas escalonadas.
 * @param {string} clubName
 * @param {{
 *   size?: number;
 *   participants?: string[];
 *   catalog?: readonly string[];
 *   rng?: () => number;
 *   name?: string;
 *   edition?: number;
 * }} [options]
 * @returns {CupState}
 */
export function createExampleCup(clubName, options = {}) {
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const sizeCandidate = Number.isFinite(options.size) ? Number(options.size) : DEFAULT_CUP_SIZE;
  const cupSize = clampCupSize(sizeCandidate);
  const participants = normaliseCupParticipants(clubName, cupSize, options.participants, {
    catalog: options.catalog,
    rng,
  });
  const definitions = resolveCupDefinitions(participants.length);
  const rounds = definitions.map((definition) => createCupRound(definition));
  const pendingParticipants = shuffleParticipants(participants, rng);
  const status = rounds.length > 0 ? 'awaiting-draw' : 'idle';
  const nameCandidate = typeof options.name === 'string' && options.name.trim().length > 0
    ? options.name.trim()
    : DEFAULT_CUP_NAME;
  const edition = Number.isFinite(options.edition) ? Math.max(1, Math.trunc(/** @type {number} */ (options.edition))) : 1;
  return {
    name: nameCandidate,
    edition,
    rounds,
    currentRoundIndex: 0,
    status,
    pendingParticipants,
    nextFixture: null,
    history: [],
  };
}

/**
 * Ejecuta el sorteo de la ronda actual y devuelve el nuevo estado de copa.
 * @param {CupState} cup
 * @param {string} clubName
 * @param {{ rng?: () => number }} [options]
 * @returns {{ cup: CupState; narrative: string[] }}
 */
export function drawCupRound(cup, clubName, options = {}) {
  if (!cup || cup.status === 'eliminated' || cup.status === 'champions') {
    return { cup, narrative: [] };
  }
  const round = cup.rounds[cup.currentRoundIndex];
  if (!round || round.drawCompleted) {
    return { cup, narrative: [] };
  }
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const participants = cup.pendingParticipants.length > 0 ? [...cup.pendingParticipants] : [clubName];
  const required = round.ties.length * 2;
  while (participants.length < required) {
    participants.push(`Invitado copero ${participants.length + 1}`);
  }
  const shuffled = shuffleParticipants(participants, rng);
  const updatedTies = round.ties.map((tie, index) => {
    const home = shuffled[index * 2] ?? null;
    const away = shuffled[index * 2 + 1] ?? null;
    const includesClub = home === clubName || away === clubName;
    return {
      ...tie,
      home,
      away,
      homeGoals: null,
      awayGoals: null,
      played: false,
      winner: null,
      includesClub,
      status: home && away ? 'scheduled' : 'pending',
    };
  });
  const updatedRound = {
    ...round,
    ties: updatedTies,
    drawCompleted: true,
  };
  const highlight = updatedTies.find((tie) => tie.includesClub && tie.home && tie.away) ?? null;
  const nextFixture = highlight
    ? {
        tieId: highlight.id,
        roundId: updatedRound.id,
        roundName: updatedRound.name,
        opponent: highlight.home === clubName ? /** @type {string} */ (highlight.away) : /** @type {string} */ (highlight.home),
        home: highlight.home === clubName,
      }
    : null;
  const narrative = [describeDrawForClub(updatedRound.name, clubName, nextFixture)];
  updatedRound.drawNarrative = narrative;
  const updatedRounds = [...cup.rounds];
  updatedRounds[cup.currentRoundIndex] = updatedRound;
  const updatedCup = {
    ...cup,
    rounds: updatedRounds,
    pendingParticipants: [],
    status: nextFixture ? 'awaiting-match' : cup.status,
    nextFixture,
  };
  return { cup: updatedCup, narrative };
}

/**
 * Recupera la próxima eliminatoria disponible para el club.
 * @param {CupState | undefined} cup
 * @param {string} clubName
 * @returns {CupFixture | null}
 */
export function getCupFixture(cup, clubName) {
  if (!cup) {
    return null;
  }
  if (cup.nextFixture) {
    return cup.nextFixture;
  }
  const round = cup.rounds[cup.currentRoundIndex];
  if (!round) {
    return null;
  }
  const tie = round.ties.find((entry) => entry.includesClub && entry.home && entry.away);
  if (!tie) {
    return null;
  }
  return {
    tieId: tie.id,
    roundId: round.id,
    roundName: round.name,
    opponent: tie.home === clubName ? /** @type {string} */ (tie.away) : /** @type {string} */ (tie.home),
    home: tie.home === clubName,
  };
}

/**
 * Actualiza el cuadro de copa tras disputar la eliminatoria del club.
 * @param {CupState} cup
 * @param {string} clubName
 * @param {MatchResult} match
 * @param {{ rng?: () => number }} [options]
 * @returns {CupProgression}
 */
export function applyCupMatchResult(cup, clubName, match, options = {}) {
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const roundIndex = Math.max(0, cup.currentRoundIndex);
  const currentRound = cup.rounds[roundIndex];
  if (!currentRound) {
    return {
      cup,
      historyEntry: {
        roundId: 'final',
        roundName: 'Final',
        outcome: 'eliminated',
        prize: 0,
        reputationDelta: 0,
        narrative: ['No se pudo actualizar la copa porque no hay ronda activa.'],
      },
      nextFixture: cup.nextFixture,
    };
  }

  const updatedRound = {
    ...currentRound,
    ties: currentRound.ties.map((tie) => ({ ...tie })),
  };

  const definition = findRoundDefinition(currentRound.id);
  const playerTieIndex = cup.nextFixture
    ? updatedRound.ties.findIndex((tie) => tie.id === cup.nextFixture?.tieId)
    : updatedRound.ties.findIndex((tie) => tie.includesClub);
  const winners = [];
  let clubWon = false;
  let opponentName = 'Rival misterioso';

  updatedRound.ties.forEach((tie, index) => {
    if (!tie.home || !tie.away) {
      return;
    }
    if (index === playerTieIndex) {
      const isHome = tie.home === clubName;
      const homeGoals = isHome ? match.goalsFor : match.goalsAgainst;
      const awayGoals = isHome ? match.goalsAgainst : match.goalsFor;
      let winner;
      if (homeGoals > awayGoals) {
        winner = tie.home;
      } else if (awayGoals > homeGoals) {
        winner = tie.away;
      } else {
        winner = match.goalsFor >= match.goalsAgainst ? clubName : isHome ? tie.away : tie.home;
      }
      opponentName = isHome ? tie.away ?? opponentName : tie.home ?? opponentName;
      tie.homeGoals = homeGoals;
      tie.awayGoals = awayGoals;
      tie.played = true;
      tie.status = 'played';
      tie.winner = winner;
      tie.includesClub = true;
      clubWon = winner === clubName;
    }
  });

  updatedRound.ties.forEach((tie, index) => {
    if (!tie.home || !tie.away) {
      return;
    }
    if (!tie.played) {
      const result = simulateNeutralTie(tie.home, tie.away, rng);
      tie.homeGoals = result.homeGoals;
      tie.awayGoals = result.awayGoals;
      tie.winner = result.winner;
      tie.played = true;
      tie.status = 'played';
    }
    if (typeof tie.winner === 'string') {
      winners.push(tie.winner);
    }
  });

  updatedRound.finished = updatedRound.ties.every((tie) => tie.played);

  const nextRoundExists = roundIndex + 1 < cup.rounds.length;
  const champion = clubWon && !nextRoundExists;
  const outcome = champion ? 'champion' : clubWon ? 'victory' : 'eliminated';

  let prize = 0;
  let reputationDelta = 0;
  if (definition) {
    if (clubWon) {
      prize = definition.reward;
      reputationDelta = definition.reputationWin;
      if (champion && Number.isFinite(definition.championBonus)) {
        prize += definition.championBonus ?? 0;
        reputationDelta += 8;
      }
    } else {
      prize = definition.consolationReward;
      reputationDelta = definition.reputationEliminated;
    }
  }

  const narrative = [];
  if (clubWon) {
    const nextRound = cup.rounds[roundIndex + 1]?.name;
    narrative.push(
      `El ${clubName} supera a ${opponentName} por ${match.goalsFor}-${match.goalsAgainst} en ${currentRound.name}.`
    );
    if (champion) {
      narrative.push('La grada estalla: la copa viaja a nuestra vitrina canalla.');
    } else if (nextRound) {
      narrative.push(`Se avecina sorteo de ${nextRound}; toca preparar las bolas calientes.`);
    }
  } else {
    narrative.push(
      `${clubName} cae ${match.goalsFor}-${match.goalsAgainst} ante ${opponentName} y se despide en ${currentRound.name}.`
    );
  }

  const historyEntry = {
    roundId: currentRound.id,
    roundName: currentRound.name,
    outcome,
    prize,
    reputationDelta,
    narrative,
  };

  const updatedRounds = [...cup.rounds];
  updatedRounds[roundIndex] = updatedRound;

  let status = clubWon ? (champion ? 'champions' : 'awaiting-draw') : 'eliminated';
  let currentRoundIndex = clubWon && nextRoundExists ? roundIndex + 1 : roundIndex;
  const pendingParticipants = winners;

  if (!nextRoundExists && clubWon) {
    currentRoundIndex = roundIndex;
  }

  const updatedCup = {
    ...cup,
    rounds: updatedRounds,
    status,
    currentRoundIndex,
    pendingParticipants,
    nextFixture: null,
    history: [...cup.history, historyEntry],
  };

  return {
    cup: updatedCup,
    historyEntry,
    nextFixture: updatedCup.nextFixture,
  };
}

/** @type {TacticalInstructions} */
const DEFAULT_INSTRUCTIONS = Object.freeze({
  pressing: 'medium',
  tempo: 'balanced',
  width: 'balanced',
  counterAttack: false,
  playThroughMiddle: true,
});

const MARKET_BLUEPRINTS = [
  {
    id: 'market-caima-gk',
    origin: 'Real Malecón',
    player: createPlayer({
      id: 'arquero-caima',
      name: "Caímán del Malecón",
      position: 'GK',
      age: 29,
      attributes: {
        pace: 48,
        stamina: 75,
        dribbling: 46,
        passing: 60,
        shooting: 38,
        defending: 82,
        leadership: 76,
        potential: 74,
      },
      morale: 32,
      salary: 18000,
    }),
    multiplier: 1.1,
  },
  {
    id: 'market-medio-magico',
    origin: 'Pibes del Río',
    player: createPlayer({
      id: 'enganche-magico',
      name: 'Mago del Río',
      position: 'MID',
      age: 24,
      attributes: {
        pace: 74,
        stamina: 78,
        dribbling: 88,
        passing: 90,
        shooting: 72,
        defending: 54,
        leadership: 69,
        potential: 90,
      },
      morale: 45,
      salary: 26000,
    }),
    multiplier: 1.35,
  },
  {
    id: 'market-central-muro',
    origin: 'Muralla Roja',
    player: createPlayer({
      id: 'central-muralla',
      name: 'Muralla del Albaicín',
      position: 'DEF',
      age: 27,
      attributes: {
        pace: 62,
        stamina: 83,
        dribbling: 55,
        passing: 66,
        shooting: 48,
        defending: 86,
        leadership: 71,
        potential: 82,
      },
      morale: 30,
      salary: 22000,
    }),
    multiplier: 1.18,
  },
  {
    id: 'market-extremo-rayo',
    origin: 'Huracán Verbenero',
    player: createPlayer({
      id: 'extremo-rayo',
      name: 'Rayo del Carnaval',
      position: 'FWD',
      age: 22,
      attributes: {
        pace: 90,
        stamina: 82,
        dribbling: 86,
        passing: 71,
        shooting: 79,
        defending: 46,
        leadership: 57,
        potential: 92,
      },
      morale: 52,
      salary: 24000,
    }),
    multiplier: 1.4,
  },
  {
    id: 'market-delantero-9',
    origin: 'Caciques del Sol',
    player: createPlayer({
      id: 'delantero-olfato',
      name: 'Olfato del Sol',
      position: 'FWD',
      age: 30,
      attributes: {
        pace: 78,
        stamina: 80,
        dribbling: 74,
        passing: 68,
        shooting: 88,
        defending: 44,
        leadership: 70,
        potential: 85,
      },
      morale: 38,
      salary: 28000,
    }),
    multiplier: 1.22,
  },
];

function pickRandom(values, rng) {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(rng() * values.length)));
  return values[index];
}

/**
 * Devuelve las instrucciones tácticas por defecto de la IA canalla.
 * @returns {TacticalInstructions}
 */
export function createDefaultInstructions() {
  return { ...DEFAULT_INSTRUCTIONS };
}

/**
 * Genera un nombre y un apodo aleatorios inspirados en la cantera canalla.
 * @param {{ rng?: () => number; includeNickname?: boolean }} [options]
 */
export function generateRandomPlayerIdentity(options = {}) {
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const includeNickname = options.includeNickname ?? true;
  const firstName = pickRandom(RANDOM_FIRST_NAMES, rng) || 'Canterano';
  const lastName = pickRandom(RANDOM_LAST_NAMES, rng) || 'Misterioso';
  const nickname = includeNickname ? pickRandom(RANDOM_NICKNAMES, rng) : '';
  return {
    name: `${firstName} ${lastName}`.trim(),
    nickname: nickname ?? '',
  };
}

/**
 * Genera un objeto de disponibilidad sin lesiones ni sanciones.
 * @returns {import('../types.js').PlayerAvailability}
 */
function createDefaultAvailability() {
  return { injuryMatches: 0, suspensionMatches: 0 };
}

/**
 * Crea un registro estadístico vacío para iniciar la temporada de un jugador.
 * @returns {import('../types.js').PlayerSeasonLog}
 */
export function createEmptySeasonLog() {
  return {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matches: 0,
    minutes: 0,
    injuries: 0,
    cleanSheets: 0,
  };
}

/**
 * Prepara un acumulador de estadísticas de club sin datos previos.
 * @returns {import('../types.js').ClubSeasonStats}
 */
function createSeasonRecordBook() {
  return {
    biggestWin: null,
    heaviestDefeat: null,
    goalFestival: null,
  };
}

export function createSeasonHistory() {
  return {
    titles: 0,
    lastTitleSeason: 0,
    records: createSeasonRecordBook(),
  };
}

export function createSeasonStats() {
  return {
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    possessionFor: 0,
    unbeatenRun: 0,
    bestUnbeatenRun: 0,
    history: createSeasonHistory(),
  };
}

/**
 * Comprueba si un jugador está disponible para ser convocado.
 * @param {import('../types.js').Player} player Jugador a revisar.
 */
export function isPlayerAvailable(player) {
  const availability = player.availability ?? createDefaultAvailability();
  return availability.injuryMatches <= 0 && availability.suspensionMatches <= 0;
}

/**
 * Reinicia la moral, forma y sanciones de un jugador al comenzar una nueva temporada.
 * @param {import('../types.js').Player} player Perfil original del futbolista.
 */
export function resetPlayerForNewSeason(player) {
  const baseAvailability = player.availability ?? createDefaultAvailability();
  return {
    ...player,
    morale: Math.min(100, Math.round((player.morale ?? 50) * 0.9 + 10)),
    fitness: 80,
    availability: { ...baseAvailability, injuryMatches: 0, suspensionMatches: 0 },
    seasonLog: createEmptySeasonLog(),
  };
}

/**
 * Genera un conjunto de contratos de patrocinio ficticios equilibrados.
 * @param {{ city?: string; stadiumName?: string }} [options]
 * @returns {SponsorContract[]}
 */
function createExampleSponsors(options = {}) {
  const cityLabel = options.city?.trim() || DEFAULT_CLUB_CITY;
  const stadiumLabel = options.stadiumName?.trim() || DEFAULT_STADIUM_NAME;
  return [
    {
      name: `Vermut ${cityLabel}`,
      value: 250000,
      frequency: 'annual',
      lastPaidMatchDay: -40,
    },
    {
      name: `${stadiumLabel} Tours`,
      value: 60000,
      frequency: 'monthly',
      lastPaidMatchDay: -4,
    },
    {
      name: `Mercado ${cityLabel}`,
      value: 15000,
      frequency: 'match',
      lastPaidMatchDay: -1,
    },
  ];
}

/**
 * Genera una hornada de ofertas de patrocinio en función del estado actual del club.
 * @param {ClubState} club
 * @param {MatchResult[]} recentResults
 * @param {{ limit?: number; rng?: () => number; existingNames?: string[] }} [options]
 * @returns {SponsorOffer[]}
 */
export function generateSponsorOffers(club, recentResults = [], options = {}) {
  const rng = options.rng ?? Math.random;
  const limit = Math.max(1, Math.min(options.limit ?? SPONSOR_PROFILE_DEFINITIONS.length, SPONSOR_PROFILE_DEFINITIONS.length));
  const reputation = clampNumber(Number.isFinite(club.reputation) ? club.reputation : 50, 5, 95);
  const performance = summariseRecentPerformance(recentResults);
  const momentumFactor = 1 + Math.max(-0.4, Math.min(0.6, performance.average * 0.2));
  const goalFactor = 1 + Math.max(-0.2, Math.min(0.3, performance.goalDelta * 0.03));
  const annualBaseline = Math.max(120000, Math.round((180000 + reputation * 4200) * momentumFactor * goalFactor));
  const usedNames = new Set(options.existingNames ?? []);
  (club.sponsors ?? []).forEach((sponsor) => usedNames.add(sponsor.name));

  const offers = [];
  for (const definition of SPONSOR_PROFILE_DEFINITIONS) {
    if (offers.length >= limit) {
      break;
    }
    const name = buildSponsorName(definition.profile, club, rng);
    if (usedNames.has(name)) {
      continue;
    }
    usedNames.add(name);
    const annualValue = Math.max(90000, Math.round(annualBaseline * definition.multiplier));
    let contractValue = annualValue;
    if (definition.frequency === 'monthly') {
      contractValue = Math.max(18000, Math.round(annualValue / 10));
    } else if (definition.frequency === 'match') {
      contractValue = Math.max(9000, Math.round(annualValue / 40));
    }
    const upfrontBase = Math.round(annualValue * definition.upfrontFactor);
    const momentumBonus = performance.formScore > 0 ? Math.round(performance.formScore * 2500) : 0;
    const upfrontPayment = Math.max(15000, upfrontBase + momentumBonus);
    const clausesFactory = COMMERCIAL_PROFILE_DATA[definition.profile]?.clauses;
    const clauses = clausesFactory ? clausesFactory(club) : [];
    /** @type {SponsorOffer} */
    const offer = {
      id: generateOfferId('sponsor'),
      profile: /** @type {"purista" | "equilibrado" | "canalla"} */ (definition.profile),
      contract: {
        name,
        value: contractValue,
        frequency: /** @type {SponsorContract['frequency']} */ (definition.frequency),
        lastPaidMatchDay: (club.league?.matchDay ?? 0) - 1,
      },
      upfrontPayment,
      reputationImpact: definition.reputation,
      summary: definition.summary(club),
      clauses,
      durationMatches: definition.durationMatches,
    };
    offers.push(offer);
  }
  return offers;
}

/**
 * Crea un acuerdo televisivo base para los clubes ejemplo.
 * @returns {TVDeal}
 */
export function createExampleTvDeal() {
  return { name: 'Liga Retro TV', perMatch: 28000, bonusWin: 12000, bonusDraw: 6000 };
}

/**
 * Sugiere nuevos contratos televisivos basándose en reputación y resultados.
 * @param {ClubState} club
 * @param {MatchResult[]} recentResults
 * @param {{ limit?: number; rng?: () => number }} [options]
 * @returns {TVDealOffer[]}
 */
export function generateTvDeals(club, recentResults = [], options = {}) {
  const rng = options.rng ?? Math.random;
  const limit = Math.max(1, Math.min(options.limit ?? 2, TV_DEAL_PROFILE_DEFINITIONS.length));
  const reputation = clampNumber(Number.isFinite(club.reputation) ? club.reputation : 45, 5, 95);
  const performance = summariseRecentPerformance(recentResults);
  const formBoost = 1 + Math.max(-0.35, Math.min(0.45, performance.average * 0.22));
  const excitementFactor = 1 + Math.max(-0.25, Math.min(0.35, performance.goalDelta * 0.05));
  const basePerMatch = Math.max(18000, Math.round((22000 + reputation * 260) * formBoost * excitementFactor));
  const usedNames = new Set(club.tvDeal?.name ? [club.tvDeal.name] : []);
  const offers = [];
  const tvClauses = {
    purista: [
      'Retransmisión con comentaristas clásicos y espacios para cantera.',
      'Cobertura abierta de entrenos solidarios.',
    ],
    equilibrado: [
      'Panel de datos interactivo durante los partidos.',
      'Mini-documentales mensuales sobre la táctica del equipo.',
    ],
    canalla: [
      'Reality semanal con acceso al vestuario.',
      'Programas nocturnos con debate sin filtros.',
    ],
  };

  for (const definition of TV_DEAL_PROFILE_DEFINITIONS) {
    if (offers.length >= limit) {
      break;
    }
    const name = buildTvBrand(definition.profile, club, rng);
    if (usedNames.has(name)) {
      continue;
    }
    usedNames.add(name);
    const perMatch = Math.max(16000, Math.round(basePerMatch * definition.multiplier));
    const bonusWin = Math.max(6000, Math.round(perMatch * 0.45));
    const bonusDraw = Math.max(3200, Math.round(perMatch * 0.22));
    const upfrontBase = Math.round(perMatch * 4 * definition.upfrontFactor);
    const flareBonus = performance.formScore > 0 ? Math.round(performance.formScore * 3000) : 0;
    const upfrontPayment = Math.max(25000, upfrontBase + flareBonus);
    /** @type {TVDealOffer} */
    const offer = {
      id: generateOfferId('tv'),
      profile: /** @type {"purista" | "equilibrado" | "canalla"} */ (definition.profile),
      deal: {
        name,
        perMatch,
        bonusWin,
        bonusDraw,
      },
      upfrontPayment,
      reputationImpact: definition.reputation,
      summary: definition.summary(club),
      clauses: tvClauses[definition.profile] ?? [],
      durationSeasons: definition.durationSeasons,
    };
    offers.push(offer);
  }
  return offers;
}

/**
 * Define un plan de merchandising genérico para el club inicial.
 * @returns {MerchandisingPlan}
 */
function createExampleMerchandising() {
  return { brand: 'Mercadillo Vintage', base: 18000, bonusWin: 4000, bonusStarPlayer: 2500 };
}

/**
 * Crea un registro vacío de clasificación para un club concreto.
 * @param {string} club Nombre del club.
 */
function createLeagueStanding(club) {
  return {
    club,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

/**
 * Actualiza un registro de clasificación con el resultado de un partido.
 * @param {LeagueStanding} standing Entrada de la tabla a modificar.
 * @param {number} goalsFor Goles a favor.
 * @param {number} goalsAgainst Goles en contra.
 */
function applyResult(standing, goalsFor, goalsAgainst) {
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  if (goalsFor > goalsAgainst) {
    standing.wins += 1;
    standing.points += 3;
  } else if (goalsFor === goalsAgainst) {
    standing.draws += 1;
    standing.points += 1;
  } else {
    standing.losses += 1;
  }
}

/**
 * Ordena la tabla de clasificación aplicando criterios de puntos y diferencia de goles.
 * @param {LeagueStanding[]} table Clasificación sin ordenar.
 */
function sortStandings(table) {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (diffB !== diffA) {
      return diffB - diffA;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.club.localeCompare(b.club);
  });
}

/**
 * Calcula un valor aproximado de mercado para un jugador.
 * @param {Player} player
 */
export function estimatePlayerValue(player) {
  const skillAverage =
    (player.attributes.pace +
      player.attributes.stamina +
      player.attributes.dribbling +
      player.attributes.passing +
      player.attributes.shooting +
      player.attributes.defending) /
    6;
  const potentialFactor = player.attributes.potential * 2000;
  const leadershipBonus = player.attributes.leadership * 120;
  const moraleFactor = 0.8 + player.morale / 100;
  const ageModifier = player.age < 24 ? 1.25 : player.age > 31 ? 0.9 : 1.05;
  const rawValue = (skillAverage * 12000 + potentialFactor + leadershipBonus) * moraleFactor * ageModifier;
  return Math.max(50000, Math.round(rawValue / 1000) * 1000);
}

/**
 * Construye una liga ficticia con rivales pintorescos y la tabla inicializada.
 * @param {string} clubName Nombre del club controlado por el jugador.
 * @param {{ city?: string; rivals?: string[]; rng?: () => number }} [options] Opciones para personalizar la ambientación.
 * @returns {LeagueState}
 */
export function createExampleLeague(clubName, options = {}) {
  const leagueSize = resolveLeagueSizeCandidate(options.leagueSize, options.rivals);
  const rivalCount = Math.max(1, leagueSize - 1);
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const rivals = normaliseLeagueRivals(options.rivals, {
    count: rivalCount,
    rng,
    exclude: [clubName],
  });
  const clubs = [clubName, ...rivals];
  const table = clubs.map((name) => createLeagueStanding(name));
  const trimmedCity = options.city?.trim();
  const leagueName =
    trimmedCity && trimmedCity.length > 0 ? `Liga Canalla de ${trimmedCity}` : 'Liga Canalla PCF';
  const difficulty = resolveLeagueDifficulty(options.difficulty);
  const totalMatchdays = calculateTotalMatchdays(rivalCount);
  return {
    name: leagueName,
    matchDay: 0,
    table,
    rivals,
    totalMatchdays,
    size: leagueSize,
    difficulty: difficulty.id,
    difficultyMultiplier: difficulty.multiplier,
  };
}

/**
 * Actualiza la clasificación liguera tras disputar una jornada completa.
 * @param {LeagueState} league Estado previo de la liga.
 * @param {string} clubName Nombre de nuestro club para localizarlo en la tabla.
 * @param {MatchResult} match Resultado obtenido por el jugador.
 * @param {() => number} [rng] Generador aleatorio opcional.
 * @returns {LeagueState}
 */
export function updateLeagueTableAfterMatch(league, clubName, match, rng = Math.random) {
  const table = league.table.map((entry) => ({ ...entry }));
  const standing = table.find((entry) => entry.club === clubName);
  if (standing) {
    applyResult(standing, match.goalsFor, match.goalsAgainst);
  }

  const others = table.filter((entry) => entry.club !== clubName);
  for (let index = 0; index < others.length; index += 2) {
    const home = others[index];
    const away = others[index + 1];
    if (!home) {
      continue;
    }
    if (!away) {
      applyResult(home, 0, 0);
      continue;
    }
    const homeGoals = Math.floor(rng() * 4);
    const awayGoals = Math.floor(rng() * 4);
    applyResult(home, homeGoals, awayGoals);
    applyResult(away, awayGoals, homeGoals);
  }

  return {
    ...league,
    matchDay: league.matchDay + 1,
    table: sortStandings(table),
    rivals: Array.isArray(league.rivals) ? [...league.rivals] : league.rivals,
  };
}

/**
 * Genera una lista de objetivos de mercado compatibles con la plantilla actual.
 * @param {ClubState} club Club que busca refuerzos.
 * @returns {TransferTarget[]}
 */
export function createExampleTransferMarket(club) {
  const filtered = MARKET_BLUEPRINTS.filter((blueprint) =>
    club.squad.every((player) => player.id !== blueprint.player.id)
  );
  return filtered.map((blueprint) => ({
    id: blueprint.id,
    player: { ...blueprint.player },
    price: Math.round(estimatePlayerValue(blueprint.player) * blueprint.multiplier),
    origin: blueprint.origin,
  }));
}

/**
 * Completa la información necesaria para instanciar un jugador del simulador.
 * @param {Partial<Player> & Pick<Player, 'id' | 'name' | 'position'>} partial Datos mínimos y opcionales.
 * @returns {Player}
 */
function createPlayer(partial) {
  const baseName =
    typeof partial.name === 'string' && partial.name.trim().length > 0
      ? partial.name.trim()
      : 'Canterano misterioso';
  const nickname = typeof partial.nickname === 'string' ? partial.nickname.trim() : '';
  const originalName =
    typeof partial.originalName === 'string' && partial.originalName.trim().length > 0
      ? partial.originalName.trim()
      : baseName;
  const availability = {
    injuryMatches: partial.availability?.injuryMatches ?? 0,
    suspensionMatches: partial.availability?.suspensionMatches ?? 0,
  };
  const seasonLog = { ...createEmptySeasonLog(), ...partial.seasonLog };
  const player = {
    id: partial.id,
    name: baseName,
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
    availability,
    seasonLog,
    originalName,
  };
  if (nickname) {
    player.nickname = nickname;
  }
  return player;
}

function resolveClubColor(candidate, fallback) {
  if (typeof candidate !== 'string') {
    return fallback;
  }
  const trimmed = candidate.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

/**
 * Construye un club de ejemplo con plantilla, finanzas y contexto narrativo.
 * @param {{
 *   name?: string;
 *   stadiumName?: string;
 *   city?: string;
 *   primaryColor?: string;
 *   secondaryColor?: string;
 *   logoUrl?: string;
 *   leagueSize?: number | string;
 *   leagueDifficulty?: string;
 *   leagueRivals?: string[];
 * }} [options]
 * @returns {ClubState}
 */
export function createExampleClub(options = {}) {
  /** @type {Player[]} */
  const squad = [
    createPlayer({
      id: 'portero-legendario',
      name: "Paco 'El Gato' Calderón",
      position: 'GK',
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
      id: 'portero-de-riego',
      name: 'Pipiolo del Aspersor',
      position: 'GK',
      attributes: {
        pace: 48,
        stamina: 68,
        dribbling: 40,
        passing: 55,
        shooting: 32,
        defending: 72,
        leadership: 55,
        potential: 62,
      },
      morale: 14,
    }),
    createPlayer({
      id: 'lateral-callejero',
      name: 'Romario del Bulevar',
      position: 'DEF',
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
      id: 'central-cemento',
      name: 'Ezequiel Mampostería',
      position: 'DEF',
      attributes: {
        pace: 64,
        stamina: 77,
        dribbling: 52,
        passing: 60,
        shooting: 45,
        defending: 82,
        leadership: 70,
        potential: 74,
      },
      morale: 17,
    }),
    createPlayer({
      id: 'lateral-chispa',
      name: 'Chispita del Callejón',
      position: 'DEF',
      attributes: {
        pace: 82,
        stamina: 78,
        dribbling: 66,
        passing: 70,
        shooting: 50,
        defending: 69,
        leadership: 57,
        potential: 79,
      },
      morale: 16,
    }),
    createPlayer({
      id: 'central-vieja-guardia',
      name: 'Capo del Callejón',
      position: 'DEF',
      attributes: {
        pace: 58,
        stamina: 73,
        dribbling: 50,
        passing: 66,
        shooting: 48,
        defending: 80,
        leadership: 84,
        potential: 70,
      },
      morale: 21,
    }),
    createPlayer({
      id: 'pivote-canchero',
      name: 'Moro del Mercado',
      position: 'MID',
      attributes: {
        pace: 67,
        stamina: 76,
        dribbling: 64,
        passing: 74,
        shooting: 58,
        defending: 72,
        leadership: 66,
        potential: 78,
      },
      morale: 18,
    }),
    createPlayer({
      id: 'cerebro-tabernas',
      name: 'Isco de Lavapiés',
      position: 'MID',
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
      id: 'enganche-malandra',
      name: 'Buba el Trilero',
      position: 'MID',
      attributes: {
        pace: 70,
        stamina: 68,
        dribbling: 84,
        passing: 86,
        shooting: 72,
        defending: 50,
        leadership: 59,
        potential: 83,
      },
      morale: 19,
    }),
    createPlayer({
      id: 'canterano-osado',
      name: 'Perla del Bar Manolo',
      position: 'MID',
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
    createPlayer({
      id: 'volante-gambeta',
      name: 'Zurdo del Pasaje',
      position: 'MID',
      attributes: {
        pace: 76,
        stamina: 71,
        dribbling: 80,
        passing: 77,
        shooting: 69,
        defending: 58,
        leadership: 60,
        potential: 81,
      },
      morale: 20,
    }),
    createPlayer({
      id: 'killer-picaro',
      name: 'Chino Benítez',
      position: 'FWD',
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
      id: 'delantero-tanque',
      name: 'Búfalo de Chamberí',
      position: 'FWD',
      attributes: {
        pace: 70,
        stamina: 74,
        dribbling: 68,
        passing: 62,
        shooting: 83,
        defending: 48,
        leadership: 63,
        potential: 79,
      },
      morale: 13,
    }),
    createPlayer({
      id: 'delantero-ruido',
      name: 'Cumbia Martínez',
      position: 'FWD',
      attributes: {
        pace: 86,
        stamina: 76,
        dribbling: 81,
        passing: 64,
        shooting: 78,
        defending: 42,
        leadership: 56,
        potential: 85,
      },
      morale: 16,
    }),
    createPlayer({
      id: 'extremo-chamuyo',
      name: 'Rayo de la Verbena',
      position: 'FWD',
      attributes: {
        pace: 88,
        stamina: 79,
        dribbling: 83,
        passing: 69,
        shooting: 76,
        defending: 44,
        leadership: 54,
        potential: 84,
      },
      morale: 18,
    }),
    createPlayer({
      id: 'comodin-polivalente',
      name: 'Lucho Multipass',
      position: 'MID',
      attributes: {
        pace: 74,
        stamina: 82,
        dribbling: 71,
        passing: 75,
        shooting: 63,
        defending: 68,
        leadership: 67,
        potential: 77,
      },
      morale: 17,
    }),
    createPlayer({
      id: 'central-juvenil',
      name: 'Chaval de la Pista',
      position: 'DEF',
      attributes: {
        pace: 72,
        stamina: 70,
        dribbling: 55,
        passing: 60,
        shooting: 50,
        defending: 74,
        leadership: 50,
        potential: 86,
      },
      morale: 10,
    }),
  ];

  const name = options.name?.trim() || DEFAULT_CLUB_NAME;
  const stadiumName = options.stadiumName?.trim() || DEFAULT_STADIUM_NAME;
  const city = options.city?.trim() || DEFAULT_CLUB_CITY;
  const primaryColor = resolveClubColor(options.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = resolveClubColor(options.secondaryColor, DEFAULT_SECONDARY_COLOR);
  const logoUrl =
    typeof options.logoUrl === 'string' && options.logoUrl.trim().length > 0
      ? options.logoUrl.trim()
      : DEFAULT_CLUB_LOGO;
  const league = createExampleLeague(name, {
    city,
    leagueSize: options.leagueSize,
    difficulty: options.leagueDifficulty,
    rivals: options.leagueRivals,
  });
  const cupParticipants = Array.isArray(options.leagueRivals) ? options.leagueRivals : league.rivals;
  const cup = createExampleCup(name, { participants: cupParticipants, rng: Math.random });

  const infrastructure = createExampleInfrastructure();
  const stadiumCapacity = calculateStadiumCapacity(infrastructure.stadiumLevel);
  const operatingExpenses = createExampleOperatingExpenses(infrastructure);

  return {
    name,
    stadiumName,
    city,
    budget: 1200000,
    stadiumCapacity,
    reputation: 5,
    primaryColor,
    secondaryColor,
    logoUrl,
    squad,
    season: 1,
    objectives: {
      minPosition: 8,
      cupRun: true,
      cupRoundTarget: 'semiFinal',
    },
    weeklyWageBill: squad.reduce((acc, player) => acc + player.salary / 4, 0),
    league,
    cup,
    sponsors: createExampleSponsors({ city, stadiumName }),
    tvDeal: createExampleTvDeal(),
    pendingSponsorOffers: [],
    pendingTvDeals: [],
    commercialNarratives: [],
    merchandising: createExampleMerchandising(),
    infrastructure,
    operatingExpenses,
    staff: createExampleStaffState(),
    seasonStats: createSeasonStats(),
    canallaStatus: createInitialCanallaStatus(),
  };
}

/**
 * Configura un partido estándar con parámetros equilibrados.
 * @returns {MatchConfig}
 */
export function createDefaultMatchConfig() {
  return {
    home: true,
    opponentStrength: 68,
    difficultyMultiplier: 1,
    tactic: 'balanced',
    formation: '4-4-2',
    startingLineup: [],
    substitutes: [],
    opponentName: '',
    instructions: createDefaultInstructions(),
    halftimeAdjustments: {
      tactic: 'balanced',
      instructions: createDefaultInstructions(),
      substitutions: [],
    },
    inMatchAdjustments: [],
    viewMode: 'text',
    seed: '',
  };
}

/**
 * Genera una alineación básica tomando los primeros jugadores disponibles.
 * @param {ClubState} club Club del que se extraen los jugadores.
 */
export function createDefaultLineup(club) {
  const eligible = club.squad.filter((player) => isPlayerAvailable(player));
  const availableGoalkeepers = eligible.filter((player) => player.position === 'GK');
  const fallbackGoalkeeper = club.squad.find((player) => player.position === 'GK' && !availableGoalkeepers.includes(player));
  const goalkeeperCandidate =
    availableGoalkeepers[0] ??
    fallbackGoalkeeper ??
    eligible[0] ??
    club.squad[0];

  const starters = [];
  const usedIds = new Set();

  if (goalkeeperCandidate) {
    starters.push(goalkeeperCandidate.id);
    usedIds.add(goalkeeperCandidate.id);
  }

  const remainingSlots = 11 - starters.length;

  const preferredFieldPlayers = eligible.filter(
    (player) => player.position !== 'GK' && !usedIds.has(player.id)
  );
  const fallbackFieldPlayers = club.squad.filter(
    (player) =>
      player.position !== 'GK' &&
      !usedIds.has(player.id) &&
      !preferredFieldPlayers.some((candidate) => candidate.id === player.id)
  );
  const fieldPool = [...preferredFieldPlayers, ...fallbackFieldPlayers];

  if (fieldPool.length < remainingSlots) {
    const extraPlayers = club.squad.filter(
      (player) =>
        !usedIds.has(player.id) &&
        !fieldPool.some((candidate) => candidate.id === player.id)
    );
    fieldPool.push(...extraPlayers);
  }

  for (const player of fieldPool.slice(0, remainingSlots)) {
    starters.push(player.id);
    usedIds.add(player.id);
  }

  const poolWithoutStarters = club.squad.filter((player) => !usedIds.has(player.id));
  const availableSubs = poolWithoutStarters.filter((player) => isPlayerAvailable(player));
  const subsPool = availableSubs.length >= 5 ? availableSubs : poolWithoutStarters;
  const substitutes = [];

  const benchGoalkeeper = poolWithoutStarters.find(
    (player) => player.position === 'GK' && isPlayerAvailable(player)
  );
  if (benchGoalkeeper) {
    substitutes.push(benchGoalkeeper.id);
  }

  for (const player of subsPool) {
    if (substitutes.length >= 5) {
      break;
    }
    if (substitutes.includes(player.id)) {
      continue;
    }
    substitutes.push(player.id);
  }

  return { starters, substitutes };
}

const DEFAULT_CANALLA_DECISIONS = [
  {
    type: 'sobornoArbitro',
    intensity: 'alta',
    cooldownMatches: 3,
    description: 'Untar al colegiado para inclinar la balanza del encuentro.',
    consequenceSummary: 'Si sale mal, la federación puede caer con dureza inmediata.',
    expectedHeat: 18,
  },
  {
    type: 'filtrarRumor',
    intensity: 'media',
    cooldownMatches: 1,
    description: 'Correr la voz de un chisme desestabilizador en la prensa local.',
    consequenceSummary: 'Puede volverse contra el club si la afición detecta la mentira.',
    expectedHeat: 8,
  },
  {
    type: 'fiestaIlegal',
    intensity: 'media',
    cooldownMatches: 2,
    description: 'Montar una celebración clandestina para cohesionar a la plantilla.',
    consequenceSummary: 'La moral se hunde si aparecen videos o sanciones policiales.',
    expectedHeat: 12,
  },
  {
    type: 'presionarFederacion',
    intensity: 'baja',
    cooldownMatches: 2,
    description: 'Llamadas nocturnas para manipular calendarios y designaciones.',
    consequenceSummary: 'Los despachos pueden vengarse bloqueando futuras peticiones.',
    expectedHeat: 10,
  },
  {
    type: 'sobornoJugador',
    intensity: 'media',
    cooldownMatches: 4,
    description: 'Intentar comprar al crack rival para que se borre del partido.',
    consequenceSummary: 'El vestuario puede fracturarse y la liga vigilará cada paso.',
    expectedHeat: 24,
  },
  {
    type: 'manipularCesped',
    intensity: 'baja',
    cooldownMatches: 1,
    description: 'Preparar un césped tramposo que favorezca nuestro estilo callejero.',
    consequenceSummary: 'Los jardineros rivales tomarán nota y podrían denunciar el truco.',
    expectedHeat: 6,
  },
  {
    type: 'espionajeAnalitico',
    intensity: 'alta',
    cooldownMatches: 3,
    description: 'Hackear datos tácticos del rival para anticipar su plan de juego.',
    consequenceSummary: 'Un fallo deja rastros digitales y multas tecnológicas severas.',
    expectedHeat: 20,
  },
];

/**
 * Genera un estado canalla limpio sin sospechas ni efectos pendientes.
 * @returns {import('../types.js').CanallaStatus}
 */
export function createInitialCanallaStatus() {
  /** @type {Record<import('../types.js').CanallaDecisionType, number>} */
  const cooldowns = {};
  DEFAULT_CANALLA_DECISIONS.forEach((decision) => {
    cooldowns[decision.type] = 0;
  });
  return {
    heat: 0,
    cooldowns,
    ongoingEffects: [],
  };
}

/**
 * Devuelve la lista de travesuras canallas disponibles en la demo.
 * Permite sobreescribir parámetros puntuales para pruebas o eventos narrativos.
 * @param {Partial<Record<import('../types.js').CanallaDecisionType, Partial<CanallaDecision>>>} [overrides]
 * @returns {CanallaDecision[]}
 */
export function listCanallaDecisions(overrides = {}) {
  return DEFAULT_CANALLA_DECISIONS.map((decision) => {
    const override = overrides?.[decision.type];
    if (override) {
      return { ...decision, ...override };
    }
    return { ...decision };
  });
}
