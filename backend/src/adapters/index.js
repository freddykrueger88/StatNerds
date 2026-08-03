'use strict';

const BundesligaAdapter = require('./football/BundesligaAdapter');

/**
 * Adapter-Registry.
 * Key = Bezeichner der Liga (lowercase), Value = Adapter-Klasse.
 * Neue Ligen einfach hier eintragen und Adapter-Datei anlegen.
 */
const REGISTRY = {
  bundesliga: BundesligaAdapter,
  // champions-league: ChampionsLeagueAdapter,  // kommt mit Issue #3
  // premier-league:   PremierLeagueAdapter,    // kommt mit Issue #4
};

/**
 * Gibt eine Adapter-Instanz zurück.
 * @param {string} league  – z.B. 'bundesliga'
 * @param {import('axios').AxiosInstance} apiClient
 * @returns {import('./BaseAdapter')}
 */
function getAdapter(league, apiClient) {
  const AdapterClass = REGISTRY[league.toLowerCase()];
  if (!AdapterClass) {
    const err = new Error(`Kein Adapter für Liga '${league}' gefunden. Verfügbar: ${Object.keys(REGISTRY).join(', ')}`);
    err.status = 400;
    throw err;
  }
  return new AdapterClass(apiClient);
}

module.exports = { getAdapter, REGISTRY };
