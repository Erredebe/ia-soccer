// @ts-check
/**
 * Generador de visualizaciones 2D simplificadas para el motor de partidos.
 * Calcula posiciones normalizadas para representar el terreno en una pizarra
 * retro con elementos interactivos y captura instantáneas por evento relevante.
 * @module core/visualization
 */

/** @typedef {import('../types.js').Player} Player */
/** @typedef {import('../types.js').MatchEvent} MatchEvent */
/** @typedef {import('../types.js').Match2DVisualization} Match2DVisualization */
/** @typedef {import('../types.js').Match2DFrame} Match2DFrame */

const PITCH_WIDTH = 21;
const PITCH_HEIGHT = 11;

/**
 * Determina la prioridad para ordenar jugadores por línea según su demarcación.
 * @param {Player} player
 */
function positionWeight(player) {
  switch (player.position) {
    case 'GK':
      return 0;
    case 'DEF':
      return 1;
    case 'MID':
      return 2;
    case 'FWD':
      return 3;
    default:
      return 4;
  }
}

/**
 * Interpreta una cadena de formación clásica (4-4-2, 3-5-2...).
 * Devuelve un arreglo con el número de jugadores por línea, excluyendo al portero.
 * @param {string | undefined} formation
 */
function parseFormation(formation) {
  if (typeof formation !== 'string' || formation.trim().length === 0) {
    return [4, 4, 2];
  }
  const parts = formation
    .split(/[-–]/)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (parts.length === 0) {
    return [4, 4, 2];
  }
  const total = parts.reduce((sum, value) => sum + value, 0);
  if (total !== 10) {
    return [4, 4, 2];
  }
  return parts;
}

/**
 * Calcula la posición inicial para cada jugador del once titular.
 * @param {Player[]} lineup Once titular original.
 * @param {string | undefined} formation Dibujo táctico solicitado.
 */
function layoutInitialPlayers(lineup, formation) {
  const playableWidth = PITCH_WIDTH - 2;
  const playableHeight = PITCH_HEIGHT - 2;
  const gk = lineup.find((player) => player.position === 'GK') ?? lineup[0];
  const outfieldPlayers = lineup.filter((player) => player.id !== gk.id);
  const sorted = outfieldPlayers.sort((a, b) => positionWeight(a) - positionWeight(b));
  const lines = parseFormation(formation);

  /** @type {Map<string, { x: number; y: number; role: 'GK' | 'OUT' }>} */
  const coordinates = new Map();
  const keeperY = Math.max(1, Math.min(PITCH_HEIGHT - 2, Math.round(PITCH_HEIGHT / 2)));
  coordinates.set(gk.id, { x: 1, y: keeperY, role: 'GK' });

  let index = 0;
  const horizontalStep = playableWidth / (lines.length + 1);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const count = lines[lineIndex];
    const linePlayers = sorted.slice(index, index + count);
    index += count;
    const column = Math.max(1, Math.min(PITCH_WIDTH - 2, Math.round(1 + horizontalStep * (lineIndex + 1))));
    if (linePlayers.length === 0) {
      continue;
    }
    const verticalStep = playableHeight / (linePlayers.length + 1);
    for (let playerIndex = 0; playerIndex < linePlayers.length; playerIndex += 1) {
      const player = linePlayers[playerIndex];
      const rawY = Math.round(verticalStep * (playerIndex + 1));
      const y = Math.max(1, Math.min(PITCH_HEIGHT - 2, rawY));
      coordinates.set(player.id, { x: column, y, role: 'OUT' });
    }
  }

  // Si quedan jugadores sin asignar (formación extraña), colócalos en la última línea.
  if (index < sorted.length) {
    const remaining = sorted.slice(index);
    const column = Math.max(1, Math.min(PITCH_WIDTH - 2, Math.round(1 + horizontalStep * lines.length)));
    const verticalStep = playableHeight / (remaining.length + 1);
    for (let playerIndex = 0; playerIndex < remaining.length; playerIndex += 1) {
      const player = remaining[playerIndex];
      const rawY = Math.round(verticalStep * (playerIndex + 1));
      const y = Math.max(1, Math.min(PITCH_HEIGHT - 2, rawY));
      coordinates.set(player.id, { x: column, y, role: 'OUT' });
    }
  }

  return coordinates;
}

/**
 * Genera la plantilla genérica del rival reflejando nuestra disposición.
 * @param {Map<string, { x: number; y: number; role: 'GK' | 'OUT' }>} homeLayout
 */
function createOpponentLayout(homeLayout) {
  /** @type {Array<{ id: string; name: string; team: 'rival'; role: 'GK' | 'OUT'; x: number; y: number }>} */
  const opponent = [];
  const entries = Array.from(homeLayout.entries());
  const keeperEntry = entries.find(([, value]) => value.role === 'GK');
  if (keeperEntry) {
    const [, value] = keeperEntry;
    opponent.push({ id: 'R1', name: 'Meta rival', team: 'rival', role: 'GK', x: PITCH_WIDTH - 2, y: value.y });
  }
  let index = opponent.length + 1;
  for (const [, value] of entries) {
    if (value.role === 'GK') {
      continue;
    }
    opponent.push({
      id: `R${index}`,
      name: `Rival ${index - 1}`,
      team: 'rival',
      role: 'OUT',
      x: Math.max(1, Math.min(PITCH_WIDTH - 2, PITCH_WIDTH - 1 - value.x)),
      y: Math.max(1, Math.min(PITCH_HEIGHT - 2, value.y)),
    });
    index += 1;
  }
  return opponent;
}

function normaliseCoordinate(value, limit) {
  const playableLimit = Math.max(1, limit - 2);
  const clamped = Math.max(1, Math.min(limit - 2, value));
  if (playableLimit <= 1) {
    return { value: clamped, percent: 50 };
  }
  const percent = ((clamped - 1) / (playableLimit - 1)) * 100;
  return { value: clamped, percent };
}

/**
 * Calcula la posición destacada del balón en función del tipo de evento.
 * @param {MatchEvent} event Evento registrado durante el partido.
 * @param {Map<string, { x: number; y: number; role: 'GK' | 'OUT' }>} coordinates
 * @param {{ x: number; y: number; possession: 'us' | 'rival' | 'neutral' }} previousBall
 */
function ballFromEvent(event, coordinates, previousBall) {
  const defaultBall = { ...previousBall };
  switch (event.type) {
    case 'gol':
    case 'penalti':
    case 'penalti_fallado':
    case 'atajada':
    case 'ocasión': {
      const reference = event.playerId ? coordinates.get(event.playerId) : undefined;
      return {
        x: reference ? Math.min(PITCH_WIDTH - 2, reference.x + 3) : PITCH_WIDTH - 3,
        y: reference ? reference.y : previousBall.y,
        possession: 'us',
      };
    }
    case 'gol_en_contra':
    case 'penalti_en_contra':
    case 'ocasión_rival': {
      return {
        x: 2,
        y: previousBall.y,
        possession: 'rival',
      };
    }
    case 'atajada_portero':
    case 'penalti_atrapado': {
      const keeper = Array.from(coordinates.entries()).find(([, value]) => value.role === 'GK');
      return {
        x: keeper ? keeper[1].x : 2,
        y: keeper ? keeper[1].y : Math.floor(PITCH_HEIGHT / 2),
        possession: 'us',
      };
    }
    case 'cambio':
    case 'lesion':
    case 'tarjeta':
    case 'doble_amarilla':
    case 'expulsion': {
      const reference = event.relatedPlayerId && coordinates.get(event.relatedPlayerId);
      const player = event.playerId ? coordinates.get(event.playerId) : undefined;
      const spot = player ?? reference;
      return {
        x: spot ? spot.x : previousBall.x,
        y: spot ? spot.y : previousBall.y,
        possession: 'neutral',
      };
    }
    case 'tarjeta_rival':
    case 'expulsion_rival':
      return {
        x: Math.floor(PITCH_WIDTH / 2),
        y: Math.floor(PITCH_HEIGHT / 2),
        possession: 'neutral',
      };
    default:
      return defaultBall;
  }
}

/**
 * Actualiza el mapa de coordenadas cuando entra o sale un jugador.
 * @param {MatchEvent} event
 * @param {Map<string, { x: number; y: number; role: 'GK' | 'OUT' }>} coordinates
 * @param {Map<string, Player>} playerMap
 */
function updateCoordinatesFromEvent(event, coordinates, playerMap) {
  if (event.type === 'cambio' && event.playerId) {
    const outgoing = event.relatedPlayerId ? coordinates.get(event.relatedPlayerId) : undefined;
    const incomingPlayer = playerMap.get(event.playerId);
    if (incomingPlayer) {
      const keeper = incomingPlayer.position === 'GK';
      const fallback = keeper
        ? { x: 1, y: Math.floor(PITCH_HEIGHT / 2), role: 'GK' }
        : { x: Math.floor(PITCH_WIDTH / 2), y: Math.floor(PITCH_HEIGHT / 2), role: 'OUT' };
      const target = outgoing ?? fallback;
      coordinates.set(event.playerId, {
        x: target.x,
        y: target.y,
        role: keeper ? 'GK' : 'OUT',
      });
    }
    if (event.relatedPlayerId) {
      coordinates.delete(event.relatedPlayerId);
    }
  }
  if ((event.type === 'expulsion' || event.type === 'doble_amarilla' || event.type === 'lesion') && event.playerId) {
    coordinates.delete(event.playerId);
  }
}

/**
 * Crea el frame con instantánea visual, incluyendo duplicación defensiva de rivales.
 * @param {number} minute
 * @param {string} label
 * @param {{ x: number; y: number; possession: 'us' | 'rival' | 'neutral' }} ball
 * @param {Map<string, { x: number; y: number; role: 'GK' | 'OUT' }>} home
 * @param {Array<{ id: string; name: string; team: 'rival'; role: 'GK' | 'OUT'; x: number; y: number }>} opponentBase
 */
function createFrame(minute, label, ball, home, opponentBase, playerMap) {
  /** @type {Match2DPlayer[]} */
  const players = [];
  for (const [playerId, value] of home.entries()) {
    const info = playerMap.get(playerId);
    const x = normaliseCoordinate(value.x, PITCH_WIDTH);
    const y = normaliseCoordinate(value.y, PITCH_HEIGHT);
    players.push({
      id: playerId,
      name: info?.name ?? playerId,
      team: 'us',
      role: value.role,
      x: x.value,
      y: y.value,
      xPercent: x.percent,
      yPercent: y.percent,
    });
  }
  for (const opponentPlayer of opponentBase) {
    const x = normaliseCoordinate(opponentPlayer.x, PITCH_WIDTH);
    const y = normaliseCoordinate(opponentPlayer.y, PITCH_HEIGHT);
    players.push({
      id: opponentPlayer.id,
      name: opponentPlayer.name,
      team: 'rival',
      role: opponentPlayer.role,
      x: x.value,
      y: y.value,
      xPercent: x.percent,
      yPercent: y.percent,
    });
  }
  const normalisedBallX = normaliseCoordinate(ball.x, PITCH_WIDTH);
  const normalisedBallY = normaliseCoordinate(ball.y, PITCH_HEIGHT);
  const enhancedBall = {
    x: normalisedBallX.value,
    y: normalisedBallY.value,
    possession: ball.possession,
    xPercent: normalisedBallX.percent,
    yPercent: normalisedBallY.percent,
  };
  return {
    minute,
    label,
    ball: enhancedBall,
    players,
  };
}

/**
 * Construye la visualización 2D a partir de la cronología del partido.
 * @param {{
 *   events: MatchEvent[];
 *   lineup: Player[];
 *   playerMap: Map<string, Player>;
 *   formation: string | undefined;
 * }} input
 * @returns {Match2DVisualization}
 */
export function buildMatchVisualization2D({ events, lineup, playerMap, formation }) {
  const coordinates = layoutInitialPlayers(lineup, formation);
  const opponent = createOpponentLayout(coordinates);

  /** @type {Match2DFrame[]} */
  const frames = [];
  let ball = { x: Math.floor(PITCH_WIDTH / 2), y: Math.floor(PITCH_HEIGHT / 2), possession: 'neutral' };

  frames.push(
    createFrame(0, 'Pitido inicial y orden sobre el tablero.', ball, coordinates, opponent, playerMap)
  );

  for (const event of events) {
    const snapshot = new Map(coordinates);
    const updatedBall = ballFromEvent(event, snapshot, ball);
    updateCoordinatesFromEvent(event, coordinates, playerMap);
    frames.push(createFrame(event.minute, event.description, updatedBall, coordinates, opponent, playerMap));
    ball = updatedBall;
  }

  return {
    dimensions: { width: PITCH_WIDTH, height: PITCH_HEIGHT },
    legend: [
      'Círculo azul: Jugador local (anillo dorado si es portero).',
      'Círculo ámbar: Jugador rival.',
      'Punto brillante: Balón (cambia de color según la posesión).',
    ],
    frames,
  };
}
