// @ts-check
/**
 * Utilidades para gestionar el staff del club.
 * @module core/data/staff
 */

/** @typedef {import('../../types.js').StaffMember} StaffMember */
/** @typedef {import('../../types.js').ClubStaffState} ClubStaffState */
/** @typedef {import('../../types.js').StaffImpact} StaffImpact */

/** @type {readonly StaffMember[]} */
export const STAFF_CATALOG = Object.freeze([
  {
    id: 'staff-maestra-pizarra',
    role: 'coach',
    name: 'Maestra Pizarra',
    description: 'Disena entrenamientos quirurgicos y planifica cambios decisivos.',
    salary: 18000,
    hiringCost: 72000,
    dismissalCost: 12000,
    effects: [
      {
        target: 'morale',
        value: 4,
        frequency: 'match',
        narrative: 'La plantilla celebra la ultima sesion de {{name}}, moral +4.',
      },
      {
        target: 'budget',
        value: -900,
        frequency: 'match',
        narrative: 'Los materiales premium de {{name}} cuestan 900 EUR semanales.',
      },
    ],
  },
  {
    id: 'staff-ojeador-puente',
    role: 'scout',
    name: 'Ojeador Puente',
    description: 'Une los barrios y detecta talento antes que nadie.',
    salary: 9500,
    hiringCost: 38000,
    dismissalCost: 7000,
  effects: [
      {
        target: 'budget',
        value: 800,
        frequency: 'match',
        narrative: 'Los informes de {{name}} traen patrocinadores (+800 EUR).',
      },
      {
        target: 'morale',
        value: 2,
        frequency: 'match',
        narrative: 'Las promesas del barrio llenan de orgullo al vestuario: moral +2.',
      },
    ],
  },
  {
    id: 'staff-fisio-habanera',
    role: 'physio',
    name: 'Fisio Habanera',
    description: 'Masajes tropicales y vendajes avanzados para sanar al instante.',
    salary: 12000,
    hiringCost: 52000,
    dismissalCost: 9000,
    effects: [
      {
        target: 'morale',
        value: 3,
        frequency: 'match',
        narrative: '{{name}} rejuvenece a la plantilla: moral +3.',
      },
      {
        target: 'budget',
        value: -500,
        frequency: 'match',
        narrative: 'Los aceites exoticos de {{name}} cuestan 500 EUR por partido.',
      },
    ],
  },
  {
    id: 'staff-analista-bohemio',
    role: 'analyst',
    name: 'Analista Bohemio',
    description: 'Un genio de los datos que lee el futbol con swing y jazz.',
    salary: 13500,
    hiringCost: 54000,
    dismissalCost: 10000,
    effects: [
      {
        target: 'budget',
        value: -650,
        frequency: 'match',
        narrative: 'Las suscripciones y artilugios de {{name}} restan 650 EUR.',
      },
      {
        target: 'reputation',
        value: 1,
        frequency: 'match',
        narrative: 'La prensa admira las graficas de {{name}}, reputacion +1.',
      },
    ],
  },
  {
    id: 'staff-motivadora-carnaval',
    role: 'motivator',
    name: 'Motivadora Carnaval',
    description: 'Convierte cada charla en un desfile que inflama hasta al mas frio.',
    salary: 8000,
    hiringCost: 32000,
    dismissalCost: 6000,
    effects: [
      {
        target: 'morale',
        value: 5,
        frequency: 'match',
        narrative: 'La charla de {{name}} explota en el vestuario: moral +5.',
      },
      {
        target: 'budget',
        value: -300,
        frequency: 'match',
        narrative: 'La batucada y la purpurina de {{name}} cuestan 300 EUR.',
      },
    ],
  },
  {
    id: 'staff-brujo-tactico',
    role: 'coach',
    name: 'Brujo Tactico',
    description: 'Hechicero de pizarras que transforma alineaciones en conjuros.',
    salary: 16000,
    hiringCost: 64000,
    dismissalCost: 11000,
    effects: [
      {
        target: 'morale',
        value: 2,
        frequency: 'match',
        narrative: 'Los conjuros de {{name}} sorprenden al rival, moral +2.',
      },
      {
        target: 'reputation',
        value: 2,
        frequency: 'match',
        narrative: 'La aficion corea al brujo {{name}}, reputacion +2.',
      },
      {
        target: 'budget',
        value: -750,
        frequency: 'match',
        narrative: 'El incienso tactico de {{name}} cuesta 750 EUR por partido.',
      },
    ],
  },
  {
    id: 'staff-fisio-sonora',
    role: 'physio',
    name: 'Fisio Sonora',
    description: 'Recuperaciones a ritmo de percusion urbana.',
    salary: 11800,
    hiringCost: 47000,
    dismissalCost: 8500,
    effects: [
      {
        target: 'morale',
        value: 2,
        frequency: 'match',
        narrative: 'Los masajes de {{name}} devuelven sonrisas, moral +2.',
      },
      {
        target: 'budget',
        value: -420,
        frequency: 'match',
        narrative: 'Los instrumentos terapeuticos de {{name}} cuestan 420 EUR.',
      },
    ],
  },
  {
    id: 'staff-analista-hacker',
    role: 'analyst',
    name: 'Analista Hacker',
    description: 'Piratea sistemas rivales y entrega informes quirurgicos.',
    salary: 14200,
    hiringCost: 58000,
    dismissalCost: 9000,
    effects: [
      {
        target: 'reputation',
        value: -1,
        frequency: 'match',
        narrative: 'Rumores turbios persiguen a {{name}}, reputacion -1.',
      },
      {
        target: 'budget',
        value: -500,
        frequency: 'match',
        narrative: 'Las VPN clandestinas de {{name}} cuestan 500 EUR.',
      },
      {
        target: 'morale',
        value: 3,
        frequency: 'match',
        narrative: 'Los informes secretos de {{name}} suben la moral +3.',
      },
    ],
  },
  {
    id: 'staff-motivador-poeta',
    role: 'motivator',
    name: 'Motivador Poeta',
    description: 'Recita versos callejeros que avivan el fuego competitivo.',
    salary: 7800,
    hiringCost: 31000,
    dismissalCost: 5000,
    effects: [
      {
        target: 'morale',
        value: 4,
        frequency: 'match',
        narrative: 'Los versos del poeta {{name}} electrifican al equipo: moral +4.',
      },
      {
        target: 'reputation',
        value: 1,
        frequency: 'match',
        narrative: 'La prensa se rinde al recital de {{name}}, reputacion +1.',
      },
    ],
  },
  {
    id: 'staff-maestra-balcon',
    role: 'pressOfficer',
    name: 'Maestra Balcon',
    description: 'Domina balcones y ruedas de prensa con latigo verbal.',
    salary: 10200,
    hiringCost: 41000,
    dismissalCost: 6500,
    effects: [
      {
        target: 'reputation',
        value: 1,
        frequency: 'match',
        narrative: '{{name}} manipula titulares a favor del club, reputacion +1.',
      },
      {
        target: 'budget',
        value: -350,
        frequency: 'match',
        narrative: 'Los cocteles con periodistas de {{name}} cuestan 350 EUR.',
      },
    ],
  },
  {
    id: 'staff-tactico-maton',
    role: 'coach',
    name: 'Tactico Maton',
    description: 'Un viejo perro del fango que endurece cada duelo.',
    salary: 15000,
    hiringCost: 60000,
    dismissalCost: 10000,
    effects: [
      {
        target: 'morale',
        value: 1,
        frequency: 'match',
        narrative: 'Las broncas de {{name}} intimidan al rival, moral +1.',
      },
      {
        target: 'reputation',
        value: -1,
        frequency: 'match',
        narrative: 'El estilo de {{name}} divide a la grada, reputacion -1.',
      },
    ],
  },
  {
    id: 'staff-pr-capote',
    role: 'pressOfficer',
    name: 'Carla Capote',
    description: 'Camina entre microfonos y tapas para maquillar escandalos.',
    salary: 11000,
    hiringCost: 42000,
    dismissalCost: 9000,
    effects: [
      {
        target: 'reputation',
        value: 1,
        frequency: 'match',
        narrative: '{{name}} maneja titulares con mano izquierda: reputacion +1.',
      },
      {
        target: 'budget',
        value: 600,
        frequency: 'match',
        narrative: '{{name}} consigue publirreportajes (+600 EUR).',
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
