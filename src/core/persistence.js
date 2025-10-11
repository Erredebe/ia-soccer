/**
 * Persistencia local para partidas guardadas en el navegador.
 * @module core/persistence
 */

import { createEmptySeasonLog, createSeasonStats } from './data.js';

/** @typedef {import('../types.js').ClubState} ClubState */
/** @typedef {import('../types.js').LeagueState} LeagueState */
/** @typedef {import('../types.js').MatchConfig} MatchConfig */
/** @typedef {import('../types.js').SavedGameBlob} SavedGameBlob */
/** @typedef {import('../types.js').TransferTarget} TransferTarget */

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'ia-soccer-manager-state';

/** @param {unknown} value */
function isObject(value) {
  return typeof value === 'object' && value !== null;
}

/** @param {import('../types.js').Player} player */
function normalisePlayer(player) {
  const availability = {
    injuryMatches: player.availability?.injuryMatches ?? 0,
    suspensionMatches: player.availability?.suspensionMatches ?? 0,
  };
  const seasonLog = {
    ...createEmptySeasonLog(),
    ...(player.seasonLog ?? {}),
  };
  return {
    ...player,
    availability,
    seasonLog,
  };
}

/**
 * @param {ClubState} club
 */
function normaliseClub(club) {
  const seasonStats = {
    ...createSeasonStats(),
    ...(club.seasonStats ?? {}),
  };
  return {
    ...club,
    squad: Array.isArray(club.squad) ? club.squad.map((player) => normalisePlayer(player)) : [],
    seasonStats,
  };
}

/**
 * @param {LeagueState} league
 */
function normaliseLeague(league) {
  return {
    ...league,
    table: Array.isArray(league.table) ? league.table.map((entry) => ({ ...entry })) : [],
  };
}

/**
 * @param {SavedGameBlob} blob
 */
function normaliseBlob(blob) {
  const config = { ...blob.config };
  if (config.seed !== undefined && typeof config.seed !== 'string' && typeof config.seed !== 'number') {
    delete config.seed;
  }
  if (config.seed === undefined) {
    config.seed = '';
  }
  return {
    version: SAVE_VERSION,
    timestamp: typeof blob.timestamp === 'number' ? blob.timestamp : Date.now(),
    club: normaliseClub(blob.club),
    league: normaliseLeague(blob.league),
    config,
    transferMarket: Array.isArray(blob.transferMarket) ? blob.transferMarket.map((target) => ({ ...target })) : [],
  };
}

/**
 * @param {unknown} maybeBlob
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
