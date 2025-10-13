// @ts-check
/**
 * Persistencia local para partidas guardadas en el navegador.
 * @module core/persistence
 */

import {
  createEmptySeasonLog,
  createSeasonStats,
  DEFAULT_CLUB_CITY,
  DEFAULT_CLUB_NAME,
  DEFAULT_STADIUM_NAME,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_CLUB_LOGO,
  DEFAULT_LEAGUE_SIZE,
  MIN_LEAGUE_SIZE,
  MAX_LEAGUE_SIZE,
  calculateTotalMatchdays,
  resolveLeagueDifficulty,
  createExampleCup,
  createExampleInfrastructure,
  createExampleTvDeal,
  createExampleStaffState,
  calculateOperatingExpensesForInfrastructure,
  calculateStadiumCapacity,
  clampInfrastructureLevel,
  normaliseStaffState,
} from './data.js';

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').LeagueState} LeagueState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').SavedGameBlob} SavedGameBlob */
/** @typedef {import('../types.js').TransferTarget} TransferTarget */
/** @typedef {import('../types.js').MatchHistoryEntry} MatchHistoryEntry */
/** @typedef {import('../types.js').MatchDayReport} MatchDayReport */

export const SAVE_VERSION = 5;
export const SAVE_KEY = 'ia-soccer-manager-state';

/**
 * Comprueba si el valor recibido es un objeto no nulo.
 * @param {unknown} value
 */
function isObject(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * Clona estructuras serializables sin compartir referencias.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  if (value === undefined) {
    return /** @type {T} */ (value);
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return /** @type {T} */ (JSON.parse(JSON.stringify(value)));
}

/**
 * Asegura que un jugador tiene disponibilidad y registro de temporada coherentes.
 * @param {import('../types.js').Player} player
 */
function normalisePlayer(player) {
  const availability = {
    injuryMatches: player.availability?.injuryMatches ?? 0,
    suspensionMatches: player.availability?.suspensionMatches ?? 0,
  };
  const seasonLog = {
    ...createEmptySeasonLog(),
    ...(player.seasonLog ?? {}),
  };
  const originalNameCandidate =
    typeof player.originalName === 'string' && player.originalName.trim().length > 0
      ? player.originalName.trim()
      : '';
  const nameCandidate =
    typeof player.name === 'string' && player.name.trim().length > 0 ? player.name.trim() : '';
  const fallbackName = originalNameCandidate || nameCandidate || 'Canterano misterioso';
  const nicknameCandidate =
    typeof player.nickname === 'string' && player.nickname.trim().length > 0
      ? player.nickname.trim()
      : '';
  const normalised = {
    ...player,
    name: nameCandidate || fallbackName,
    originalName: fallbackName,
    availability,
    seasonLog,
  };
  if (nicknameCandidate) {
    normalised.nickname = nicknameCandidate;
  } else {
    delete normalised.nickname;
  }
  return normalised;
}

function normaliseHexColor(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function normaliseInfrastructure(value) {
  const baseline = createExampleInfrastructure();
  const input = isObject(value) ? value : {};
  return {
    stadiumLevel: clampInfrastructureLevel('stadium', input.stadiumLevel ?? baseline.stadiumLevel),
    trainingLevel: clampInfrastructureLevel('training', input.trainingLevel ?? baseline.trainingLevel),
    medicalLevel: clampInfrastructureLevel('medical', input.medicalLevel ?? baseline.medicalLevel),
    academyLevel: clampInfrastructureLevel('academy', input.academyLevel ?? baseline.academyLevel),
  };
}

function normaliseOperatingExpenses(expenses, infrastructure) {
  const baseline = calculateOperatingExpensesForInfrastructure(infrastructure);
  if (!isObject(expenses)) {
    return baseline;
  }
  return {
    maintenance: Number.isFinite(expenses.maintenance)
      ? Math.max(0, Math.round(expenses.maintenance))
      : baseline.maintenance,
    staff: Number.isFinite(expenses.staff) ? Math.max(0, Math.round(expenses.staff)) : baseline.staff,
    academy: Number.isFinite(expenses.academy) ? Math.max(0, Math.round(expenses.academy)) : baseline.academy,
    medical: Number.isFinite(expenses.medical) ? Math.max(0, Math.round(expenses.medical)) : baseline.medical,
  };
}

function normaliseStadiumCapacity(value, infrastructure) {
  if (Number.isFinite(value)) {
    return Math.max(8000, Math.round(Number(value)));
  }
  return calculateStadiumCapacity(infrastructure.stadiumLevel);
}

const VALID_SPONSOR_FREQUENCIES = new Set(['match', 'monthly', 'annual']);

function createOfferId(prefix) {
  const random = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now().toString(36)}-${random.toString(36)}`;
}

function normaliseSponsorContract(contract, fallbackName) {
  if (!isObject(contract)) {
    return {
      name: fallbackName,
      value: 15000,
      frequency: 'match',
      lastPaidMatchDay: -1,
    };
  }
  const name =
    typeof contract.name === 'string' && contract.name.trim().length > 0
      ? contract.name.trim()
      : fallbackName;
  const value = Number.isFinite(contract.value) ? Math.max(1000, Math.round(contract.value)) : 15000;
  const frequency = VALID_SPONSOR_FREQUENCIES.has(contract.frequency)
    ? contract.frequency
    : 'match';
  const lastPaidMatchDay = Number.isFinite(contract.lastPaidMatchDay)
    ? Math.trunc(contract.lastPaidMatchDay)
    : -1;
  return { name, value, frequency, lastPaidMatchDay };
}

function normaliseSponsorOffer(offer) {
  if (!isObject(offer)) {
    return null;
  }
  const id = typeof offer.id === 'string' && offer.id.trim().length > 0 ? offer.id.trim() : createOfferId('sponsor');
  const profile = offer.profile === 'purista' || offer.profile === 'canalla' ? offer.profile : 'equilibrado';
  const summary = typeof offer.summary === 'string' && offer.summary.trim().length > 0 ? offer.summary.trim() : '';
  const clauses = Array.isArray(offer.clauses)
    ? offer.clauses
        .map((line) => (typeof line === 'string' ? line.trim() : ''))
        .filter((line) => line.length > 0)
    : [];
  const upfrontPayment = Number.isFinite(offer.upfrontPayment) ? Math.max(0, Math.round(offer.upfrontPayment)) : 0;
  const reputationImpact = {
    accept: Number.isFinite(offer.reputationImpact?.accept)
      ? Math.trunc(offer.reputationImpact.accept)
      : 0,
    reject: Number.isFinite(offer.reputationImpact?.reject)
      ? Math.trunc(offer.reputationImpact.reject)
      : 0,
  };
  const contract = normaliseSponsorContract(offer.contract, `Patrocinio ${id}`);
  const durationMatches = Number.isFinite(offer.durationMatches)
    ? Math.max(4, Math.trunc(offer.durationMatches))
    : undefined;
  const durationSeasons = Number.isFinite(offer.durationSeasons)
    ? Math.max(1, Math.trunc(offer.durationSeasons))
    : undefined;
  return {
    id,
    profile,
    contract,
    upfrontPayment,
    reputationImpact,
    summary,
    clauses,
    durationMatches,
    durationSeasons,
  };
}

function normaliseTvDealOffer(offer) {
  if (!isObject(offer)) {
    return null;
  }
  const id = typeof offer.id === 'string' && offer.id.trim().length > 0 ? offer.id.trim() : createOfferId('tv');
  const profile = offer.profile === 'purista' || offer.profile === 'canalla' ? offer.profile : 'equilibrado';
  const summary = typeof offer.summary === 'string' && offer.summary.trim().length > 0 ? offer.summary.trim() : '';
  const clauses = Array.isArray(offer.clauses)
    ? offer.clauses
        .map((line) => (typeof line === 'string' ? line.trim() : ''))
        .filter((line) => line.length > 0)
    : [];
  const upfrontPayment = Number.isFinite(offer.upfrontPayment) ? Math.max(0, Math.round(offer.upfrontPayment)) : 0;
  const reputationImpact = {
    accept: Number.isFinite(offer.reputationImpact?.accept)
      ? Math.trunc(offer.reputationImpact.accept)
      : 0,
    reject: Number.isFinite(offer.reputationImpact?.reject)
      ? Math.trunc(offer.reputationImpact.reject)
      : 0,
  };
  const deal = isObject(offer.deal)
    ? {
        name:
          typeof offer.deal.name === 'string' && offer.deal.name.trim().length > 0
            ? offer.deal.name.trim()
            : `TV ${id}`,
        perMatch: Number.isFinite(offer.deal.perMatch)
          ? Math.max(0, Math.round(offer.deal.perMatch))
          : 16000,
        bonusWin: Number.isFinite(offer.deal.bonusWin)
          ? Math.max(0, Math.round(offer.deal.bonusWin))
          : 6000,
        bonusDraw: Number.isFinite(offer.deal.bonusDraw)
          ? Math.max(0, Math.round(offer.deal.bonusDraw))
          : 3000,
      }
    : { name: `TV ${id}`, perMatch: 16000, bonusWin: 6000, bonusDraw: 3000 };
  const durationSeasons = Number.isFinite(offer.durationSeasons)
    ? Math.max(1, Math.trunc(offer.durationSeasons))
    : undefined;
  return {
    id,
    profile,
    deal,
    upfrontPayment,
    reputationImpact,
    summary,
    clauses,
    durationSeasons,
  };
}

/**
 * Normaliza un club reconstruyendo plantilla y estadísticas con valores por defecto.
 * @param {ClubState} club
 */
function normaliseClub(club) {
  const seasonStats = {
    ...createSeasonStats(),
    ...(club.seasonStats ?? {}),
  };
  const name = typeof club.name === 'string' && club.name.trim().length > 0 ? club.name : DEFAULT_CLUB_NAME;
  const stadiumName =
    typeof club.stadiumName === 'string' && club.stadiumName.trim().length > 0
      ? club.stadiumName
      : DEFAULT_STADIUM_NAME;
  const city = typeof club.city === 'string' && club.city.trim().length > 0 ? club.city : DEFAULT_CLUB_CITY;
  const primaryColor = normaliseHexColor(club.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = normaliseHexColor(club.secondaryColor, DEFAULT_SECONDARY_COLOR);
  const logoUrl =
    typeof club.logoUrl === 'string' && club.logoUrl.trim().length > 0 ? club.logoUrl.trim() : DEFAULT_CLUB_LOGO;
  const cup = normaliseCup(club.cup, name);
  const infrastructure = normaliseInfrastructure(club.infrastructure);
  const stadiumCapacity = normaliseStadiumCapacity(club.stadiumCapacity, infrastructure);
  const operatingExpenses = normaliseOperatingExpenses(club.operatingExpenses, infrastructure);
  const staffState = normaliseStaffState(club.staff ?? createExampleStaffState());
  const sponsors = Array.isArray(club.sponsors)
    ? club.sponsors.map((contract, index) => normaliseSponsorContract(contract, `Patrocinio ${index + 1}`))
    : [];
  const pendingSponsorOffers = Array.isArray(club.pendingSponsorOffers)
    ? club.pendingSponsorOffers
        .map((offer) => normaliseSponsorOffer(offer))
        .filter((offer) => offer !== null)
        .map((offer) => /** @type {import('../types.js').SponsorOffer} */ (offer))
    : [];
  const pendingTvDeals = Array.isArray(club.pendingTvDeals)
    ? club.pendingTvDeals
        .map((offer) => normaliseTvDealOffer(offer))
        .filter((offer) => offer !== null)
        .map((offer) => /** @type {import('../types.js').TVDealOffer} */ (offer))
    : [];
  const commercialNarratives = Array.isArray(club.commercialNarratives)
    ? club.commercialNarratives
        .map((line) => (typeof line === 'string' ? line.trim() : ''))
        .filter((line) => line.length > 0)
        .slice(-6)
    : [];
  const tvDeal = isObject(club.tvDeal)
    ? {
        name:
          typeof club.tvDeal.name === 'string' && club.tvDeal.name.trim().length > 0
            ? club.tvDeal.name.trim()
            : 'Liga Retro TV',
        perMatch: Number.isFinite(club.tvDeal.perMatch) ? Math.max(0, Math.round(club.tvDeal.perMatch)) : 28000,
        bonusWin: Number.isFinite(club.tvDeal.bonusWin) ? Math.max(0, Math.round(club.tvDeal.bonusWin)) : 12000,
        bonusDraw: Number.isFinite(club.tvDeal.bonusDraw) ? Math.max(0, Math.round(club.tvDeal.bonusDraw)) : 6000,
      }
    : createExampleTvDeal();
  return {
    ...club,
    name,
    stadiumName,
    city,
    primaryColor,
    secondaryColor,
    logoUrl,
    stadiumCapacity,
    infrastructure,
    operatingExpenses,
    staff: staffState,
    squad: Array.isArray(club.squad) ? club.squad.map((player) => normalisePlayer(player)) : [],
    sponsors,
    tvDeal,
    pendingSponsorOffers,
    pendingTvDeals,
    commercialNarratives,
    seasonStats,
    cup,
  };
}

/**
 * Clona una liga asegurando que la tabla es una copia independiente.
 * @param {LeagueState} league
 */
function clampLeagueSize(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_LEAGUE_SIZE;
  }
  const truncated = Math.trunc(value);
  return Math.max(MIN_LEAGUE_SIZE, Math.min(MAX_LEAGUE_SIZE, Math.max(2, truncated)));
}

function normaliseLeague(league) {
  const table = Array.isArray(league.table) ? league.table.map((entry) => ({ ...entry })) : [];
  const rivals = Array.isArray(league.rivals) ? [...league.rivals] : [];
  const difficulty = resolveLeagueDifficulty(league?.difficulty);
  const rivalCountFromData = rivals.length > 0 ? rivals.length : Math.max(1, table.length > 0 ? table.length - 1 : DEFAULT_LEAGUE_SIZE - 1);
  const sizeCandidate =
    Number.isFinite(league?.size) && league.size
      ? Math.trunc(league.size)
      : rivalCountFromData + 1;
  const size = clampLeagueSize(sizeCandidate);
  const rivalCount = Math.max(1, size - 1);
  const totalMatchdaysCandidate =
    Number.isFinite(league?.totalMatchdays) && league.totalMatchdays
      ? Math.max(1, Math.trunc(league.totalMatchdays))
      : calculateTotalMatchdays(rivalCount);
  const difficultyMultiplier =
    typeof league?.difficultyMultiplier === 'number' && Number.isFinite(league.difficultyMultiplier)
      ? league.difficultyMultiplier
      : difficulty.multiplier;

  return {
    ...league,
    table,
    rivals,
    size,
    totalMatchdays: totalMatchdaysCandidate,
    difficulty: difficulty.id,
    difficultyMultiplier,
  };
}

/**
 * Normaliza la estructura de la copa conservando datos válidos del guardado.
 * @param {import('../types.js').CupState | undefined} cup
 * @param {string} clubName
 */
function normaliseCup(cup, clubName) {
  const baseline = createExampleCup(clubName);
  if (!cup || typeof cup !== 'object') {
    return baseline;
  }
  const rounds = Array.isArray(cup.rounds) && cup.rounds.length > 0
    ? cup.rounds.map((round, index) => {
        const fallback = baseline.rounds[index] ?? baseline.rounds[baseline.rounds.length - 1];
        const ties = Array.isArray(round?.ties)
          ? round.ties.map((tie, tieIndex) => ({
              id: typeof tie?.id === 'string' && tie.id.trim().length > 0 ? tie.id.trim() : `${fallback.id}-${tieIndex + 1}`,
              home: typeof tie?.home === 'string' && tie.home.trim().length > 0 ? tie.home.trim() : null,
              away: typeof tie?.away === 'string' && tie.away.trim().length > 0 ? tie.away.trim() : null,
              homeGoals: Number.isFinite(tie?.homeGoals) ? Math.trunc(/** @type {number} */ (tie.homeGoals)) : null,
              awayGoals: Number.isFinite(tie?.awayGoals) ? Math.trunc(/** @type {number} */ (tie.awayGoals)) : null,
              played: Boolean(tie?.played),
              winner: typeof tie?.winner === 'string' && tie.winner.trim().length > 0 ? tie.winner.trim() : null,
              includesClub: Boolean(tie?.includesClub),
              status:
                tie?.status === 'scheduled' || tie?.status === 'played'
                  ? tie.status
                  : tie?.status === 'pending'
                    ? 'pending'
                    : fallback.ties[tieIndex]?.status ?? 'pending',
            }))
          : fallback.ties;
        return {
          id: typeof round?.id === 'string' && round.id.trim().length > 0 ? round.id.trim() : fallback.id,
          name: typeof round?.name === 'string' && round.name.trim().length > 0 ? round.name.trim() : fallback.name,
          reward: Number.isFinite(round?.reward) ? Math.max(0, Math.trunc(/** @type {number} */ (round.reward))) : fallback.reward,
          ties,
          drawCompleted: Boolean(round?.drawCompleted),
          finished: Boolean(round?.finished),
          drawNarrative: Array.isArray(round?.drawNarrative)
            ? round.drawNarrative.map((line) => (typeof line === 'string' ? line : String(line))).filter((line) => line.length > 0)
            : [],
        };
      })
    : baseline.rounds;
  const statusOptions = ['idle', 'awaiting-draw', 'awaiting-match', 'eliminated', 'champions'];
  const status = statusOptions.includes(cup.status) ? /** @type {typeof statusOptions[number]} */ (cup.status) : baseline.status;
  const currentRoundIndex = Number.isFinite(cup.currentRoundIndex)
    ? Math.min(Math.max(0, Math.trunc(/** @type {number} */ (cup.currentRoundIndex))), Math.max(0, rounds.length - 1))
    : baseline.currentRoundIndex;
  const pendingParticipants = Array.isArray(cup.pendingParticipants)
    ? cup.pendingParticipants
        .map((name) => (typeof name === 'string' ? name.trim() : ''))
        .filter((name) => name.length > 0)
    : baseline.pendingParticipants;
  const nextFixture =
    cup.nextFixture && typeof cup.nextFixture === 'object'
      ? {
          tieId:
            typeof cup.nextFixture.tieId === 'string' && cup.nextFixture.tieId.trim().length > 0
              ? cup.nextFixture.tieId.trim()
              : '',
          roundId:
            typeof cup.nextFixture.roundId === 'string' && cup.nextFixture.roundId.trim().length > 0
              ? cup.nextFixture.roundId.trim()
              : rounds[currentRoundIndex]?.id ?? baseline.rounds[0].id,
          roundName:
            typeof cup.nextFixture.roundName === 'string' && cup.nextFixture.roundName.trim().length > 0
              ? cup.nextFixture.roundName.trim()
              : rounds[currentRoundIndex]?.name ?? baseline.rounds[0].name,
          opponent:
            typeof cup.nextFixture.opponent === 'string' && cup.nextFixture.opponent.trim().length > 0
              ? cup.nextFixture.opponent.trim()
              : 'Rival misterioso',
          home: Boolean(cup.nextFixture.home),
        }
      : null;
  const history = Array.isArray(cup.history)
    ? cup.history.map((entry) => ({
        roundId:
          typeof entry?.roundId === 'string' && entry.roundId.trim().length > 0
            ? entry.roundId.trim()
            : baseline.rounds[0].id,
        roundName:
          typeof entry?.roundName === 'string' && entry.roundName.trim().length > 0
            ? entry.roundName.trim()
            : 'Ronda misteriosa',
        outcome:
          entry?.outcome === 'victory' || entry?.outcome === 'eliminated' || entry?.outcome === 'champion'
            ? entry.outcome
            : 'victory',
        prize: Number.isFinite(entry?.prize) ? Math.trunc(/** @type {number} */ (entry.prize)) : 0,
        reputationDelta: Number.isFinite(entry?.reputationDelta)
          ? Math.trunc(/** @type {number} */ (entry.reputationDelta))
          : 0,
        narrative: Array.isArray(entry?.narrative)
          ? entry.narrative.map((line) => (typeof line === 'string' ? line : String(line))).filter((line) => line.length > 0)
          : [],
      }))
    : [];
  return {
    name: typeof cup.name === 'string' && cup.name.trim().length > 0 ? cup.name.trim() : baseline.name,
    edition: Number.isFinite(cup.edition) ? Math.max(1, Math.trunc(/** @type {number} */ (cup.edition))) : baseline.edition,
    rounds,
    currentRoundIndex,
    status,
    pendingParticipants,
    nextFixture,
    history,
  };
}

/**
 * Normaliza una entrada del historial de crónicas para garantizar su integridad.
 * @param {unknown} entry
 * @returns {MatchHistoryEntry | null}
 */
function normaliseHistoryEntry(entry) {
  if (!isObject(entry)) {
    return null;
  }

  const candidate = /** @type {Partial<MatchHistoryEntry>} */ (entry);
  const clonedReport = cloneValue(candidate.report);
  if (!isObject(clonedReport) || !isObject(/** @type {MatchDayReport} */ (clonedReport).updatedClub)) {
    return null;
  }

  const idCandidate = typeof candidate.id === 'string' && candidate.id.trim().length > 0
    ? candidate.id.trim()
    : `history-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const seasonCandidate = Number.isFinite(candidate.season) ? Math.trunc(/** @type {number} */ (candidate.season)) : 1;
  const matchdayCandidate =
    Number.isFinite(candidate.matchday) ? Math.trunc(/** @type {number} */ (candidate.matchday)) : 1;
  const opponent =
    typeof candidate.opponent === 'string' && candidate.opponent.trim().length > 0
      ? candidate.opponent.trim()
      : 'Rival misterioso';
  const timestamp =
    typeof candidate.timestamp === 'number' && Number.isFinite(candidate.timestamp)
      ? candidate.timestamp
      : Date.now();

  const report = /** @type {MatchDayReport} */ (clonedReport);
  report.updatedClub = normaliseClub(/** @type {ClubState} */ (report.updatedClub));

  const decisionOutcome = isObject(candidate.decisionOutcome)
    ? cloneValue(candidate.decisionOutcome)
    : undefined;
  const metadata = isObject(candidate.metadata) ? cloneValue(candidate.metadata) : {};

  return {
    id: idCandidate,
    season: Math.max(1, seasonCandidate),
    matchday: Math.max(1, matchdayCandidate),
    opponent,
    report,
    decisionOutcome,
    metadata,
    timestamp,
  };
}

/**
 * Prepara un blob serializable limpiando semillas y referencias inconsistentes.
 * @param {SavedGameBlob} blob
 */
function normaliseBlob(blob) {
  const league = normaliseLeague(blob.league);
  const config = { ...blob.config };
  if (config.seed !== undefined && typeof config.seed !== 'string' && typeof config.seed !== 'number') {
    delete config.seed;
  }
  if (config.seed === undefined) {
    config.seed = '';
  }
  if (typeof config.difficultyMultiplier === 'string') {
    const parsed = Number.parseFloat(config.difficultyMultiplier);
    if (Number.isFinite(parsed)) {
      config.difficultyMultiplier = parsed;
    }
  }
  if (typeof config.difficultyMultiplier !== 'number' || !Number.isFinite(config.difficultyMultiplier)) {
    config.difficultyMultiplier = league.difficultyMultiplier ?? resolveLeagueDifficulty(league.difficulty).multiplier;
  }
  const history = Array.isArray(blob.history)
    ? blob.history
        .map((entry) => normaliseHistoryEntry(entry))
        .filter((entry) => entry !== null)
        .map((entry) => /** @type {MatchHistoryEntry} */ (entry))
    : [];
  history.sort((a, b) => b.timestamp - a.timestamp);
  return {
    version: SAVE_VERSION,
    timestamp: typeof blob.timestamp === 'number' ? blob.timestamp : Date.now(),
    club: normaliseClub(blob.club),
    league,
    config,
    transferMarket: Array.isArray(blob.transferMarket) ? blob.transferMarket.map((target) => ({ ...target })) : [],
    history,
  };
}

/**
 * Intenta migrar una partida guardada antigua al formato actual.
 * @param {unknown} maybeBlob Datos procedentes del almacenamiento.
 * @returns {SavedGameBlob | null}
 */
export function migrateSave(maybeBlob) {
  if (!isObject(maybeBlob)) {
    return null;
  }
  const blob = /** @type {Partial<SavedGameBlob>} */ (maybeBlob);
  if (!blob.club || !blob.league || !blob.config) {
    return null;
  }
  const normalised = normaliseBlob({
    version: SAVE_VERSION,
    timestamp: blob.timestamp ?? Date.now(),
    club: blob.club,
    league: blob.league,
    config: blob.config,
    transferMarket: blob.transferMarket ?? [],
    history: blob.history ?? [],
  });
  return normalised;
}

/**
 * Serializa el estado del juego listo para persistir.
 * @param {{ club: ClubState; league: LeagueState; config: MatchConfig; transferMarket: TransferTarget[]; history?: MatchHistoryEntry[] }} state
 */
export function serializeState(state) {
  const payload = normaliseBlob({
    version: SAVE_VERSION,
    timestamp: Date.now(),
    club: state.club,
    league: state.league,
    config: state.config,
    transferMarket: state.transferMarket,
    history: state.history ?? [],
  });
  return payload;
}

/**
 * Obtiene una instancia de `localStorage` disponible en entorno navegador o tests.
 */
function getDefaultStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && /** @type {any} */ (globalThis).localStorage) {
    return /** @type {Storage} */ (/** @type {any} */ (globalThis).localStorage);
  }
  return undefined;
}

/**
 * Persiste el blob proporcionado en la clave estándar del simulador.
 * @param {SavedGameBlob} payload
 * @param {Storage} storage
 */
function persistPayload(payload, storage) {
  storage.setItem(SAVE_KEY, JSON.stringify(payload));
}

/**
 * Guarda el estado actual en LocalStorage.
 * @param {{ club: ClubState; league: LeagueState; config: MatchConfig; transferMarket: TransferTarget[]; history?: MatchHistoryEntry[] }} state
 * @param {Storage=} storage
 */
export function saveGame(state, storage = getDefaultStorage()) {
  if (!storage) {
    return null;
  }
  const payload = serializeState(state);
  persistPayload(payload, storage);
  return payload;
}

/**
 * Recupera el estado almacenado, aplicando migraciones si es necesario.
 * @param {Storage=} storage
 */
export function loadSavedGame(storage = getDefaultStorage()) {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    const migrated = migrateSave(parsed);
    return migrated;
  } catch (error) {
    console.warn('No se pudo leer la partida guardada:', error);
    return null;
  }
}

/**
 * Elimina la partida guardada.
 * @param {Storage=} storage
 */
export function clearSavedGame(storage = getDefaultStorage()) {
  if (!storage) {
    return;
  }
  storage.removeItem(SAVE_KEY);
}
