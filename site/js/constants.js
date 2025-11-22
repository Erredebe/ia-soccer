export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const GOAL_EVENT_TYPES = new Set(['gol', 'penalti', 'gol_en_contra', 'penalti_en_contra']);

export const TIMELINE_EVENT_META = {
  gol: {
    iconId: 'icon-goal',
    label: 'Gol a favor',
    className: 'timeline-event--goal',
    highlight: true,
  },
  penalti: {
    iconId: 'icon-penalty',
    label: 'Penalti convertido',
    className: 'timeline-event--penalty',
    highlight: true,
  },
  gol_en_contra: {
    iconId: 'icon-goal',
    label: 'Gol encajado',
    className: 'timeline-event--goal-against',
    highlight: true,
  },
  penalti_en_contra: {
    iconId: 'icon-penalty',
    label: 'Penalti encajado',
    className: 'timeline-event--penalty-against',
    highlight: true,
  },
  penalti_fallado: {
    iconId: 'icon-penalty',
    label: 'Penalti fallado',
    className: 'timeline-event--penalty-missed',
  },
  penalti_atrapado: {
    iconId: 'icon-penalty',
    label: 'Penalti detenido',
    className: 'timeline-event--penalty-save',
  },
  tarjeta: {
    iconId: 'icon-yellow-card',
    label: 'Tarjeta amarilla',
    className: 'timeline-event--yellow-card',
    highlight: true,
  },
  tarjeta_rival: {
    iconId: 'icon-yellow-card',
    label: 'Tarjeta amarilla rival',
    className: 'timeline-event--yellow-card-opponent',
    highlight: true,
  },
  doble_amarilla: {
    iconId: 'icon-red-card',
    label: 'Doble amarilla',
    className: 'timeline-event--red-card',
    highlight: true,
  },
  expulsion: {
    iconId: 'icon-red-card',
    label: 'Expulsión',
    className: 'timeline-event--red-card',
    highlight: true,
  },
  expulsion_rival: {
    iconId: 'icon-red-card',
    label: 'Expulsión rival',
    className: 'timeline-event--red-card-opponent',
    highlight: true,
  },
  lesion: {
    iconId: 'icon-injury',
    label: 'Lesión',
    className: 'timeline-event--injury',
    highlight: true,
  },
  cambio: {
    iconId: 'icon-substitution',
    label: 'Sustitución',
    className: 'timeline-event--substitution',
  },
  atajada: {
    iconId: 'icon-goal',
    label: 'Paradón rival',
    className: 'timeline-event--defensive',
  },
  atajada_portero: {
    iconId: 'icon-goal',
    label: 'Paradón propio',
    className: 'timeline-event--defensive',
  },
  ocasión: {
    iconId: 'icon-goal',
    label: 'Ocasión creada',
    className: 'timeline-event--chance',
  },
  ocasión_rival: {
    iconId: 'icon-goal',
    label: 'Ocasión rival',
    className: 'timeline-event--chance-opponent',
  },
  default: {
    iconId: 'icon-club-shield',
    label: 'Momento destacado',
    className: 'timeline-event--generic',
  },
};

export const decisionLabels = {
  sobornoArbitro: 'Soborno al árbitro',
  filtrarRumor: 'Filtrar rumor',
  fiestaIlegal: 'Fiesta ilegal',
  presionarFederacion: 'Presionar a la federación',
  sobornoJugador: 'Soborno a jugador rival',
  manipularCesped: 'Manipular césped',
  espionajeAnalitico: 'Espionaje analítico',
};

export const instructionText = {
  pressing: {
    low: 'Presión baja',
    medium: 'Presión media',
    high: 'Presión alta',
  },
  tempo: {
    slow: 'Ritmo pausado',
    balanced: 'Ritmo equilibrado',
    fast: 'Ritmo alto',
  },
  width: {
    narrow: 'Juego cerrado',
    balanced: 'Anchura equilibrada',
    wide: 'Ataque por bandas',
  },
};

export const booleanInstructionText = {
  counterAttack: { true: 'Buscar contragolpes', false: 'Sin contraataques' },
  playThroughMiddle: {
    true: 'Construir por dentro',
    false: 'Abrir el juego a las bandas',
  },
};

export const MATCH_VISUALIZATION_TRANSITION_CLASS = 'match-visualization__screen--transition';
export const MATCH_VISUALIZATION_MINUTE_CLASS = 'match-visualization__minute--pulse';
export const MATCH_VISUALIZATION_AUTOPLAY_INTERVAL = 3400;
export const MATCH_DUELS_REVEAL_DELAY = 520;
