// @ts-check
/**
 * Modelos comerciales (patrocinios, TV y merchandising).
 * @module core/data/commercial
 */

import {
  clampNumber,
  generateOfferId,
  summariseRecentPerformance,
  pickLabel,
} from './utils.js';

/** @typedef {import('../../types.js').ClubState} ClubState */
/** @typedef {import('../../types.js').SponsorContract} SponsorContract */
/** @typedef {import('../../types.js').SponsorOffer} SponsorOffer */
/** @typedef {import('../../types.js').TVDeal} TVDeal */
/** @typedef {import('../../types.js').TVDealOffer} TVDealOffer */
/** @typedef {import('../../types.js').MatchResult} MatchResult */

const SPONSOR_NAME_CATALOG = Object.freeze({
  purista: ['Cooperativa', 'Fundacion', 'Colectivo', 'Red cultural', 'Ruta gastronomica'],
  equilibrado: ['Bodega urbana', 'Startup analitica', 'Mercado fusion', 'Laboratorio deportivo', 'Red social futbolera'],
  canalla: ['Casa de apuestas', 'Criptocasino', 'Marisqueria nocturna', 'After clandestino', 'Bingo 24h'],
});

const SPONSOR_SUFFIXES = Object.freeze({
  purista: ['Solidaria', 'Barrio', 'Popular', 'Colectiva'],
  equilibrado: ['360', 'Interactiva', 'Hub', 'Digital'],
  canalla: ['Xtreme', 'Deluxe', 'Nocturna', 'Prime'],
});

const TV_BRAND_CATALOG = Object.freeze({
  purista: ['Television publica', 'Canal cultural', 'Cadena vecinal'],
  equilibrado: ['Stream Fut', 'Deporte Total+', 'Canal esferico'],
  canalla: ['Late Night Sports', 'Canalla Prime', 'FutTube X'],
});

const TV_SUFFIXES = Object.freeze({
  purista: ['Clasic', 'Barrio', 'Abierta'],
  equilibrado: ['Plus', 'Live', 'Interactive'],
  canalla: ['24/7', 'Show', 'Raw'],
});

export const COMMERCIAL_PROFILE_DATA = Object.freeze({
  purista: {
    clauses: (club) => [
      `Acciones comunitarias mensuales en ${club.city}.`,
      'Uniformes con mensaje social en la manga.',
    ],
  },
  equilibrado: {
    clauses: (club) => [
      'Campanas cruzadas en redes emergentes.',
      `Eventos hibridos con fans del ${club.name}.`,
    ],
  },
  canalla: {
    clauses: () => [
      'Activaciones nocturnas antes de partidos clave.',
      'Bonificaciones por titulares picantes en prensa.',
    ],
  },
});

export const SPONSOR_PROFILE_DEFINITIONS = Object.freeze([
  {
    profile: 'purista',
    frequency: 'annual',
    multiplier: 0.95,
    upfrontFactor: 0.12,
    reputation: { accept: 4, reject: -1 },
    durationMatches: 40,
    summary: (club) =>
      `Una cooperativa de ${club.city} quiere asociarse a la causa y presume de futbol de barrio.`,
  },
  {
    profile: 'equilibrado',
    frequency: 'monthly',
    multiplier: 1.05,
    upfrontFactor: 0.18,
    reputation: { accept: 1, reject: 0 },
    durationMatches: 32,
    summary: () => 'Marca emergente busca club valiente para explorar formatos digitales y acciones express.',
  },
  {
    profile: 'canalla',
    frequency: 'match',
    multiplier: 1.18,
    upfrontFactor: 0.26,
    reputation: { accept: -3, reject: 2 },
    durationMatches: 24,
    summary: () => 'Patrocinador descarado promete ingresos suculentos a cambio de abrazar la picardia.',
  },
]);

export const TV_DEAL_PROFILE_DEFINITIONS = Object.freeze([
  {
    profile: 'purista',
    upfrontFactor: 0.15,
    multiplier: 0.9,
    reputation: { accept: 3, reject: -1 },
    durationSeasons: 1,
    summary: (club) =>
      `La television publica de ${club.city} ofrece retransmisiones cuidadas y foco en la cantera.`,
  },
  {
    profile: 'equilibrado',
    upfrontFactor: 0.22,
    multiplier: 1.05,
    reputation: { accept: 1, reject: 0 },
    durationSeasons: 2,
    summary: () => 'Plataforma hibrida mezcla directos clasicos con metricas en vivo para la grada digital.',
  },
  {
    profile: 'canalla',
    upfrontFactor: 0.3,
    multiplier: 1.18,
    reputation: { accept: -2, reject: 2 },
    durationSeasons: 1,
    summary: () => 'Cadena nocturna promete audiencias globales a cambio de espectaculo y drama semanal.',
  },
]);

function buildSponsorName(profile, club, rng) {
  const candidates = SPONSOR_NAME_CATALOG[profile] ?? [];
  const base = pickLabel(candidates, rng);
  if (!base) {
    return `${club.name} Sponsor`;
  }
  const suffix = pickLabel(SPONSOR_SUFFIXES[profile] ?? [], rng);
  if (!suffix) {
    return base;
  }
  const cityToken = club.city?.split(' ')[0] ?? club.name.split(' ')[0] ?? 'Barrio';
  return `${base} ${suffix} ${cityToken}`;
}

function buildTvBrand(profile, club, rng) {
  const base = pickLabel(TV_BRAND_CATALOG[profile] ?? [], rng);
  if (!base) {
    return `${club.name} TV`;
  }
  const suffix = pickLabel(TV_SUFFIXES[profile] ?? [], rng);
  return suffix ? `${base} ${suffix}` : base;
}

/**
 * Genera ofertas de patrocinio basadas en reputacion y forma reciente.
 */
export function generateSponsorOffers(club, recentResults = [], options = {}) {
  const rng = options.rng ?? Math.random;
  const limit = Math.max(
    1,
    Math.min(options.limit ?? SPONSOR_PROFILE_DEFINITIONS.length, SPONSOR_PROFILE_DEFINITIONS.length),
  );
  const reputation = clampNumber(Number.isFinite(club.reputation) ? club.reputation : 50, 5, 95);
  const performance = summariseRecentPerformance(recentResults);
  const momentumFactor = 1 + Math.max(-0.4, Math.min(0.6, performance.average * 0.2));
  const goalFactor = 1 + Math.max(-0.2, Math.min(0.3, performance.goalDelta * 0.03));
  const annualBaseline = Math.max(120000, Math.round((180000 + reputation * 4200) * momentumFactor * goalFactor));
  const usedNames = new Set(options.existingNames ?? []);
  (club.sponsors ?? []).forEach((sponsor) => usedNames.add(sponsor.name));

  /** @type {SponsorOffer[]} */
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

    offers.push({
      id: generateOfferId('sponsor'),
      profile: definition.profile,
      contract: {
        name,
        value: contractValue,
        frequency: definition.frequency,
        lastPaidMatchDay: (club.league?.matchDay ?? 0) - 1,
      },
      upfrontPayment,
      reputationImpact: definition.reputation,
      summary: definition.summary(club),
      clauses,
      durationMatches: definition.durationMatches,
    });
  }
  return offers;
}

export function createExampleTvDeal() {
  return { name: 'Liga Retro TV', perMatch: 28000, bonusWin: 12000, bonusDraw: 6000 };
}

export function generateTvDeals(club, recentResults = [], options = {}) {
  const rng = options.rng ?? Math.random;
  const limit = Math.max(1, Math.min(options.limit ?? 2, TV_DEAL_PROFILE_DEFINITIONS.length));
  const reputation = clampNumber(Number.isFinite(club.reputation) ? club.reputation : 45, 5, 95);
  const performance = summariseRecentPerformance(recentResults);
  const formBoost = 1 + Math.max(-0.35, Math.min(0.45, performance.average * 0.22));
  const excitementFactor = 1 + Math.max(-0.25, Math.min(0.35, performance.goalDelta * 0.05));
  const basePerMatch = Math.max(18000, Math.round((22000 + reputation * 260) * formBoost * excitementFactor));
  const usedNames = new Set(club.tvDeal?.name ? [club.tvDeal.name] : []);

  const tvClauses = {
    purista: [
      'Retransmision con comentaristas clasicos y espacios para cantera.',
      'Cobertura abierta de entrenamientos solidarios.',
    ],
    equilibrado: [
      'Panel de datos interactivo durante los partidos.',
      'Mini-documentales mensuales sobre la tactica del equipo.',
    ],
    canalla: [
      'Reality semanal con acceso al vestuario.',
      'Programas nocturnos con debate sin filtros.',
    ],
  };

  /** @type {TVDealOffer[]} */
  const offers = [];
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

    offers.push({
      id: generateOfferId('tv'),
      profile: definition.profile,
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
    });
  }
  return offers;
}

export function createExampleMerchandising() {
  return { brand: 'Mercadillo Vintage', base: 18000, bonusWin: 4000, bonusStarPlayer: 2500 };
}

