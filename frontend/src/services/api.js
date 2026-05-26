/**
 * Zentraler API-Service für alle Backend-Calls.
 * Alle fetch()-Aufrufe gehen über dieses Modul – nie direkt in Komponenten.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${path}`);
  return res.json();
}

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth             = ()                        => request('/health');

// ── Spiele ────────────────────────────────────────────────────────────────────
export const getCurrentGames       = (league = 'bl1')          => request(`/games/${league}/current`);
export const getGamesByDay         = (league, matchday)        => request(`/games/${league}/${matchday}`);
export const getMatchdays          = (league = 'bl1')          => request(`/games/${league}/matchdays`);
export const getTable              = (league = 'bl1')          => request(`/games/${league}/table`);
export const getScorers            = (league = 'bl1')          => request(`/games/${league}/scorers`);
export const getAssists            = (league = 'bl1')          => request(`/games/${league}/assists`);
export const getH2H                = (team1, team2)            => request(`/games/bl1/h2h?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);

// ── Vereine ───────────────────────────────────────────────────────────────────
export const getTeamList           = ()                        => request('/teams');
export const getTeamDetail         = (teamId)                  => request(`/teams/${teamId}`);
export const getTeams              = (league = 'bl1')          => request(`/teams/${league}`);
export const getTeamStats          = (league = 'bl1')          => request(`/teamstats/${league}`);

// ── Prognose ──────────────────────────────────────────────────────────────────
export const getPrediction         = (team1, team2)            => request(`/prediction?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);

// ── TV-Übertragung ───────────────────────────────────────────────────────────
export const getBroadcast          = (date)                    => request(`/broadcast/${date}`);
export const getBroadcastByCountry = (matchId, country)        => request(`/broadcast/${matchId}/${country}`);
export const getBroadcastCountries = ()                        => request('/broadcast/countries');

// ── Schiedsrichter ────────────────────────────────────────────────────────────
export const getRefereeProfile     = (name)                    => request(`/referee/profile/${encodeURIComponent(name)}`);

// ── API-Football (Key benötigt, als Header übergeben) ───────────────────────────
export const getApiFootballStats   = (fixtureId, apiKey)       =>
  request(`/apifootball/stats/${fixtureId}`, { headers: { 'x-api-key': apiKey } });
export const getApiFootballFixture = (fixtureId, apiKey)       =>
  request(`/apifootball/fixture/${fixtureId}`, { headers: { 'x-api-key': apiKey } });

// ── Admin (benötigt x-api-key Header) ────────────────────────────────────────
export const cleanupStats          = (days, adminKey)          =>
  request(`/stats/cleanup?days=${days}`, {
    method: 'DELETE',
    headers: { 'x-api-key': adminKey }
  });
