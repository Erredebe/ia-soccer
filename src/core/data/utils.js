// @ts-check
/**
 * Utilidades compartidas entre módulos de datos.
 * @module core/data/utils
 */

/** @typedef {import('../../types.js').MatchResult} MatchResult */

export function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function generateOfferId(prefix) {
  const random = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${Date.now().toString(36)}-${random.toString(36)}`;
}

/**
 * Resume el rendimiento reciente del club.
 * @param {MatchResult[]} results
 */
export function summariseRecentPerformance(results) {
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

export function pickLabel(entries, rng) {
  if (entries.length === 0) {
    return '';
  }
  const index = Math.floor((rng?.() ?? Math.random()) * entries.length);
  return entries[Math.max(0, Math.min(entries.length - 1, index))];
}

