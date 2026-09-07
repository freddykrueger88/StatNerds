/**
 * Zentraler API-Service für alle Backend-Calls.
 * Alle fetch()-Aufrufe gehen über dieses Modul – nie direkt in Komponenten.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status} – ${path}`;
    try { const body = await res.json(); if (body?.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ── Health ──────────────────────────────────────────────────────────────────
export const getHealth             = ()                          => request('/health');

// ── Meta ──────────────────────────────────────────────────────────────────
export const getLeagueSeasons      = ()                          => request('/meta/seasons');

// ── Spiele ────────────────────────────────────────────────────────────────
export const getCurrentGames       = (league = 'bl1')            => request(`/games/${league}/current`);
export const getGamesByDay         = (league = 'bl1', matchday)  => request(`/games/${league}/${matchday}`);
export const getMatchdays          = (league = 'bl1')            => request(`/games/${league}/matchdays`);
export const getTable              = (league = 'bl1')            => request(`/games/${league}/table`);
export const getTableSeason        = (league, season)            => request(`/games/${league}/table?season=${season}`);
export const getAvailableSeasons   = (league = 'bl1')            => request(`/games/${league}/seasons`);
export const getTeamWindow         = (league = 'bl1', team)      => request(`/games/${league}/teamwindow?team=${encodeURIComponent(team)}`);
export const getTeamForm           = (league = 'bl1', team)      => request(`/games/${league}/teamform?team=${encodeURIComponent(team)}`);
export const getScorers            = (league = 'bl1', season)     => request(`/games/${league}/scorers${season ? `?season=${season}` : ''}`);
export const getAssists            = (league = 'bl1', season)     => request(`/games/${league}/assists${season ? `?season=${season}` : ''}`);
export const getWeeklySummary      = (leagues, teams, days = 7)  => {
  const q1 = Array.isArray(leagues) && leagues.length ? `league=${encodeURIComponent(leagues.join(','))}` : '';
  const q2 = Array.isArray(teams)   && teams.length   ? `teams=${encodeURIComponent(teams.join(','))}` : '';
  return request(`/weekly/summary?${[q1, q2, `days=${days}`].filter(Boolean).join('&')}`);
};

// ── Benutzerkonto (Issue #15) ──────────────────────────────────────────
const JSON_OPTS = data => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export const authRegister  = (email, password, settings) => request('/auth/register', JSON_OPTS({ email, password, settings }));
export const authLogin     = (email, password, settings) => request('/auth/login',    JSON_OPTS({ email, password, settings }));
export const authMe        = token => request('/auth/me',    { headers: { Authorization: `Bearer ${token}` } });
export const authSync      = (token, settings) => request('/auth/sync', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ settings }),
});
const AUTH_JSON = (token, data) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(data),
});

// ── Tipp-Spiel (Issue #23) ────────────────────────────────────────────────
export const submitPick       = (league, token, pick) => request(`/picks/${league}`, AUTH_JSON(token, pick));
export const getMyPicks       = (league, token)       => request(`/picks/${league}/mine`, { headers: { Authorization: `Bearer ${token}` } });
export const getPickRanking   = (league, users)       => request(`/picks/${league}/ranking${users?.length ? `?users=${encodeURIComponent(users.join(','))}` : ''}`);
export const getH2H                = (team1, team2, league = 'bl1') => request(`/games/${league}/h2h?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);
export const getCompare            = (team1, team2, league = 'bl1') => request(`/games/${league}/compare?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);

// ── ESPN Public API (keyless: NBA, ATP, WTA) ────────────────────────────────
export const getEspnCurrent        = (league)                    => request(`/espn/${league}/current`);
export const getNhlCurrent         = ()                          => request('/nhl/current');
export const getNhlStandings       = ()                          => request('/nhl/standings');
export const getNhlLeaders         = ()                          => request('/nhl/leaders');
export const getNhlTeams           = ()                          => request('/nhl/teams');
export const getF1Drivers          = (season)                    => request(`/f1/drivers${season ? `?season=${season}` : ''}`);
export const getF1Constructors     = (season)                    => request(`/f1/constructors${season ? `?season=${season}` : ''}`);
export const getF1Schedule         = (season)                    => request(`/f1/schedule${season ? `?season=${season}` : ''}`);
export const getF1Results          = (round, season)             => request(`/f1/results/${round}${season ? `?season=${season}` : ''}`);
export const getF1PitStops         = (round, season)             => request(`/f1/lap-times/${round}${season ? `?season=${season}` : ''}`);
export const getNbaStandings       = ()                          => request('/espn/nba/standings');
export const getNbaTeams           = ()                          => request('/espn/nba/teams');
export const getNflCurrent         = ()                          => request('/espn/nfl/current');
export const getNflStandings       = ()                          => request('/espn/nfl/standings');
export const getNflTeams           = ()                          => request('/espn/nfl/teams');
export const getNflLeaders         = (category)                  => request(`/espn/nfl/leaders?category=${category}&limit=20`);
export const getTennisRankings     = (league)                    => request(`/espn/${league}/rankings`);
export const getTennisPlayer       = (league, playerId)          => request(`/espn/${league}/player/${playerId}`);

// ── Vereine ───────────────────────────────────────────────────────────────
export const getTeamList           = (league = '')            => request(`/teams${league ? `?liga=${league}` : ''}`);
export const searchTeams           = (q)                         => request(`/teams/search?q=${encodeURIComponent(q)}`);
export const getTeamDetail         = (sportsdbId)                => request(`/teams/${sportsdbId}`);
export const getPlayer             = (sportsdbId)                => request(`/players/${sportsdbId}`);
export const getTeamStats          = (league = 'bl1')            => request(`/teamstats/${league}`);

// ── Prognose ──────────────────────────────────────────────────────────────
export const getPrediction         = (team1, team2, league = 'bl1') => request(`/prediction?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&league=${league}`);
export const getPredictionXG       = (fixtureId, apiKey)         => request(`/prediction/xg?fixtureId=${fixtureId}`, { headers: { 'x-api-key': apiKey } });

// ── TV-Übertragung ───────────────────────────────────────────────────────────
export const getBroadcast          = (matchDate, country = 'DE') => request(`/broadcast/${encodeURIComponent(matchDate)}?country=${country}`);
export const getBroadcastByCountry = (country = 'DE')            => request(`/broadcast?country=${country}`);

// ── Schiedsrichter ──────────────────────────────────────────────────────────
export const getRefereeList        = ()                          => request('/referee');
export const getRefereeProfile     = (name)                      => request(`/referee/profile/${encodeURIComponent(name)}`);
export const getRefereeMatchday    = (matchday)                  => request(`/referee/bl1/matchday/${matchday}`);
export const getRefereeApif        = (fixtureId, apiKey)         => request(`/referee/apif/${fixtureId}`, { headers: { 'x-api-key': apiKey } });

// ── API-Football (Key benötigt) ────────────────────────────────────────────────
// league = Registry-Name des Adapters ('bundesliga', 'champions-league', …)
export const getApiFootballLive    = (league, apiKey)                    => request(`/apifootball/${league}/live`,                          { headers: { 'x-api-key': apiKey } });
export const getApiFootballStats   = (fixtureId, league, apiKey)         => request(`/apifootball/${league}/stats/${fixtureId}`,            { headers: { 'x-api-key': apiKey } });
export const getApiFootballFixture = (fixtureId, league, apiKey)         => request(`/apifootball/${league}/fixture/${fixtureId}`,          { headers: { 'x-api-key': apiKey } });
export const getApiFootballSchedule= (league, apiKey, round)             => request(`/apifootball/${league}/schedule${round ? `?round=${encodeURIComponent(round)}` : ''}`, { headers: { 'x-api-key': apiKey } });
export const getApiFootballTeams   = (league, apiKey, leagueId)          => request(`/apifootball/${league}/teams${leagueId ? `?leagueId=${leagueId}` : ''}`, { headers: { 'x-api-key': apiKey } });
export const getApiFootballSquad   = (teamId, league, apiKey)            => request(`/apifootball/${league}/squad/${teamId}`,              { headers: { 'x-api-key': apiKey } });
export const getApiFootballPlayer  = (playerId, league, apiKey)          => request(`/apifootball/${league}/player/${playerId}`,            { headers: { 'x-api-key': apiKey } });
export const getApiFootballPlayerSearch = (q, league, apiKey, leagueId)  => request(`/apifootball/${league}/search?q=${encodeURIComponent(q)}${leagueId ? `&leagueId=${leagueId}` : ''}`, { headers: { 'x-api-key': apiKey } });
export const getApiFootballHeatmap = (playerId, league, apiKey, name)   => request(`/apifootball/${league}/heatmap/${playerId}${name ? `?name=${encodeURIComponent(name)}` : ''}`, { headers: { 'x-api-key': apiKey } });

// ── Admin (benötigt x-api-key Header) ──────────────────────────────────────────────
export const cleanupStats          = (days, adminKey)            => request(`/stats/cleanup?days=${days}`, { method: 'DELETE', headers: { 'x-api-key': adminKey } });
