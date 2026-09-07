// Zentrale Liga-Liste – globaler Liga-State in App.js (localStorage 'sn_league')
// source: 'openligadb' = OpenLigaDB (bl1/bl2/fbl1/bbl), 'apifootball' = API-Football (Key nötig),
//         'espn' = ESPN Public API (keyless; NBA, ATP, WTA)
export const SPORTS = [
  { id: 'football',   label: '⚽ Fußball'   },
  { id: 'basketball', label: '🏀 Basketball' },
  { id: 'tennis',     label: '🎾 Tennis'    },
];

export const LEAGUES = [
  { id: 'bl1',             label: '1. Bundesliga',     sport: 'football',   source: 'openligadb' },
  { id: 'bl2',             label: '2. Bundesliga',     sport: 'football',   source: 'openligadb' },
  { id: 'fbl1',            label: 'Frauen-Bundesliga', sport: 'football',   source: 'openligadb' },
  { id: 'champions-league', label: 'Champions League',  sport: 'football',   source: 'apifootball' },
  { id: 'premier-league',  label: 'Premier League',    sport: 'football',   source: 'apifootball' },
  { id: 'la-liga',         label: 'La Liga',           sport: 'football',   source: 'apifootball' },
  { id: 'nba',             label: 'NBA',               sport: 'basketball', source: 'espn' },
  { id: 'bbl',             label: 'Basketball-Bundesliga', sport: 'basketball', source: 'openligadb' },
  { id: 'atp',             label: 'ATP Tour',          sport: 'tennis',     source: 'espn' },
  { id: 'wta',             label: 'WTA Tour',          sport: 'tennis',     source: 'espn' },
];

export const leagueLabel = (id) => LEAGUES.find(l => l.id === id)?.label || id;

export const leagueSource = (id) => LEAGUES.find(l => l.id === id)?.source || 'openligadb';

export const leagueSport = (id) => LEAGUES.find(l => l.id === id)?.sport || 'football';

export const leaguesForSport = (sport) => LEAGUES.filter(l => l.sport === sport);

export const defaultLeagueForSport = (sport) => (leaguesForSport(sport)[0]?.id) || 'bl1';

// Per-Sport-Akzentfarbe („Eigene Farbthemes“): Fußball nutzt das gewählte Theme,
// Basketball/ Tennis bekommen einen eigenen nav/interaction-Farbton.
export const sportColor = (sport) => {
  if (sport === 'basketball') return '#f97316';
  if (sport === 'tennis')     return '#4ade80';
  return null; // football → Theme bleibt maßgeblich
};

// Saison-Label dynamisch aus dem aktuellen Jahr (passt zum Backend-Default
// `SEASON = BL_SEASON || aktuelles Jahr`), z.B. 2026 → „2026/27“.
export const seasonLabel = () => {
  const y = new Date().getFullYear();
  return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
};

export const seasonFile = () => {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
};
