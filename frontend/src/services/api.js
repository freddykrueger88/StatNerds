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

// ── Health ──────────────────────────────────────────────────────────────────
export const getHealth             = ()                          => request('/health');

// ── Spiele ────────────────────────────────────────────────────────────────
export const getCurrentGames       = (league = 'bl1')            => request(`/games/${league}/current`);
export const getGamesByDay         = (league = 'bl1', matchday)  => request(`/games/${league}/${matchday}`);
export const getMatchdays          = (league = 'bl1')            => request(`/games/${league}/matchdays`);
export const getTable              = (league = 'bl1')            => request(`/games/${league}/table`);
export const getScorers            = (league = 'bl1')            => request(`/games/${league}/scorers`);
export const getAssists            = (league = 'bl1')            => request(`/games/${league}/assists`);
export const getH2H                = (team1, team2)              => request(`/games/bl1/h2h?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);

// ── Vereine ───────────────────────────────────────────────────────────────
export const getTeamList           = ()                          => request('/teams');
export const searchTeams           = (q)                         => request(`/teams/search?q=${encodeURIComponent(q)}`);
export const getTeamDetail         = (sportsdbId)                => request(`/teams/${sportsdbId}`);
export const getTeamStats          = (league = 'bl1')            => request(`/teamstats/${league}`);

// ── Prognose ──────────────────────────────────────────────────────────────
export const getPrediction         = (team1, team2)              => request(`/prediction?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);
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
export const getApiFootballLive    = (apiKey)                    => request('/apifootball/live',                            { headers: { 'x-api-key': apiKey } });
export const getApiFootballStats   = (fixtureId, apiKey)         => request(`/apifootball/stats/${fixtureId}`,              { headers: { 'x-api-key': apiKey } });
export const getApiFootballFixture = (fixtureId, apiKey)         => request(`/apifootball/fixture/${fixtureId}`,            { headers: { 'x-api-key': apiKey } });
export const getApiFootballSchedule= (apiKey, round)             => request(`/apifootball/schedule${round ? `?round=${encodeURIComponent(round)}` : ''}`, { headers: { 'x-api-key': apiKey } });

// ── Admin (benötigt x-api-key Header) ──────────────────────────────────────────────
export const cleanupStats          = (days, adminKey)            => request(`/stats/cleanup?days=${days}`, { method: 'DELETE', headers: { 'x-api-key': adminKey } });
