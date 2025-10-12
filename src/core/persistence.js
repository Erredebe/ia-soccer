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
} from './data.js';

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').LeagueState} LeagueState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').SavedGameBlob} SavedGameBlob */
/** @typedef {import('../types.js').TransferTarget} TransferTarget */

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'ia-soccer-manager-state';

/**
 * Comprueba si el valor recibido es un objeto no nulo.
 * @param {unknown} value
 */
function isObject(value) {
  return typeof value === 'object' && value !== null;
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
  return {
    ...club,
    name,
    stadiumName,
    city,
    primaryColor,
    secondaryColor,
    logoUrl,
    squad: Array.isArray(club.squad) ? club.squad.map((player) => normalisePlayer(player)) : [],
    seasonStats,
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
  return {
    version: SAVE_VERSION,
    timestamp: typeof blob.timestamp === 'number' ? blob.timestamp : Date.now(),
    club: normaliseClub(blob.club),
    league,
    config,
    transferMarket: Array.isArray(blob.transferMarket) ? blob.transferMarket.map((target) => ({ ...target })) : [],
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
  });
  return normalised;
}

/**
 * Serializa el estado del juego listo para persistir.
 * @param {{ club: ClubState; league: LeagueState; config: MatchConfig; transferMarket: TransferTarget[] }} state
 */
export function serializeState(state) {
  const payload = normaliseBlob({
    version: SAVE_VERSION,
    timestamp: Date.now(),
    club: state.club,
    league: state.league,
    config: state.config,
    transferMarket: state.transferMarket,
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
 * @param {{ club: ClubState; league: LeagueState; config: MatchConfig; transferMarket: TransferTarget[] }} state
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
