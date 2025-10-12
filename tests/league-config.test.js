// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LEAGUE_RIVAL_CATALOG,
  normaliseLeagueRivals,
  selectRandomLeagueRivals,
  shuffleLeagueRivals,
} from '../src/core/data.js';

const compareSorted = (arrayA, arrayB) => {
  assert.deepEqual([...arrayA].sort(), [...arrayB].sort());
};

test('shuffleLeagueRivals devuelve una permutación sin mutar el catálogo', () => {
  const shuffled = shuffleLeagueRivals(LEAGUE_RIVAL_CATALOG, () => 0.42);
  assert.notStrictEqual(shuffled, LEAGUE_RIVAL_CATALOG);
  assert.equal(shuffled.length, LEAGUE_RIVAL_CATALOG.length);
  compareSorted(shuffled, LEAGUE_RIVAL_CATALOG);
});

test('selectRandomLeagueRivals respeta el tamaño solicitado y las exclusiones', () => {
  const catalog = ['A', 'B', 'C', 'D', 'E', 'F'];
  const selection = selectRandomLeagueRivals(5, { catalog, exclude: ['E'], rng: () => 0.8 });
  assert.equal(selection.length, 5);
  assert.ok(!selection.includes('E'));
  assert.equal(new Set(selection).size, selection.length);
});

test('normaliseLeagueRivals mantiene el orden manual y completa con alternativas válidas', () => {
  const manual = [' Club Verbena del Sur ', 'CD Barras Bravas', 'CD Barras Bravas'];
  const result = normaliseLeagueRivals(manual, {
    count: 4,
    catalog: ['Club Verbena del Sur', 'CD Barras Bravas', 'Real Canilla'],
    rng: () => 0.7,
  });
  assert.deepEqual(result, [
    'Club Verbena del Sur',
    'CD Barras Bravas',
    'Real Canilla',
    'Rival invitado 4',
  ]);
});
