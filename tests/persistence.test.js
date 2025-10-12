// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefaultMatchConfig,
  createExampleClub,
  createExampleLeague,
  createExampleTransferMarket,
  TOTAL_MATCHDAYS,
} from '../src/core/data.js';
import { migrateSave, serializeState, SAVE_VERSION } from '../src/core/persistence.js';

test('serializeState normaliza disponibilidad y estadísticas', () => {
  const club = createExampleClub();
  club.squad[0].availability = { injuryMatches: 2, suspensionMatches: 1 };
  club.seasonStats.matches = 3;
  const league = createExampleLeague(club.name);
  const config = createDefaultMatchConfig();
  config.seed = 'debug-seed-42';
  const transferMarket = createExampleTransferMarket(club);

  const payload = serializeState({ club, league, config, transferMarket });
  assert.equal(payload.version, SAVE_VERSION);
  assert.equal(payload.club.squad[0].availability.injuryMatches, 2);
  assert.ok(payload.club.seasonStats);
  assert.equal(payload.config.seed, 'debug-seed-42');
  assert.equal(payload.club.primaryColor, club.primaryColor);
  assert.equal(payload.club.secondaryColor, club.secondaryColor);
  assert.equal(payload.club.logoUrl, club.logoUrl);
  assert.equal(Array.isArray(payload.league.rivals), true);
  assert.equal(payload.league.rivals.length, TOTAL_MATCHDAYS / 2);
});

test('migrateSave rellena valores faltantes en partidas antiguas', () => {
  const club = createExampleClub();
  const league = createExampleLeague(club.name);
  const config = createDefaultMatchConfig();
  const transferMarket = createExampleTransferMarket(club);
  const base = serializeState({ club, league, config, transferMarket });
  const legacy = JSON.parse(JSON.stringify(base));
  delete legacy.version;
  delete legacy.club.seasonStats;
  delete legacy.club.squad[0].availability;
  delete legacy.club.primaryColor;
  delete legacy.club.secondaryColor;
  delete legacy.club.logoUrl;
  const migrated = migrateSave(legacy);
  assert.ok(migrated);
  assert.equal(migrated?.version, SAVE_VERSION);
  assert.deepEqual(migrated?.club.squad[0].availability, { injuryMatches: 0, suspensionMatches: 0 });
  assert.ok(migrated?.club.seasonStats);
  assert.equal(typeof migrated?.config.seed, 'string');
  assert.equal(migrated?.club.primaryColor, club.primaryColor);
  assert.equal(migrated?.club.secondaryColor, club.secondaryColor);
  assert.equal(migrated?.club.logoUrl, club.logoUrl);
  assert.equal(Array.isArray(migrated?.league.rivals), true);
  assert.equal(migrated?.league.rivals?.length, TOTAL_MATCHDAYS / 2);
});
