// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createExampleClub,
  DEFAULT_CLUB_LOGO,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from '../src/core/data.js';

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
  assert.equal(club.primaryColor, DEFAULT_PRIMARY_COLOR);
  assert.equal(club.secondaryColor, DEFAULT_SECONDARY_COLOR);
  assert.equal(club.logoUrl, DEFAULT_CLUB_LOGO);
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
