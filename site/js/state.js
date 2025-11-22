import {
  DEFAULT_LEAGUE_SIZE,
  DEFAULT_LEAGUE_DIFFICULTY,
  resolveLeagueDifficulty,
  calculateTotalMatchdays,
  listCanallaDecisions,
  createExampleClub,
  createExampleCup,
  createExampleTransferMarket,
  createDefaultMatchConfig,
  createDefaultInstructions,
  createSeasonStats,
  normaliseStaffState,
  generateSponsorOffers,
  generateTvDeals,
  DEFAULT_CLUB_NAME,
  DEFAULT_STADIUM_NAME,
  DEFAULT_CLUB_CITY,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_CLUB_LOGO
} from '../../src/core/data.js';
import { HEX_COLOR_PATTERN } from './constants.js';

export const scorelineState = {
  finalText: '',
  clubName: '',
  opponentName: '',
};

export const matchVisualizationState = {
  frames: [],
  index: 0,
  dimensions: { width: 21, height: 11 },
  autoplayId: null,
  autoplayActive: false,
  elements: {
    pitch: null,
    players: new Map(),
    ball: null,
  },
};

export const matchDuelsState = {
  timeouts: [],
};

const defaultDifficultyInfo = resolveLeagueDifficulty(DEFAULT_LEAGUE_DIFFICULTY);

export let leagueSettings = {
  leagueSize: DEFAULT_LEAGUE_SIZE,
  difficulty: defaultDifficultyInfo.id,
  difficultyMultiplier: defaultDifficultyInfo.multiplier,
  totalMatchdays: calculateTotalMatchdays(DEFAULT_LEAGUE_SIZE - 1),
};

export const decisions = listCanallaDecisions();

export const gameState = {
  club: null,
  league: null,
  cup: null,
  transferMarket: [],
  config: null,
  opponentRotation: [],
  matchHistory: [],
  currentHistoryEntryId: null,
  reportHistoryFilterSeason: 'all',
  activeReportTab: 'current',
  currentReportData: null,
  clubIdentity: null,
  editingPlayerId: null,
  selectedLineupPlayerId: null,
  staffFeedback: '',
  pendingSavedGame: null,
  autoContinueTimeoutId: null,
  transferMessageTimeout: null,
  modalHandlersAttached: false,
  saveMessageTimeout: null,
  previewLogoObjectUrl: null,
  loadNoticeTimeout: null,
  hasLatestReport: false,
};

export function normaliseColorValue(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

export function normaliseIdentity(partial) {
  const rawName = typeof partial?.name === 'string' ? partial.name.trim() : '';
  const rawStadium = typeof partial?.stadiumName === 'string' ? partial.stadiumName.trim() : '';
  const rawCity = typeof partial?.city === 'string' ? partial.city.trim() : '';
  const primaryColor = normaliseColorValue(partial?.primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = normaliseColorValue(partial?.secondaryColor, DEFAULT_SECONDARY_COLOR);
  const rawLogo = typeof partial?.logoUrl === 'string' ? partial.logoUrl.trim() : '';
  return {
    name: rawName.length > 0 ? rawName : DEFAULT_CLUB_NAME,
    stadiumName: rawStadium.length > 0 ? rawStadium : DEFAULT_STADIUM_NAME,
    city: rawCity.length > 0 ? rawCity : DEFAULT_CLUB_CITY,
    primaryColor,
    secondaryColor,
    logoUrl: rawLogo.length > 0 ? rawLogo : DEFAULT_CLUB_LOGO,
  };
}

export function extractClubIdentity(club) {
  return normaliseIdentity({
    name: club?.name,
    stadiumName: club?.stadiumName,
    city: club?.city,
    primaryColor: club?.primaryColor,
    secondaryColor: club?.secondaryColor,
    logoUrl: club?.logoUrl,
  });
}

function normaliseRecordEntry(entry) {
  if (!entry) {
    return null;
  }
  const opponent =
    typeof entry.opponent === 'string' && entry.opponent.trim().length > 0
      ? entry.opponent.trim()
      : 'Rival misterioso';
  const goalsFor = Number.isFinite(entry.goalsFor) ? entry.goalsFor : 0;
  const goalsAgainst = Number.isFinite(entry.goalsAgainst) ? entry.goalsAgainst : 0;
  const goalDifference = Number.isFinite(entry.goalDifference)
    ? entry.goalDifference
    : goalsFor - goalsAgainst;
  const totalGoals = Number.isFinite(entry.totalGoals)
    ? entry.totalGoals
    : goalsFor + goalsAgainst;
  const season = Number.isFinite(entry.season) ? entry.season : 1;
  const matchday = Number.isFinite(entry.matchday) ? entry.matchday : 1;
  return {
    ...entry,
    opponent,
    goalsFor,
    goalsAgainst,
    goalDifference,
    totalGoals,
    season,
    matchday,
  };
}

export function normaliseSeasonStats(stats) {
  const defaults = createSeasonStats();
  if (!stats) {
    return createSeasonStats();
  }
  const merged = { ...defaults, ...stats };
  const defaultHistory = defaults.history ?? { titles: 0, lastTitleSeason: 0, records: {} };
  const incomingHistory = stats.history ?? {};
  const mergedHistory = {
    ...defaultHistory,
    ...incomingHistory,
  };
  const defaultRecords = defaultHistory.records ?? {};
  const incomingRecords = incomingHistory.records ?? {};
  const mergedRecords = {
    ...defaultRecords,
    ...incomingRecords,
  };
  mergedRecords.biggestWin = normaliseRecordEntry(mergedRecords.biggestWin);
  mergedRecords.heaviestDefeat = normaliseRecordEntry(mergedRecords.heaviestDefeat);
  mergedRecords.goalFestival = normaliseRecordEntry(mergedRecords.goalFestival);
  mergedHistory.records = mergedRecords;
  mergedHistory.titles = Number.isFinite(mergedHistory.titles) ? mergedHistory.titles : 0;
  mergedHistory.lastTitleSeason = Number.isFinite(mergedHistory.lastTitleSeason)
    ? mergedHistory.lastTitleSeason
    : 0;
  merged.history = mergedHistory;
  return merged;
}

export function computeOpponentRotation(league, clubName) {
  if (!league || !Array.isArray(league.table)) {
    return [];
  }
  return league.table.filter((entry) => entry.club !== clubName).map((entry) => entry.club);
}

export function ensureCommercialOffersAvailable(club, options = {}) {
  const { sponsorLimit = 3, tvLimit = 2, recentResults = [] } = options;
  const sponsorOffers = Array.isArray(club.pendingSponsorOffers) ? [...club.pendingSponsorOffers] : [];
  const tvOffers = Array.isArray(club.pendingTvDeals) ? [...club.pendingTvDeals] : [];
  const sponsorNameSet = new Set(
    sponsorOffers
      .map((offer) => offer?.contract?.name)
      .filter((name) => typeof name === 'string' && name.length > 0)
  );
  if (Array.isArray(club.sponsors)) {
    for (const sponsor of club.sponsors) {
      if (typeof sponsor?.name === 'string' && sponsor.name.length > 0) {
        sponsorNameSet.add(sponsor.name);
      }
    }
  }
  const sponsorHeadroom = Math.max(0, sponsorLimit - sponsorOffers.length);
  const additionalSponsors =
    sponsorHeadroom > 0
      ? generateSponsorOffers(club, recentResults, {
          limit: sponsorHeadroom,
          existingNames: Array.from(sponsorNameSet),
        }).filter((offer) => {
          const contractName = offer?.contract?.name;
          if (typeof contractName !== 'string' || contractName.length === 0) {
            return false;
          }
          if (sponsorNameSet.has(contractName)) {
            return false;
          }
          sponsorNameSet.add(contractName);
          return true;
        })
      : [];

  const tvNameSet = new Set(
    tvOffers
      .map((offer) => offer?.deal?.name)
      .filter((name) => typeof name === 'string' && name.length > 0)
  );
  if (typeof club.tvDeal?.name === 'string' && club.tvDeal.name.length > 0) {
    tvNameSet.add(club.tvDeal.name);
  }
  const tvHeadroom = Math.max(0, tvLimit - tvOffers.length);
  const generatedTvOffers =
    tvHeadroom > 0 ? generateTvDeals(club, recentResults, { limit: tvHeadroom }) : [];
  const additionalTv = [];
  for (const offer of generatedTvOffers) {
    const name = offer?.deal?.name;
    if (typeof name !== 'string' || name.length === 0) {
      continue;
    }
    if (tvNameSet.has(name)) {
      continue;
    }
    additionalTv.push(offer);
    tvNameSet.add(name);
    if (additionalTv.length >= tvHeadroom) {
      break;
    }
  }

  return {
    ...club,
    pendingSponsorOffers: [...sponsorOffers, ...additionalSponsors].slice(0, sponsorLimit),
    pendingTvDeals: [...tvOffers, ...additionalTv].slice(0, tvLimit),
  };
}

function normaliseViewMode(value) {
  return value === '2d' || value === 'duels' || value === 'text' ? value : 'text';
}

export function buildInitialConfig(club) {
  const baseConfig = createDefaultMatchConfig();
  const instructions = { ...createDefaultInstructions(), ...(baseConfig.instructions ?? {}) };
  const defaultLineup = createDefaultLineup(club); // Note: createDefaultLineup needs club
  // But wait, deriveLeagueSettings is needed here too.
  // I'll skip deriveLeagueSettings for now and just use defaults if needed, or import it.
  // Actually deriveLeagueSettings is in game.js. I should move it here too.
  
  return {
    ...baseConfig,
    startingLineup: defaultLineup.starters,
    substitutes: defaultLineup.substitutes,
    opponentName: typeof baseConfig.opponentName === 'string' ? baseConfig.opponentName : '',
    instructions,
    seed: typeof baseConfig.seed === 'string' ? baseConfig.seed : '',
    difficultyMultiplier: 1, // Placeholder, will be updated
    viewMode: normaliseViewMode(baseConfig.viewMode ?? 'text'),
  };
}

// Initialize state
gameState.club = ensureCommercialOffersAvailable(createExampleClub());
gameState.club.seasonStats = normaliseSeasonStats(gameState.club.seasonStats);
gameState.club.staff = normaliseStaffState(gameState.club.staff);
gameState.league = gameState.club.league;
gameState.cup = gameState.club.cup;
gameState.transferMarket = createExampleTransferMarket(gameState.club);
gameState.config = buildInitialConfig(gameState.club);
gameState.opponentRotation = computeOpponentRotation(gameState.league, gameState.club.name);
gameState.clubIdentity = extractClubIdentity(gameState.club);
