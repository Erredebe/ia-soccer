// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import { createExampleClub } from '../src/core/data.js';

test('createExampleClub acepta identidad personalizada', () => {
  const club = createExampleClub({
    name: 'Club de Prueba',
    stadiumName: 'Estadio Demo',
    city: 'Vallekas',
  });

  assert.equal(club.name, 'Club de Prueba');
  assert.equal(club.city, 'Vallekas');
  assert.equal(club.stadiumName, 'Estadio Demo');
  assert.equal(club.league.name, 'Liga Canalla de Vallekas');
  const sponsorNames = (club.sponsors ?? []).map((sponsor) => sponsor.name);
  assert.ok(
    sponsorNames.includes('Estadio Demo Tours'),
    'Los patrocinadores se adaptan al estadio personalizado'
  );
  assert.ok(
    sponsorNames.some((name) => name.includes('Vallekas')),
    'Los patrocinadores reflejan la ciudad personalizada'
  );
});
